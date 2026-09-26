create or replace function public.recruiter_roles_summary(p_recruiter_id uuid)
returns jsonb
language sql
stable
set search_path to 'pg_catalog', 'public'
as $function$
with
actor as (
  select 1
  from public.profiles p
  where p.id = p_recruiter_id
    and p.account_status = 'active'
    and p.role::text = 'recruiter'
),
recruiter_jobs as materialized (
  select
    j.id,j.title,j.company_name,j.status,j.hiring_stage,j.hiring_stage_entered_at,
    j.target_start_date,j.recruiter_id,j.client_id,j.created_at,j.updated_at,
    j.summary,j.responsibilities,j.required_skills,j.categories,j.hours_per_week,
    j.timezone,j.min_hourly_rate,j.start_timing
  from public.jobs j
  cross join actor
  order by j.updated_at desc
  limit 250
),
shortlist_agg as (
  select
    s.job_id,
    count(*) filter (where s.shortlist_status = 'proposed')::int as proposed_count,
    count(*) filter (where s.shortlist_status = 'released')::int as released_count,
    count(*) filter (where s.shortlist_status in ('proposed','released'))::int as active_shortlist_count,
    count(*) filter (where s.shortlist_status = 'released' and s.client_decision = 'pass')::int as released_pass_count,
    count(*) filter (where s.shortlist_status = 'released' and (s.client_decision is null or s.client_decision = 'hold'))::int as unanswered_released_count,
    min(s.released_at) filter (
      where s.shortlist_status = 'released'
        and (s.client_decision is null or s.client_decision = 'hold')
        and s.released_at is not null
    ) as oldest_unanswered_released_at
  from public.job_shortlist_candidates s
  join recruiter_jobs j on j.id = s.job_id
  group by s.job_id
),
interview_agg as (
  select
    i.job_id,
    count(*) filter (where i.status <> 'cancelled')::int as active_interview_count,
    bool_or(
      case
        when i.status = 'requested' then i.created_at <= now() - interval '72 hours'
        when i.status = 'scheduled' then i.scheduled_at is not null and i.scheduled_at <= now() - interval '72 hours'
        when i.status = 'completed' then i.client_feedback_at is null and coalesce(i.completed_at,i.updated_at) <= now() - interval '72 hours'
        else false
      end
    ) filter (where i.status <> 'cancelled') as interview_overdue
  from public.candidate_interviews i
  join recruiter_jobs j on j.id = i.job_id
  group by i.job_id
),
offer_agg as (
  select
    o.job_id,
    count(*) filter (where o.status not in ('declined','cancelled'))::int as active_offer_count,
    bool_or(
      o.status in ('pending_va','pending_client')
      and o.updated_at <= now() - interval '72 hours'
    ) filter (where o.status not in ('declined','cancelled')) as offer_overdue
  from public.placement_offers o
  join recruiter_jobs j on j.id = o.job_id
  group by o.job_id
),
room_agg as (
  select w.job_id, true as placement_created
  from public.workrooms w
  join recruiter_jobs j on j.id = w.job_id
  group by w.job_id
),
role_rows as (
  select
    j.id,j.title,j.company_name,j.status::text as status,j.hiring_stage,j.hiring_stage_entered_at,
    j.target_start_date,j.recruiter_id,j.client_id,j.created_at,j.updated_at,
    j.summary,j.responsibilities,j.required_skills,j.categories,j.hours_per_week,
    j.timezone,j.min_hourly_rate,j.start_timing,
    c.commercial_status,
    coalesce(s.proposed_count,0) as proposed_count,
    coalesce(s.released_count,0) as released_count,
    coalesce(s.active_shortlist_count,0) as active_shortlist_count,
    coalesce(s.released_pass_count,0) as released_pass_count,
    coalesce(s.unanswered_released_count,0) as unanswered_released_count,
    s.oldest_unanswered_released_at,
    coalesce(i.active_interview_count,0) as active_interview_count,
    coalesce(i.interview_overdue,false) as interview_overdue,
    coalesce(o.active_offer_count,0) as active_offer_count,
    coalesce(o.offer_overdue,false) as offer_overdue,
    coalesce(r.placement_created,false) as placement_created
  from recruiter_jobs j
  left join shortlist_agg s on s.job_id = j.id
  left join interview_agg i on i.job_id = j.id
  left join offer_agg o on o.job_id = j.id
  left join room_agg r on r.job_id = j.id
  left join public.job_commercials c on c.job_id = j.id
),
talent_totals as (
  select
    count(*)::int as active_count,
    count(*) filter (where d.primary_category is null)::int as uncategorized_count,
    count(*) filter (where coalesce(d.completion_score,0)=0)::int as not_started_count
  from public.recruiter_va_directory d
  cross join actor
  where d.account_status='active'
),
talent_supply as (
  select coalesce(jsonb_object_agg(x.primary_category,x.total),'{}'::jsonb) as by_category
  from (
    select d.primary_category, count(*)::int as total
    from public.recruiter_va_directory d
    cross join actor
    where d.account_status='active'
      and d.primary_category is not null
    group by d.primary_category
  ) x
)
select jsonb_build_object(
  'jobs', coalesce((select jsonb_agg(to_jsonb(rr) order by rr.updated_at desc) from role_rows rr), '[]'::jsonb),
  'talent', jsonb_build_object(
    'active_count', coalesce(tt.active_count,0),
    'uncategorized_count', coalesce(tt.uncategorized_count,0),
    'not_started_count', coalesce(tt.not_started_count,0),
    'supply_by_category', coalesce(ts.by_category,'{}'::jsonb)
  )
)
from talent_totals tt
cross join talent_supply ts;
$function$;

