-- Agency Operations v2 core schema.
-- Sales remains on lead_intake. Hiring belongs to jobs. Post-hire operations
-- belong to workrooms/placements with explicit Client Success ownership.

-- Keep the sales pipeline compact. Discovery and qualification detail belong
-- in the lead record, not as dozens of CRM stages.
alter table public.lead_intake drop constraint if exists lead_intake_crm_stage_check;
update public.lead_intake set crm_stage='terms_sent' where crm_stage='shortlist_sent';
alter table public.lead_intake add constraint lead_intake_crm_stage_check check (
  crm_stage = any (array[
    'new'::text,'contacted'::text,'discovery_booked'::text,'qualified'::text,
    'terms_sent'::text,'nurture'::text,'won'::text,'lost'::text
  ])
);

-- Hiring lifecycle. This is deliberately separate from sales and post-hire
-- placement operations.
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

-- One commercial source of truth. Do not hard-code these values across pages.
alter table public.admin_settings add column if not exists client_success_owner_id uuid references public.profiles(id) on delete set null;
alter table public.admin_settings add column if not exists health_healthy_threshold integer not null default 85;
alter table public.admin_settings add column if not exists health_watch_threshold integer not null default 65;
alter table public.admin_settings add column if not exists health_min_coverage integer not null default 40;
alter table public.admin_settings add column if not exists health_client_sentiment_weight integer not null default 25;
alter table public.admin_settings add column if not exists health_va_sentiment_weight integer not null default 15;
alter table public.admin_settings add column if not exists health_attendance_weight integer not null default 15;
alter table public.admin_settings add column if not exists health_performance_weight integer not null default 15;
alter table public.admin_settings add column if not exists health_task_completion_weight integer not null default 10;
alter table public.admin_settings add column if not exists health_timesheet_weight integer not null default 5;
alter table public.admin_settings add column if not exists health_communication_weight integer not null default 5;
alter table public.admin_settings add column if not exists health_billing_weight integer not null default 5;
alter table public.admin_settings add column if not exists health_support_weight integer not null default 5;

-- Public client identity is opt-in. Company data can exist privately without
-- automatically becoming public on a job listing.
alter table public.client_profiles add column if not exists public_company_visible boolean not null default false;
alter table public.client_profiles add column if not exists public_company_visible_at timestamptz;

-- A workroom is the managed placement record. Lifecycle and health are
-- separate: a placement can be Active and Healthy, Active and Watch, etc.
alter table public.workrooms add column if not exists client_success_owner_id uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists placement_stage text not null default 'pre_start';
alter table public.workrooms add column if not exists placement_stage_entered_at timestamptz not null default now();
alter table public.workrooms add column if not exists handoff_completed_at timestamptz;
alter table public.workrooms add column if not exists handoff_completed_by uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists handoff_notes text;
alter table public.workrooms add column if not exists placement_ready_at timestamptz;
alter table public.workrooms add column if not exists health_score integer;
alter table public.workrooms add column if not exists health_status text not null default 'building';
alter table public.workrooms add column if not exists health_coverage integer not null default 0;
alter table public.workrooms add column if not exists health_calculated_at timestamptz;
alter table public.workrooms add column if not exists at_risk_reason text;
alter table public.workrooms add column if not exists recovery_plan text;
alter table public.workrooms add column if not exists ended_at timestamptz;
alter table public.workrooms drop constraint if exists workrooms_placement_stage_check;
alter table public.workrooms add constraint workrooms_placement_stage_check check (
  placement_stage = any (array[
    'pre_start'::text,'launch'::text,'active'::text,
    'recovery'::text,'replacement'::text,'ended'::text
  ])
);
alter table public.workrooms drop constraint if exists workrooms_health_status_check;
alter table public.workrooms add constraint workrooms_health_status_check check (
  health_status = any (array['building'::text,'healthy'::text,'watch'::text,'at_risk'::text])
);
alter table public.workrooms drop constraint if exists workrooms_health_score_check;
alter table public.workrooms add constraint workrooms_health_score_check check (health_score is null or health_score between 0 and 100);
alter table public.workrooms drop constraint if exists workrooms_health_coverage_check;
alter table public.workrooms add constraint workrooms_health_coverage_check check (health_coverage between 0 and 100);
create index if not exists workrooms_csm_stage_idx
  on public.workrooms(client_success_owner_id,placement_stage,placement_stage_entered_at desc);
create index if not exists workrooms_health_idx
  on public.workrooms(health_status,health_score,health_calculated_at desc)
  where placement_stage <> 'ended';

alter table public.workroom_checklist drop constraint if exists workroom_checklist_owner_role_check;
alter table public.workroom_checklist add constraint workroom_checklist_owner_role_check
  check (owner_role = any (array['client'::text,'va'::text,'agency'::text]));

-- Shared milestone pulse. Client and VA respond independently. Jervis only
-- needs to handle the exceptions.
create table if not exists public.placement_checkins (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  checkpoint text not null,
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo','completed','skipped')),
  client_signal text check (client_signal is null or client_signal in ('green','yellow','red')),
  client_note text check (client_note is null or char_length(client_note)<=2000),
  client_responded_at timestamptz,
  client_notified_at timestamptz,
  va_signal text check (va_signal is null or va_signal in ('green','yellow','red')),
  va_note text check (va_note is null or char_length(va_note)<=2000),
  va_responded_at timestamptz,
  va_notified_at timestamptz,
  escalated_at timestamptz,
  notes text check (notes is null or char_length(notes)<=4000),
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workroom_id,checkpoint)
);
alter table public.placement_checkins enable row level security;
revoke all on table public.placement_checkins from public,anon,authenticated;
grant select,insert,update,delete on table public.placement_checkins to service_role;
create index if not exists placement_checkins_due_idx on public.placement_checkins(status,due_at);
create index if not exists placement_checkins_workroom_idx on public.placement_checkins(workroom_id,due_at);

-- Private work-setup evidence. Clients should see a truthful verified signal,
-- not the raw device/network details.
alter table public.va_profiles add column if not exists work_setup_computer text;
alter table public.va_profiles add column if not exists work_setup_os text;
alter table public.va_profiles add column if not exists work_setup_ram_gb integer;
alter table public.va_profiles add column if not exists primary_internet text;
alter table public.va_profiles add column if not exists backup_internet text;
alter table public.va_profiles add column if not exists backup_power text;
alter table public.va_profiles add column if not exists headset_ready boolean;
alter table public.va_profiles add column if not exists webcam_ready boolean;
alter table public.va_profiles add column if not exists quiet_workspace boolean;
alter table public.va_profiles add column if not exists work_setup_verified_at timestamptz;
