alter table public.job_shortlist_candidates
  drop constraint if exists job_shortlist_candidates_client_decision_check;

alter table public.job_shortlist_candidates
  add constraint job_shortlist_candidates_client_decision_check
  check (client_decision is null or client_decision in ('interested','interview','hold','pass'));
