CREATE OR REPLACE FUNCTION public.admin_today_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with
settings as (
  select coalesce((select finance_invoice_overdue_days from public.admin_settings where id=1),7)::int as overdue_days
),
active_leads as materialized (
  select *
  from public.lead_intake
  where lead_type='client_hiring'
    and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture')
),
proposals as materialized (
  select p.*
  from public.lead_proposals p
  join active_leads l on l.id=p.lead_id
  where p.status in ('sent','viewed','changes_requested')
),
calls_today as materialized (
  select l.*
  from active_leads l
  where l.discovery_scheduled_at is not null
    and l.discovery_completed_at is null
    and l.discovery_cancelled_at is null
    and timezone('Asia/Manila',l.discovery_scheduled_at)::date=timezone('Asia/Manila',now())::date
),
hiring_rooms as materialized (
  select s.job_id,min(s.released_at) released_at,count(*)::int candidate_count,
         max(j.title) title,max(j.company_name) company_name
  from public.job_shortlist_candidates s
  join public.jobs j on j.id=s.job_id and j.status in ('pending','published')
  where s.shortlist_status='released' and s.client_decision is null and s.released_at is not null
  group by s.job_id
),
active_workrooms as materialized (
  select w.*,j.title as job_title,j.company_name
  from public.workrooms w
  left join public.jobs j on j.id=w.job_id
  where w.placement_stage is null or w.placement_stage<>'ended'
),
at_risk as materialized (
  select *
  from active_workrooms
  where health_status='at_risk' or placement_stage in ('recovery','replacement')
),
renewals as materialized (
  select *
  from active_workrooms
  where renewal_date is not null
    and renewal_date between (timezone('Asia/Manila',now())::date - 1) and (timezone('Asia/Manila',now())::date + 30)
    and coalesce(renewal_status,'')<>'renewed'
),
payment_base as materialized (
  select p.*
  from public.payments p
  where p.status in ('awaiting_payment','paid','release_pending','disputed')
),
urgent_tasks as materialized (
  select t.*
  from public.recruiter_tasks t
  where t.status='todo'
    and t.priority in ('urgent','high')
    and (t.snoozed_until is null or t.snoozed_until<=now())
    and (t.due_at is null or t.due_at<=now()+interval '1 day')
),
lead_actions as (
  select
    ('lead-first-'||l.id)::text id,
    ('First response overdue · '||coalesce(nullif(l.company,''),nullif(l.name,''),'New client lead'))::text title,
    (coalesce(nullif(l.service,''),'Hiring request')||' · waiting '||
      case when now()-l.created_at<interval '1 hour' then 'under 1h'
           when now()-l.created_at<interval '1 day' then floor(extract(epoch from(now()-l.created_at))/3600)::int||'h'
           else floor(extract(epoch from(now()-l.created_at))/86400)::int||'d' end)::text subtitle,
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text))::text href,
    'Lead'::text label,'rose'::text tone,1::int rank,
    coalesce(l.first_response_due_at,l.created_at+interval '30 minutes') due
  from active_leads l
  where coalesce(l.crm_stage,'new')='new'
    and l.first_contact_at is null
    and coalesce(l.first_response_due_at,l.created_at+interval '30 minutes')<now()
  union all
  select
    ('lead-followup-'||l.id)::text,
    ('Follow-up overdue · '||coalesce(nullif(l.company,''),nullif(l.name,''),'Client lead'))::text,
    (coalesce(nullif(l.service,''),'Hiring request')||' · follow-up overdue')::text,
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text))::text,
    'Lead','amber',2,l.next_follow_up_at
  from active_leads l
  where l.next_follow_up_at is not null and l.next_follow_up_at<now()
),
call_actions as (
  select
    ('call-'||l.id)::text id,
    ((case when l.discovery_scheduled_at<now() then 'Missed discovery call' else 'Discovery call' end)||' · '||coalesce(nullif(l.company,''),nullif(l.name,''),'Client'))::text title,
    (to_char(timezone('Asia/Manila',l.discovery_scheduled_at),'Mon DD, HH12:MI AM')||' · '||coalesce(nullif(l.service,''),'Hiring brief'))::text subtitle,
    ('/workspace/admin/leads?view=hiring&q='||coalesce(nullif(l.email,''),l.id::text))::text href,
    'Call'::text label,(case when l.discovery_scheduled_at<now() then 'rose' else 'violet' end)::text tone,1::int rank,l.discovery_scheduled_at due
  from calls_today l
),
proposal_actions as (
  select
    ('proposal-'||p.id)::text id,
    ('Proposal needs follow-up · '||coalesce(nullif(l.company,''),nullif(l.name,''),nullif(p.role_title,''),'Client proposal'))::text title,
    (coalesce(nullif(p.role_title,''),'Hiring proposal')||' · '||
      case when p.changes_requested_at is not null then 'Changes requested'
           when p.viewed_at is not null then 'Viewed, waiting on client'
           else 'Sent, not viewed' end)::text subtitle,
    ('/workspace/admin/leads?view=hiring&q='||p.lead_id)::text href,
    'Proposal'::text label,'indigo'::text tone,
    (case when p.changes_requested_at is not null then 1 else 3 end)::int rank,
    coalesce(p.changes_requested_at,p.viewed_at,p.sent_at,p.created_at) due
  from proposals p
  join active_leads l on l.id=p.lead_id
  where p.changes_requested_at is not null
     or (p.viewed_at is not null and p.viewed_at<=now()-interval '1 day')
     or (p.viewed_at is null and p.sent_at is not null and p.sent_at<=now()-interval '2 days')
),
shortlist_actions as (
  select
    ('hiring-room-'||h.job_id)::text id,
    ('Hiring Room waiting · '||coalesce(nullif(h.company_name,''),'Client'))::text title,
    (coalesce(nullif(h.title,''),'Hiring role')||' · '||h.candidate_count||' candidate(s) waiting for client response')::text subtitle,
    ('/workspace/admin/jobs/'||h.job_id)::text href,
    'Hiring Room'::text label,'amber'::text tone,3::int rank,h.released_at due
  from hiring_rooms h
  where h.released_at<=now()-interval '1 day'
),
risk_actions as (
  select
    ('risk-'||w.id)::text id,
    ('Placement at risk · '||coalesce(nullif(w.company_name,''),'Client'))::text title,
    (coalesce(nullif(w.job_title,''),'Active placement')||' · '||coalesce(nullif(w.at_risk_reason,''),'Recovery attention required'))::text subtitle,
    ('/workspace/client-success/'||w.id)::text href,
    'Client health'::text label,'rose'::text tone,1::int rank,now() due
  from at_risk w
),
finance_actions as (
  select 'overdue-collections'::text id,
    ((count(*)::int)::text||' overdue collection(s)')::text title,
    'Awaiting payment beyond the configured overdue threshold'::text subtitle,
    '/workspace/admin/payments'::text href,'Finance'::text label,'rose'::text tone,1::int rank,min(p.created_at) due
  from payment_base p,settings s
  where p.status='awaiting_payment' and p.created_at<now()-(s.overdue_days||' days')::interval
  having count(*)>0
  union all
  select 'payment-disputes',
    ((count(*)::int)::text||' payment dispute(s) need review')::text,
    'Payout remains frozen until the dispute is resolved',
    '/workspace/admin/payments','Finance','rose',1,min(p.created_at)
  from payment_base p
  where p.status='disputed'
  having count(*)>0
),
renewal_actions as (
  select
    ('renewal-'||w.id)::text id,
    ('Renewal approaching · '||coalesce(nullif(w.company_name,''),'Client'))::text title,
    (coalesce(nullif(w.job_title,''),'Placement')||' · renewal '||w.renewal_date::text)::text subtitle,
    ('/workspace/client-success/'||w.id)::text href,
    'Renewal'::text label,'indigo'::text tone,4::int rank,(w.renewal_date::timestamp at time zone 'Asia/Manila') due
  from renewals w
),
task_actions as (
  select
    ('task-'||t.id)::text id,t.title,
    coalesce(nullif(t.description,''),t.priority||' priority owner task')::text subtitle,
    case
      when t.subject_type='job' and t.subject_id is not null and wr.id is not null then '/workspace/client-success/'||wr.id
      when t.subject_type='job' and t.subject_id is not null then '/workspace/admin/jobs/'||t.subject_id
      when t.subject_type='lead' and t.subject_id is not null then '/workspace/admin/leads?view=hiring&q='||t.subject_id
      when t.subject_type='va' and t.subject_id is not null then '/workspace/admin/vetting/'||t.subject_id
      else '/workspace/admin/today#owner-actions'
    end::text href,
    'Task'::text label,(case when t.priority='urgent' then 'rose' else 'amber' end)::text tone,
    (case when t.priority='urgent' then 1 else 2 end)::int rank,coalesce(t.due_at,now()) due
  from urgent_tasks t
  left join public.jobs j on t.subject_type='job' and j.id=t.subject_id
  left join active_workrooms wr on t.subject_type='job' and wr.job_id=t.subject_id
  where not (
    t.subject_type='job' and t.subject_id is not null and wr.id is null and j.status in ('closed','draft')
  )
  and not (
    t.subject_type='job' and t.subject_id is not null
    and exists(select 1 from hiring_rooms h where h.job_id=t.subject_id)
    and (t.title||' '||coalesce(t.description,'')) ~* '(shortlist|client response)'
  )
),
actions as materialized (
  select * from lead_actions union all
  select * from call_actions union all
  select * from proposal_actions union all
  select * from shortlist_actions union all
  select * from risk_actions union all
  select * from finance_actions union all
  select * from renewal_actions union all
  select * from task_actions
),
payment_counts as (
  select
    count(*) filter(where p.status='awaiting_payment' and p.created_at<now()-(s.overdue_days||' days')::interval)::int overdue_count,
    coalesce(sum(p.amount_total) filter(where p.status='awaiting_payment' and p.created_at<now()-(s.overdue_days||' days')::interval),0) overdue_total,
    count(*) filter(where p.status in ('paid','release_pending'))::int payout_ready_count,
    coalesce(sum(p.amount_total) filter(where p.status in ('paid','release_pending')),0) payout_ready_total,
    count(*) filter(where p.status='disputed')::int dispute_count
  from payment_base p cross join settings s
)
select jsonb_build_object(
  'pipeline',jsonb_build_object(
    'new_leads',(select count(*) from active_leads where coalesce(crm_stage,'new')='new'),
    'calls_today',(select count(*) from calls_today),
    'proposals',(select count(*) from proposals),
    'open_roles',(select count(*) from public.jobs where status in ('pending','published')),
    'shortlists',(select count(*) from hiring_rooms),
    'placements',(select count(*) from active_workrooms),
    'overdue_collections',(select overdue_count from payment_counts),
    'overdue_total',(select overdue_total from payment_counts),
    'retention_risks',(select count(*) from at_risk)
  ),
  'pulse',jsonb_build_object(
    'active_leads',(select count(*) from active_leads),
    'proposals_out',(select count(*) from proposals),
    'hiring_rooms_waiting',(select count(*) from hiring_rooms where released_at<=now()-interval '1 day'),
    'high_priority_tasks',(select count(*) from urgent_tasks),
    'at_risk',(select count(*) from at_risk),
    'renewals_30d',(select count(*) from renewals),
    'payout_ready',(select payout_ready_count from payment_counts),
    'payout_ready_total',(select payout_ready_total from payment_counts),
    'disputes',(select dispute_count from payment_counts)
  ),
  'owner_attention',(select count(*) from actions),
  'actions',coalesce((
    select jsonb_agg(to_jsonb(a) order by a.rank,a.due)
    from (
      select *
      from actions
      order by rank,due
      limit 14
    ) a
  ),'[]'::jsonb),
  'overdue_days',(select overdue_days from settings)
);
$function$;

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

revoke all on function public.recruiter_today_summary(uuid) from public;
revoke all on function public.recruiter_today_summary(uuid) from anon;
revoke all on function public.recruiter_today_summary(uuid) from authenticated;
grant execute on function public.recruiter_today_summary(uuid) to service_role;

revoke all on function public.admin_today_summary() from public;
revoke all on function public.admin_today_summary() from anon;
revoke all on function public.admin_today_summary() from authenticated;
grant execute on function public.admin_today_summary() to service_role;
