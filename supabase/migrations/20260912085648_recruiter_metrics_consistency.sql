create or replace function public.recruiter_dashboard_metrics(p_signup_weeks integer default 10)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      (date_trunc('week', now() at time zone 'UTC') at time zone 'UTC') as current_week,
      greatest(p_signup_weeks, 1) as weeks
  ),
  directory as materialized (
    select
      user_id,
      account_status,
      stage,
      completion_score,
      account_created_at,
      avatar_url,
      directory_visible,
      years_experience,
      hourly_rate,
      availability_status
    from public.recruiter_va_directory
  ),
  directory_state as materialized (
    select
      d.*,
      exists (
        select 1
        from public.public_va_directory p
        where p.user_id = d.user_id
      ) as is_public
    from directory d
  ),
  directory_metrics as (
    select
      count(*) filter (where account_status = 'active' and stage <> 'rejected')::int as total,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score > 0)::int as started,
      count(*) filter (where account_status = 'active' and stage in ('approved', 'bench'))::int as approved,
      count(*) filter (
        where account_status = 'active'
          and stage <> 'rejected'
          and completion_score > 0
          and completion_score < 80
      )::int as incomplete,
      count(*) filter (
        where account_status = 'active'
          and stage not in ('approved', 'bench', 'rejected')
          and completion_score >= 80
          and avatar_url is not null
          and btrim(avatar_url) <> ''
      )::int as ready,
      count(*) filter (
        where account_status = 'active'
          and stage in ('approved', 'bench')
          and not is_public
      )::int as vetted_hidden,
      count(*) filter (
        where account_status = 'active'
          and stage in ('approved', 'bench')
          and directory_visible = false
      )::int as explicit_hidden,
      count(*) filter (
        where account_status = 'active'
          and stage in ('approved', 'bench')
          and directory_visible = true
          and not is_public
      )::int as approved_blocked,
      count(*) filter (
        where account_status = 'active'
          and stage <> 'rejected'
          and completion_score = 0
      )::int as zero_profiles
    from directory_state
  ),
  public_count as (
    select count(*)::int as public
    from public.public_va_directory
  ),
  recruiter_counts as (
    select count(*) filter (where stage = 'recruiter_review')::int as unreviewed
    from public.va_vetting
  ),
  job_metrics as (
    select
      count(*) filter (where j.status in ('pending', 'published'))::int as active_jobs,
      count(*) filter (where j.status = 'pending')::int as pending_jobs,
      count(*) filter (
        where j.status in ('pending', 'published')
          and not exists (
            select 1 from public.applications a where a.job_id = j.id
          )
          and not exists (
            select 1
            from public.job_shortlist_candidates s
            where s.job_id = j.id
              and s.shortlist_status in ('proposed', 'released')
          )
      )::int as roles_without_candidates
    from public.jobs j
  ),
  marketplace_metrics as (
    select
      (select count(*)::int from public.applications where status = 'new') as new_apps,
      (select count(*)::int from public.messages where read_at is null) as unread_messages,
      (select count(*)::int from public.job_shortlist_candidates where shortlist_status = 'released') as released_shortlists
  ),
  lead_metrics as (
    select
      count(*)::int as open_leads,
      count(*) filter (where coalesce(crm_stage, 'new') = 'new' and first_contact_at is null)::int as untouched_leads,
      count(*) filter (where next_follow_up_at is not null and next_follow_up_at <= now())::int as followups_due,
      coalesce(sum(estimated_value_usd), 0)::numeric as open_pipeline_value,
      count(*) filter (
        where discovery_scheduled_at is not null
          and discovery_completed_at is null
          and discovery_scheduled_at >= now() - interval '1 hour'
          and discovery_scheduled_at < ((date_trunc('day', now() at time zone 'Asia/Manila') + interval '2 days') at time zone 'Asia/Manila')
      )::int as discovery_next_two_days
    from public.lead_intake
    where coalesce(crm_stage, 'new') not in ('won', 'lost')
  ),
  weekly as (
    select
      gs.week_start,
      count(d.account_created_at)::int as signup_count
    from params p
    cross join lateral generate_series(
      p.current_week - ((p.weeks - 1) * interval '1 week'),
      p.current_week,
      interval '1 week'
    ) as gs(week_start)
    left join directory d
      on d.account_created_at >= gs.week_start
     and d.account_created_at < gs.week_start + interval '1 week'
    group by gs.week_start
    order by gs.week_start
  )
  select jsonb_build_object(
    'total', d.total,
    'started', d.started,
    'approved', d.approved,
    'public', p.public,
    'incomplete', d.incomplete,
    'ready', d.ready,
    'vetted_hidden', d.vetted_hidden,
    'explicit_hidden', d.explicit_hidden,
    'approved_blocked', d.approved_blocked,
    'zero_profiles', d.zero_profiles,
    'unreviewed', r.unreviewed,
    'active_jobs', j.active_jobs,
    'pending_jobs', j.pending_jobs,
    'roles_without_candidates', j.roles_without_candidates,
    'new_apps', m.new_apps,
    'unread_messages', m.unread_messages,
    'released_shortlists', m.released_shortlists,
    'open_leads', l.open_leads,
    'untouched_leads', l.untouched_leads,
    'followups_due', l.followups_due,
    'open_pipeline_value', l.open_pipeline_value,
    'discovery_next_two_days', l.discovery_next_two_days,
    'signups', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('week_start', week_start, 'count', signup_count)
          order by week_start
        )
        from weekly
      ),
      '[]'::jsonb
    )
  )
  from directory_metrics d
  cross join public_count p
  cross join recruiter_counts r
  cross join job_metrics j
  cross join marketplace_metrics m
  cross join lead_metrics l;
$$;

revoke all on function public.recruiter_dashboard_metrics(integer) from public;
revoke all on function public.recruiter_dashboard_metrics(integer) from anon;
revoke all on function public.recruiter_dashboard_metrics(integer) from authenticated;
grant execute on function public.recruiter_dashboard_metrics(integer) to service_role;
