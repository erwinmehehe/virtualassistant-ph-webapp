-- Legacy accounts existed before notification preferences were introduced.
-- Treat absence of a preference row as unset, not as an opt-out. Future rows
-- default product emails on; any user-saved false remains an explicit opt-out.
alter table public.account_notification_preferences
  alter column product_emails set default true;
