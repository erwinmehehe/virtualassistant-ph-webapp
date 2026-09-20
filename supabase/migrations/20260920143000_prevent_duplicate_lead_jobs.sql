-- A hiring lead must own at most one generated role. This complements the
-- client + normalized-title guard and protects anonymous/public lead retries.
create unique index if not exists jobs_one_job_per_lead_idx
on public.jobs (lead_id)
where lead_id is not null;
