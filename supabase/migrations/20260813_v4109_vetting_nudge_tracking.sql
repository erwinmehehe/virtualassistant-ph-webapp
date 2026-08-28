-- v4.10.9: tracks when a VA was last sent a "finish your profile" nudge,
-- so the scheduled maintenance job never re-sends the same person a
-- reminder every single day forever.
alter table public.va_vetting add column if not exists nudged_at timestamptz;
