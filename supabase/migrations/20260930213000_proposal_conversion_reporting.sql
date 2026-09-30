-- Proposal conversion QA/reporting.
-- Adds proposal sent/accepted stages and proposal timing metrics to the agency funnel,
-- and adds proposal action states to the existing single Recruiter Today summary RPC.

-- One-cohort end-to-end hiring funnel from enquiry through placement.
-- Keeps the existing sales/recruiting/retention payloads for compatibility and
-- adds a journey payload for the exact lead -> hire progression.

create or replace function public.agency_funnel_metrics(
  p_days integer default 90,
  p_recruiter_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = 'pg_catalog', 'public'
as $function$
with params as (
  select
    least(greatest(coalesce(p_days,90),30),365)::int as days,
    now() - make_interval(days => least(greatest(coalesce(p_days,90),30),365)) as cutoff,
    current_date - least(greatest(coalesce(p_days,90),30),365) as cutoff_date
),
sales_cohort as materialized (
  select
    l.id,
    l.crm_stage,
    l.discovery_scheduled_at,
    l.discovery_completed_at,
    l.discovery_outcome,
    l.won_at,
    l.job_id,
    l.created_at
  from public.lead_intake l
  cross join params p
  where l.lead_type='client_hiring'
    and l.status <> 'spam'
    and l.created_at>=p.cutoff
    and (p_recruiter_id is null or l.owner_id=p_recruiter_id)
),
sales_progress as (
  select
    s.*,
    exists(
      select 1 from public.lead_proposals lp
      where lp.lead_id=s.id and lp.sent_at is not null
    ) as has_proposal,
    exists(
      select 1 from public.lead_proposals lp
      where lp.lead_id=s.id and lp.accepted_at is not null
    ) as has_accepted_proposal,
    exists(
      select 1 from public.jobs j
      where (j.lead_id=s.id or j.id=s.job_id) and j.published_at is not null
    ) as has_active_job_order,
    exists(
      select 1
      from public.jobs j
      join public.job_shortlist_candidates sc on sc.job_id=j.id
      where (j.lead_id=s.id or j.id=s.job_id)
        and sc.shortlist_status='released'
    ) as has_shortlist,
    exists(
      select 1
      from public.jobs j
      join public.candidate_interviews ci on ci.job_id=j.id
      where (j.lead_id=s.id or j.id=s.job_id)
        and ci.status<>'cancelled'
    ) as has_interview,
    exists(
      select 1
      from public.jobs j
      join public.placement_offers po on po.job_id=j.id
      where (j.lead_id=s.id or j.id=s.job_id)
        and po.status<>'cancelled'
    ) as has_offer,
    exists(
      select 1
      from public.jobs j
      join public.workrooms w on w.job_id=j.id
      where (j.lead_id=s.id or j.id=s.job_id)
    ) as has_hire
  from sales_cohort s
),
sales_flags as (
  select
    sp.*,
    (sp.won_at is not null or sp.crm_stage='won' or sp.has_accepted_proposal) as is_won,
    (
      sp.crm_stage in ('qualified','terms_sent','won')
      or sp.has_proposal
      or sp.has_active_job_order
      or sp.won_at is not null
      or sp.has_shortlist
      or sp.has_interview
      or sp.has_offer
      or sp.has_hire
    ) as is_qualified
  from sales_progress sp
),
journey_flags as (
  select
    sf.*,
    (
      sf.discovery_completed_at is not null
      and coalesce(sf.discovery_outcome,'attended') not in ('no_show','cancelled','rescheduled')
    ) or sf.is_qualified or sf.has_shortlist or sf.has_interview or sf.has_offer or sf.has_hire as is_discovery_attended
  from sales_flags sf
),
journey as (
  select
    count(*)::int as enquiries,
    count(*) filter(
      where discovery_scheduled_at is not null
        or is_discovery_attended
        or is_qualified
        or has_shortlist
        or has_interview
        or has_offer
        or has_hire
    )::int as discovery_booked,
    count(*) filter(where is_discovery_attended)::int as discovery_attended,
    count(*) filter(where is_qualified or has_shortlist or has_interview or has_offer or has_hire)::int as qualified,
    count(*) filter(where has_proposal or has_shortlist or has_interview or has_offer or has_hire)::int as proposal_sent,
    count(*) filter(where has_accepted_proposal or has_shortlist or has_interview or has_offer or has_hire)::int as proposal_accepted,
    count(*) filter(where has_shortlist or has_interview or has_offer or has_hire)::int as shortlisted,
    count(*) filter(where has_interview or has_offer or has_hire)::int as interviewed,
    count(*) filter(where has_offer or has_hire)::int as offered,
    count(*) filter(where has_hire)::int as hired
  from journey_flags
),
sales as (
  select
    count(*)::int as leads,
    count(*) filter(
      where discovery_scheduled_at is not null
        or discovery_completed_at is not null
        or is_qualified or has_proposal or is_won
    )::int as calls_booked,
    count(*) filter(where discovery_completed_at is not null)::int as discovery_completed,
    count(*) filter(where is_qualified)::int as qualified,
    count(*) filter(where has_proposal or crm_stage in ('terms_sent','won') or is_won)::int as proposals,
    count(*) filter(where is_won)::int as clients_won,
    count(*) filter(where has_active_job_order)::int as active_job_orders
  from sales_flags
),
proposal_by_lead as (
  select
    s.id as lead_id,
    min(lp.sent_at) filter (where lp.sent_at is not null) as first_sent_at,
    min(lp.viewed_at) filter (where lp.viewed_at is not null) as first_viewed_at,
    min(lp.changes_requested_at) filter (where lp.changes_requested_at is not null) as first_changes_at,
    min(lp.accepted_at) filter (where lp.accepted_at is not null) as first_accepted_at,
    min(lp.declined_at) filter (where lp.declined_at is not null) as first_declined_at
  from sales_cohort s
  left join public.lead_proposals lp on lp.lead_id=s.id
  group by s.id
),
proposal_metrics as (
  select
    count(*) filter(where first_sent_at is not null)::int as sent,
    count(*) filter(where first_viewed_at is not null)::int as viewed,
    count(*) filter(where first_changes_at is not null or first_accepted_at is not null or first_declined_at is not null)::int as responded,
    count(*) filter(where first_changes_at is not null)::int as changes_requested,
    count(*) filter(where first_accepted_at is not null)::int as accepted,
    count(*) filter(where first_declined_at is not null)::int as declined,
    coalesce(round((
      percentile_cont(0.5) within group (
        order by extract(epoch from(first_viewed_at-first_sent_at))/3600.0
      ) filter(where first_sent_at is not null and first_viewed_at is not null and first_viewed_at>=first_sent_at)
    )::numeric,1),0)::numeric as median_hours_to_view,
    coalesce(round((
      percentile_cont(0.5) within group (
        order by extract(epoch from(coalesce(first_accepted_at,first_declined_at)-first_sent_at))/3600.0
      ) filter(where first_sent_at is not null and coalesce(first_accepted_at,first_declined_at) is not null and coalesce(first_accepted_at,first_declined_at)>=first_sent_at)
    )::numeric,1),0)::numeric as median_hours_to_decision
  from proposal_by_lead
),
recruiting_cohort as materialized (
  select j.id,j.published_at
  from public.jobs j cross join params p
  where j.published_at is not null
    and j.published_at>=p.cutoff
    and (p_recruiter_id is null or j.recruiter_id=p_recruiter_id)
),
recruiting_progress as (
  select
    r.*,
    (select min(s.released_at) from public.job_shortlist_candidates s where s.job_id=r.id and s.shortlist_status='released' and s.released_at is not null) as first_shortlist_at,
    exists(select 1 from public.candidate_interviews ci where ci.job_id=r.id and ci.status<>'cancelled') as has_interview,
    exists(select 1 from public.placement_offers po where po.job_id=r.id and po.status<>'cancelled') as has_offer,
    exists(select 1 from public.workrooms w where w.job_id=r.id) as has_placement,
    (select min(w.start_date) from public.workrooms w where w.job_id=r.id and w.start_date is not null) as first_start_date
  from recruiting_cohort r
),
recruiting as (
  select
    count(*)::int job_orders,
    count(*) filter(where first_shortlist_at is not null)::int shortlisted,
    count(*) filter(where has_interview)::int interviewed,
    count(*) filter(where has_offer)::int offered,
    count(*) filter(where has_placement)::int placed,
    coalesce(round((avg(extract(epoch from(first_shortlist_at-published_at))/86400.0) filter(where first_shortlist_at is not null))::numeric,1),0)::numeric avg_days_to_shortlist,
    coalesce(round((avg(first_start_date-published_at::date) filter(where first_start_date is not null))::numeric,1),0)::numeric avg_days_to_start
  from recruiting_progress
),
retention_base as materialized (
  select w.id,w.start_date,w.ended_at,w.placement_stage
  from public.workrooms w
  join public.jobs j on j.id=w.job_id
  where w.start_date is not null
    and (p_recruiter_id is null or j.recruiter_id=p_recruiter_id)
),
retention as (
  select
    count(*) filter(where placement_stage<>'ended')::int active_placements,
    count(*) filter(where start_date+30 between (select cutoff_date from params) and current_date)::int eligible_30d,
    count(*) filter(
      where start_date+30 between (select cutoff_date from params) and current_date
        and (ended_at is null or ended_at::date>=start_date+30)
    )::int retained_30d,
    count(*) filter(where start_date+90 between (select cutoff_date from params) and current_date)::int eligible_90d,
    count(*) filter(
      where start_date+90 between (select cutoff_date from params) and current_date
        and (ended_at is null or ended_at::date>=start_date+90)
    )::int retained_90d
  from retention_base
)
select jsonb_build_object(
  'days',(select days from params),
  'journey',jsonb_build_object(
    'enquiries',j.enquiries,
    'discovery_booked',j.discovery_booked,
    'discovery_attended',j.discovery_attended,
    'qualified',j.qualified,
    'proposal_sent',j.proposal_sent,
    'proposal_accepted',j.proposal_accepted,
    'shortlisted',j.shortlisted,
    'interviewed',j.interviewed,
    'offered',j.offered,
    'hired',j.hired
  ),
  'sales',jsonb_build_object(
    'leads',s.leads,
    'calls_booked',s.calls_booked,
    'discovery_completed',s.discovery_completed,
    'qualified',s.qualified,
    'proposals',s.proposals,
    'clients_won',s.clients_won,
    'active_job_orders',s.active_job_orders
  ),
  'proposal',jsonb_build_object(
    'sent',p.sent,
    'viewed',p.viewed,
    'responded',p.responded,
    'changes_requested',p.changes_requested,
    'accepted',p.accepted,
    'declined',p.declined,
    'median_hours_to_view',p.median_hours_to_view,
    'median_hours_to_decision',p.median_hours_to_decision
  ),
  'recruiting',jsonb_build_object(
    'job_orders',r.job_orders,
    'shortlisted',r.shortlisted,
    'interviewed',r.interviewed,
    'offered',r.offered,
    'placed',r.placed,
    'avg_days_to_shortlist',r.avg_days_to_shortlist,
    'avg_days_to_start',r.avg_days_to_start
  ),
  'retention',jsonb_build_object(
    'active_placements',t.active_placements,
    'eligible_30d',t.eligible_30d,
    'retained_30d',t.retained_30d,
    'eligible_90d',t.eligible_90d,
    'retained_90d',t.retained_90d
  )
)
from journey j cross join sales s cross join proposal_metrics p cross join recruiting r cross join retention t;
$function$;

revoke all on function public.agency_funnel_metrics(integer,uuid) from public;
revoke all on function public.agency_funnel_metrics(integer,uuid) from anon;
revoke all on function public.agency_funnel_metrics(integer,uuid) from authenticated;
grant execute on function public.agency_funnel_metrics(integer,uuid) to service_role;


-- Include the client's timezone in Recruiter Today discovery summaries.
-- Extend the compact Recruiter Today summary with upcoming discovery calls.
-- Keeps the page to one summary RPC and avoids page-level lead queries.
-- Keep assigned client email replies inside the single Recruiter Today summary RPC.
-- Keep fresh untouched hiring enquiries inside the single Recruiter My Day summary RPC.
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
cross join proposal_actions pa
cross join proposal_health ph
cross join stale_roles sr
cross join action_counts a;
$function$;

revoke execute on function public.recruiter_today_summary(uuid) from public, anon, authenticated;
grant execute on function public.recruiter_today_summary(uuid) to service_role;

