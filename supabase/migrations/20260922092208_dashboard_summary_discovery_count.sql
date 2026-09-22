CREATE OR REPLACE FUNCTION public.recruiter_today_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with daily_actions as materialized (
  select *
  from public.recruiter_daily_action_queue(p_user_id)
),
client_waits as (
  select distinct on (subject_id)
    priority,action_type,title,description,href,subject_type,subject_id,age_hours
  from daily_actions
  where action_type in ('client_shortlist_waiting','client_response_overdue')
    and subject_id is not null
  order by subject_id,
    case when action_type='client_response_overdue' then 0 else 1 end,
    age_hours desc
),
approval_ready as materialized (
  select d.user_id,d.full_name,d.avatar_url,d.primary_category,d.completion_score,d.stage,d.availability_status,d.last_activity_at
  from public.recruiter_va_directory d
  where d.account_status='active'
    and d.completion_score>=60
    and (d.stage is null or d.stage not in ('approved','bench','rejected'))
),
stale_roles as materialized (
  select j.id,j.title,j.company_name,j.status,j.hiring_stage,j.hiring_stage_entered_at,j.updated_at,j.created_at,
         coalesce(j.hiring_stage_entered_at,j.updated_at,j.created_at) as activity_at
  from public.jobs j
  where j.recruiter_id=p_user_id
    and j.status in ('pending','published')
    and coalesce(j.hiring_stage_entered_at,j.updated_at,j.created_at)<=now()-interval '72 hours'
    and not exists(select 1 from client_waits cw where cw.subject_id=j.id)
),
no_shows as materialized (
  select l.id,
    exists(
      select 1 from public.outbound_email_events e
      where e.event_type='discovery_no_show_rebook'
        and e.status='sent'
        and e.idempotency_key='discovery-no-show-rebook-'||l.id::text
    ) as rebook_sent
  from public.lead_intake l
  where l.lead_type='client_hiring'
    and l.discovery_outcome='no_show'
    and (l.owner_id=p_user_id or l.owner_id is null)
),
counts as (
  select jsonb_build_object(
    'approval_ready', (select count(*) from approval_ready),
    'missing_photo', (select count(*) from approval_ready where avatar_url is null),
    'approval_cleanup', (select count(*) from public.recruiter_va_directory where account_status='active' and stage in ('approved','bench') and completion_score<60),
    'work_setup_ready', (
      select count(*)
      from public.va_profiles
      where work_setup_submitted_at is not null
        and work_setup_verified_at is null
        and work_setup_computer is not null
        and work_setup_os is not null
        and work_setup_ram_gb is not null
        and primary_internet is not null
        and backup_internet is not null
        and backup_power is not null
        and headset_ready=true
        and webcam_ready=true
        and quiet_workspace=true
    ),
    'recent_zero', (
      select count(*)
      from public.recruiter_va_directory
      where account_status='active'
        and completion_score=0
        and account_created_at>=now()-interval '7 days'
    ),
    'no_show_needs_email', (select count(*) from no_shows where not rebook_sent),
    'no_show_waiting_rebook', (select count(*) from no_shows where rebook_sent),
    'role_no_candidates', (select count(*) from daily_actions where action_type='role_without_shortlist'),
    'replacement_needed', (select count(*) from daily_actions where action_type='all_candidates_passed'),
    'client_response_overdue', (select count(*) from daily_actions where action_type='client_response_overdue'),
    'interviews_due', (select count(*) from daily_actions where action_type in ('interview_today','interview_feedback_missing')),
    'offers_waiting', (select count(*) from daily_actions where action_type in ('offer_waiting_va','offer_waiting_client')),
    'discovery_next_7_days', (
      select count(*)
      from public.lead_intake l
      where l.lead_type='client_hiring'
        and l.discovery_scheduled_at>=now()
        and l.discovery_scheduled_at<now()+interval '7 days'
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
    ),
    'stale_roles', (select count(*) from stale_roles),
    'unread_notifications', (
      select count(*)
      from public.notifications n
      where n.user_id=p_user_id
        and n.read_at is null
        and n.done_at is null
        and (n.snoozed_until is null or n.snoozed_until<=now())
    ),
    'open_tasks', (
      select count(*)
      from public.recruiter_tasks t
      where t.assignee_id=p_user_id and t.status='todo'
    )
  ) as value
)
select jsonb_build_object(
  'today_queue', public.recruiter_today_queue(p_user_id,20),
  'cleanup_queue', public.recruiter_lead_cleanup_queue(p_user_id,40),
  'daily_actions', coalesce((
    select jsonb_agg(to_jsonb(da) order by case da.priority when 'urgent' then 0 when 'high' then 1 else 2 end,da.age_hours desc)
    from daily_actions da
  ),'[]'::jsonb),
  'client_waits', coalesce((
    select jsonb_agg(to_jsonb(cw) order by cw.age_hours desc)
    from client_waits cw
  ),'[]'::jsonb),
  'approval_ready', coalesce((
    select jsonb_agg(to_jsonb(a) - 'last_activity_at' order by a.completion_score desc,a.last_activity_at desc nulls last)
    from (
      select *
      from approval_ready
      order by completion_score desc,last_activity_at desc nulls last
      limit 5
    ) a
  ),'[]'::jsonb),
  'stale_roles', coalesce((
    select jsonb_agg(to_jsonb(s) - 'activity_at' order by s.activity_at asc)
    from (
      select *
      from stale_roles
      order by activity_at asc
      limit 5
    ) s
  ),'[]'::jsonb),
  'counts', (select value from counts)
);
$function$;
