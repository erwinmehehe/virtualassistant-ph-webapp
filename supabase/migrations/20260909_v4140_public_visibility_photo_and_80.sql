-- v4.14.0: relax the public directory to "photo + 80% profile".
--
-- The old view required eleven separate things. Several of them are already
-- priced into the completion score, so a VA was being gated twice for the same
-- field -- and a resume, which no client ever sees, could keep a finished
-- profile off the directory entirely.
--
-- New rule: approved, available, has a photo, profile at 80% or better,
-- 2+ years of experience, rate at or above the USD 5 floor.
--
-- Experience and rate stay because they are published promises, not
-- completeness: the site states the two-year minimum, and $5/hour is the
-- platform floor for ongoing hourly roles.
--
-- Dropped as individual gates (still scored, so still worth points):
--   resume_path, bio >= 80 chars, 5 skills, headline >= 8 chars, weekly_hours
--
-- Column list is unchanged, so CREATE OR REPLACE is safe here.

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
  and vv.stage in ('approved','bench')
  and v.availability_status = 'available'
  and p.avatar_url is not null and btrim(p.avatar_url) <> ''
  and coalesce(v.years_experience, 0) >= 2
  and coalesce(v.hourly_rate, 0) >= 5
  -- Same 100-point formula as recruiter_va_directory.completion_score.
  and (
    (case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end) +
    (case when coalesce(length(btrim(v.headline)),0) >= 8 then 10 else 0 end) +
    (case when coalesce(length(btrim(v.bio)),0) >= 80 then 15 else 0 end) +
    (case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end) +
    (case when cardinality(coalesce(v.skills,'{}'::text[])) >= 5 then 15 else 0 end) +
    (case when cardinality(coalesce(v.tools,'{}'::text[])) >= 3 then 5 else 0 end) +
    (case when coalesce(v.years_experience,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.weekly_hours,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.hourly_rate,0) >= 5 then 10 else 0 end) +
    (case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end) +
    (case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end)
  ) >= 80;

grant select on public.public_va_directory to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Publish everyone who now qualifies. directory_visible is an operational flag
-- that approval never set, so most approved VAs are still switched off.
-- ---------------------------------------------------------------------------
update public.va_profiles v
set directory_visible = true
from public.profiles p, public.va_vetting vv
where p.id = v.user_id
  and vv.va_id = v.user_id
  and v.directory_visible = false
  and vv.stage in ('approved','bench')
  and v.availability_status = 'available'
  and p.avatar_url is not null and btrim(p.avatar_url) <> ''
  and coalesce(v.years_experience, 0) >= 2
  and coalesce(v.hourly_rate, 0) >= 5
  and (
    (case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end) +
    (case when coalesce(length(btrim(v.headline)),0) >= 8 then 10 else 0 end) +
    (case when coalesce(length(btrim(v.bio)),0) >= 80 then 15 else 0 end) +
    (case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end) +
    (case when cardinality(coalesce(v.skills,'{}'::text[])) >= 5 then 15 else 0 end) +
    (case when cardinality(coalesce(v.tools,'{}'::text[])) >= 3 then 5 else 0 end) +
    (case when coalesce(v.years_experience,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.weekly_hours,0) >= 1 then 10 else 0 end) +
    (case when coalesce(v.hourly_rate,0) >= 5 then 10 else 0 end) +
    (case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end) +
    (case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end)
  ) >= 80;

-- Result.
select count(*) as public_profiles from public.public_va_directory;

-- Anyone approved and still not public, with the one reason.
select p.full_name,
       case
         when p.avatar_url is null or btrim(p.avatar_url) = '' then 'no photo'
         when coalesce(v.years_experience,0) < 2                then 'under 2 years experience'
         when coalesce(v.hourly_rate,0) < 5                     then 'rate under USD 5'
         when v.availability_status <> 'available'              then 'not marked available'
         else 'profile under 80%'
       end as blocked_by
from public.va_profiles v
join public.profiles p    on p.id = v.user_id
join public.va_vetting vv on vv.va_id = v.user_id
where vv.stage in ('approved','bench')
  and not v.directory_visible
order by 2, 1;
