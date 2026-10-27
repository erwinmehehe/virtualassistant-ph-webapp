-- Keep client role editing quick: do not re-score all VAs in a job UPDATE trigger.
-- A durable queue records which changes need refreshing. The bounded daily
-- maintenance matcher recalculates all active jobs and then acknowledges only
-- queue entries that were present BEFORE its run began.

create table if not exists private.job_match_refresh_queue (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  requested_at timestamptz not null default clock_timestamp()
);
alter table private.job_match_refresh_queue enable row level security;
revoke all on private.job_match_refresh_queue from public, anon, authenticated;

create or replace function public.trigger_refresh_job_matches()
returns trigger
language plpgsql
security definer
set search_path to pg_catalog
as $function$
begin
  if new.status in ('pending', 'published') then
    insert into private.job_match_refresh_queue (job_id, requested_at)
    values (new.id, clock_timestamp())
    on conflict (job_id) do update
      set requested_at = excluded.requested_at;
  else
    -- Closed/draft jobs should not remain in the active refresh backlog.
    delete from private.job_match_refresh_queue where job_id = new.id;
  end if;
  return new;
end;
$function$;

-- The existing update trigger does not cover newly inserted jobs. Enqueue
-- new active jobs too, without changing the list of criteria that triggers
-- a refresh for existing jobs.
drop trigger if exists job_match_refresh on public.jobs;
create trigger job_match_refresh
after insert or update of categories, required_skills, required_tools,
  must_have_skills, nice_to_have_skills, must_have_tools,
  required_industries, minimum_years_experience, hours_per_week,
  overlap_hours, max_hourly_rate, status
on public.jobs
for each row
execute function public.trigger_refresh_job_matches();

-- Ack only after every per-VA match operation completes. Entries updated
-- after the run began remain pending for the next successful run.
create or replace function public.acknowledge_job_match_refresh_queue(
  p_completed_through timestamptz
)
returns integer
language plpgsql
security definer
set search_path to pg_catalog
as $function$
declare
  v_count integer := 0;
begin
  if (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role') is distinct from 'service_role' then
    raise exception 'Server-only matching acknowledgment'
      using errcode = '42501';
  end if;
  if p_completed_through is null or p_completed_through > clock_timestamp() then
    raise exception 'Invalid matching acknowledgment cutoff'
      using errcode = '22023';
  end if;

  delete from private.job_match_refresh_queue
  where requested_at <= p_completed_through;
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.acknowledge_job_match_refresh_queue(timestamptz)
  from public, anon, authenticated;
grant execute on function public.acknowledge_job_match_refresh_queue(timestamptz)
  to service_role;

-- This only writes lightweight queue markers; it does not run matchmaking.
insert into private.job_match_refresh_queue (job_id, requested_at)
select id, clock_timestamp()
from public.jobs where status in ('pending', 'published')
on conflict (job_id) do nothing;
