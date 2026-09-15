alter table public.job_shortlist_candidates
  add column if not exists client_recommendation text,
  add column if not exists client_decision text,
  add column if not exists client_decision_note text,
  add column if not exists client_decision_at timestamptz;

alter table public.job_shortlist_candidates
  drop constraint if exists job_shortlist_candidates_client_decision_check;

alter table public.job_shortlist_candidates
  add constraint job_shortlist_candidates_client_decision_check
  check (client_decision is null or client_decision in ('interested','interview','pass'));

alter table public.job_shortlist_candidates
  drop constraint if exists job_shortlist_candidates_client_recommendation_length_check;

alter table public.job_shortlist_candidates
  add constraint job_shortlist_candidates_client_recommendation_length_check
  check (client_recommendation is null or char_length(client_recommendation) <= 500);

alter table public.job_shortlist_candidates
  drop constraint if exists job_shortlist_candidates_client_decision_note_length_check;

alter table public.job_shortlist_candidates
  add constraint job_shortlist_candidates_client_decision_note_length_check
  check (client_decision_note is null or char_length(client_decision_note) <= 500);

alter table public.va_profiles
  add column if not exists availability_confirmed_at timestamptz;

create index if not exists job_shortlist_client_waiting_idx
  on public.job_shortlist_candidates(shortlist_status, client_decision, released_at)
  where shortlist_status = 'released';
