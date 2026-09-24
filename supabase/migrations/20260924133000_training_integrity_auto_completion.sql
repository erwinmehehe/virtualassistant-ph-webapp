-- Learner-integrity tracking for automatic training completion.
-- Server actions write this table after authenticated, visible-tab activity.
-- RLS is enabled without client policies so browsers cannot forge rows directly.

create table if not exists public.training_lesson_engagement (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  max_scroll_percent smallint not null default 0 check (max_scroll_percent between 0 and 100),
  checkpoint_passed_at timestamptz,
  checkpoint_key text,
  exercise_response text,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.training_lesson_engagement enable row level security;

create index if not exists training_lesson_engagement_lesson_idx
  on public.training_lesson_engagement(lesson_id);

comment on table public.training_lesson_engagement is
  'Server-recorded learner integrity signals used before lesson completion. No browser-direct writes.';
