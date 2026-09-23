-- Secure external specialist-review handoff.
-- Raw review tokens are never stored; only a SHA-256 hash is persisted.

create table if not exists public.training_specialist_review_invites (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  reviewer_name text not null,
  reviewer_email text not null,
  reviewer_role text not null,
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
