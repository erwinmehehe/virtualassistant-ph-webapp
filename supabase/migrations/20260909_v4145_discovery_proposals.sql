-- v4.14.5 discovery calls and client proposals

alter table public.lead_intake
  add column if not exists discovery_scheduled_at timestamptz,
  add column if not exists discovery_duration_minutes integer,
  add column if not exists discovery_meeting_url text,
  add column if not exists discovery_completed_at timestamptz,
  add column if not exists discovery_notes text;

update public.lead_intake
set discovery_duration_minutes = coalesce(discovery_duration_minutes, 30)
where discovery_duration_minutes is null;

alter table public.lead_intake
  alter column discovery_duration_minutes set default 30;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.lead_intake'::regclass
      and conname='lead_intake_discovery_duration_check'
  ) then
    alter table public.lead_intake
      add constraint lead_intake_discovery_duration_check
      check (discovery_duration_minutes between 15 and 120);
  end if;
end $$;

create table if not exists public.lead_proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_intake(id) on delete cascade,
  public_token uuid not null default gen_random_uuid() unique,
  status text not null default 'draft',
  role_title text not null,
  summary text,
  service_model text not null default 'curated_placement',
  hours_per_week integer,
  va_rate_min numeric(10,2),
  va_rate_max numeric(10,2),
  placement_fee numeric(12,2),
  managed_markup_percent numeric(7,2),
  estimated_monthly_total numeric(12,2),
  start_timing text,
  expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  acceptance_name text,
  decline_reason text,
  job_id uuid references public.jobs(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_status_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_status_check
      check (status in ('draft','sent','accepted','declined','expired'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_service_model_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_service_model_check
      check (service_model in ('curated_placement','managed_service'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_hours_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_hours_check
      check (hours_per_week is null or hours_per_week between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_rates_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_rates_check
      check (
        (va_rate_min is null or va_rate_min >= 0)
        and (va_rate_max is null or va_rate_max >= 0)
        and (va_rate_min is null or va_rate_max is null or va_rate_max >= va_rate_min)
      );
  end if;
end $$;

create index if not exists lead_intake_discovery_idx
  on public.lead_intake (discovery_scheduled_at)
  where discovery_scheduled_at is not null;

create index if not exists lead_proposals_lead_created_idx
  on public.lead_proposals (lead_id, created_at desc);

create index if not exists lead_proposals_status_idx
  on public.lead_proposals (status, created_at desc);

alter table public.lead_proposals enable row level security;
revoke all on table public.lead_proposals from anon, authenticated;
