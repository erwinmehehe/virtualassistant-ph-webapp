-- Learners may mark their own training notifications read, but notification
-- content and destinations remain server-controlled.
revoke update on public.training_notifications from authenticated;
grant update (read_at) on public.training_notifications to authenticated;
