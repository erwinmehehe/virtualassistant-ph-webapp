-- Keep My Day focused on recent, actionable recruiter work.

create or replace function public.recruiter_daily_action_queue()
returns table(priority text, action_type text, title text, description text, href text, subject_type text, subject_id uuid, age_hours integer)
language sql
security definer
set search_path = public
as $$
  with released as (
    select j.id job_id, j.title, min(s.released_at) released_at,
      count(*) filter (where s.client_decision is null) waiting,
      count(*) filter (where s.client_decision='pass') passed,
      count(*) total,
      exists(select 1 from recruiter_activity ra where ra.subject_type='job' and ra.subject_id=j.id and ra.action='client_shortlist_viewed') viewed
    from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.shortlist_status='released'
    where j.status <> 'closed' and s.released_at >= now()-interval '14 days'
    group by j.id,j.title
  ), roles_without as (
    select j.id,j.title,j.created_at from jobs j
    where j.status in ('pending','published') and j.created_at between now()-interval '14 days' and now()-interval '24 hours'
      and not exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.shortlist_status in ('proposed','released'))
      and not exists(select 1 from applications a where a.job_id=j.id and a.status not in ('rejected','withdrawn'))
  ), conflicts as (
    select a.va_id, count(distinct a.job_id) roles
    from applications a join jobs j on j.id=a.job_id and j.status <> 'closed'
    where a.status in ('interview','offered','hired')
    group by a.va_id having count(distinct a.job_id) >= 2
  ), actions as (
    select case when extract(epoch from (now()-r.released_at))/3600 >=72 then 'urgent' else 'high' end::text priority,
      'client_shortlist_waiting'::text action_type,
      case when r.viewed then 'Client viewed shortlist but has not decided' else 'Client has not reviewed shortlist' end::text title,
      (r.title || ' · ' || r.waiting || ' candidate(s) waiting for feedback')::text description,
      '/workspace/recruiter/client-review'::text href,'job'::text subject_type,r.job_id subject_id,
      floor(extract(epoch from (now()-r.released_at))/3600)::int age_hours
    from released r where r.waiting>0 and r.released_at <= now()-interval '24 hours'
    union all
    select 'urgent','all_candidates_passed','All released candidates were passed',(r.title || ' needs replacement matches')::text,('/workspace/recruiter/matching/'||r.job_id)::text,'job',r.job_id,
      floor(extract(epoch from (now()-r.released_at))/3600)::int
    from released r where r.total>0 and r.passed=r.total
    union all
    select 'urgent','client_response_overdue','Client response overdue',(r.title || ' has been waiting 5+ days')::text,'/workspace/recruiter/client-review','job',r.job_id,
      floor(extract(epoch from (now()-r.released_at))/3600)::int
    from released r where r.waiting>0 and r.released_at <= now()-interval '5 days'
    union all
    select 'high','role_without_shortlist','Role has no shortlist',(rw.title || ' has been open for more than 24 hours without candidates')::text,('/workspace/recruiter/matching/'||rw.id)::text,'job',rw.id,
      floor(extract(epoch from (now()-rw.created_at))/3600)::int from roles_without rw
    union all
    select 'high','interview_today','Interview today',(j.title || ' · candidate interview scheduled today')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job',ci.job_id,
      greatest(0,floor(extract(epoch from (ci.scheduled_at-now()))/3600)::int)
    from candidate_interviews ci join jobs j on j.id=ci.job_id
    where ci.status='scheduled' and timezone('Asia/Manila',ci.scheduled_at)::date=timezone('Asia/Manila',now())::date
    union all
    select 'high','interview_feedback_missing','Interview completed, feedback missing',(j.title || ' needs a Proceed / Hold / Pass decision')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job',ci.job_id,
      floor(extract(epoch from (now()-coalesce(ci.completed_at,ci.scheduled_at)))/3600)::int
    from candidate_interviews ci join jobs j on j.id=ci.job_id
    where ci.status='completed' and ci.client_feedback_at is null and coalesce(ci.completed_at,ci.scheduled_at) >= now()-interval '14 days'
    union all
    select 'high','offer_waiting_va','VA has not accepted offer',(j.title || ' · offer waiting for VA response')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job',po.job_id,
      floor(extract(epoch from (now()-po.created_at))/3600)::int
    from placement_offers po join jobs j on j.id=po.job_id where po.status='pending_va' and po.created_at between now()-interval '14 days' and now()-interval '24 hours'
    union all
    select 'high','offer_waiting_client','Offer waiting for client confirmation',(j.title || ' · VA accepted, client confirmation is pending')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job',po.job_id,
      floor(extract(epoch from (now()-coalesce(po.va_accepted_at,po.created_at)))/3600)::int
    from placement_offers po join jobs j on j.id=po.job_id where po.status='pending_client' and coalesce(po.va_accepted_at,po.created_at) >= now()-interval '14 days'
    union all
    select 'high','candidate_capacity_conflict','Candidate may be double-booked',(coalesce(p.full_name,'VA candidate') || ' is active in ' || c.roles || ' client processes')::text,('/workspace/recruiter/candidates/'||c.va_id)::text,'va',c.va_id,0
    from conflicts c left join profiles p on p.id=c.va_id
  )
  select * from actions
  order by case priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end, age_hours asc nulls last;
