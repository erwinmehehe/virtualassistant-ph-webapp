-- Preserve the recruiter no-show rebooking preview inside the consolidated dashboard fast path.
CREATE OR REPLACE FUNCTION public.recruiter_today_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with
today_queue as (
  select public.recruiter_today_queue(p_user_id, 20) as rows
),
cleanup_queue as (
  select public.recruiter_lead_cleanup_queue(p_user_id, 40) as rows
),
daily_actions as materialized (
  select * from public.recruiter_daily_action_queue(p_user_id)
),
daily_action_json as (
  select coalesce(jsonb_agg(to_jsonb(a) order by
    case a.priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,
    a.age_hours asc nulls last
  ), '[]'::jsonb) as rows
  from daily_actions a
),
client_wait_jobs as (
  select distinct subject_id
  from daily_actions
  where action_type in ('client_shortlist_waiting','client_response_overdue')
    and subject_id is not null
),
approval_ready as (
  select
    count(*)::int as total,
    count(*) filter (where avatar_url is null)::int as missing_photo,
    coalesce((
      select jsonb_agg(to_jsonb(p) order by p.completion_score desc, p.last_activity_at desc nulls last)
      from (
        select user_id, full_name, avatar_url, primary_category, completion_score, stage, availability_status, last_activity_at
        from public.recruiter_va_directory
        where account_status='active'
          and completion_score >= 60
          and (stage is null or stage not in ('approved','bench','rejected'))
        order by completion_score desc, last_activity_at desc nulls last
        limit 5
      ) p
    ), '[]'::jsonb) as preview
  from public.recruiter_va_directory
  where account_status='active'
    and completion_score >= 60
    and (stage is null or stage not in ('approved','bench','rejected'))
),
approval_cleanup as (
  select count(*)::int as total
  from public.recruiter_va_directory
  where account_status='active'
    and stage in ('approved','bench')
    and completion_score < 60
),
work_setup_ready as (
  select count(*)::int as total
  from public.va_profiles
  where work_setup_submitted_at is not null
    and work_setup_verified_at is null
    and work_setup_computer is not null
    and work_setup_os is not null
    and work_setup_ram_gb is not null
    and primary_internet is not null
    and backup_internet is not null
    and backup_power is not null
    and headset_ready is true
    and webcam_ready is true
    and quiet_workspace is true
),
recent_zero as (
  select count(*)::int as total
  from public.recruiter_va_directory
  where account_status='active'
    and completion_score=0
    and account_created_at >= now()-interval '7 days'
),
no_shows as materialized (
  select l.id,l.name,l.email,l.discovery_scheduled_at
  from public.lead_intake l
  where l.lead_type='client_hiring'
    and l.discovery_outcome='no_show'
    and (l.owner_id=p_user_id or l.owner_id is null)
),
no_show_metrics as (
  select
    count(*) filter (where not exists (
      select 1 from public.outbound_email_events e
      where e.event_type='discovery_no_show_rebook'
        and e.status='sent'
        and e.idempotency_key='discovery-no-show-rebook-'||n.id::text
    ))::int as needs_email,
    count(*) filter (where exists (
      select 1 from public.outbound_email_events e
      where e.event_type='discovery_no_show_rebook'
        and e.status='sent'
        and e.idempotency_key='discovery-no-show-rebook-'||n.id::text
    ))::int as waiting_rebook
  from no_shows n
),
no_show_preview as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',n.id,
    'name',n.name,
    'email',n.email,
    'sent',exists(
      select 1 from public.outbound_email_events e
      where e.event_type='discovery_no_show_rebook'
        and e.status='sent'
        and e.idempotency_key='discovery-no-show-rebook-'||n.id::text
    )
  ) order by n.discovery_scheduled_at desc nulls last), '[]'::jsonb) as rows
  from (
    select * from no_shows
    order by discovery_scheduled_at desc nulls last
    limit 8
  ) n
),
stale_roles_base as (
  select j.id,j.title,j.company_name,j.status,j.hiring_stage,j.hiring_stage_entered_at,j.updated_at,j.created_at,
    coalesce(j.hiring_stage_entered_at,j.updated_at,j.created_at) as activity_at
  from public.jobs j
  where j.recruiter_id=p_user_id
    and j.status in ('pending','published')
    and coalesce(j.hiring_stage_entered_at,j.updated_at,j.created_at) <= now()-interval '72 hours'
    and not exists (select 1 from client_wait_jobs cw where cw.subject_id=j.id)
),
stale_roles as (
  select
    count(*)::int as total,
    coalesce((
      select jsonb_agg(to_jsonb(s) order by s.activity_at asc)
      from (
        select id,title,company_name,status,hiring_stage,hiring_stage_entered_at,updated_at,created_at,activity_at
        from stale_roles_base
        order by activity_at asc
        limit 5
      ) s
    ), '[]'::jsonb) as preview
  from stale_roles_base
),
notification_counts as (
  select count(*)::int as unread
  from public.notifications
  where user_id=p_user_id
    and read_at is null
    and done_at is null
    and (snoozed_until is null or snoozed_until<=now())
),
task_counts as (
  select count(*)::int as open
  from public.recruiter_tasks
  where assignee_id=p_user_id and status='todo'
),
action_counts as (
  select
    count(*) filter (where action_type='role_without_shortlist')::int as role_no_candidates,
    count(*) filter (where action_type='all_candidates_passed')::int as replacement_needed,
    count(*) filter (where action_type='client_response_overdue')::int as client_response_overdue,
    count(*) filter (where action_type in ('interview_today','interview_feedback_missing'))::int as interviews_due,
    count(*) filter (where action_type in ('offer_waiting_va','offer_waiting_client'))::int as offers_waiting
  from daily_actions
)
select jsonb_build_object(
  'today_queue', tq.rows,
  'cleanup_queue', cq.rows,
  'daily_actions', da.rows,
  'unread_notifications', nc.unread,
  'open_tasks', tc.open,
  'approval_ready_count', ar.total,
  'approval_ready_preview', ar.preview,
  'missing_photo_count', ar.missing_photo,
  'approval_cleanup_count', ac.total,
  'work_setup_ready_count', ws.total,
  'recent_zero_count', rz.total,
  'no_show_needs_email', coalesce(ns.needs_email,0),
  'no_show_waiting_rebook', coalesce(ns.waiting_rebook,0),
  'no_show_preview', np.rows,
  'stale_roles_count', sr.total,
  'stale_roles_preview', sr.preview,
  'role_no_candidates', a.role_no_candidates,
  'replacement_needed', a.replacement_needed,
  'client_response_overdue', a.client_response_overdue,
  'interviews_due', a.interviews_due,
  'offers_waiting', a.offers_waiting
)
from today_queue tq
cross join cleanup_queue cq
cross join daily_action_json da
cross join notification_counts nc
cross join task_counts tc
cross join approval_ready ar
cross join approval_cleanup ac
cross join work_setup_ready ws
cross join recent_zero rz
cross join no_show_metrics ns
cross join no_show_preview np
cross join stale_roles sr
cross join action_counts a;
$function$;

revoke execute on function public.recruiter_today_summary(uuid) from public, anon, authenticated;
grant execute on function public.recruiter_today_summary(uuid) to service_role;
