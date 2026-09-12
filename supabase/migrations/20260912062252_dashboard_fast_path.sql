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
    select account_status, stage, completion_score, account_created_at, avatar_url
    from public.recruiter_va_directory
  ),
  directory_metrics as (
    select
      count(*) filter (where account_status = 'active' and stage <> 'rejected')::int as total,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score > 0)::int as started,
      count(*) filter (where account_status = 'active' and stage in ('approved', 'bench'))::int as approved,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score < 100)::int as incomplete,
      count(*) filter (
        where account_status = 'active'
          and completion_score >= 80
          and avatar_url is not null
          and stage not in ('approved', 'bench', 'rejected')
      )::int as ready,
      count(*) filter (
        where account_status = 'active'
          and stage in ('approved', 'bench')
          and completion_score < 100
      )::int as vetted_hidden
    from directory
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

create or replace function public.workspace_badges(p_role text, p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_role = 'recruiter' then
    select jsonb_build_object(
      'leads', (
        select count(*)::int
        from public.lead_intake
        where crm_stage not in ('won', 'lost')
          and (crm_stage = 'new' or next_follow_up_at <= now())
      ),
      'vetting', (
        select count(*)::int from public.va_vetting where stage = 'recruiter_review'
      ),
      'pending_roles', (
        select count(*)::int from public.jobs where status = 'pending'
      )
    ) into result;
    return result;
  end if;

  if p_role in ('va', 'client') then
    select jsonb_build_object(
      'messages', (
        select count(*)::int
        from public.messages m
        join public.conversations c on c.id = m.conversation_id
        where m.read_at is null
          and m.sender_id <> p_user_id
          and (
            (p_role = 'va' and c.va_id = p_user_id)
            or (p_role = 'client' and c.client_id = p_user_id)
          )
      ),
      'notifications', (
        select count(*)::int
        from public.notifications n
        where n.user_id = p_user_id and n.read_at is null
      )
    ) into result;
    return result;
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.workspace_badges(text, uuid) from public;
revoke all on function public.workspace_badges(text, uuid) from anon;
revoke all on function public.workspace_badges(text, uuid) from authenticated;
grant execute on function public.workspace_badges(text, uuid) to service_role;

create or replace function public.va_dashboard_summary(p_va_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with va as (
    select jsonb_build_object(
      'user_id', v.user_id,
      'headline', v.headline,
      'bio', v.bio,
      'primary_category', v.primary_category,
      'categories', coalesce(v.categories, '{}'::text[]),
      'skills', coalesce(v.skills, '{}'::text[]),
      'tools', coalesce(v.tools, '{}'::text[]),
      'industries', coalesce(v.industries, '{}'::text[]),
      'languages', coalesce(v.languages, '{}'::text[]),
      'years_experience', v.years_experience,
      'weekly_hours', v.weekly_hours,
      'schedule', v.schedule,
      'overlap_hours', v.overlap_hours,
      'hourly_rate', v.hourly_rate,
      'portfolio_url', v.portfolio_url,
      'linkedin_url', v.linkedin_url,
      'resume_path', v.resume_path,
      'directory_visible', v.directory_visible,
      'availability_status', v.availability_status,
      'slug', v.slug,
      'preferred_timezone', v.preferred_timezone
    ) as profile
    from public.va_profiles v
    where v.user_id = p_va_id
  ),
  account as (
    select avatar_url from public.profiles where id = p_va_id
  ),
  vetting as (
    select jsonb_build_object('stage', stage, 'video_url', video_url) as data
    from public.va_vetting
    where va_id = p_va_id
  ),
  latest_test as (
    select coalesce(final_score, auto_score) as score
    from public.va_test_attempts
    where va_id = p_va_id
    order by submitted_at desc
    limit 1
  ),
  latest_scorecard as (
    select total_score
    from public.vetting_scorecards
    where va_id = p_va_id
    order by created_at desc
    limit 1
  ),
  app_metrics as (
    select
      count(*)::int as application_count,
      count(*) filter (where status in ('new', 'reviewing'))::int as applied,
      count(*) filter (where status = 'shortlisted')::int as shortlisted,
      count(*) filter (where status = 'interview')::int as interview,
      count(*) filter (where status = 'offered')::int as offered,
      count(*) filter (where status = 'hired')::int as hired,
      count(*) filter (where status = 'rejected')::int as rejected
    from public.applications
    where va_id = p_va_id
  ),
  recruiter_requests as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) as rows
    from (
      select id, title, body, href, created_at
      from public.notifications
      where user_id = p_va_id
        and read_at is null
        and type = 'profile_update_request'
      order by created_at desc
      limit 3
    ) x
  )
  select jsonb_build_object(
    'profile', coalesce((select profile from va), '{}'::jsonb),
    'avatar_url', (select avatar_url from account),
    'vetting', coalesce((select data from vetting), '{}'::jsonb),
    'test_score', (select score from latest_test),
    'scorecard_total', (select total_score from latest_scorecard),
    'application_count', a.application_count,
    'pipeline', jsonb_build_object(
      'applied', a.applied,
      'shortlisted', a.shortlisted,
      'interview', a.interview,
      'offered', a.offered,
      'hired', a.hired,
      'rejected', a.rejected
    ),
    'pending_invites', (select count(*)::int from public.job_invites where va_id = p_va_id and status = 'pending'),
    'workroom_count', (select count(*)::int from public.workrooms where va_id = p_va_id),
    'certification_count', (select count(*)::int from public.public_va_certifications where va_id = p_va_id),
    'unread_notifications', (select count(*)::int from public.notifications where user_id = p_va_id and read_at is null),
    'recruiter_requests', r.rows,
    'unread_messages', (
      select count(*)::int
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where c.va_id = p_va_id
        and m.sender_id <> p_va_id
        and m.read_at is null
    )
  )
  from app_metrics a
  cross join recruiter_requests r;
$$;

revoke all on function public.va_dashboard_summary(uuid) from public;
revoke all on function public.va_dashboard_summary(uuid) from anon;
revoke all on function public.va_dashboard_summary(uuid) from authenticated;
grant execute on function public.va_dashboard_summary(uuid) to service_role;
