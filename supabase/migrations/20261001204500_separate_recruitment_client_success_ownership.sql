-- Separate recruitment ownership from post-hire Client Success ownership.
-- Recruiters keep access only until the formal handoff is complete, unless they
-- are also the assigned Client Success owner. Admin retains agency-wide access.

create or replace function private.client_success_can_access(p_actor_id uuid,p_workroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select exists (
    select 1
    from public.profiles p
    join public.workrooms w on w.id=p_workroom_id
    join public.jobs j on j.id=w.job_id
    where p.id=p_actor_id
      and p.account_status='active'
      and p.role::text in ('admin','recruiter')
      and (
        p.role::text='admin'
        or w.client_success_owner_id=p_actor_id
        or (
          p.role::text='recruiter'
          and w.handoff_completed_at is null
          and j.recruiter_id=p_actor_id
        )
      )
  );
$function$;

revoke execute on function private.client_success_can_access(uuid,uuid) from public,anon,authenticated;
grant execute on function private.client_success_can_access(uuid,uuid) to service_role;


CREATE OR REPLACE FUNCTION public.client_success_today_queue(p_actor_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(workroom_id uuid, job_id uuid, job_title text, company_name text, client_id uuid, client_name text, va_id uuid, va_name text, client_success_owner_id uuid, client_success_owner_name text, placement_stage text, handoff_completed_at timestamp with time zone, placement_ready_at timestamp with time zone, health_score integer, health_status text, at_risk_reason text, start_date date, created_at timestamp with time zone, next_checkin_id uuid, next_checkpoint text, next_due_at timestamp with time zone, due_checkins_24h bigint, priority_rank integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = p_actor_id
      and p.role::text in ('admin', 'recruiter')
  ),
  visible_ids as (
    select w.id
    from public.workrooms w
    where w.placement_stage <> 'ended'
      and private.client_success_can_access(p_actor_id,w.id)
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
$function$


CREATE OR REPLACE FUNCTION public.client_success_placement_detail(p_actor_id uuid, p_workroom_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = p_actor_id
      and p.account_status = 'active'
      and p.role::text in ('admin','recruiter')
  ),
  visible as (
    select
      to_jsonb(w) as room,
      jsonb_build_object(
        'id', j.id,
        'title', j.title,
        'company_name', j.company_name,
        'client_id', j.client_id,
        'recruiter_id', j.recruiter_id
      ) as job,
      client.full_name as client_name,
      va.full_name as va_name,
      recruiter.full_name as recruiter_name,
      csm.full_name as client_success_owner_name
    from public.workrooms w
    join public.jobs j on j.id = w.job_id
    cross join actor a
    left join public.profiles client on client.id = w.client_id
    left join public.profiles va on va.id = w.va_id
    left join public.profiles recruiter on recruiter.id = j.recruiter_id
    left join public.profiles csm on csm.id = w.client_success_owner_id
    where w.id = p_workroom_id
      and private.client_success_can_access(p_actor_id,w.id)
  )
  select jsonb_build_object(
    'room', v.room,
    'job', v.job,
    'client_name', v.client_name,
    'va_name', v.va_name,
    'recruiter_name', v.recruiter_name,
    'client_success_owner_name', v.client_success_owner_name,
    'checklist', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.sort_order)
      from public.workroom_checklist c
      where c.workroom_id = p_workroom_id
    ), '[]'::jsonb),
    'checkins', coalesce((
      select jsonb_agg(to_jsonb(pc) order by pc.due_at)
      from public.placement_checkins pc
      where pc.workroom_id = p_workroom_id
    ), '[]'::jsonb),
    'staff', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'role', p.role::text,
        'account_status', p.account_status
      ) order by p.full_name)
      from public.profiles p
      where p.role::text in ('admin','recruiter')
        and p.account_status = 'active'
    ), '[]'::jsonb)
  )
  from visible v;
$function$


