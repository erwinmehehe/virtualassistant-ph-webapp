create or replace function public.va_dashboard_summary(p_va_id uuid)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  with va as (
    select jsonb_build_object(
      'user_id', v.user_id,
      'address', v.address,
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
        and type in ('profile_update_request', 'private_address_request')
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
$function$;

revoke all on function public.va_dashboard_summary(uuid) from public;
revoke all on function public.va_dashboard_summary(uuid) from anon;
revoke all on function public.va_dashboard_summary(uuid) from authenticated;
grant execute on function public.va_dashboard_summary(uuid) to service_role;
