-- Managed agency reminders now track VA profile health, candidate interviews,
-- and placement offers directly instead of routing those states through legacy applications.
alter table public.workflow_reminders
  drop constraint if exists workflow_reminders_subject_type_check;

alter table public.workflow_reminders
  add constraint workflow_reminders_subject_type_check
  check (subject_type = any (array['job'::text,'application'::text,'lead'::text,'proposal'::text,'va'::text,'interview'::text,'offer'::text]));
