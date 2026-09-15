-- Keep My Day to one useful next action per shortlist-aging stage and make
-- role/VA actions deep-link to the exact operational record.
create or replace function public.recruiter_today_queue(p_user_id uuid,p_limit integer default 20)
returns jsonb
language sql
stable security definer
set search_path=public
as $$
  with items(priority_rank,priority,kind,id,title,subtitle,due_at,href,action_url,metadata,sort_distance) as (
    select case when t.due_at is not null and t.due_at<=now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end,
      t.priority,'task'::text,t.id,t.title,coalesce(nullif(t.description,''),'Recruiter task'),t.due_at,coalesce(t.href,'/workspace/recruiter/tasks'),null::text,
      jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id),
      abs(extract(epoch from(coalesce(t.due_at,now())-now()))
    from recruiter_tasks t
    where t.assignee_id=p_user_id and t.status='todo'
      and (t.snoozed_until is null or t.snoozed_until<=now())
      and (t.due_at is null or t.due_at between now()-interval '14 days' and now()+interval '1 day')

    union all
    select 0,'urgent'::text,'lead_first_contact'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),l.created_at,
      '/workspace/recruiter/leads?view=attention'::text,null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.created_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null
      and l.created_at>=now()-interval '14 days' and l.owner_id=p_user_id

    union all
    select 0,'urgent'::text,'lead_followup'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),l.next_follow_up_at,
      '/workspace/recruiter/leads?view=attention'::text,null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.next_follow_up_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
      and l.next_follow_up_at between now()-interval '7 days' and now()
      and not(coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null)
      and l.owner_id=p_user_id

    union all
    select 1,'high'::text,'discovery'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,'')),l.discovery_scheduled_at,
      '/workspace/recruiter/leads?view=discovery'::text,l.discovery_meeting_url,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),
      abs(extract(epoch from(l.discovery_scheduled_at-now())))
    from lead_intake l
    where l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at>=now()-interval '1 hour' and l.discovery_scheduled_at<=now()+interval '48 hours'
      and l.owner_id=p_user_id

    union all
    select 2,'normal'::text,'vetting'::text,vv.va_id,coalesce(nullif(p.full_name,''),'VA candidate'),'Recruiter review waiting'::text,
      vv.updated_at,('/workspace/recruiter/candidates/'||vv.va_id)::text,null::text,jsonb_build_object('va_id',vv.va_id),
      abs(extract(epoch from(now()-vv.updated_at)))
    from va_vetting vv left join profiles p on p.id=vv.va_id
    where vv.stage='recruiter_review' and vv.recruiter_id=p_user_id and vv.updated_at>=now()-interval '14 days'

    union all
    select case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,
      q.priority,q.action_type,q.subject_id,q.title,q.description,now()-(q.age_hours||' hours')::interval,
      case
        when q.subject_type='job' then '/workspace/recruiter/matching/'||q.subject_id
        when q.subject_type='va' then '/workspace/recruiter/candidates/'||q.subject_id
        else q.href
      end,
      null::text,jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),(q.age_hours*3600)::numeric
    from recruiter_daily_action_queue(p_user_id) q
    where not(q.action_type='client_shortlist_waiting' and q.age_hours>=120)
  ),
  deduped as(
    select distinct on(kind,id) * from items order by kind,id,priority_rank asc,sort_distance asc
  ),
  ranked as(
    select * from deduped order by priority_rank asc,sort_distance asc,title asc limit greatest(coalesce(p_limit,20),1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'priority',priority,'kind',kind,'id',id,'title',title,'subtitle',subtitle,
    'due_at',due_at,'href',href,'action_url',action_url,'metadata',metadata
  ) order by priority_rank asc,sort_distance asc,title asc),'[]'::jsonb)
  from ranked;
$$;

revoke execute on function public.recruiter_today_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;
