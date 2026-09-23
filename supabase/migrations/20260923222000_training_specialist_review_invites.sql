-- Secure external specialist-review invites.
-- Raw review tokens are never stored; only a SHA-256 hash is persisted.

create table if not exists public.training_specialist_review_invites (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  reviewer_email text not null,
  reviewer_name text not null,
  reviewer_role text not null,
  review_revision integer not null,
  assigned_revision integer not null,
  course_content_version integer not null,
  token_hash text not null unique,
  due_at timestamptz,
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'opened', 'submitted', 'revoked')),
  sent_at timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  assigned_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_specialist_review_invites enable row level security;

revoke all on public.training_specialist_review_invites from anon, authenticated;
grant all on public.training_specialist_review_invites to service_role;

create index if not exists training_specialist_review_invites_course_idx
  on public.training_specialist_review_invites(course_id, created_at desc);

create index if not exists training_specialist_review_invites_status_idx
  on public.training_specialist_review_invites(status, due_at, created_at desc);

create unique index if not exists training_specialist_review_invites_one_active_per_course
  on public.training_specialist_review_invites(course_id)
  where status in ('pending', 'opened');


-- Keep external handoff activity in the same append-only specialist review timeline.
alter table public.training_specialist_review_events
  drop constraint if exists training_specialist_review_events_event_type_check;

alter table public.training_specialist_review_events
  add constraint training_specialist_review_events_event_type_check
  check (event_type in (
    'assigned',
    'reassigned',
    'progress_saved',
    'changes_requested',
    'approved',
    'invalidated',
    'invite_sent',
    'invite_opened',
    'invite_revoked',
    'external_changes_requested',
    'external_approved'
  ));
