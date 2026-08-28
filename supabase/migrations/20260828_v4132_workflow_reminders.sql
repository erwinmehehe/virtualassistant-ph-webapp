-- v4.13.2: idempotent, rate-limited reminders for stalled hiring workflow steps.
create table if not exists public.workflow_reminders (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('job','application')),
  subject_id uuid not null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  reminder_count integer not null default 0 check (reminder_count between 0 and 3),
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subject_type, subject_id, recipient_id, action)
);

create index if not exists workflow_reminders_due_idx on public.workflow_reminders(last_sent_at, reminder_count);
revoke all on public.workflow_reminders from anon, authenticated;
alter table public.workflow_reminders enable row level security;
