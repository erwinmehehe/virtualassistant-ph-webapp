-- Keep recruiter/client conversations isolated to the exact hiring role.
-- Existing client-only threads remain as general conversations for history.

alter table public.client_recruiter_threads
  add column if not exists job_id uuid references public.jobs(id) on delete set null;

alter table public.client_recruiter_threads
  drop constraint if exists client_recruiter_threads_client_unique;

create unique index if not exists client_recruiter_threads_general_unique
  on public.client_recruiter_threads(client_id)
  where job_id is null;

create unique index if not exists client_recruiter_threads_job_unique
  on public.client_recruiter_threads(client_id, job_id)
  where job_id is not null;

create index if not exists client_recruiter_threads_job_idx
  on public.client_recruiter_threads(job_id);

create or replace function public.validate_client_recruiter_thread()
returns trigger
language plpgsql
security definer
set search_path='public'
as $function$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.client_id and role = 'client'::public.user_role
  ) then
    raise exception 'client_recruiter_threads.client_id must belong to a client';
  end if;

  if new.recruiter_id is not null and not exists (
    select 1 from public.profiles
    where id = new.recruiter_id and role = 'recruiter'::public.user_role
  ) then
    raise exception 'client_recruiter_threads.recruiter_id must belong to a recruiter';
  end if;

  if new.job_id is not null and not exists (
    select 1 from public.jobs
    where id = new.job_id and client_id = new.client_id
  ) then
    raise exception 'client_recruiter_threads.job_id must belong to this client';
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

comment on column public.client_recruiter_threads.job_id is
  'Optional hiring role scope. Null means a general recruiter/client conversation retained for pre-role or legacy chat.';
