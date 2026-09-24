-- Harden public analytics ingestion and remove recoverable raw booking tokens.

alter table public.analytics_events
  add column if not exists event_id uuid;

create unique index if not exists analytics_events_event_id_unique_idx
  on public.analytics_events(event_id)
  where event_id is not null;

-- Booking management now uses signed capability tokens. Keep only legacy token
-- hashes so old links can continue to work during the transition.
update public.lead_intake
set discovery_manage_token = null
where discovery_manage_token is not null;

comment on column public.lead_intake.discovery_manage_token is
  'Deprecated. Raw booking-management capabilities are no longer stored. Legacy hashes remain temporarily for old links.';
