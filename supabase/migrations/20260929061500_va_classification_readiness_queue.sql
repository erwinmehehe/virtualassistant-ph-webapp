-- Add an explicit VA classification lifecycle to the recruiter talent directory.
-- Profiles need at least two evidence signals, including one role signal, before
-- automatic specialty inference is allowed to run.

create or replace view public.recruiter_va_directory as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.created_at as account_created_at,
  p.updated_at as account_updated_at,
  p.last_active_at,
  p.email_verified,
  p.identity_verified_at,
  p.account_status,
  v.slug,
  v.headline,
  v.bio,
  v.primary_category,
  v.categories,
  v.skills,
  v.tools,
  v.industries,
  v.years_experience,
  v.weekly_hours,
  v.schedule,
  v.preferred_timezone,
  v.hourly_rate,
  v.portfolio_url,
  v.resume_path,
  v.directory_visible,
  v.availability_status,
  v.updated_at as profile_updated_at,
  coalesce(vv.stage, 'profile'::text) as stage,
  vv.updated_at as vetting_updated_at,
  vv.profile_reviewed_at,
  vv.resume_reviewed_at,
  vv.changes_requested_at,
  case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end
    + case when coalesce(length(btrim(v.headline)), 0) >= 8 then 10 else 0 end
    + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 15 else 0 end
    + case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end
    + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 5 then 15 else 0 end
    + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 3 then 5 else 0 end
    + case when coalesce(v.years_experience, 0) >= 1 then 10 else 0 end
    + case when coalesce(v.weekly_hours, 0) >= 1 then 10 else 0 end
    + case when coalesce(v.hourly_rate, 0::numeric) >= 5::numeric then 10 else 0 end
    + case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end
    + case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end
    as completion_score,
  array_remove(array[
    case when p.avatar_url is null or btrim(p.avatar_url) = '' then 'photo' else null end,
    case when coalesce(length(btrim(v.headline)), 0) < 8 then 'headline' else null end,
    case when coalesce(length(btrim(v.bio)), 0) < 80 then 'bio' else null end,
    case when v.primary_category is null or btrim(v.primary_category) = '' then 'category' else null end,
    case when cardinality(coalesce(v.skills, '{}'::text[])) < 5 then 'skills' else null end,
    case when cardinality(coalesce(v.tools, '{}'::text[])) < 3 then 'tools' else null end,
    case when coalesce(v.years_experience, 0) < 1 then 'experience' else null end,
    case when coalesce(v.weekly_hours, 0) < 1 then 'availability' else null end,
    case when coalesce(v.hourly_rate, 0::numeric) < 5::numeric then 'rate' else null end,
    case when v.resume_path is null or btrim(v.resume_path) = '' then 'resume' else null end,
    case when v.portfolio_url is null or btrim(v.portfolio_url) = '' then 'portfolio' else null end
  ], null::text) as missing_items,
  greatest(p.updated_at, coalesce(v.updated_at, p.updated_at), coalesce(p.last_active_at, p.updated_at)) as last_activity_at,
  vv.edited_since_approval_at,
  ce.total_signal_count as classification_evidence_count,
  case
    when (v.primary_category is not null and btrim(v.primary_category) <> '')
      or cardinality(coalesce(v.categories, '{}'::text[])) > 0
      then 'classified'
    when ce.role_signal_count >= 1 and ce.total_signal_count >= 2
      then 'ready_to_classify'
    else 'incomplete_profile'
  end as classification_status,
  array_remove(array[
    case when coalesce(length(btrim(v.headline)), 0) < 8 then 'headline' else null end,
    case when coalesce(length(btrim(v.bio)), 0) < 80 then 'bio' else null end,
    case when cardinality(coalesce(v.skills, '{}'::text[])) < 3 then 'skills' else null end,
    case when cardinality(coalesce(v.tools, '{}'::text[])) < 2 then 'tools' else null end,
    case when cardinality(coalesce(v.industries, '{}'::text[])) < 1 then 'industries' else null end
  ], null::text) as classification_missing
from profiles p
left join va_profiles v on v.user_id = p.id
left join va_vetting vv on vv.va_id = p.id
cross join lateral (
  select
    (case when coalesce(length(btrim(v.headline)), 0) >= 8 then 1 else 0 end
      + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 1 else 0 end
      + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 3 then 1 else 0 end
      + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 2 then 1 else 0 end) as role_signal_count,
    (case when coalesce(length(btrim(v.headline)), 0) >= 8 then 1 else 0 end
      + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 1 else 0 end
      + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 3 then 1 else 0 end
      + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 2 then 1 else 0 end
      + case when cardinality(coalesce(v.industries, '{}'::text[])) >= 1 then 1 else 0 end) as total_signal_count
) ce
where p.role = 'va'::user_role;

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
      account_status,
      classification_status,
      classification_missing,
      classification_evidence_count
    from recent
    where classification_status = 'incomplete_profile'
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
      and classification_status = 'classified'
  )::integer as approval_ready_count,
  count(*) filter (
    where stage in ('approved','bench')
      and completion_score < 60
      and account_status = 'active'
  )::integer as approval_cleanup_count,
  count(*) filter (where avatar_url is null and classification_status = 'classified')::integer as missing_photo_count,
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
  count(*) filter (where last_activity_at < now() - interval '60 days' and classification_status = 'classified')::integer as stale_60_count,
  count(*) filter (where availability_status = 'available' and classification_status = 'classified')::integer as available_count,
  count(*) filter (where stage = 'recruiter_review')::integer as needs_review_count,
  (select count(*)::integer from recent) as new_accounts_7d,
  (select count(*)::integer from recent where completion_score = 0) as recent_zero_7d,
  (select count(*)::integer from recent where completion_score = 0 and email_verified = true) as verified_recent_zero_7d,
  stalled.rows as stalled,
  count(*) filter (where classification_status = 'classified')::integer as talent_pool_count,
  count(*) filter (where classification_status = 'incomplete_profile')::integer as classification_incomplete_count,
  count(*) filter (where classification_status = 'ready_to_classify')::integer as classification_ready_count
from directory
cross join stalled
group by stalled.rows;

revoke all on public.recruiter_talent_summary from public, anon, authenticated;
grant select on public.recruiter_talent_summary to service_role;
