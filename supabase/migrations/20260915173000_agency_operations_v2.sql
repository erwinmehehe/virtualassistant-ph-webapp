-- Agency Operations v2 core schema.
-- Reuse the existing Sales CRM, recruiter workflow and workrooms. Sales,
-- Recruitment and Client Success remain related but distinct operating layers.

-- Sales uses a commercial stage. Client shortlist state remains on the role.
alter table public.lead_intake drop constraint if exists lead_intake_crm_stage_check;
alter table public.lead_intake add constraint lead_intake_crm_stage_check check (
  crm_stage = any (array[
    'new'::text,'contacted'::text,'discovery_booked'::text,'qualified'::text,
    'terms_sent'::text,'shortlist_sent'::text,'nurture'::text,'won'::text,'lost'::text
  ])
);
update public.lead_intake set crm_stage='terms_sent' where crm_stage='shortlist_sent';

-- Existing admin_settings is the business-configuration source of truth.
-- Do not silently change min_hourly_rate or current commercial economics here.
alter table public.admin_settings
  add column if not exists default_client_success_owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists placement_health_weights jsonb not null default '{"client_sentiment":25,"va_sentiment":15,"attendance":15,"performance":15,"task_completion":10,"timesheet_health":5,"communication":5,"billing":5,"support_escalations":5}'::jsonb,
  add column if not exists placement_health_healthy_min numeric not null default 85,
  add column if not exists placement_health_watch_min numeric not null default 65,
  add column if not exists availability_fresh_days integer not null default 7,
  add column if not exists availability_block_days integer not null default 14;

alter table public.admin_settings drop constraint if exists admin_settings_health_threshold_check;
alter table public.admin_settings add constraint admin_settings_health_threshold_check check (
  placement_health_healthy_min between 1 and 100
  and placement_health_watch_min between 0 and placement_health_healthy_min
  and availability_fresh_days between 1 and 60
  and availability_block_days >= availability_fresh_days
);

-- Public employer identity is opt-in. Existing rows stay private by default.
alter table public.client_profiles
  add column if not exists public_company_visible boolean not null default false;
alter table public.jobs
  add column if not exists public_company_name_enabled boolean not null default false;

-- Hiring lifecycle belongs to the role, not the Sales CRM.
alter table public.jobs add column if not exists hiring_stage text not null default 'intake';
alter table public.jobs add column if not exists hiring_stage_entered_at timestamptz not null default now();
alter table public.jobs add column if not exists target_start_date date;
alter table public.jobs drop constraint if exists jobs_hiring_stage_check;
alter table public.jobs add constraint jobs_hiring_stage_check check (
  hiring_stage = any (array[
    'intake'::text,'ready_to_recruit'::text,'sourcing'::text,'internal_review'::text,
    'client_review'::text,'interviewing'::text,'selected'::text,'offer'::text,
    'pre_start'::text,'filled'::text,'closed'::text
  ])
);
create index if not exists jobs_recruiter_hiring_stage_idx
  on public.jobs(recruiter_id,hiring_stage,hiring_stage_entered_at desc);

-- Workrooms are already the confirmed placement object. Extend them rather
-- than creating a parallel placement table.
alter table public.workrooms
  add column if not exists client_success_owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists placement_stage text not null default 'pre_start',
  add column if not exists placement_stage_entered_at timestamptz not null default now(),
  add column if not exists handoff_ready_at timestamptz,
  add column if not exists handoff_ready_by uuid references public.profiles(id) on delete set null,
  add column if not exists handoff_accepted_at timestamptz,
  add column if not exists handoff_accepted_by uuid references public.profiles(id) on delete set null,
  add column if not exists handoff_notes text,
  add column if not exists handoff_snapshot jsonb,
  add column if not exists placement_ready_at timestamptz,
  add column if not exists health_score numeric,
  add column if not exists health_status text,
  add column if not exists health_signal_coverage numeric,
  add column if not exists health_calculated_at timestamptz,
  add column if not exists at_risk_reason text,
  add column if not exists recovery_plan text,
  add column if not exists ended_at timestamptz;

alter table public.workrooms drop constraint if exists workrooms_placement_stage_check;
alter table public.workrooms add constraint workrooms_placement_stage_check check (
  placement_stage = any (array['pre_start'::text,'launch'::text,'active'::text,'recovery'::text,'replacement'::text,'ended'::text])
);
alter table public.workrooms drop constraint if exists workrooms_health_status_check;
alter table public.workrooms add constraint workrooms_health_status_check check (
  health_status is null or health_status = any (array['building'::text,'healthy'::text,'watch'::text,'at_risk'::text])
);
alter table public.workrooms drop constraint if exists workrooms_health_score_check;
alter table public.workrooms add constraint workrooms_health_score_check check (
  (health_score is null or health_score between 0 and 100)
  and (health_signal_coverage is null or health_signal_coverage between 0 and 100)
);
create index if not exists workrooms_csm_stage_idx
  on public.workrooms(client_success_owner_id,placement_stage,placement_stage_entered_at desc);
create index if not exists workrooms_csm_health_idx
  on public.workrooms(client_success_owner_id,health_status,health_score);

-- Extend the existing onboarding checklist with agency-owned readiness work.
alter table public.workroom_checklist drop constraint if exists workroom_checklist_owner_role_check;
alter table public.workroom_checklist add constraint workroom_checklist_owner_role_check
  check (owner_role = any (array['client'::text,'va'::text,'agency'::text]));

-- Milestone pulses are operational records. Monthly rows can repeat, so the
-- unique key includes due_at rather than pretending there is only one monthly check.
create table if not exists public.placement_checkins (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  checkpoint text not null check (checkpoint in ('day1','day3','day7','day14','day30','day60','day90','monthly')),
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo','completed','skipped')),
  client_signal text check (client_signal is null or client_signal in ('green','yellow','red')),
  va_signal text check (va_signal is null or va_signal in ('green','yellow','red')),
  notes text check (notes is null or char_length(notes)<=4000),
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workroom_id,checkpoint,due_at)
);
alter table public.placement_checkins enable row level security;
revoke all on table public.placement_checkins from public,anon,authenticated;
grant select,insert,update,delete on table public.placement_checkins to service_role;
create index if not exists placement_checkins_due_idx on public.placement_checkins(status,due_at);
create index if not exists placement_checkins_workroom_idx on public.placement_checkins(workroom_id,due_at);

-- Public company directory data is exposed only when the client has opted in.
create or replace function private.public_company_profile_rows()
returns table(user_id uuid, company_name text, logo_url text, website text, industry text, location text, team_size text, company_description text, verified_at timestamptz, hires_count integer)
language sql
stable security definer
set search_path='pg_catalog'
as $$
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
    (select count(*)::integer from public.workrooms w where w.client_id=c.user_id) as hires_count
  from public.client_profiles c
  where c.public_company_visible=true
    and c.company_name is not null
    and btrim(c.company_name)<>'';
$$;
