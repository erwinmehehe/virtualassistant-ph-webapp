-- v4.14.7 finish agency sales handoff

alter table public.lead_proposals
  add column if not exists changes_requested_at timestamptz;

alter table public.lead_proposals
  drop constraint if exists lead_proposals_status_check;

alter table public.lead_proposals
  add constraint lead_proposals_status_check
  check (status in ('draft','sent','changes_requested','accepted','declined','expired'));

alter table public.workflow_reminders
  drop constraint if exists workflow_reminders_subject_type_check;

alter table public.workflow_reminders
  add constraint workflow_reminders_subject_type_check
  check (subject_type in ('job','application','lead','proposal'));

create index if not exists workflow_reminders_sales_subject_idx
  on public.workflow_reminders (subject_type, subject_id, recipient_id, action);

create index if not exists lead_proposals_open_followup_idx
  on public.lead_proposals (status, sent_at)
  where status in ('sent','changes_requested');
