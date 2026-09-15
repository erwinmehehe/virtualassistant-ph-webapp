create or replace function public.create_placement_followup_tasks()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_recruiter uuid; v_base timestamptz; begin
  select recruiter_id into v_recruiter from jobs where id=new.job_id;
  v_recruiter:=coalesce(v_recruiter,public.default_recruiter_id());
  if v_recruiter is null then return new; end if;
  v_base:=greatest(coalesce(new.created_at,now()),coalesce(new.start_date::timestamptz,now()));
  insert into recruiter_tasks(title,description,assignee_id,created_by,subject_type,subject_id,href,priority,status,due_at)
  values
    ('Day 3 placement setup','Confirm the VA has access, tools, SOPs, priorities, and a working communication channel. Escalate only real blockers.',v_recruiter,null,'job',new.job_id,'/workspace/recruiter/today','high','todo',v_base+interval '3 days'),
    ('Day 7 placement health','Check whether the client and VA are operating smoothly. Capture concerns early and create a recovery action only if needed.',v_recruiter,null,'job',new.job_id,'/workspace/recruiter/today','normal','todo',v_base+interval '7 days'),
    ('Day 30 placement review','Confirm placement stability, client satisfaction, VA workload, and whether the engagement should continue unchanged.',v_recruiter,null,'job',new.job_id,'/workspace/recruiter/today','normal','todo',v_base+interval '30 days');
  return new;
end;
$$;

