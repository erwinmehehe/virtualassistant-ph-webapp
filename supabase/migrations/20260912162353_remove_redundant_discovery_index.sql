-- The unique partial index now supports both availability lookups and
-- collision prevention, so the older non-unique copy is redundant.
drop index if exists public.lead_intake_discovery_idx;
