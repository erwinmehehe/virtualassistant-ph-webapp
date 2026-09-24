-- Prevent concurrent recruiter form submissions from repeating external side effects
-- such as creating a second Google Calendar event for the same button click.
create table if not exists public.recruiter_action_claims (
  request_id uuid primary key,
  action_type text not null,
  actor_id uuid not null,
  subject_id uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists recruiter_action_claims_created_at_idx
  on public.recruiter_action_claims (created_at desc);

alter table public.recruiter_action_claims enable row level security;

revoke all on table public.recruiter_action_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.recruiter_action_claims to service_role;
