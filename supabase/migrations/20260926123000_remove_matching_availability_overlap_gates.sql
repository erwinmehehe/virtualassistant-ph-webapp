-- Recruiter matching should not disqualify or block a VA because profile overlap
-- hours are blank or because availability was not reconfirmed recently.
-- Keep availability as informational profile data, not a shortlist release gate.

drop trigger if exists shortlist_release_availability_guard
on public.job_shortlist_candidates;

drop function if exists public.guard_released_candidate_availability();

create or replace function public.is_va_agency_certified(
  p_va_id uuid,
  p_as_of timestamptz default now()
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
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
        and v.availability_status = 'available'
        and v.work_setup_verified_at is not null
    );
$$;

revoke execute on function public.is_va_agency_certified(uuid, timestamptz)
from public, anon, authenticated;
grant execute on function public.is_va_agency_certified(uuid, timestamptz)
to service_role;

create or replace function public.refresh_match_suggestions_for_va(p_va_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
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

  if not found then
    return 0;
  end if;

  for j in select * from jobs where status in ('pending','published') loop
    if not public.array_contains_all_ci(j.must_have_skills,v.skills) then continue; end if;
    if not public.array_contains_all_ci(j.must_have_tools,v.tools) then continue; end if;
    if not public.array_contains_all_ci(j.required_industries,v.industries) then continue; end if;
    if j.minimum_years_experience is not null and coalesce(v.years_experience,0) < j.minimum_years_experience then continue; end if;
    if j.hours_per_week is not null and coalesce(v.weekly_hours,0) < j.hours_per_week then continue; end if;
    if j.max_hourly_rate is not null and v.hourly_rate is not null and v.hourly_rate > j.max_hourly_rate then continue; end if;
    if exists(
      select 1
      from job_shortlist_candidates s
      where s.job_id=j.id
        and s.va_id=p_va_id
        and s.shortlist_status in ('hidden','released')
    ) then continue; end if;

    raw_score := 0;
    assessed := 0;

    if cardinality(coalesce(j.categories,'{}')) > 0 then
      assessed := assessed + 30;
      if public.array_overlap_count_ci(
        j.categories,
        array_prepend(v.primary_category,coalesce(v.categories,'{}'))
      ) > 0 then
        raw_score := raw_score + 30;
      end if;
    end if;

    if cardinality(coalesce(j.required_skills,'{}')) > 0 then
      assessed := assessed + 25;
      raw_score := raw_score
        + 25.0 * public.array_overlap_count_ci(j.required_skills,v.skills)
        / greatest(cardinality(j.required_skills),1);
    end if;

    if cardinality(coalesce(j.required_tools,'{}')) > 0 then
      assessed := assessed + 15;
      raw_score := raw_score
        + 15.0 * public.array_overlap_count_ci(j.required_tools,v.tools)
        / greatest(cardinality(j.required_tools),1);
    end if;

    if cardinality(coalesce(j.nice_to_have_skills,'{}')) > 0 then
      assessed := assessed + 10;
      raw_score := raw_score
        + 10.0 * public.array_overlap_count_ci(j.nice_to_have_skills,v.skills)
        / greatest(cardinality(j.nice_to_have_skills),1);
    end if;

    if j.hours_per_week is not null then
      assessed := assessed + 10;
      if v.weekly_hours is not null and v.weekly_hours >= j.hours_per_week then
        raw_score := raw_score + 10;
      end if;
    end if;

    normalized := case
      when assessed=0 then 0
      else least(100,round(raw_score/assessed*100))::integer
    end;

    if normalized < 60 then
      continue;
    end if;

    select exists(
      select 1
      from job_shortlist_candidates s
      where s.job_id=j.id and s.va_id=p_va_id
    ) into existed;

    insert into job_shortlist_candidates(
      job_id,va_id,match_score,match_confidence,shortlist_status,created_by,released_at
    )
    values(
      j.id,p_va_id,normalized,least(100,assessed),'proposed',null,null
    )
    on conflict(job_id,va_id) do update set
      match_score=excluded.match_score,
      match_confidence=excluded.match_confidence,
      updated_at=now()
    where job_shortlist_candidates.shortlist_status='proposed';

    if not existed then
      proposed_count := proposed_count + 1;
    end if;
  end loop;

  if proposed_count > 0 then
    insert into recruiter_activity(
      subject_type,subject_id,action,description,actor_id,metadata
    )
    values(
      'va',
      p_va_id,
      'automatic_match_refresh',
      proposed_count || ' new recruiter-only role suggestion(s) found',
      null,
      jsonb_build_object('suggestions',proposed_count)
    );
  end if;

  return proposed_count;
end;
$$;

revoke execute on function public.refresh_match_suggestions_for_va(uuid)
from public, anon, authenticated;
grant execute on function public.refresh_match_suggestions_for_va(uuid)
to service_role;