create or replace function public.refresh_match_suggestions_for_va(p_va_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v record;
  j record;
  raw_score numeric;
  assessed integer;
  normalized integer;
  proposed_count integer := 0;
  existed boolean;
begin
  select vp.*, vv.stage into v
  from va_profiles vp
  join va_vetting vv on vv.va_id=vp.user_id
  where vp.user_id=p_va_id
    and vv.stage in ('approved','bench');

  if not found then return 0; end if;

  for j in select * from jobs where status in ('pending','published') loop
    if not public.array_contains_all_ci(j.must_have_skills,v.skills) then continue; end if;
    if not public.array_contains_all_ci(j.must_have_tools,v.tools) then continue; end if;
    if not public.array_contains_all_ci(j.required_industries,v.industries) then continue; end if;
    if exists(
      select 1 from job_shortlist_candidates s
      where s.job_id=j.id and s.va_id=p_va_id and s.shortlist_status in ('hidden','released')
    ) then continue; end if;

    raw_score := 0;
    assessed := 0;

    if cardinality(coalesce(j.categories,'{}')) > 0 then
      assessed := assessed + 30;
      if public.array_overlap_count_ci(j.categories,array_prepend(v.primary_category,coalesce(v.categories,'{}'))) > 0 then
        raw_score := raw_score + 30;
      end if;
    end if;

    if cardinality(coalesce(j.required_skills,'{}')) > 0 then
      assessed := assessed + 25;
      raw_score := raw_score + 25.0 * public.array_overlap_count_ci(j.required_skills,v.skills) / greatest(cardinality(j.required_skills),1);
    end if;

    if cardinality(coalesce(j.required_tools,'{}')) > 0 then
      assessed := assessed + 15;
      raw_score := raw_score + 15.0 * public.array_overlap_count_ci(j.required_tools,v.tools) / greatest(cardinality(j.required_tools),1);
    end if;

    if cardinality(coalesce(j.nice_to_have_skills,'{}')) > 0 then
      assessed := assessed + 10;
      raw_score := raw_score + 10.0 * public.array_overlap_count_ci(j.nice_to_have_skills,v.skills) / greatest(cardinality(j.nice_to_have_skills),1);
    end if;

    if j.minimum_years_experience is not null then
      assessed := assessed + 10;
      if coalesce(v.years_experience,0) >= j.minimum_years_experience then
        raw_score := raw_score + 10;
      end if;
    end if;

    if j.max_hourly_rate is not null and v.hourly_rate is not null then
      assessed := assessed + 10;
      if v.hourly_rate <= j.max_hourly_rate then
        raw_score := raw_score + 10;
      end if;
    end if;

    if j.hours_per_week is not null then
      assessed := assessed + 10;
      if v.weekly_hours is not null then
        raw_score := raw_score + 10.0 * least(1.0, greatest(0.0, v.weekly_hours::numeric / greatest(j.hours_per_week,1)));
      end if;
    end if;

    normalized := case when assessed=0 then 0 else least(100,round(raw_score/assessed*100))::integer end;
    if normalized < 60 then continue; end if;

    select exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.va_id=p_va_id) into existed;

    insert into job_shortlist_candidates(job_id,va_id,match_score,match_confidence,shortlist_status,created_by,released_at)
    values(j.id,p_va_id,normalized,least(100,assessed),'proposed',null,null)
    on conflict(job_id,va_id) do update set
      match_score=excluded.match_score,
      match_confidence=excluded.match_confidence,
      updated_at=now()
    where job_shortlist_candidates.shortlist_status='proposed';

    if not existed then proposed_count := proposed_count + 1; end if;
  end loop;

  if proposed_count > 0 then
    insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata)
    values('va',p_va_id,'automatic_match_refresh',proposed_count || ' new recruiter-only role suggestion(s) found',null,jsonb_build_object('suggestions',proposed_count));
  end if;

  return proposed_count;
end;
$function$;

create or replace function public.is_va_agency_certified(p_va_id uuid, p_as_of timestamp with time zone default now())
returns boolean
language sql
stable
set search_path to ''
as $function$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = p_va_id
        and p.role = 'va'
        and p.account_status = 'active'
    )
    and exists (
      select 1
      from public.va_vetting vv
      where vv.va_id = p_va_id
        and vv.stage in ('approved', 'bench')
    )
    and exists (
      select 1
      from public.bench_memberships bm
      where bm.va_id = p_va_id
        and bm.status = 'active'
    )
    and exists (
      select 1
      from public.va_profiles v
      where v.user_id = p_va_id
        and v.work_setup_verified_at is not null
    );
$function$;

create or replace function public.enforce_agency_certified_shortlist_release()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_required boolean := false;
begin
  if new.shortlist_status <> 'released' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.shortlist_status = 'released' then
    return new;
  end if;

  select coalesce(s.require_agency_certified_release, false)
    into v_required
  from public.admin_settings s
  where s.id = 1;

  if not coalesce(v_required, false) then
    return new;
  end if;

  if not public.is_va_agency_certified(new.va_id, now()) then
    raise exception using
      errcode = '23514',
      message = 'VA is not Agency Certified for client release. Confirm active talent-pool membership and verified work setup first.';
  end if;

  return new;
end;
$function$;
