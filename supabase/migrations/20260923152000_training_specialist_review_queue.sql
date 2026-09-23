-- Add persistent specialist-review records for gated training courses.

create table if not exists public.training_specialist_reviews (
  course_id uuid primary key references public.training_courses(id) on delete cascade,
  reviewer_name text,
  reviewer_role text,
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  decision text not null default 'in_progress'
    check (decision in ('in_progress', 'changes_requested', 'approved')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_specialist_reviews enable row level security;

revoke all on public.training_specialist_reviews from anon, authenticated;
grant all on public.training_specialist_reviews to service_role;

create index if not exists training_specialist_reviews_decision_idx
  on public.training_specialist_reviews(decision, updated_at desc);
