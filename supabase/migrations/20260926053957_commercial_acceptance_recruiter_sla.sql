create unique index if not exists recruiter_tasks_open_job_title_unique
  on public.recruiter_tasks (subject_id, title)
  where subject_type = 'job' and status = 'todo';

create or replace function public.create_commercial_acceptance_recruiter_sla()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs%rowtype;
  v_recruiter uuid;
  v_base timestamptz;
  v_href text;
begin
  if new.commercial_status = 'accepted'
     and (tg_op = 'INSERT' or old.commercial_status is distinct from 'accepted') then
    select *
      into v_job
      from public.jobs
      where id = new.job_id
      for update;

    if not found or v_job.status = 'closed' then
      return new;
    end if;

    v_recruiter := coalesce(v_job.recruiter_id, public.default_recruiter_id());
    if v_recruiter is null then
      return new;
    end if;

    if v_job.recruiter_id is null then
      update public.jobs
      set recruiter_id = v_recruiter,
          updated_at = now()
      where id = v_job.id
        and recruiter_id is null;
    end if;

    v_base := coalesce(new.updated_at, now());
    v_href := '/workspace/recruiter/roles/' || v_job.id::text || '#matching';

    insert into public.recruiter_tasks (
      title, description, assignee_id, created_by, subject_type, subject_id,
      href, priority, status, due_at
    )
    values
      (
        'Start sourcing and review matches',
        v_job.title || ' has accepted client terms. Review recruiter-only match suggestions and start targeted sourcing for any gaps.',
        v_recruiter, null, 'job', v_job.id, v_href, 'high', 'todo',
        v_base + interval '2 hours'
      ),
      (
        'First client-ready shortlist due',
        v_job.title || ' needs a recruiter-curated shortlist. Review evidence, confirm availability, and prepare client-ready candidates without auto-releasing them.',
        v_recruiter, null, 'job', v_job.id, v_href, 'high', 'todo',
        v_base + interval '24 hours'
      )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.create_commercial_acceptance_recruiter_sla() from public, anon, authenticated;

drop trigger if exists commercial_acceptance_recruiter_sla on public.job_commercials;
create trigger commercial_acceptance_recruiter_sla
after insert or update of commercial_status on public.job_commercials
for each row
execute function public.create_commercial_acceptance_recruiter_sla();

with eligible as (
  select
    j.id,
    j.title,
    coalesce(j.recruiter_id, public.default_recruiter_id()) as recruiter_id,
    coalesce(c.updated_at, j.published_at, now()) as accepted_at
  from public.job_commercials c
  join public.jobs j on j.id = c.job_id
  where c.commercial_status = 'accepted'
    and j.status <> 'closed'
)
update public.jobs j
set recruiter_id = e.recruiter_id,
    updated_at = now()
from eligible e
where j.id = e.id
  and j.recruiter_id is null
  and e.recruiter_id is not null;

with eligible as (
  select
    j.id,
    j.title,
    j.recruiter_id,
    coalesce(c.updated_at, j.published_at, now()) as accepted_at
  from public.job_commercials c
  join public.jobs j on j.id = c.job_id
  where c.commercial_status = 'accepted'
    and j.status <> 'closed'
    and j.recruiter_id is not null
)
insert into public.recruiter_tasks (
  title, description, assignee_id, created_by, subject_type, subject_id,
  href, priority, status, due_at
)
select
  task.title,
  task.description,
  e.recruiter_id,
  null,
  'job',
  e.id,
  '/workspace/recruiter/roles/' || e.id::text || '#matching',
  'high',
  'todo',
  task.due_at
from eligible e
cross join lateral (
  values
    (
      'Start sourcing and review matches'::text,
      e.title || ' has accepted client terms. Review recruiter-only match suggestions and start targeted sourcing for any gaps.'::text,
      e.accepted_at + interval '2 hours'
    ),
    (
      'First client-ready shortlist due'::text,
      e.title || ' needs a recruiter-curated shortlist. Review evidence, confirm availability, and prepare client-ready candidates without auto-releasing them.'::text,
      e.accepted_at + interval '24 hours'
    )
) as task(title, description, due_at)
where not exists (
  select 1
  from public.recruiter_tasks existing
  where existing.subject_type = 'job'
    and existing.subject_id = e.id
    and existing.title = task.title
    and existing.status = 'todo'
)
on conflict do nothing;
