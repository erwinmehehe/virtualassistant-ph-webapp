-- v4.12 launch hardening: onboarding, richer job briefs, message attachments,
-- trust metadata, rate-limit counters, and stricter public VA eligibility.

alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists identity_verified_at timestamptz;
alter table public.profiles add column if not exists last_active_at timestamptz;

alter table public.client_profiles add column if not exists company_description text;
alter table public.client_profiles add column if not exists logo_url text;
alter table public.client_profiles add column if not exists location text;
alter table public.client_profiles add column if not exists hiring_needs text;
alter table public.client_profiles add column if not exists budget_min numeric(10,2);
alter table public.client_profiles add column if not exists budget_max numeric(10,2);
alter table public.client_profiles add column if not exists onboarding_completed_at timestamptz;

alter table public.va_profiles add column if not exists preferred_timezone text;

alter table public.jobs add column if not exists experience_level text check (experience_level is null or experience_level in ('entry','intermediate','senior','expert'));
alter table public.jobs add column if not exists moderation_status text not null default 'clear' check (moderation_status in ('clear','review','blocked'));
alter table public.jobs add column if not exists closed_at timestamptz;

alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_size integer check (attachment_size is null or attachment_size between 1 and 10485760);
alter table public.conversations add column if not exists status text not null default 'active' check (status in ('active','archived','closed'));

create table if not exists public.action_rate_limits (
  id uuid primary key default gen_random_uuid(),
  action_key text not null,
  subject_hash text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  unique(action_key, subject_hash)
);
create index if not exists action_rate_limits_updated_idx on public.action_rate_limits(updated_at);
revoke all on public.action_rate_limits from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-attachments','message-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false, file_size_limit=10485760;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-logos','company-logos',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=3145728;

create or replace view public.public_company_profiles as
select user_id, company_name, logo_url, website, industry, location, team_size, company_description
from public.client_profiles
where company_name is not null and btrim(company_name) <> '';
revoke all on public.public_company_profiles from anon;
grant select on public.public_company_profiles to anon, authenticated;

-- Only high-quality, approved profiles may be surfaced publicly. The view remains
-- deliberately contact-safe: no email, resume path, legal name, or private links.
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

revoke all on public.public_va_directory from anon;
grant select on public.public_va_directory to anon, authenticated;

-- Immutable-style admin audit trail for sensitive staff actions.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log(target_type, target_id);
revoke all on public.admin_audit_log from anon, authenticated;
