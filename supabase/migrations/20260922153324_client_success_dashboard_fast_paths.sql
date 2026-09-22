-- Consolidate Client Success support, retention, and placement detail reads.
-- Server-only RPCs with actor-scoped visibility.

create or replace function public.client_success_support_summary(
  p_actor_id uuid,
  p_limit integer default 300
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
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
    where a.role = 'admin'
       or w.client_success_owner_id = p_actor_id
       or j.recruiter_id = p_actor_id
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
$$;

revoke all on function public.client_success_support_summary(uuid, integer) from public;
revoke all on function public.client_success_support_summary(uuid, integer) from anon;
revoke all on function public.client_success_support_summary(uuid, integer) from authenticated;
grant execute on function public.client_success_support_summary(uuid, integer) to service_role;

create or replace function public.client_success_retention_summary(
  p_actor_id uuid,
  p_room_limit integer default 200,
  p_request_limit integer default 200
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
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
    where a.role = 'admin'
       or w.client_success_owner_id = p_actor_id
       or j.recruiter_id = p_actor_id
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
$$;

revoke all on function public.client_success_retention_summary(uuid, integer, integer) from public;
revoke all on function public.client_success_retention_summary(uuid, integer, integer) from anon;
revoke all on function public.client_success_retention_summary(uuid, integer, integer) from authenticated;
grant execute on function public.client_success_retention_summary(uuid, integer, integer) to service_role;

create or replace function public.client_success_placement_detail(
  p_actor_id uuid,
  p_workroom_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
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
      and (
        a.role = 'admin'
        or w.client_success_owner_id = p_actor_id
        or j.recruiter_id = p_actor_id
      )
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
$$;

revoke all on function public.client_success_placement_detail(uuid, uuid) from public;
revoke all on function public.client_success_placement_detail(uuid, uuid) from anon;
revoke all on function public.client_success_placement_detail(uuid, uuid) from authenticated;
grant execute on function public.client_success_placement_detail(uuid, uuid) to service_role;
