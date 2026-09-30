-- Structured discovery workspace for consultative client hiring.
-- Server-only: recruiter/admin Server Actions use the service role after app authorization.

create table if not exists public.lead_discovery_briefs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.lead_intake(id) on delete cascade,

  current_pain text,
  why_now text,
  ownership_needed text,
  previous_attempts text,
  success_90_days text,
  failure_risks text,
  decision_process text,
  additional_notes text,

  recommended_role text,
  recommended_hours integer check (recommended_hours is null or recommended_hours between 1 and 80),
  recommended_skills text[] not null default '{}'::text[],
  recommended_tools text[] not null default '{}'::text[],
  recommended_salary_min numeric check (recommended_salary_min is null or recommended_salary_min >= 0),
  recommended_salary_max numeric check (recommended_salary_max is null or recommended_salary_max >= 0),
  salary_currency text not null default 'PHP',
  vaph_fee_note text,
  recommended_start_date date,

  next_step text check (next_step is null or next_step in ('qualified','follow_up','nurture')),
  qualification_status text not null default 'in_progress'
    check (qualification_status in ('in_progress','ready','follow_up','nurture')),

  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_discovery_briefs_updated_idx
  on public.lead_discovery_briefs(updated_at desc);

alter table public.lead_discovery_briefs enable row level security;

-- No browser role should reach discovery-call notes or commercial recommendations.
revoke all on table public.lead_discovery_briefs from public, anon, authenticated;
grant select, insert, update, delete on table public.lead_discovery_briefs to service_role;

comment on table public.lead_discovery_briefs is
  'Server-only structured discovery notes and recruiter recommendations for client hiring leads.';
comment on column public.lead_discovery_briefs.current_pain is
  'The business problem or workload currently staying on the client or team.';
comment on column public.lead_discovery_briefs.ownership_needed is
  'Responsibilities the recommended hire should own after handoff.';
comment on column public.lead_discovery_briefs.success_90_days is
  'Client-defined outcome that would make the hire successful after roughly 90 days.';
