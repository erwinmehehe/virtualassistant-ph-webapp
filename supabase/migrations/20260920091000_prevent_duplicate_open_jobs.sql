-- Consolidate the known duplicate Amara Island role without deleting history,
-- then prevent a client from having multiple open roles with the same title.

do $$
declare
  canonical_job uuid := '0df1eefa-1291-4eee-84d7-8ff071991b05';
  duplicate_jobs uuid[] := array[
    '7abcca4f-a07b-458d-8cd4-4f0460309b18',
    '233e4dea-35fe-40f2-a7aa-f439c01cebc7',
    '14818f00-614b-4e93-a10c-665cb184a9f0',
    'c04dc8ea-e2fd-4228-a3da-18b4feb60d8a',
    'dd2d543a-97cb-4480-b456-890676844c77',
    'f422f2c2-3695-4e22-80ca-f7e8389dda6e',
    'f4a2de12-1b20-4b2b-812e-16c64317f28d',
    '08ff9edc-bf5d-412c-857d-33a71b667631',
    '459dc708-bff2-443a-af99-742cf70d9ddf',
    '2109e9ed-c264-4767-a356-68e6dde3a3b8',
    '011ab8ff-8590-4e52-93c1-350824a27cff',
    'ae3fdd97-228e-4547-a691-3f0809310fee',
    'b186a86e-ef7c-4d28-a341-ae2fc61cafb4'
  ]::uuid[];
begin
  -- The canonical role already contains the same proposed candidates as the
  -- duplicates. Remove only exact duplicate shortlist rows, then move any
  -- candidate that exists only on a duplicate to the canonical role.
  delete from public.job_shortlist_candidates d
  where d.job_id = any(duplicate_jobs)
    and exists (
      select 1
      from public.job_shortlist_candidates c
      where c.job_id = canonical_job
        and c.va_id = d.va_id
    );

  update public.job_shortlist_candidates
  set job_id = canonical_job
  where job_id = any(duplicate_jobs);

  -- Keep the redundant job records as closed history instead of deleting them.
  update public.jobs
  set status = 'closed',
      hiring_stage = 'closed',
      closed_at = coalesce(closed_at, now()),
      rejection_note = 'Duplicate role consolidated into ' || canonical_job::text,
      updated_at = now()
  where id = any(duplicate_jobs)
    and status <> 'closed';
end
$$;

create unique index if not exists jobs_one_open_normalized_title_per_client_idx
on public.jobs (client_id, lower(btrim(title)))
where client_id is not null
  and status in ('draft','pending','published');
