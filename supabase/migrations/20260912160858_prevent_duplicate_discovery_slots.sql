-- A public booking is stored on lead_intake. The unique partial index is the
-- final concurrency guard when two visitors submit the same available time.
create unique index if not exists lead_intake_discovery_scheduled_unique_idx
  on public.lead_intake (discovery_scheduled_at)
  where discovery_scheduled_at is not null;
