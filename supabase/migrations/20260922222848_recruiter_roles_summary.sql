create or replace function public.recruiter_roles_summary(p_recruiter_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = 'pg_catalog', 'public'
as $$
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
  where j.recruiter_id = p_recruiter_id
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
$$;

revoke all on function public.recruiter_roles_summary(uuid) from public;
revoke all on function public.recruiter_roles_summary(uuid) from anon;
revoke all on function public.recruiter_roles_summary(uuid) from authenticated;
grant execute on function public.recruiter_roles_summary(uuid) to service_role;
