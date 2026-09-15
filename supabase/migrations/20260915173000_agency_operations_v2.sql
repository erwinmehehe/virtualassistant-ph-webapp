-- Agency Operations v2 core schema.
-- Sales remains on lead_intake. Hiring belongs to jobs. Post-hire operations
-- belong to workrooms/placements with explicit Client Success ownership.

alter table public.lead_intake drop constraint if exists lead_intake_crm_stage_check;
alter table public.lead_intake add constraint lead_intake_crm_stage_check check (
  crm_stage = any (array[
    'new'::text,'contacted'::text,'discovery_booked'::text,'qualified'::text,
    'terms_sent'::text,'shortlist_sent'::text,'nurture'::text,'won'::text,'lost'::text
  ])
);
update public.lead_intake set crm_stage='terms_sent' where crm_stage='shortlist_sent';

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

alter table public.workrooms add column if not exists client_success_owner_id uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists placement_stage text not null default 'onboarding';
alter table public.workrooms add column if not exists placement_stage_entered_at timestamptz not null default now();
alter table public.workrooms add column if not exists handoff_completed_at timestamptz;
alter table public.workrooms add column if not exists handoff_completed_by uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists handoff_notes text;
alter table public.workrooms add column if not exists placement_ready_at timestamptz;
alter table public.workrooms add column if not exists at_risk_reason text;
alter table public.workrooms add column if not exists recovery_plan text;
alter table public.workrooms add column if not exists ended_at timestamptz;
alter table public.workrooms drop constraint if exists workrooms_placement_stage_check;
alter table public.workrooms add constraint workrooms_placement_stage_check check (
  placement_stage = any (array[
    'onboarding'::text,'healthy'::text,'watch'::text,'at_risk'::text,
    'recovery'::text,'replacement'::text,'ended'::text
  ])
);
create index if not exists workrooms_csm_stage_idx
  on public.workrooms(client_success_owner_id,placement_stage,placement_stage_entered_at desc);

alter table public.workroom_checklist drop constraint if exists workroom_checklist_owner_role_check;
alter table public.workroom_checklist add constraint workroom_checklist_owner_role_check
  check (owner_role = any (array['client'::text,'va'::text,'agency'::text]));

create table if not exists public.placement_checkins (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  checkpoint text not null check (checkpoint in ('day3','day7','day14','day30')),
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo','completed','skipped')),
  client_signal text check (client_signal is null or client_signal in ('green','yellow','red')),
  va_signal text check (va_signal is null or va_signal in ('green','yellow','red')),
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
