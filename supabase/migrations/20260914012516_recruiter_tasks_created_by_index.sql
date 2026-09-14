create index if not exists recruiter_tasks_created_by_idx
  on public.recruiter_tasks (created_by)
  where created_by is not null;
