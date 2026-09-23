-- Add specialist-review assignment, revision locking, and immutable audit history.

alter table public.training_specialist_reviews
  add column if not exists assigned_reviewer_name text,
  add column if not exists assigned_reviewer_role text,
  add column if not exists review_due_date date,
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by uuid,
  add column if not exists review_revision integer not null default 1,
  add column if not exists assigned_revision integer;

create table if not exists public.training_specialist_review_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'assigned',
      'reassigned',
      'progress_saved',
      'changes_requested',
      'approved',
      'invalidated'
    )),
  actor_id uuid,
  actor_label text,
  reviewer_name text,
  reviewer_role text,
  review_due_date date,
  review_revision integer not null,
  assigned_revision integer,
  course_content_version integer,
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.training_specialist_review_events enable row level security;

revoke all on public.training_specialist_review_events from anon, authenticated, service_role;
grant select, insert on public.training_specialist_review_events to service_role;

create schema if not exists private;

create or replace function private.reject_training_specialist_review_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  raise exception 'training specialist review history is append-only';
end;
$;

drop trigger if exists training_specialist_review_events_append_only
  on public.training_specialist_review_events;

create trigger training_specialist_review_events_append_only
before update or delete on public.training_specialist_review_events
for each row execute function private.reject_training_specialist_review_event_mutation();

create index if not exists training_specialist_review_events_course_created_idx
  on public.training_specialist_review_events(course_id, created_at desc);

create index if not exists training_specialist_review_events_actor_idx
  on public.training_specialist_review_events(actor_id)
  where actor_id is not null;
