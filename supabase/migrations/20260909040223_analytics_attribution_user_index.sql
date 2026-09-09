create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;
