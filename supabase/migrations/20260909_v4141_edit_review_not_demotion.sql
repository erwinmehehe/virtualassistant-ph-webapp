-- v4.14.1: an approved VA who edits their profile is reviewed, not demoted.
--
-- Until now ANY material profile edit by an approved VA set directory_visible
-- to false AND knocked them from 'approved' back to 'finalist'. That made the
-- profile completion reminder self-defeating: we email a VA asking for a photo
-- and a fuller bio, and the moment they comply they are unpublished and have to
-- be approved all over again. The public directory drained itself.
--
-- The control it provided was real -- an approved VA could otherwise rewrite
-- their bio to anything and it would be live unreviewed -- so it is replaced
-- rather than removed. The edit now raises a flag the recruiter can see and
-- clear, while the VA stays approved and stays listed.
--
-- A change of primary category still demotes: a different specialty genuinely
-- needs a category-appropriate test and a fresh scorecard.

alter table public.va_vetting
  add column if not exists edited_since_approval_at timestamptz;

comment on column public.va_vetting.edited_since_approval_at is
  'Set when an already-approved VA materially edits their profile. Cleared by a recruiter marking the edit reviewed. Does not affect stage or visibility.';

create index if not exists va_vetting_edited_since_approval_idx
  on public.va_vetting(edited_since_approval_at)
  where edited_since_approval_at is not null;

-- Expose it to the recruiter directory. Appending a column at the end is the
-- one shape change CREATE OR REPLACE VIEW allows, so no drop is needed.
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
    (case when cardinality(coalesce(v.skills,'{}'::text[])) >= 5 then 15 else 0 end) +
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
    case when cardinality(coalesce(v.skills,'{}'::text[])) < 5 then 'skills' end,
    case when cardinality(coalesce(v.tools,'{}'::text[])) < 3 then 'tools' end,
    case when coalesce(v.years_experience,0) < 1 then 'experience' end,
    case when coalesce(v.weekly_hours,0) < 1 then 'availability' end,
    case when coalesce(v.hourly_rate,0) < 5 then 'rate' end,
    case when v.resume_path is null or btrim(v.resume_path) = '' then 'resume' end,
    case when v.portfolio_url is null or btrim(v.portfolio_url) = '' then 'portfolio' end
  ], null) as missing_items,
  greatest(p.updated_at, coalesce(v.updated_at,p.updated_at), coalesce(p.last_active_at,p.updated_at)) as last_activity_at,
  vv.edited_since_approval_at
from public.profiles p
left join public.va_profiles v on v.user_id = p.id
left join public.va_vetting vv on vv.va_id = p.id
where p.role = 'va';

revoke all on public.recruiter_va_directory from anon, authenticated;
grant select on public.recruiter_va_directory to service_role;

-- Confirm.
select column_name from information_schema.columns
where table_name = 'recruiter_va_directory' and column_name = 'edited_since_approval_at';
