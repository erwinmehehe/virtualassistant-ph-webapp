-- Production-applied 2026-09-30.
-- focus_verticals is public read-only data. Browser roles do not need writes.

revoke insert, update, delete on table public.focus_verticals from authenticated;
