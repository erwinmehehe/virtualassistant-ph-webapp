-- v4.13.0 recruiter operations: control-center reporting, bulk cleanup,
-- profile reminders, private recruiter notes/activity, pipeline offers,
-- internal error monitoring, and a queryable recruiter VA directory.

-- Offered is a distinct client pipeline stage between interview and hired.
alter type public.application_status add value if not exists 'offered' after 'interview';

alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists identity_verified_at timestamptz;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.client_profiles add column if not exists verified_at timestamptz;

-- Backfill trust/activity signals for accounts that existed before these fields.
update public.profiles p
set email_verified = true
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null and p.email_verified = false;
update public.profiles
set last_active_at = coalesce(last_active_at, updated_at, created_at)
where last_active_at is null;

alter table public.va_vetting add column if not exists profile_reviewed_at timestamptz;
alter table public.va_vetting add column if not exists resume_reviewed_at timestamptz;
alter table public.va_vetting add column if not exists changes_requested_at timestamptz;

create table if not exists public.recruiter_notes (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('va','job','lead')),
  subject_id uuid not null,
  note text not null check (char_length(btrim(note)) between 2 and 4000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists recruiter_notes_subject_idx on public.recruiter_notes(subject_type, subject_id, created_at desc);
revoke all on public.recruiter_notes from anon, authenticated;

create table if not exists public.recruiter_activity (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('va','job','lead','application')),
  subject_id uuid not null,
  action text not null,
  description text,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists recruiter_activity_subject_idx on public.recruiter_activity(subject_type, subject_id, created_at desc);
create index if not exists recruiter_activity_created_idx on public.recruiter_activity(created_at desc);
revoke all on public.recruiter_activity from anon, authenticated;

create table if not exists public.va_profile_reminders (
  va_id uuid primary key references public.profiles(id) on delete cascade,
  reminder_count integer not null default 0 check (reminder_count between 0 and 20),
  last_score integer check (last_score is null or last_score between 0 and 100),
  last_sent_at timestamptz,
  last_sent_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists va_profile_reminders_last_sent_idx on public.va_profile_reminders(last_sent_at desc);
revoke all on public.va_profile_reminders from anon, authenticated;

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  digest text,
  message text not null,
  path text,
  role text,
  user_id uuid references public.profiles(id) on delete set null,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists app_error_events_created_idx on public.app_error_events(created_at desc);
create index if not exists app_error_events_unresolved_idx on public.app_error_events(resolved_at, created_at desc);
revoke all on public.app_error_events from anon, authenticated;

create table if not exists public.outbound_email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  recipient text,
  status text not null check (status in ('sent','failed')),
  provider_id text,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists outbound_email_events_status_idx on public.outbound_email_events(status, created_at desc);
create index if not exists outbound_email_events_type_idx on public.outbound_email_events(event_type, created_at desc);
revoke all on public.outbound_email_events from anon, authenticated;

-- Private service-role-only view for the recruiter directory. It intentionally
-- includes no auth.users fields such as email; email is fetched only on the
-- individual internal profile page.
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
  greatest(p.updated_at, coalesce(v.updated_at,p.updated_at), coalesce(p.last_active_at,p.updated_at)) as last_activity_at
from public.profiles p
left join public.va_profiles v on v.user_id = p.id
left join public.va_vetting vv on vv.va_id = p.id
where p.role = 'va';
revoke all on public.recruiter_va_directory from anon, authenticated;

-- Keep the schema snapshot aligned for fresh installs by applying these
-- changes through migrations in production. Service-role server code is the
-- only application surface intended to read the private tables/view above.


-- Public company trust view: append-only fields keep existing consumers stable.
create or replace view public.public_company_profiles as
select
  c.user_id,
  c.company_name,
  c.logo_url,
  c.website,
  c.industry,
  c.location,
  c.team_size,
  c.company_description,
  c.verified_at,
  (select count(*)::integer from public.workrooms w where w.client_id = c.user_id) as hires_count
from public.client_profiles c
where c.company_name is not null and btrim(c.company_name) <> '';
revoke all on public.public_company_profiles from anon;
grant select on public.public_company_profiles to anon, authenticated;
