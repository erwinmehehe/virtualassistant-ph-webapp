alter table public.notifications
  add column if not exists priority text not null default 'normal',
  add column if not exists snoozed_until timestamptz,
  add column if not exists done_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_priority_check'
  ) then
    alter table public.notifications
      add constraint notifications_priority_check
      check (priority in ('low','normal','high','urgent'));
  end if;
end $$;

update public.notifications
set priority = case
  when lower(title || ' ' || coalesce(body,'')) ~ '(overdue|failed|failure|bounced|complained|suppressed|sla)' then 'urgent'
  when lower(title || ' ' || coalesce(body,'')) ~ '(new client|proposal|discovery|booking|application|shortlist)' then 'high'
  else priority
end
where priority = 'normal';

create index if not exists notifications_user_open_idx
  on public.notifications (user_id, done_at, snoozed_until, created_at desc);

create table if not exists public.recruiter_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  description text,
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  subject_type text check (subject_type is null or subject_type in ('lead','job','va','client')),
  subject_id uuid,
  href text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'todo' check (status in ('todo','done')),
  due_at timestamptz,
  snoozed_until timestamptz,
  repeat_rule text not null default 'none' check (repeat_rule in ('none','daily','weekly')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recruiter_tasks enable row level security;
revoke all on table public.recruiter_tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.recruiter_tasks to service_role;

create index if not exists recruiter_tasks_assignee_due_idx
  on public.recruiter_tasks (assignee_id, status, due_at)
  where status = 'todo';
create index if not exists recruiter_tasks_open_idx
  on public.recruiter_tasks (status, snoozed_until, due_at)
  where status = 'todo';

create or replace function public.workspace_badges(p_role text, p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_role = 'recruiter' then
    select jsonb_build_object(
      'leads', (
        select count(*)::int
        from public.lead_intake
        where crm_stage not in ('won', 'lost')
          and (crm_stage = 'new' or next_follow_up_at <= now())
      ),
      'vetting', (
        select count(*)::int from public.va_vetting where stage = 'recruiter_review'
      ),
      'pending_roles', (
        select count(*)::int from public.jobs where status = 'pending'
      ),
      'notifications', (
        select count(*)::int
        from public.notifications n
        where n.user_id = p_user_id
          and n.read_at is null
          and n.done_at is null
          and (n.snoozed_until is null or n.snoozed_until <= now())
      ),
      'tasks', (
        select count(*)::int
        from public.recruiter_tasks t
        where t.assignee_id = p_user_id
          and t.status = 'todo'
          and (t.snoozed_until is null or t.snoozed_until <= now())
          and (t.due_at is null or t.due_at <= now() + interval '1 day')
      )
    ) into result;
    return result;
  end if;

  if p_role in ('va', 'client') then
    select jsonb_build_object(
      'messages', (
        select count(*)::int
        from public.messages m
        join public.conversations c on c.id = m.conversation_id
        where m.read_at is null
          and m.sender_id <> p_user_id
          and (
            (p_role = 'va' and c.va_id = p_user_id)
            or (p_role = 'client' and c.client_id = p_user_id)
          )
      ),
      'notifications', (
        select count(*)::int
        from public.notifications n
        where n.user_id = p_user_id and n.read_at is null
      )
    ) into result;
    return result;
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.workspace_badges(text,uuid) from public, anon, authenticated;
grant execute on function public.workspace_badges(text,uuid) to service_role;

create or replace function public.recruiter_today_queue(p_user_id uuid, p_limit integer default 20)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with items as (
    select
      case
        when t.due_at is not null and t.due_at <= now() then 0
        when t.priority = 'urgent' then 0
        when t.priority = 'high' then 1
        when t.priority = 'normal' then 2
        else 3
      end as priority_rank,
      t.priority,
      'task'::text as kind,
      t.id,
      t.title,
      coalesce(nullif(t.description,''), 'Recruiter task') as subtitle,
      t.due_at,
      coalesce(t.href, '/workspace/recruiter/tasks') as href,
      null::text as action_url,
      jsonb_build_object('repeat_rule', t.repeat_rule, 'subject_type', t.subject_type, 'subject_id', t.subject_id) as metadata
    from public.recruiter_tasks t
    where t.assignee_id = p_user_id
      and t.status = 'todo'
      and (t.snoozed_until is null or t.snoozed_until <= now())
      and (t.due_at is null or t.due_at <= now() + interval '1 day')

    union all

    select
      0,
      'urgent',
      'lead_first_contact',
      l.id,
      coalesce(nullif(l.company,''), nullif(l.name,''), l.email),
      concat_ws(' · ', nullif(l.service,''), nullif(l.email,'')),
      l.created_at,
      '/workspace/recruiter/leads?view=attention',
      null::text,
      jsonb_build_object('lead_id', l.id, 'name', l.name, 'email', l.email, 'service', l.service)
    from public.lead_intake l
    where coalesce(l.crm_stage,'new') = 'new'
      and l.first_contact_at is null
      and (l.owner_id is null or l.owner_id = p_user_id)

    union all

    select
      0,
      'urgent',
      'lead_followup',
      l.id,
      coalesce(nullif(l.company,''), nullif(l.name,''), l.email),
      concat_ws(' · ', 'Follow-up due', nullif(l.service,'')),
      l.next_follow_up_at,
      '/workspace/recruiter/leads?view=attention',
      null::text,
      jsonb_build_object('lead_id', l.id, 'name', l.name, 'email', l.email, 'service', l.service)
    from public.lead_intake l
    where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
      and l.next_follow_up_at is not null
      and l.next_follow_up_at <= now()
      and not (coalesce(l.crm_stage,'new') = 'new' and l.first_contact_at is null)
      and (l.owner_id is null or l.owner_id = p_user_id)

    union all

    select
      1,
      'high',
      'discovery',
      l.id,
      coalesce(nullif(l.company,''), nullif(l.name,''), l.email),
      concat_ws(' · ', 'Discovery call', nullif(l.timezone,'')),
      l.discovery_scheduled_at,
      '/workspace/recruiter/leads?view=discovery',
      l.discovery_meeting_url,
      jsonb_build_object('lead_id', l.id, 'name', l.name, 'email', l.email, 'timezone', l.timezone, 'duration', l.discovery_duration_minutes)
    from public.lead_intake l
    where l.discovery_scheduled_at is not null
      and l.discovery_completed_at is null
      and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at >= now() - interval '1 hour'
      and l.discovery_scheduled_at <= now() + interval '48 hours'
      and (l.owner_id is null or l.owner_id = p_user_id)

    union all

    select
      1,
      'high',
      'role_review',
      j.id,
      j.title,
      coalesce(nullif(j.company_name,''), 'New client role'),
      j.created_at,
      '/workspace/recruiter/matching/' || j.id::text,
      null::text,
      jsonb_build_object('job_id', j.id)
    from public.jobs j
    where j.status = 'pending'

    union all

    select
      1,
      'high',
      'role_needs_candidates',
      j.id,
      j.title,
      coalesce(nullif(j.company_name,''), 'Published role needs candidates'),
      j.created_at,
      '/workspace/recruiter/matching/' || j.id::text,
      null::text,
      jsonb_build_object('job_id', j.id)
    from public.jobs j
    where j.status = 'published'
      and not exists (select 1 from public.applications a where a.job_id = j.id)
      and not exists (
        select 1 from public.job_shortlist_candidates s
        where s.job_id = j.id and s.shortlist_status in ('proposed','released')
      )

    union all

    select
      2,
      'normal',
      'vetting',
      vv.va_id,
      coalesce(nullif(p.full_name,''), 'VA candidate'),
      'Recruiter review waiting',
      vv.updated_at,
      '/workspace/recruiter/candidates/' || vv.va_id::text,
      null::text,
      jsonb_build_object('va_id', vv.va_id)
    from public.va_vetting vv
    left join public.profiles p on p.id = vv.va_id
    where vv.stage = 'recruiter_review'
  ), ranked as (
    select * from items
    order by priority_rank asc, due_at asc nulls last, title asc
    limit greatest(coalesce(p_limit,20),1)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'priority', priority,
        'kind', kind,
        'id', id,
        'title', title,
        'subtitle', subtitle,
        'due_at', due_at,
        'href', href,
        'action_url', action_url,
        'metadata', metadata
      )
      order by priority_rank asc, due_at asc nulls last, title asc
    ),
    '[]'::jsonb
  )
  from ranked;
$$;

revoke all on function public.recruiter_today_queue(uuid,integer) from public, anon, authenticated;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;
