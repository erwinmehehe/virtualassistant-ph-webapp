-- Revert the skill minimum to 5.
--
-- Lowering it to 3 unblocked nobody: the three VAs it was meant to help have 0,
-- 0 and 2 skills, not 4. The bar is restored to 5, which is the level a client
-- can actually match against.
--
-- This is a plain CREATE OR REPLACE, not a drop: the earlier recreation aligned
-- production's column order with the repo, so replacing works now. The
-- dependent view public_va_reviews is untouched.

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
  and cardinality(v.skills) >= 5
  and coalesce(v.weekly_hours,0) >= 1
  and coalesce(v.hourly_rate,0) >= 5
  and v.resume_path is not null
  and vv.stage in ('approved','bench');

select count(*) as public_profiles from public.public_va_directory;
