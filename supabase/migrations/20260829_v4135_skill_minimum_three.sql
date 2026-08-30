-- v4.13.5: lower the public-directory skill minimum from 5 to 3.
--
-- The 5-skill rule was blocking otherwise complete, vetted profiles from ever
-- reaching the directory. Both views are recreated with the new threshold so
-- the eligibility rule, the readiness score and the missing-items list agree.
-- Only the skills predicates change; the tools thresholds are untouched.

create or replace view public.public_va_directory as
select
  v.user_id,
  v.slug,
  case
    when p.full_name is null or btrim(p.full_name) = '' then 'Vetted VA'
    when position(' ' in btrim(p.full_name)) = 0 then btrim(p.full_name)
    else split_part(btrim(p.full_name), ' ', 1) || ' ' || upper(left(reverse(split_part(reverse(btrim(p.full_name)), ' ', 1)), 1)) || '.'
  end as full_name,
  p.avatar_url,
  p.email_verified,
  p.identity_verified_at,
  p.last_active_at,
  v.headline,
  v.bio,
  v.primary_category,
  v.categories,
  v.skills,
  v.tools,
  v.industries,
  v.languages,
  v.years_experience,
  v.weekly_hours,
  v.schedule,
  v.preferred_timezone,
  v.overlap_hours,
  null::text as portfolio_url,
  null::text as linkedin_url,
  v.availability_status,
  v.hourly_rate,
  (v.portfolio_url is not null and btrim(v.portfolio_url) <> '') as has_portfolio,
  v.created_at
from public.va_profiles v
join public.profiles p on p.id = v.user_id
join public.va_vetting vv on vv.va_id = v.user_id
where v.directory_visible = true
  and v.availability_status = 'available'
  and coalesce(v.years_experience, 0) >= 2
  and p.avatar_url is not null and btrim(p.avatar_url) <> ''
  and coalesce(length(btrim(v.headline)),0) >= 8
  and coalesce(length(btrim(v.bio)),0) >= 80
  and cardinality(v.skills) >= 3
  and coalesce(v.weekly_hours,0) >= 1
  and coalesce(v.hourly_rate,0) >= 5
  and v.resume_path is not null
  and vv.stage in ('approved','bench');

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
  coalesce(vv.stage, 'profile') as stage,
  vv.updated_at as vetting_updated_at,
  vv.profile_reviewed_at,
  vv.resume_reviewed_at,
  vv.changes_requested_at,
  (
    (case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end) +
    (case when coalesce(length(btrim(v.headline)),0) >= 8 then 10 else 0 end) +
    (case when coalesce(length(btrim(v.bio)),0) >= 80 then 15 else 0 end) +
    (case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end) +
    (case when cardinality(coalesce(v.skills,'{}'::text[])) >= 3 then 15 else 0 end) +
    (case when cardinality(coalesce(v.tools,'{}'::text[])) >= 3 then 5 else 0 end) +
    (case when coalesce(v.years_experience,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.weekly_hours,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.hourly_rate,0) >= 5 then 10 else 0 end) +
    (case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end) +
    (case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end)
  )::integer as completion_score,
  array_remove(array[
    case when p.avatar_url is null or btrim(p.avatar_url) = '' then 'photo' end,
    case when coalesce(length(btrim(v.headline)),0) < 8 then 'headline' end,
    case when coalesce(length(btrim(v.bio)),0) < 80 then 'bio' end,
    case when v.primary_category is null or btrim(v.primary_category) = '' then 'category' end,
    case when cardinality(coalesce(v.skills,'{}'::text[])) < 3 then 'skills' end,
    case when cardinality(coalesce(v.tools,'{}'::text[])) < 3 then 'tools' end,
    case when coalesce(v.years_experience,0) < 1 then 'experience' end,
    case when coalesce(v.weekly_hours,0) < 1 then 'availability' end,
    case when coalesce(v.hourly_rate,0) < 5 then 'rate' end,
    case when v.resume_path is null or btrim(v.resume_path) = '' then 'resume' end,
    case when v.portfolio_url is null or btrim(v.portfolio_url) = '' then 'portfolio' end
  ], null) as missing_items,
  greatest(p.updated_at, coalesce(v.updated_at,p.updated_at), coalesce(p.last_active_at,p.updated_at)) as last_activity_at
from public.profiles p
left join public.va_profiles v on v.user_id = p.id
left join public.va_vetting vv on vv.va_id = p.id
where p.role = 'va';

select count(*) as public_profiles from public.public_va_directory;
