-- Collapse recruiter Talent saved-view/onboarding fan-out and page-row metadata
-- into two service-role-only reads. The visible directory query remains filterable/paginated.

create or replace view public.recruiter_talent_summary as
with directory as (
  select *
  from public.recruiter_va_directory
),
recent as (
  select *
  from directory
  where account_status = 'active'
    and account_created_at >= now() - interval '7 days'
),
stalled as (
  select coalesce(jsonb_agg(to_jsonb(s) order by s.email_verified desc nulls last, s.account_created_at desc), '[]'::jsonb) as rows
  from (
    select
      user_id,
      full_name,
      email_verified,
      account_created_at,
      last_activity_at,
      completion_score,
      stage,
      account_status
    from recent
    where completion_score = 0
    order by email_verified desc nulls last, account_created_at desc
    limit 6
  ) s
)
select
  1::integer as id,
  count(*)::integer as all_count,
  count(*) filter (
    where completion_score >= 60
      and account_status = 'active'
      and stage not in ('approved','bench','rejected')
  )::integer as approval_ready_count,
  count(*) filter (
    where stage in ('approved','bench')
      and completion_score < 60
      and account_status = 'active'
  )::integer as approval_cleanup_count,
  count(*) filter (where avatar_url is null)::integer as missing_photo_count,
  count(*) filter (
    where stage in ('approved','bench')
      and account_status = 'active'
      and (
        directory_visible = false
        or completion_score < 80
        or avatar_url is null
        or years_experience < 2
        or years_experience is null
        or hourly_rate < 6
        or hourly_rate is null
        or availability_status <> 'available'
        or availability_status is null
      )
  )::integer as approved_hidden_count,
  count(*) filter (where stage = 'bench')::integer as bench_count,
  count(*) filter (where last_activity_at < now() - interval '60 days')::integer as stale_60_count,
  count(*) filter (where availability_status = 'available')::integer as available_count,
  count(*) filter (where stage = 'recruiter_review')::integer as needs_review_count,
  (select count(*)::integer from recent) as new_accounts_7d,
  (select count(*)::integer from recent where completion_score = 0) as recent_zero_7d,
  (select count(*)::integer from recent where completion_score = 0 and email_verified = true) as verified_recent_zero_7d,
  stalled.rows as stalled
from directory
cross join stalled;

revoke all on public.recruiter_talent_summary from public, anon, authenticated;
grant select on public.recruiter_talent_summary to service_role;

create or replace view public.recruiter_talent_page_meta as
select
  d.user_id as va_id,
  r.last_sent_at,
  r.reminder_count,
  exists (
    select 1
    from public.public_va_directory pd
    where pd.user_id = d.user_id
  ) as public_now,
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
  v.linkedin_url,
  v.availability_status,
  v.public_profile_consent,
  v.public_profile_consent_at,
  v.public_profile_consent_withdrawn_at,
  v.public_profile_consent_version
from public.recruiter_va_directory d
left join public.va_profiles v on v.user_id = d.user_id
left join public.va_profile_reminders r on r.va_id = d.user_id;

revoke all on public.recruiter_talent_page_meta from public, anon, authenticated;
grant select on public.recruiter_talent_page_meta to service_role;
