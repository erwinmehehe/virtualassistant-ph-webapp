create policy recruiter_tasks_server_only
on public.recruiter_tasks
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
