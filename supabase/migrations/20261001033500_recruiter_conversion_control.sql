-- Keep conversion-critical sales work inside the existing Recruiter Today queue.
-- Adds overdue discovery outcomes, unsent proposal drafts, and qualified discoveries
-- that have not entered the proposal workflow. Also removes legacy /leads hrefs.

create or replace function public.recruiter_today_queue(p_user_id uuid,p_limit integer default 20)
returns jsonb
language sql
stable
security definer
set search_path='pg_catalog','public'
as $function$
  with latest_draft_proposals as materialized (
    select *
    from (
      select
        lp.id as proposal_id,
        lp.lead_id,
        lp.role_title,
        lp.created_at,
        l.name,
        l.company,
        row_number() over(partition by lp.lead_id order by lp.created_at desc,lp.id desc) as row_rank
      from public.lead_proposals lp
      join public.lead_intake l on l.id=lp.lead_id
      where l.lead_type='client_hiring'
        and l.owner_id=p_user_id
        and coalesce(l.crm_stage,'new') not in ('won','lost')
        and lp.status='draft'
        and lp.sent_at is null
        and lp.created_at<=now()-interval '2 hours'
    ) ranked
    where row_rank=1
  ),
  items(priority_rank,priority,kind,id,title,subtitle,due_at,href,action_url,metadata,sort_distance) as (
    select
      case when t.due_at is not null and t.due_at<=now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end,
      t.priority,
      'task'::text,
      t.id,
      t.title,
      coalesce(nullif(t.description,''),'Recruiter task'),
      t.due_at,
      coalesce(t.href,'/workspace/recruiter/tasks'),
      null::text,
      jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id),
      abs(extract(epoch from(coalesce(t.due_at,now())-now())))
    from public.recruiter_tasks t
    where t.assignee_id=p_user_id
      and t.status='todo'
      and (t.snoozed_until is null or t.snoozed_until<=now())
      and (t.due_at is null or t.due_at between now()-interval '14 days' and now()+interval '1 day')

    union all
    select
      0,'urgent'::text,'lead_first_contact'::text,l.id,
      coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),
      l.created_at,
      ('/workspace/recruiter/crm/'||l.id::text)::text,
      null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.created_at)))
    from public.lead_intake l
    where coalesce(l.crm_stage,'new')='new'
      and l.first_contact_at is null
      and l.created_at>=now()-interval '14 days'
      and l.owner_id=p_user_id
      and l.lead_type='client_hiring'

    union all
    select
      0,'urgent'::text,'lead_followup'::text,l.id,
      coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),
      l.next_follow_up_at,
      ('/workspace/recruiter/crm/'||l.id::text||'#client-followup')::text,
      null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.next_follow_up_at)))
    from public.lead_intake l
    where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture')
      and l.next_follow_up_at between now()-interval '7 days' and now()
      and not(coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null)
      and l.owner_id=p_user_id
      and l.lead_type='client_hiring'

    union all
    select
      case when l.discovery_scheduled_at<now() then 0 else 1 end,
      case when l.discovery_scheduled_at<now() then 'urgent' else 'high' end::text,
      'discovery'::text,
      l.id,
      coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      case
        when l.discovery_scheduled_at<now()
          then concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery outcome overdue',nullif(l.timezone,''))
        else concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,''))
      end,
      l.discovery_scheduled_at,
      ('/workspace/recruiter/crm/'||l.id::text||'/discovery')::text,
      l.discovery_meeting_url,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),
      abs(extract(epoch from(l.discovery_scheduled_at-now())))
    from public.lead_intake l
    where l.discovery_scheduled_at is not null
      and l.discovery_completed_at is null
      and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at>=now()-interval '7 days'
      and l.discovery_scheduled_at<=now()+interval '48 hours'
      and l.owner_id=p_user_id
      and l.lead_type='client_hiring'

    union all
    select
      0,'urgent'::text,'proposal_missing'::text,l.id,
      coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      'Qualified discovery has no proposal'::text,
      coalesce(l.discovery_completed_at,l.stage_updated_at,l.created_at),
      ('/workspace/recruiter/crm/'||l.id::text||'/discovery')::text,
      null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'company',l.company,'job_id',l.job_id),
      abs(extract(epoch from(now()-coalesce(l.discovery_completed_at,l.stage_updated_at,l.created_at))))
    from public.lead_intake l
    where l.lead_type='client_hiring'
      and l.owner_id=p_user_id
      and l.crm_stage='qualified'
      and l.discovery_completed_at is not null
      and l.discovery_outcome='qualified'
      and not exists (
        select 1 from public.lead_proposals lp where lp.lead_id=l.id
      )

    union all
    select
      1,'high'::text,'proposal_draft'::text,d.lead_id,
      coalesce(nullif(d.company,''),nullif(d.name,''),'Client proposal'),
      concat_ws(' · ','Proposal draft not sent',nullif(d.role_title,'')),
      d.created_at,
      ('/workspace/recruiter/crm/'||d.lead_id::text||'/proposal')::text,
      null::text,
      jsonb_build_object('lead_id',d.lead_id,'proposal_id',d.proposal_id,'role_title',d.role_title),
      abs(extract(epoch from(now()-d.created_at)))
    from latest_draft_proposals d

    union all
    select
      2,'normal'::text,'vetting'::text,vv.va_id,
      coalesce(nullif(p.full_name,''),'VA candidate'),
      'Recruiter review waiting'::text,
      vv.updated_at,
      ('/workspace/recruiter/candidates/'||vv.va_id)::text,
      null::text,
      jsonb_build_object('va_id',vv.va_id),
      abs(extract(epoch from(now()-vv.updated_at)))
    from public.va_vetting vv
    left join public.profiles p on p.id=vv.va_id
    where vv.stage='recruiter_review'
      and vv.recruiter_id=p_user_id
      and vv.updated_at>=now()-interval '14 days'

    union all
    select
      case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,
      q.priority,
      q.action_type,
      q.subject_id,
      q.title,
      q.description,
      now()-(q.age_hours||' hours')::interval,
      case
        when q.subject_type='job' then '/workspace/recruiter/roles/'||q.subject_id
        when q.subject_type='va' then '/workspace/recruiter/candidates/'||q.subject_id
        when q.subject_type='lead' then '/workspace/recruiter/crm/'||q.subject_id
        else q.href
      end,
      null::text,
      jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),
      (q.age_hours*3600)::numeric
    from public.recruiter_daily_action_queue(p_user_id) q
    where not(q.action_type='client_shortlist_waiting' and q.age_hours>=120)
  ),
  deduped as (
    select distinct on(kind,id) *
    from items
    order by kind,id,priority_rank asc,sort_distance asc
  ),
  ranked as (
    select *
    from deduped
    order by priority_rank asc,sort_distance asc,title asc
    limit greatest(coalesce(p_limit,20),1)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'priority',priority,
        'kind',kind,
        'id',id,
        'title',title,
        'subtitle',subtitle,
        'due_at',due_at,
        'href',href,
        'action_url',action_url,
        'metadata',metadata
      )
      order by priority_rank asc,sort_distance asc,title asc
    ),
    '[]'::jsonb
  )
  from ranked;
$function$;

revoke execute on function public.recruiter_today_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;
