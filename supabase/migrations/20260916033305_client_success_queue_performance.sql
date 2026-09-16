create index if not exists workrooms_active_owner_created_idx
  on public.workrooms (client_success_owner_id, created_at)
  where placement_stage <> 'ended';

create index if not exists placement_checkins_todo_workroom_due_idx
  on public.placement_checkins (workroom_id, due_at)
  where status = 'todo';

create or replace function public.client_success_today_queue(
  p_actor_id uuid,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  workroom_id uuid,
  job_id uuid,
  job_title text,
  company_name text,
  client_id uuid,
  client_name text,
  va_id uuid,
  va_name text,
  client_success_owner_id uuid,
  client_success_owner_name text,
  placement_stage text,
  handoff_completed_at timestamptz,
  placement_ready_at timestamptz,
  health_score integer,
  health_status text,
  at_risk_reason text,
  start_date date,
  created_at timestamptz,
  next_checkin_id uuid,
  next_checkpoint text,
  next_due_at timestamptz,
  due_checkins_24h bigint,
  priority_rank integer
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = p_actor_id
      and p.role::text in ('admin', 'recruiter')
  ),
  visible_ids as (
    select w.id
    from public.workrooms w
    cross join actor a
    where a.role = 'admin'
      and w.placement_stage <> 'ended'

    union

    select w.id
    from public.workrooms w
    cross join actor a
    where a.role = 'recruiter'
      and w.placement_stage <> 'ended'
      and w.client_success_owner_id = p_actor_id

    union

    select w.id
    from public.jobs j
    join public.workrooms w on w.job_id = j.id
    cross join actor a
    where a.role = 'recruiter'
      and w.placement_stage <> 'ended'
      and j.recruiter_id = p_actor_id
  )
  select
    w.id as workroom_id,
    w.job_id,
    j.title as job_title,
    j.company_name,
    w.client_id,
    client.full_name as client_name,
    w.va_id,
    va.full_name as va_name,
    w.client_success_owner_id,
    csm.full_name as client_success_owner_name,
    w.placement_stage,
    w.handoff_completed_at,
    w.placement_ready_at,
    w.health_score,
    w.health_status,
    w.at_risk_reason,
    w.start_date,
    w.created_at,
    ci.id as next_checkin_id,
    ci.checkpoint as next_checkpoint,
    ci.due_at as next_due_at,
    coalesce(ci.due_checkins_24h, 0)::bigint as due_checkins_24h,
    case
      when w.health_status = 'at_risk' or w.placement_stage in ('recovery', 'replacement') then 0
      when w.health_status = 'watch' then 1
      when w.client_success_owner_id is null then 2
      when w.handoff_completed_at is null then 3
      when w.placement_stage in ('pre_start', 'launch') then 4
      else 5
    end as priority_rank
  from visible_ids v
  join public.workrooms w on w.id = v.id
  left join public.jobs j on j.id = w.job_id
  left join public.profiles client on client.id = w.client_id
  left join public.profiles va on va.id = w.va_id
  left join public.profiles csm on csm.id = w.client_success_owner_id
  left join lateral (
    select
      pc.id,
      pc.checkpoint,
      pc.due_at,
      count(*) filter (where pc.due_at <= now() + interval '24 hours') over () as due_checkins_24h
    from public.placement_checkins pc
    where pc.workroom_id = w.id
      and pc.status = 'todo'
    order by pc.due_at asc
    limit 1
  ) ci on true
  order by priority_rank asc, w.created_at asc
  limit least(greatest(coalesce(p_limit, 100), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.client_success_today_queue(uuid, integer, integer) from public;
revoke all on function public.client_success_today_queue(uuid, integer, integer) from anon;
revoke all on function public.client_success_today_queue(uuid, integer, integer) from authenticated;
grant execute on function public.client_success_today_queue(uuid, integer, integer) to service_role;