create or replace function public.recruiter_daily_action_queue(p_user_id uuid)
returns table(priority text, action_type text, title text, description text, href text, subject_type text, subject_id uuid, age_hours integer)
language sql
security definer
set search_path=public
as $$
  with released as (
    select j.id job_id,j.title,min(s.released_at) released_at,
      count(*) filter(where s.client_decision is null) waiting,
      count(*) filter(where s.client_decision='pass') passed,
      count(*) total,
      exists(select 1 from recruiter_activity ra where ra.subject_type='job' and ra.subject_id=j.id and ra.action='client_shortlist_viewed') viewed
    from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.shortlist_status='released'
    where j.status<>'closed' and j.recruiter_id=p_user_id and s.released_at>=now()-interval '14 days'
    group by j.id,j.title
  ), roles_without as (
    select j.id,j.title,j.created_at from jobs j
    where j.recruiter_id=p_user_id and j.status='published' and j.created_at between now()-interval '14 days' and now()-interval '24 hours'
      and not exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.shortlist_status in ('proposed','released'))
  ), conflicts as (
    select a.va_id,count(distinct a.job_id) roles
    from applications a join jobs j on j.id=a.job_id and j.status<>'closed'
    where a.status in ('interview','offered','hired')
    group by a.va_id having count(distinct a.job_id)>=2
  ), actions(priority,action_type,title,description,href,subject_type,subject_id,age_hours) as (
    select (case when extract(epoch from(now()-r.released_at))/3600>=72 then 'urgent' else 'high' end)::text,'client_shortlist_waiting'::text,(case when r.viewed then 'Client viewed shortlist but has not decided' else 'Client has not reviewed shortlist' end)::text,(r.title||' · '||r.waiting||' candidate(s) waiting for feedback')::text,'/workspace/recruiter/client-review'::text,'job'::text,r.job_id,floor(extract(epoch from(now()-r.released_at))/3600)::int
    from released r where r.waiting>0 and r.released_at<=now()-interval '24 hours'
    union all select 'urgent'::text,'all_candidates_passed'::text,'All presented candidates were passed'::text,(r.title||' needs replacement matches')::text,('/workspace/recruiter/matching/'||r.job_id)::text,'job'::text,r.job_id,floor(extract(epoch from(now()-r.released_at))/3600)::int from released r where r.total>0 and r.passed=r.total
    union all select 'urgent'::text,'client_response_overdue'::text,'Client response overdue'::text,(r.title||' has been waiting 5+ days')::text,'/workspace/recruiter/client-review'::text,'job'::text,r.job_id,floor(extract(epoch from(now()-r.released_at))/3600)::int from released r where r.waiting>0 and r.released_at<=now()-interval '5 days'
    union all select 'high'::text,'role_without_shortlist'::text,'Published role has no recruiter shortlist'::text,(rw.title||' has been recruiting for more than 24 hours without candidates')::text,('/workspace/recruiter/matching/'||rw.id)::text,'job'::text,rw.id,floor(extract(epoch from(now()-rw.created_at))/3600)::int from roles_without rw
    union all select (case when j.created_at<=now()-interval '8 hours' then 'urgent' else 'high' end)::text,'role_needs_terms'::text,'Prepare client service terms'::text,(j.title||' passed intake but has no commercial terms yet')::text,('/workspace/recruiter/matching/'||j.id)::text,'job'::text,j.id,floor(extract(epoch from(now()-j.created_at))/3600)::int from jobs j left join job_commercials c on c.job_id=j.id where j.recruiter_id=p_user_id and j.status='pending' and j.service_model<>'managed_service' and j.client_id is not null and c.job_id is null and j.created_at between now()-interval '14 days' and now()-interval '2 hours'
    union all select (case when c.updated_at<=now()-interval '48 hours' then 'urgent' else 'high' end)::text,'client_terms_waiting'::text,'Client has not approved service terms'::text,(j.title||' · quoted terms are waiting on client approval')::text,('/workspace/recruiter/matching/'||j.id)::text,'job'::text,j.id,floor(extract(epoch from(now()-c.updated_at))/3600)::int from jobs j join job_commercials c on c.job_id=j.id and c.commercial_status='quoted' where j.recruiter_id=p_user_id and j.status='pending' and c.updated_at between now()-interval '14 days' and now()-interval '24 hours'
    union all select 'high'::text,'client_account_missing'::text,'Client account not linked'::text,(j.title||' cannot move to client review until the qualified lead claims or links a client account')::text,('/workspace/recruiter/matching/'||j.id)::text,'job'::text,j.id,floor(extract(epoch from(now()-j.created_at))/3600)::int from jobs j where j.recruiter_id=p_user_id and j.status='pending' and j.client_id is null and j.lead_id is not null and j.created_at between now()-interval '14 days' and now()-interval '24 hours'
    union all select 'high'::text,'interview_today'::text,'Interview today'::text,(j.title||' · candidate interview scheduled today')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job'::text,ci.job_id,greatest(0,floor(extract(epoch from(ci.scheduled_at-now()))/3600)::int) from candidate_interviews ci join jobs j on j.id=ci.job_id where j.recruiter_id=p_user_id and ci.status='scheduled' and timezone('Asia/Manila',ci.scheduled_at)::date=timezone('Asia/Manila',now())::date
    union all select 'high'::text,'interview_feedback_missing'::text,'Interview completed, feedback missing'::text,(j.title||' needs a Proceed / Hold / Pass decision')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job'::text,ci.job_id,floor(extract(epoch from(now()-coalesce(ci.completed_at,ci.scheduled_at)))/3600)::int from candidate_interviews ci join jobs j on j.id=ci.job_id where j.recruiter_id=p_user_id and ci.status='completed' and ci.client_feedback_at is null and coalesce(ci.completed_at,ci.scheduled_at)>=now()-interval '14 days'
    union all select 'high'::text,'offer_waiting_va'::text,'VA has not accepted offer'::text,(j.title||' · offer waiting for VA response')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job'::text,po.job_id,floor(extract(epoch from(now()-po.created_at))/3600)::int from placement_offers po join jobs j on j.id=po.job_id where j.recruiter_id=p_user_id and po.status='pending_va' and po.created_at between now()-interval '14 days' and now()-interval '24 hours'
    union all select 'high'::text,'offer_waiting_client'::text,'Offer waiting for client confirmation'::text,(j.title||' · VA accepted, client confirmation is pending')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job'::text,po.job_id,floor(extract(epoch from(now()-coalesce(po.va_accepted_at,po.created_at)))/3600)::int from placement_offers po join jobs j on j.id=po.job_id where j.recruiter_id=p_user_id and po.status='pending_client' and coalesce(po.va_accepted_at,po.created_at)>=now()-interval '14 days'
    union all select 'high'::text,'candidate_capacity_conflict'::text,'Candidate may be double-booked'::text,(coalesce(p.full_name,'VA candidate')||' is active in '||c.roles||' client processes')::text,('/workspace/recruiter/candidates/'||c.va_id)::text,'va'::text,c.va_id,0 from conflicts c left join profiles p on p.id=c.va_id where exists(select 1 from applications a join jobs j on j.id=a.job_id where a.va_id=c.va_id and j.recruiter_id=p_user_id and j.status<>'closed' and a.status in ('interview','offered','hired'))
  )
  select * from actions order by case actions.priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,actions.age_hours asc nulls last;
