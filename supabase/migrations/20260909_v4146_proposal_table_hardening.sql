-- v4.14.6 proposal table hardening

create index if not exists lead_proposals_job_id_idx
  on public.lead_proposals (job_id)
  where job_id is not null;

create index if not exists lead_proposals_created_by_idx
  on public.lead_proposals (created_by)
  where created_by is not null;

drop policy if exists "deny browser access to lead proposals" on public.lead_proposals;
create policy "deny browser access to lead proposals"
  on public.lead_proposals
  for all
  to anon, authenticated
  using (false)
  with check (false);
