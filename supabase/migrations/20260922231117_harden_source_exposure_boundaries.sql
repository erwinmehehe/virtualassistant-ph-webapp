-- Keep raw application state private even when source code is known.
drop policy if exists "public published jobs" on public.jobs;
drop policy if exists "authenticated jobs read" on public.jobs;
drop policy if exists "client owns job reads" on public.jobs;

create policy "client owns job reads"
on public.jobs
for select
to authenticated
using ((select auth.uid()) = client_id);

revoke select on table public.jobs from anon;
revoke select on table public.applications from anon;

-- Remove sensitive candidate paths copied into historical application snapshots.
update public.applications
set profile_snapshot = profile_snapshot
  - 'resume_path'
  - 'linkedin_url'
  - 'portfolio_url'
where profile_snapshot is not null
  and profile_snapshot ?| array['resume_path','linkedin_url','portfolio_url'];

create or replace function private.sanitize_application_profile_snapshot()
returns trigger
language plpgsql
set search_path = 'pg_catalog'
as $$
begin
  if new.profile_snapshot is not null then
    new.profile_snapshot := new.profile_snapshot
      - 'resume_path'
      - 'linkedin_url'
      - 'portfolio_url';
  end if;
  return new;
end;
$$;

revoke all on function private.sanitize_application_profile_snapshot() from public, anon, authenticated;

drop trigger if exists sanitize_application_profile_snapshot on public.applications;
create trigger sanitize_application_profile_snapshot
before insert or update of profile_snapshot on public.applications
for each row
execute function private.sanitize_application_profile_snapshot();

-- Match Storage enforcement to the validated application upload rules.
update storage.buckets
set
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'avatars';

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
where id = 'resumes';
