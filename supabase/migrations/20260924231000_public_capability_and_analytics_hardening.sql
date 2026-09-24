-- Public capability hardening: expire booking-management links, stop retaining
-- raw booking tokens, and deduplicate client analytics events.

alter table public.lead_intake
  add column if not exists discovery_manage_token_id uuid,
  add column if not exists discovery_manage_token_expires_at timestamptz;

-- Existing high-entropy links remain usable for a limited migration window.
-- New/reissued links are reconstructable from token_id + expiry and signed
-- server-side, so the raw capability never needs to be stored.
update public.lead_intake
set discovery_manage_token_expires_at = coalesce(
  discovery_manage_token_expires_at,
  now() + interval '30 days'
)
where discovery_manage_token_hash is not null;

update public.lead_intake
set discovery_manage_token = null
where discovery_manage_token is not null;

comment on column public.lead_intake.discovery_manage_token is
  'Deprecated. Raw booking-management capabilities must not be stored.';
comment on column public.lead_intake.discovery_manage_token_hash is
  'SHA-256 hash of the current booking-management capability.';
comment on column public.lead_intake.discovery_manage_token_id is
  'Non-secret identifier used with expiry to reconstruct a signed booking-management capability server-side.';
comment on column public.lead_intake.discovery_manage_token_expires_at is
  'Expiry for the current booking-management capability.';

create index if not exists lead_intake_discovery_manage_token_expiry_idx
  on public.lead_intake(discovery_manage_token_expires_at)
  where discovery_manage_token_hash is not null;

alter table public.analytics_events
  add column if not exists event_id uuid;

do $$
begin
  alter table public.analytics_events
    add constraint analytics_events_event_id_key unique(event_id);
exception
  when duplicate_object then null;
end
$$;

comment on column public.analytics_events.event_id is
  'Browser-generated idempotency identifier. Duplicate deliveries are ignored by the analytics API.';
