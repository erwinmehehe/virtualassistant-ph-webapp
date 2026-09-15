-- Cover recruiter-operation foreign keys used by client/VA interview and placement views.
create index if not exists jobs_recruiter_id_idx on public.jobs(recruiter_id) where recruiter_id is not null;
create index if not exists candidate_interviews_client_idx on public.candidate_interviews(client_id, created_at desc);
create index if not exists candidate_interviews_va_idx on public.candidate_interviews(va_id, created_at desc);
create index if not exists candidate_interviews_application_idx on public.candidate_interviews(application_id) where application_id is not null;
create index if not exists candidate_interviews_shortlist_idx on public.candidate_interviews(shortlist_candidate_id) where shortlist_candidate_id is not null;
create index if not exists placement_offers_client_idx on public.placement_offers(client_id, created_at desc);
create index if not exists placement_offers_va_idx on public.placement_offers(va_id, created_at desc);
create index if not exists placement_offers_application_idx on public.placement_offers(application_id) where application_id is not null;
create index if not exists placement_offers_created_by_idx on public.placement_offers(created_by) where created_by is not null;
