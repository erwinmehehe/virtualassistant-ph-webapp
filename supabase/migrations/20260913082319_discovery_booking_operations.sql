alter table public.lead_intake
  add column if not exists discovery_manage_token_hash text,
  add column if not exists discovery_manage_token text,
  add column if not exists discovery_zoom_meeting_id text,
  add column if not exists discovery_outcome text,
  add column if not exists discovery_cancelled_at timestamptz,
  add column if not exists discovery_rescheduled_at timestamptz,
  add column if not exists discovery_reminder_24h_sent_at timestamptz,
  add column if not exists discovery_reminder_1h_sent_at timestamptz;

do $$ begin
  alter table public.lead_intake add constraint lead_intake_discovery_outcome_check
    check (discovery_outcome is null or discovery_outcome in ('attended','no_show','cancelled','rescheduled','qualified'));
exception when duplicate_object then null;
end $$;

create unique index if not exists lead_intake_discovery_manage_token_hash_idx
  on public.lead_intake (discovery_manage_token_hash)
  where discovery_manage_token_hash is not null;

create index if not exists lead_intake_discovery_reminder_due_idx
  on public.lead_intake (discovery_scheduled_at)
  where discovery_scheduled_at is not null
    and discovery_completed_at is null
    and discovery_cancelled_at is null;

comment on column public.lead_intake.discovery_manage_token is
  'High-entropy booking token retained only for server-side reminder links; lead_intake remains server-only.';
