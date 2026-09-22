-- Consolidate workspace dashboard reads into compact database summaries.
-- These functions are server-only: Next.js calls them with the service role.
CREATE OR REPLACE FUNCTION public.admin_today_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with
settings as (
  select coalesce(finance_invoice_overdue_days,7)::int as overdue_days
  from public.admin_settings
  where id=1
),
active_leads as materialized (
  select *
  from public.lead_intake
  where lead_type='client_hiring'
    and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture')
),
open_proposals as materialized (
  select p.*
  from public.lead_proposals p
  join active_leads l on l.id=p.lead_id
  where p.status in ('sent','viewed','changes_requested')
),
shortlist_groups as materialized (
  select
    j.id as job_id,
    j.title,
    j.company_name,
    min(s.released_at) as released_at,
    count(*) filter (where s.client_decision is null)::int as waiting_count
  from public.jobs j
  join public.job_shortlist_candidates s on s.job_id=j.id
  where j.status in ('pending','published')
    and s.shortlist_status='released'
    and s.released_at is not null
  group by j.id,j.title,j.company_name
),
active_workrooms as materialized (
  select w.*, j.title as job_title, j.company_name
  from public.workrooms w
  left join public.jobs j on j.id=w.job_id
  where coalesce(w.placement_stage,'') <> 'ended'
    and coalesce(w.status,'') not in ('closed','ended','cancelled','inactive')
    and (w.ended_at is null or w.ended_at>now())
),
payment_base as materialized (
  select p.*
  from public.payments p
  where p.status in ('awaiting_payment','paid','release_pending','disputed')
),
task_base as materialized (
  select *
  from public.recruiter_tasks
  where status='todo'
    and (snoozed_until is null or snoozed_until<=now())
),
counts as (
  select
    (select count(*)::int from active_leads) as open_leads,
    (select count(*)::int from active_leads where coalesce(crm_stage,'new')='new') as new_leads,
    (select count(*)::int from active_leads
      where discovery_scheduled_at is not null
        and discovery_completed_at is null
        and discovery_cancelled_at is null
        and timezone('Asia/Manila',discovery_scheduled_at)::date=timezone('Asia/Manila',now())::date
    ) as calls_today,
    (select count(*)::int from open_proposals) as proposals_open,
    (select count(*)::int from public.jobs where status in ('pending','published')) as open_roles,
    (select count(*)::int from shortlist_groups where waiting_count>0) as shortlists_waiting,
    (select count(*)::int from shortlist_groups where waiting_count>0 and released_at<=now()-interval '24 hours') as hiring_rooms_waiting,
    (select count(*)::int from active_workrooms) as active_placements,
    (select count(*)::int from active_workrooms where health_status='at_risk' or placement_stage in ('recovery','replacement')) as at_risk,
    (select count(*)::int from active_workrooms
      where renewal_date is not null
        and renewal_date::date between timezone('Asia/Manila',now())::date-1 and timezone('Asia/Manila',now())::date+30
        and coalesce(renewal_status,'')<>'renewed'
    ) as renewals_30,
    (select count(*)::int from payment_base p cross join settings s
      where p.status='awaiting_payment'
        and p.created_at < now()-(s.overdue_days||' days')::interval
    ) as overdue_invoice_count,
    (select coalesce(sum(p.amount_total),0)::numeric from payment_base p cross join settings s
      where p.status='awaiting_payment'
        and p.created_at < now()-(s.overdue_days||' days')::interval
    ) as overdue_total,
    (select count(*)::int from payment_base where status in ('paid','release_pending')) as payout_ready_count,
    (select coalesce(sum(amount_total),0)::numeric from payment_base where status in ('paid','release_pending')) as payout_ready_total,
    (select count(*)::int from payment_base where status='disputed') as disputes,
    (select count(*)::int from task_base
      where priority in ('urgent','high')
        and (due_at is null or due_at<=now()+interval '1 day')
    ) as urgent_tasks
),
raw_actions as (
  select
    1 as rank,
    coalesce(l.first_response_due_at,l.created_at+interval '30 minutes') as due_at,
    'lead_first_response'::text as kind,
    ('First response overdue · '||coalesce(nullif(l.company,''),nullif(l.name,''),'New client lead'))::text as title,
    (coalesce(nullif(l.service,''),'Hiring request')||' · waiting '||
      case
        when now()-l.created_at<interval '1 hour' then 'under 1h'
        when now()-l.created_at<interval '1 day' then floor(extract(epoch from(now()-l.created_at))/3600)::int||'h'
        else floor(extract(epoch from(now()-l.created_at))/86400)::int||'d'
      end)::text as subtitle,
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text))::text as href,
    'Lead'::text as label
  from active_leads l
  where coalesce(l.crm_stage,'new')='new'
    and l.first_contact_at is null
    and coalesce(l.first_response_due_at,l.created_at+interval '30 minutes')<now()

  union all
  select
    2,l.next_follow_up_at,'lead_followup',
    ('Follow-up overdue · '||coalesce(nullif(l.company,''),nullif(l.name,''),'Client lead')),
    (coalesce(nullif(l.service,''),'Hiring request')||' · follow-up overdue'),
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text)),
    'Lead'
  from active_leads l
  where l.next_follow_up_at is not null and l.next_follow_up_at<now()

  union all
  select
    case when l.discovery_scheduled_at<now() then 1 else 2 end,
    l.discovery_scheduled_at,
    'discovery_call',
    ((case when l.discovery_scheduled_at<now() then 'Missed discovery call' else 'Discovery call' end)||' · '||
      coalesce(nullif(l.company,''),nullif(l.name,''),'Client')),
    (coalesce(nullif(l.service,''),'Hiring brief')||' · '||
      to_char(timezone('Asia/Manila',l.discovery_scheduled_at),'Mon DD, HH12:MI AM')),
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text)),
    'Call'
  from active_leads l
  where l.discovery_scheduled_at is not null
    and l.discovery_completed_at is null
    and l.discovery_cancelled_at is null
    and timezone('Asia/Manila',l.discovery_scheduled_at)::date=timezone('Asia/Manila',now())::date

  union all
  select
    case when p.changes_requested_at is not null then 1 else 3 end,
    coalesce(p.changes_requested_at,p.viewed_at,p.sent_at,p.created_at),
    'proposal_followup',
    ('Proposal needs follow-up · '||coalesce(nullif(l.company,''),nullif(l.name,''),nullif(p.role_title,''),'Client proposal')),
    (coalesce(nullif(p.role_title,''),'Hiring proposal')||' · '||
      case
        when p.changes_requested_at is not null then 'Changes requested'
        when p.viewed_at is not null then 'Viewed, awaiting decision'
        else 'Sent, not viewed'
      end),
    ('/workspace/admin/leads?view=hiring&q='||p.lead_id::text),
    'Proposal'
  from open_proposals p
  join active_leads l on l.id=p.lead_id
  where p.changes_requested_at is not null
     or (p.viewed_at is not null and p.viewed_at<=now()-interval '1 day')
     or (p.viewed_at is null and p.sent_at is not null and p.sent_at<=now()-interval '2 days')

  union all
  select
    3,sg.released_at,'shortlist_waiting',
    ('Hiring Room waiting · '||coalesce(nullif(sg.company_name,''),'Client')),
    (coalesce(nullif(sg.title,''),'Hiring role')||' · '||sg.waiting_count||' candidate(s) awaiting client response'),
    ('/workspace/admin/jobs/'||sg.job_id::text),
    'Hiring Room'
  from shortlist_groups sg
  where sg.waiting_count>0 and sg.released_at<=now()-interval '24 hours'

  union all
  select
    1,w.created_at,'placement_risk',
    ('Placement at risk · '||coalesce(nullif(w.company_name,''),'Client')),
    (coalesce(nullif(w.job_title,''),'Active placement')||' · '||coalesce(nullif(w.at_risk_reason,''),'Recovery attention required')),
    ('/workspace/client-success/'||w.id::text),
    'Client health'
  from active_workrooms w
  where w.health_status='at_risk' or w.placement_stage in ('recovery','replacement')

  union all
  select
    4,(w.renewal_date::date::timestamp at time zone 'Asia/Manila'),'renewal',
    ('Renewal approaching · '||coalesce(nullif(w.company_name,''),'Client')),
    (coalesce(nullif(w.job_title,''),'Placement')||' · renewal '||w.renewal_date::text),
    ('/workspace/client-success/'||w.id::text),
    'Renewal'
  from active_workrooms w
  where w.renewal_date is not null
    and w.renewal_date::date between timezone('Asia/Manila',now())::date-1 and timezone('Asia/Manila',now())::date+30
    and coalesce(w.renewal_status,'')<>'renewed'

  union all
  select
    case when t.priority='urgent' then 1 else 2 end,
    coalesce(t.due_at,now()),
    'owner_task',
    t.title,
    coalesce(nullif(t.description,''),t.priority||' priority owner task'),
    case
      when t.subject_type='lead' and t.subject_id is not null then '/workspace/admin/leads?view=hiring&q='||t.subject_id::text
      when t.subject_type='job' and t.subject_id is not null then '/workspace/admin/jobs/'||t.subject_id::text
      when t.subject_type='va' and t.subject_id is not null then '/workspace/admin/vetting/'||t.subject_id::text
      else coalesce(t.href,'/workspace/admin/today#owner-actions')
    end,
    'Task'
  from task_base t
  where t.priority in ('urgent','high')
    and (t.due_at is null or t.due_at<=now()+interval '1 day')
),
collection_action as (
  select
    1 as rank,
    min(p.created_at) as due_at,
    'overdue_collections'::text as kind,
    (count(*)::int||' overdue collection'||case when count(*)=1 then '' else 's' end||' · $'||round(sum(p.amount_total)::numeric,2)::text)::text as title,
    ('Awaiting payment beyond configured overdue window')::text as subtitle,
    '/workspace/admin/payments'::text as href,
    'Finance'::text as label
  from payment_base p cross join settings s
  where p.status='awaiting_payment'
    and p.created_at < now()-(s.overdue_days||' days')::interval
  having count(*)>0
),
dispute_action as (
  select
    1 as rank,
    min(created_at) as due_at,
    'payment_disputes'::text as kind,
    (count(*)::int||' payment dispute'||case when count(*)=1 then '' else 's' end||' need review')::text as title,
    'Payout remains frozen until the dispute is resolved.'::text as subtitle,
    '/workspace/admin/payments'::text as href,
    'Finance'::text as label
  from payment_base
  where status='disputed'
  having count(*)>0
),
all_actions as (
  select * from raw_actions
  union all select * from collection_action
  union all select * from dispute_action
),
owner_actions as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',a.rank,
    'due_at',a.due_at,
    'kind',a.kind,
    'title',a.title,
    'subtitle',a.subtitle,
    'href',a.href,
    'label',a.label
  ) order by a.rank,a.due_at), '[]'::jsonb) as rows
  from (
    select * from all_actions
    order by rank,due_at
    limit 14
  ) a
),
owner_action_count as (
  select count(*)::int as total from all_actions
)
select jsonb_build_object(
  'open_leads',c.open_leads,
  'new_leads',c.new_leads,
  'calls_today',c.calls_today,
  'proposals_open',c.proposals_open,
  'open_roles',c.open_roles,
  'shortlists_waiting',c.shortlists_waiting,
  'hiring_rooms_waiting',c.hiring_rooms_waiting,
  'active_placements',c.active_placements,
  'at_risk',c.at_risk,
  'renewals_30',c.renewals_30,
  'overdue_invoice_count',c.overdue_invoice_count,
  'overdue_total',c.overdue_total,
  'payout_ready_count',c.payout_ready_count,
  'payout_ready_total',c.payout_ready_total,
  'disputes',c.disputes,
  'urgent_tasks',c.urgent_tasks,
  'owner_attention',oc.total,
  'owner_actions',oa.rows,
  'overdue_days',(select overdue_days from settings)
)
from counts c
cross join owner_actions oa
cross join owner_action_count oc;
$function$;

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

revoke execute on function public.admin_today_summary() from public, anon, authenticated;
grant execute on function public.admin_today_summary() to service_role;

revoke execute on function public.recruiter_today_summary(uuid) from public, anon, authenticated;
grant execute on function public.recruiter_today_summary(uuid) to service_role;