CREATE OR REPLACE FUNCTION public.client_success_support_summary(p_actor_id uuid, p_limit integer DEFAULT 300)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = p_actor_id
      and p.account_status = 'active'
      and p.role::text in ('admin','recruiter')
  ),
  visible_rooms as (
    select
      w.id as workroom_id,
      w.job_id,
      w.client_id,
      w.va_id,
      w.client_success_owner_id,
      w.placement_stage,
      w.health_status,
      w.health_score,
      j.title as job_title,
      j.company_name,
      j.recruiter_id,
      client.full_name as client_name,
      va.full_name as va_name
    from public.workrooms w
    join public.jobs j on j.id = w.job_id
    cross join actor a
    left join public.profiles client on client.id = w.client_id
    left join public.profiles va on va.id = w.va_id
    where private.client_success_can_access(p_actor_id,w.id)
  ),
  request_rows as (
    select
      r.id,
      r.workroom_id,
      r.requester_id,
      r.requester_role,
      r.request_type,
      r.priority,
      r.details,
      r.start_date,
      r.end_date,
      r.status,
      r.resolution,
      r.resolved_by,
      r.resolved_at,
      r.created_at,
      r.updated_at,
      r.replacement_reason,
      r.replacement_sla_due_on,
      r.guarantee_status,
      r.guarantee_notes,
      v.job_id,
      v.job_title,
      v.company_name,
      v.client_id,
      v.client_name,
      v.va_id,
      v.va_name,
      v.client_success_owner_id,
      v.placement_stage,
      v.health_status,
      v.health_score,
      v.recruiter_id
    from public.placement_support_requests r
    join visible_rooms v on v.workroom_id = r.workroom_id
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit,300),1),500)
  )
  select jsonb_build_object(
    'requests',
    coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb)
  )
  from request_rows r;
$function$


CREATE OR REPLACE FUNCTION public.client_success_retention_summary(p_actor_id uuid, p_room_limit integer DEFAULT 200, p_request_limit integer DEFAULT 200)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = p_actor_id
      and p.account_status = 'active'
      and p.role::text in ('admin','recruiter')
  ),
  visible_rooms as (
    select
      w.id,
      w.job_id,
      w.client_id,
      w.va_id,
      w.client_success_owner_id,
      w.placement_stage,
      w.health_status,
      w.health_score,
      w.renewal_date,
      w.renewal_status,
      w.end_reason,
      w.offboarding_notes,
      w.created_at,
      j.title as job_title,
      j.company_name,
      j.recruiter_id,
      client.full_name as client_name,
      va.full_name as va_name
    from public.workrooms w
    join public.jobs j on j.id = w.job_id
    cross join actor a
    left join public.profiles client on client.id = w.client_id
    left join public.profiles va on va.id = w.va_id
    where private.client_success_can_access(p_actor_id,w.id)
  ),
  room_rows as (
    select *
    from visible_rooms
    order by created_at desc
    limit least(greatest(coalesce(p_room_limit,200),1),300)
  ),
  replacement_rows as (
    select
      r.id,
      r.workroom_id,
      r.status,
      r.details,
      r.resolution,
      r.replacement_reason,
      r.replacement_sla_due_on,
      r.guarantee_status,
      r.guarantee_notes,
      r.created_at,
      v.job_id,
      v.job_title,
      v.company_name,
      v.client_id,
      v.client_name,
      v.va_id,
      v.va_name
    from public.placement_support_requests r
    join visible_rooms v on v.id = r.workroom_id
    where r.request_type = 'replacement'
    order by r.created_at desc
    limit least(greatest(coalesce(p_request_limit,200),1),300)
  )
  select jsonb_build_object(
    'rooms',
    coalesce((select jsonb_agg(to_jsonb(rr) order by rr.created_at desc) from room_rows rr), '[]'::jsonb),
    'replacements',
    coalesce((select jsonb_agg(to_jsonb(pr) order by pr.created_at desc) from replacement_rows pr), '[]'::jsonb)
  );
$function$

