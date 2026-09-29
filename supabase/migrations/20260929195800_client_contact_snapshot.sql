-- Track role-scoped in-app client chat alongside email replies in recruiter CRM.

drop function if exists public.recruiter_client_activity_snapshot(uuid[]);

create function public.recruiter_client_activity_snapshot(lead_ids uuid[])
returns table (
  lead_id uuid,
  last_login_at timestamptz,
  last_va_view_at timestamptz,
  va_views bigint,
  shortlist_opened_at timestamptz,
  last_shortlist_activity_at timestamptz,
  latest_decision text,
  latest_decision_at timestamptz,
  last_client_reply_at timestamptz,
  last_client_chat_at timestamptz,
  last_client_contact_at timestamptz,
  reply_status text,
  unread_chat bigint
)
language sql
security definer
set search_path = 'public', 'auth'
as $function$
  select
    l.id as lead_id,
    u.last_sign_in_at,
    (
      select max(a.created_at)
      from public.analytics_events a
      where a.user_id = l.client_id
        and a.event_name = 'candidate_viewed'
        and a.metadata ->> 'job_id' = l.job_id::text
        and a.metadata ->> 'surface' = 'client_hiring_room'
    ) as last_va_view_at,
    (
      select count(distinct nullif(a.metadata ->> 'va_id', ''))
      from public.analytics_events a
      where a.user_id = l.client_id
        and a.event_name = 'candidate_viewed'
        and a.metadata ->> 'job_id' = l.job_id::text
        and a.metadata ->> 'surface' = 'client_hiring_room'
    ) as va_views,
    (
      select max(ra.created_at)
      from public.recruiter_activity ra
      where ra.subject_type = 'job'
        and ra.subject_id = l.job_id
        and ra.actor_id = l.client_id
        and ra.action = 'client_shortlist_viewed'
    ) as shortlist_opened_at,
    (
      select max(ra.created_at)
      from public.recruiter_activity ra
      where ra.subject_type = 'job'
        and ra.subject_id = l.job_id
        and ra.actor_id = l.client_id
        and ra.action in ('client_shortlist_viewed', 'client_shortlist_message')
    ) as last_shortlist_activity_at,
    decision.client_decision as latest_decision,
    decision.client_decision_at as latest_decision_at,
    reply.last_client_reply_at,
    chat.last_client_chat_at,
    greatest(reply.last_client_reply_at, chat.last_client_chat_at) as last_client_contact_at,
    reply.reply_status,
    coalesce(chat.unread_chat, 0) as unread_chat
  from public.lead_intake l
  left join auth.users u on u.id = l.client_id
  left join public.recruiter_client_reply_state reply on reply.lead_id = l.id
  left join lateral (
    select s.client_decision, s.client_decision_at
    from public.job_shortlist_candidates s
    where s.job_id = l.job_id
      and s.client_decision_at is not null
    order by s.client_decision_at desc
    limit 1
  ) decision on true
  left join lateral (
    select
      max(m.created_at) filter (where m.sender_id = l.client_id) as last_client_chat_at,
      count(*) filter (where m.sender_id = l.client_id and m.read_at is null) as unread_chat
    from public.client_recruiter_threads t
    join public.client_recruiter_messages m on m.thread_id = t.id
    where t.client_id = l.client_id
      and (
        (l.job_id is not null and t.job_id = l.job_id)
        or (l.job_id is null and t.job_id is null)
      )
  ) chat on true
  where l.id = any(lead_ids)
    and l.lead_type = 'client_hiring';
$function$;

revoke all on function public.recruiter_client_activity_snapshot(uuid[]) from public, anon, authenticated;
grant execute on function public.recruiter_client_activity_snapshot(uuid[]) to service_role;

comment on function public.recruiter_client_activity_snapshot(uuid[]) is
  'Batched recruiter activity snapshot. Candidate views and client chat are role-scoped; direct execution remains service-role only.';
