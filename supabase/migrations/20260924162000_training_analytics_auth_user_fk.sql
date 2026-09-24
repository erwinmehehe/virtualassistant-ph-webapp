-- Training-only accounts may not have a public.profiles row.
-- Analytics events should reference the authoritative auth user instead so
-- acquisition and training funnel events can retain user identity safely.

alter table public.analytics_events
  drop constraint if exists analytics_events_user_id_fkey;

alter table public.analytics_events
  add constraint analytics_events_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete set null;