$$;
revoke execute on function public.recruiter_daily_action_queue(uuid) from public,anon,authenticated;
grant execute on function public.recruiter_daily_action_queue(uuid) to service_role;

create or replace function public.recruiter_today_queue(p_user_id uuid,p_limit integer default 20)
returns jsonb
language sql
stable security definer
set search_path=public
as $$
  with items(priority_rank,priority,kind,id,title,subtitle,due_at,href,action_url,metadata,sort_distance) as (
    select case when t.due_at is not null and t.due_at<=now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end,t.priority,'task'::text,t.id,t.title,coalesce(nullif(t.description,''),'Recruiter task'),t.due_at,coalesce(t.href,'/workspace/recruiter/tasks'),null::text,jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id),abs(extract(epoch from(coalesce(t.due_at,now())-now()))) from recruiter_tasks t where t.assignee_id=p_user_id and t.status='todo' and (t.snoozed_until is null or t.snoozed_until<=now()) and (t.due_at is null or t.due_at between now()-interval '14 days' and now()+interval '1 day')
    union all select 0,'urgent'::text,'lead_first_contact'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),l.created_at,'/workspace/recruiter/leads?view=attention'::text,null::text,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),abs(extract(epoch from(now()-l.created_at))) from lead_intake l where coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null and l.created_at>=now()-interval '14 days' and l.owner_id=p_user_id
    union all select 0,'urgent'::text,'lead_followup'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),l.next_follow_up_at,'/workspace/recruiter/leads?view=attention'::text,null::text,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),abs(extract(epoch from(now()-l.next_follow_up_at))) from lead_intake l where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') and l.next_follow_up_at between now()-interval '7 days' and now() and not(coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null) and l.owner_id=p_user_id
    union all select 1,'high'::text,'discovery'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,'')),l.discovery_scheduled_at,'/workspace/recruiter/leads?view=discovery'::text,l.discovery_meeting_url,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),abs(extract(epoch from(l.discovery_scheduled_at-now()))) from lead_intake l where l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null and l.discovery_scheduled_at>=now()-interval '1 hour' and l.discovery_scheduled_at<=now()+interval '48 hours' and l.owner_id=p_user_id
    union all select 2,'normal'::text,'vetting'::text,vv.va_id,coalesce(nullif(p.full_name,''),'VA candidate'),'Recruiter review waiting'::text,vv.updated_at,('/workspace/recruiter/candidates/'||vv.va_id)::text,null::text,jsonb_build_object('va_id',vv.va_id),abs(extract(epoch from(now()-vv.updated_at))) from va_vetting vv left join profiles p on p.id=vv.va_id where vv.stage='recruiter_review' and vv.recruiter_id=p_user_id and vv.updated_at>=now()-interval '14 days'
    union all select case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,q.priority,q.action_type,q.subject_id,q.title,q.description,now()-(q.age_hours||' hours')::interval,q.href,null::text,jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),(q.age_hours*3600)::numeric from recruiter_daily_action_queue(p_user_id) q
  ),deduped as(select distinct on(kind,id) * from items order by kind,id,priority_rank asc,sort_distance asc),ranked as(select * from deduped order by priority_rank asc,sort_distance asc,title asc limit greatest(coalesce(p_limit,20),1))
  select coalesce(jsonb_agg(jsonb_build_object('priority',priority,'kind',kind,'id',id,'title',title,'subtitle',subtitle,'due_at',due_at,'href',href,'action_url',action_url,'metadata',metadata) order by priority_rank asc,sort_distance asc,title asc),'[]'::jsonb) from ranked;
$$;
revoke execute on function public.recruiter_today_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;

insert into recruiter_tasks(title,description,assignee_id,created_by,subject_type,subject_id,href,priority,status,due_at)
select 'Existing placement health review','This placement predates the new Day 3 / 7 / 30 workflow. Review client satisfaction, VA workload, access, communication, payment status, and any replacement risk once, then close this task.',coalesce(j.recruiter_id,public.default_recruiter_id()),null,'job',w.job_id,'/workspace/recruiter/today','high','todo',now()
from workrooms w join jobs j on j.id=w.job_id
where w.status='active' and coalesce(j.recruiter_id,public.default_recruiter_id()) is not null
  and not exists(select 1 from recruiter_tasks t where t.subject_type='job' and t.subject_id=w.job_id and t.title in ('Existing placement health review','Day 3 placement setup','Day 7 placement health','Day 30 placement review'));
