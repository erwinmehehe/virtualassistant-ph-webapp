-- Keep the recruiter responsible for one final action only: formal handoff.
-- After handoff, post-start placement work lives in Client Success.

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
upcoming_discovery_calls as (
  select coalesce(jsonb_agg(to_jsonb(r) order by r.discovery_scheduled_at asc), '[]'::jsonb) as rows
  from (
    select
      l.id,
      l.company,
      l.service,
      l.timezone,
      l.message,
      l.created_at,
      l.discovery_scheduled_at,
      l.discovery_meeting_url,
      l.job_id
    from public.lead_intake l
    where l.lead_type='client_hiring'
      and l.owner_id=p_user_id
      and l.discovery_completed_at is null
      and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at>=now()
      and l.discovery_scheduled_at<now()+interval '48 hours'
    order by l.discovery_scheduled_at asc
    limit 8
  ) r
),
new_hiring_roles as (
  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) as rows
  from (
    select
      j.id,
      j.title,
      j.company_name,
      j.lead_id,
      j.recruiter_id,
      j.status,
      j.hiring_stage,
      j.created_at
    from public.jobs j
    where j.status in ('pending','published')
      and j.hiring_stage in ('intake','ready_to_recruit','sourcing','internal_review')
      and j.created_at >= now()-interval '7 days'
      and (j.recruiter_id=p_user_id or j.recruiter_id is null)
      and not exists (
        select 1
        from public.job_shortlist_candidates s
        where s.job_id=j.id
          and (
            s.shortlist_status='released'
            or (s.shortlist_status='proposed' and s.created_by is not null)
          )
      )
    order by j.created_at desc
    limit 8
  ) r
),
client_replies as (
  select coalesce(jsonb_agg(to_jsonb(r) order by r.last_client_reply_at desc), '[]'::jsonb) as rows
  from (
    select
      lead_id,
      owner_id,
      job_id,
      name,
      company,
      crm_stage,
      last_client_reply_at,
      last_recruiter_response_at,
      last_recruiter_response_action,
      reply_status
    from public.recruiter_client_reply_state
    where owner_id=p_user_id
      and reply_status='needs_action'
      and coalesce(crm_stage,'new') not in ('won','lost')
    order by last_client_reply_at desc
    limit 20
  ) r
),
timezone_confirmation as (
  select count(*)::int as total
  from public.lead_intake l
  where l.lead_type='client_hiring'
    and coalesce(l.crm_stage,'new') not in ('won','lost')
    and (l.owner_id=p_user_id or l.owner_id is null)
    and (
      l.timezone is null
      or btrim(l.timezone)=''
      or not exists (
        select 1
        from pg_catalog.pg_timezone_names tz
        where tz.name=btrim(l.timezone)
      )
    )
),
active_lead_action_rows as materialized (
  select
    l.id,
    l.name,
    l.company,
    l.service,
    coalesce(l.crm_stage,'new') as crm_stage,
    l.owner_id,
    l.job_id,
    l.created_at,
    l.first_contact_at,
    l.last_contact_at,
    l.next_follow_up_at,
    l.discovery_scheduled_at,
    l.discovery_completed_at,
    l.timezone,
    exists (
      select 1
      from pg_catalog.pg_timezone_names tz
      where tz.name=btrim(coalesce(l.timezone,''))
    ) as timezone_valid,
    lp.status as proposal_status,
    case
      when coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null then 'first_contact'
      when l.discovery_scheduled_at is not null
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
        and l.discovery_scheduled_at<=now() then 'record_discovery_outcome'
      when lp.status='changes_requested' then 'revise_proposal'
      when lp.status='sent'
        and (
          (lp.viewed_at is not null and lp.viewed_at<=now()-interval '24 hours')
          or (lp.viewed_at is null and lp.sent_at is not null and lp.sent_at<=now()-interval '48 hours')
        ) then 'follow_up_proposal'
      when l.next_follow_up_at is not null
        and l.next_follow_up_at<=now()
        and coalesce(l.crm_stage,'new')='nurture' then 'reengage_nurture'
      when l.next_follow_up_at is not null
        and l.next_follow_up_at<=now() then 'follow_up'
      when l.discovery_scheduled_at is not null
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
        and l.discovery_scheduled_at>now() then 'prepare_discovery'
      when coalesce(l.crm_stage,'new') in ('qualified','terms_sent')
        and lp.id is null then 'prepare_proposal'
      when coalesce(l.crm_stage,'new')='shortlist_sent' then 'review_client_decision'
      when lp.status='sent' then 'wait_proposal'
      when l.next_follow_up_at is not null and l.next_follow_up_at>now() then 'wait_follow_up'
      when coalesce(l.crm_stage,'new')='contacted' then 'set_discovery_or_follow_up'
      when coalesce(l.crm_stage,'new')='nurture' then 'set_nurture_follow_up'
      else 'review_client'
    end as action_key,
    case
      when l.discovery_scheduled_at is not null
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
        and l.discovery_scheduled_at<=now() then 'urgent'
      when lp.status='changes_requested' then 'urgent'
      when coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null
        and l.created_at<=now()-interval '30 minutes' then 'high'
      when l.next_follow_up_at is not null and l.next_follow_up_at<=now() then 'high'
      when lp.status='sent'
        and (
          (lp.viewed_at is not null and lp.viewed_at<=now()-interval '24 hours')
          or (lp.viewed_at is null and lp.sent_at is not null and lp.sent_at<=now()-interval '48 hours')
        ) then 'high'
      when coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null then 'normal'
      when l.discovery_scheduled_at is not null
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
        and l.discovery_scheduled_at>now() then 'normal'
      when coalesce(l.crm_stage,'new') in ('qualified','terms_sent','shortlist_sent') then 'normal'
      else 'low'
    end as priority,
    case
      when l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null
        then l.discovery_scheduled_at
      when l.next_follow_up_at is not null then l.next_follow_up_at
      when lp.status='changes_requested' then coalesce(lp.changes_requested_at,lp.created_at)
      when lp.status='sent' then coalesce(lp.viewed_at,lp.sent_at)
      else l.created_at
    end as action_at
  from public.lead_intake l
  left join lateral (
    select p.id,p.status,p.sent_at,p.viewed_at,p.changes_requested_at,p.created_at
    from public.lead_proposals p
    where p.lead_id=l.id
    order by p.created_at desc,p.id desc
    limit 1
  ) lp on true
  where l.lead_type='client_hiring'
    and coalesce(l.crm_stage,'new') not in ('won','lost')
    and (l.owner_id=p_user_id or l.owner_id is null)
),
active_lead_actions as (
  select coalesce(jsonb_agg(to_jsonb(a) order by
    case a.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,
    a.action_at asc nulls last,
    a.created_at asc
  ),'[]'::jsonb) as rows
  from active_lead_action_rows a
),
placement_handoffs as (
  select coalesce(jsonb_agg(to_jsonb(h) order by
    coalesce(h.start_date,current_date) asc,
    h.created_at asc
  ),'[]'::jsonb) as rows
  from (
    select
      w.id as workroom_id,
      j.id as job_id,
      j.title as job_title,
      j.company_name,
      w.placement_stage,
      w.start_date,
      w.created_at
    from public.workrooms w
    join public.jobs j on j.id=w.job_id
    where j.recruiter_id=p_user_id
      and w.placement_stage<>'ended'
      and w.handoff_completed_at is null
      and w.client_success_owner_id is not null
    order by coalesce(w.start_date,current_date) asc,w.created_at asc
    limit 20
  ) h
),
latest_owned_proposals as materialized (
  select *
  from (
    select
      lp.id as proposal_id,
      lp.lead_id,
      lp.role_title,
      lp.status,
      lp.sent_at,
      lp.viewed_at,
      lp.changes_requested_at,
      lp.expires_at,
      lp.created_at,
      l.name,
      l.company,
      row_number() over(partition by lp.lead_id order by lp.created_at desc, lp.id desc) as row_rank
    from public.lead_proposals lp
    join public.lead_intake l on l.id=lp.lead_id
    where l.lead_type='client_hiring'
      and l.owner_id=p_user_id
      and lp.status in ('sent','changes_requested')
  ) ranked
  where row_rank=1
),
proposal_action_rows as (
  select
    proposal_id,
    lead_id,
    role_title,
    status,
    sent_at,
    viewed_at,
    changes_requested_at,
    name,
    company,
    case
      when status='changes_requested' then 'changes_requested'
      when status='sent' and viewed_at is not null and viewed_at<=now()-interval '24 hours' then 'viewed_waiting'
      when status='sent' and viewed_at is null and sent_at<=now()-interval '48 hours' then 'unopened'
      else null
    end as action_kind,
    case
      when status='changes_requested' then coalesce(changes_requested_at,created_at)
      when status='sent' and viewed_at is not null then viewed_at
      else sent_at
    end as action_at
  from latest_owned_proposals
  where (expires_at is null or expires_at>now())
),
proposal_actions as (
  select coalesce(jsonb_agg(to_jsonb(a) order by
    case a.action_kind when 'changes_requested' then 0 when 'viewed_waiting' then 1 else 2 end,
    a.action_at asc nulls last
  ) filter(where a.action_kind is not null), '[]'::jsonb) as rows
  from proposal_action_rows a
),
proposal_health as (
  select
    count(*) filter(where action_kind='changes_requested')::int as changes_requested,
    count(*) filter(where action_kind='viewed_waiting')::int as viewed_waiting,
    count(*) filter(where action_kind='unopened')::int as unopened
  from proposal_action_rows
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
    count(*) filter (where action_type in ('interview_requested','interview_today','interview_feedback_missing'))::int as interviews_due,
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
  'upcoming_discovery_calls', ud.rows,
  'new_hiring_roles', nh.rows,
  'client_replies', cr.rows,
  'timezone_confirmation_count', tzc.total,
  'active_lead_actions', ala.rows,
  'placement_handoffs', phf.rows,
  'proposal_actions', pa.rows,
  'proposal_changes_requested', ph.changes_requested,
  'proposal_viewed_waiting', ph.viewed_waiting,
  'proposal_unopened', ph.unopened,
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
cross join upcoming_discovery_calls ud
cross join new_hiring_roles nh
cross join client_replies cr
cross join timezone_confirmation tzc
cross join active_lead_actions ala
cross join placement_handoffs phf
cross join proposal_actions pa
cross join proposal_health ph
cross join stale_roles sr
cross join action_counts a;
$function$


revoke execute on function public.recruiter_today_summary(uuid) from public,anon,authenticated;
grant execute on function public.recruiter_today_summary(uuid) to service_role;