$$;

create or replace function public.recruiter_today_queue(p_user_id uuid, p_limit integer default 20)
returns jsonb
language sql
stable security definer
set search_path=public
as $$
  with items as (
    select
      case when t.due_at is not null and t.due_at <= now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end priority_rank,
      t.priority,'task'::text kind,t.id,t.title,coalesce(nullif(t.description,''),'Recruiter task') subtitle,t.due_at,
      coalesce(t.href,'/workspace/recruiter/tasks') href,null::text action_url,
      jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id) metadata,
      abs(extract(epoch from (coalesce(t.due_at,now())-now()))) sort_distance
    from recruiter_tasks t
    where t.assignee_id=p_user_id and t.status='todo' and (t.snoozed_until is null or t.snoozed_until<=now())
      and (t.due_at is null or (t.due_at between now()-interval '14 days' and now()+interval '1 day'))

    union all
    select 0,'urgent','lead_first_contact',l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),l.created_at,
      '/workspace/recruiter/leads?view=attention',null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from (now()-l.created_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null
      and l.created_at>=now()-interval '14 days' and (l.owner_id is null or l.owner_id=p_user_id)

    union all
    select 0,'urgent','lead_followup',l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),l.next_follow_up_at,
      '/workspace/recruiter/leads?view=attention',null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from (now()-l.next_follow_up_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
      and l.next_follow_up_at between now()-interval '7 days' and now()
      and not (coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null)
      and (l.owner_id is null or l.owner_id=p_user_id)

    union all
    select 1,'high','discovery',l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,'')),l.discovery_scheduled_at,
      '/workspace/recruiter/leads?view=discovery',l.discovery_meeting_url,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),
      abs(extract(epoch from (l.discovery_scheduled_at-now())))
    from lead_intake l
    where l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at>=now()-interval '1 hour' and l.discovery_scheduled_at<=now()+interval '48 hours'
      and (l.owner_id is null or l.owner_id=p_user_id)

    union all
    select 1,'high','role_review',j.id,j.title,coalesce(nullif(j.company_name,''),'New client role'),j.created_at,
      '/workspace/recruiter/matching/'||j.id::text,null::text,jsonb_build_object('job_id',j.id),
      abs(extract(epoch from (now()-j.created_at)))
    from jobs j where j.status='pending' and j.created_at>=now()-interval '14 days'

    union all
    select 2,'normal','vetting',vv.va_id,coalesce(nullif(p.full_name,''),'VA candidate'),'Recruiter review waiting',vv.updated_at,
      '/workspace/recruiter/candidates/'||vv.va_id::text,null::text,jsonb_build_object('va_id',vv.va_id),
      abs(extract(epoch from (now()-vv.updated_at)))
    from va_vetting vv left join profiles p on p.id=vv.va_id
    where vv.stage='recruiter_review' and vv.updated_at>=now()-interval '14 days'

    union all
    select case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,
      q.priority,q.action_type,q.subject_id,q.title,q.description,
      now()-(q.age_hours||' hours')::interval,q.href,null::text,
      jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),
      q.age_hours*3600::numeric
    from recruiter_daily_action_queue() q
  ), deduped as (
    select distinct on (kind,id) * from items
    order by kind,id,priority_rank asc,sort_distance asc
  ), ranked as (
    select * from deduped
    order by priority_rank asc,sort_distance asc,title asc
    limit greatest(coalesce(p_limit,20),1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'priority',priority,'kind',kind,'id',id,'title',title,'subtitle',subtitle,'due_at',due_at,'href',href,'action_url',action_url,'metadata',metadata
  ) order by priority_rank asc,sort_distance asc,title asc),'[]'::jsonb)
  from ranked;
$$;

revoke execute on function public.recruiter_daily_action_queue() from public, anon, authenticated;
revoke execute on function public.recruiter_today_queue(uuid,integer) from public, anon, authenticated;
grant execute on function public.recruiter_daily_action_queue() to service_role;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;
