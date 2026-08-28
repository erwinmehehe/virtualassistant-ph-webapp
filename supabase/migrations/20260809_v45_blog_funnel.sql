-- v4.5 content-funnel attribution.
-- Stores the same anonymous browser session ID used by first-party analytics on lead records.

alter table public.lead_intake
  add column if not exists session_id uuid;

create index if not exists lead_intake_session_idx
  on public.lead_intake(session_id, created_at desc);
