create index if not exists jobs_client_created_idx
  on public.jobs (client_id, created_at desc);

create index if not exists applications_job_status_idx
  on public.applications (job_id, status);

create index if not exists workrooms_client_idx
  on public.workrooms (client_id);

create index if not exists va_vetting_stage_updated_idx
  on public.va_vetting (stage, updated_at);

create or replace function public.client_dashboard_summary(p_client_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with client_jobs as materialized (
    select id, title, status, created_at, published_at
    from public.jobs
    where client_id = p_client_id
  ),
  app_metrics as (
    select
      count(*)::int as application_count,
      count(*) filter (where a.status in ('new', 'reviewing'))::int as applied,
      count(*) filter (where a.status = 'shortlisted')::int as shortlisted,
      count(*) filter (where a.status = 'interview')::int as interview,
      count(*) filter (where a.status = 'offered')::int as offered,
      count(*) filter (where a.status = 'hired')::int as hired,
      count(*) filter (where a.status = 'rejected')::int as rejected
    from public.applications a
    join client_jobs j on j.id = a.job_id
  ),
  recent_jobs as (
    select
      j.id,
      j.title,
      j.status,
      j.created_at,
      j.published_at,
      count(a.id)::int as applicants,
      count(a.id) filter (where a.status = 'shortlisted')::int as shortlisted,
      count(a.id) filter (where a.status = 'interview')::int as interview,
      count(a.id) filter (where a.status = 'offered')::int as offered,
      count(a.id) filter (where a.status = 'hired')::int as hired
    from client_jobs j
    left join public.applications a on a.job_id = j.id
    group by j.id, j.title, j.status, j.created_at, j.published_at
    order by j.created_at desc
    limit 6
  )
  select jsonb_build_object(
    'job_count', (select count(*)::int from client_jobs),
    'active_jobs', (select count(*)::int from client_jobs where status = 'published'),
    'hire_count', (select count(*)::int from public.workrooms where client_id = p_client_id),
    'application_count', a.application_count,
    'pipeline', jsonb_build_object(
      'applied', a.applied,
      'shortlisted', a.shortlisted,
      'interview', a.interview,
      'offered', a.offered,
      'hired', a.hired,
      'rejected', a.rejected
    ),
    'jobs', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from recent_jobs r), '[]'::jsonb)
  )
  from app_metrics a;
$$;

revoke all on function public.client_dashboard_summary(uuid) from public;
revoke all on function public.client_dashboard_summary(uuid) from anon;
revoke all on function public.client_dashboard_summary(uuid) from authenticated;
grant execute on function public.client_dashboard_summary(uuid) to service_role;

create or replace function public.recruiter_dashboard_vetting_queue(p_limit integer default 5)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at), '[]'::jsonb)
  from (
    select
      vv.va_id,
      vv.updated_at,
      vv.video_url,
      p.full_name,
      p.avatar_url,
      v.headline,
      v.bio,
      v.primary_category,
      v.skills,
      v.tools,
      v.years_experience,
      v.weekly_hours,
      v.hourly_rate,
      v.resume_path,
      v.portfolio_url,
      latest.test_score
    from public.va_vetting vv
    left join public.profiles p on p.id = vv.va_id
    left join public.va_profiles v on v.user_id = vv.va_id
    left join lateral (
      select coalesce(t.final_score, t.auto_score) as test_score
      from public.va_test_attempts t
      where t.va_id = vv.va_id
      order by t.submitted_at desc
      limit 1
    ) latest on true
    where vv.stage = 'recruiter_review'
    order by vv.updated_at
    limit greatest(p_limit, 1)
  ) q;
$$;

revoke all on function public.recruiter_dashboard_vetting_queue(integer) from public;
revoke all on function public.recruiter_dashboard_vetting_queue(integer) from anon;
revoke all on function public.recruiter_dashboard_vetting_queue(integer) from authenticated;
grant execute on function public.recruiter_dashboard_vetting_queue(integer) to service_role;

create or replace function public.recruiter_dashboard_roles_needing_matching(p_limit integer default 5)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(j) order by j.created_at desc), '[]'::jsonb)
  from (
    select id, title, company_name, status, created_at
    from public.jobs j
    where j.status in ('pending', 'published')
      and not exists (select 1 from public.applications a where a.job_id = j.id)
      and not exists (
        select 1
        from public.job_shortlist_candidates s
        where s.job_id = j.id
          and s.shortlist_status in ('proposed', 'released')
      )
    order by j.created_at desc
    limit greatest(p_limit, 1)
  ) j;
$$;

revoke all on function public.recruiter_dashboard_roles_needing_matching(integer) from public;
revoke all on function public.recruiter_dashboard_roles_needing_matching(integer) from anon;
revoke all on function public.recruiter_dashboard_roles_needing_matching(integer) from authenticated;
grant execute on function public.recruiter_dashboard_roles_needing_matching(integer) to service_role;
