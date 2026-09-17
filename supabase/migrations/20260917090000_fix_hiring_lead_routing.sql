-- Keep public hiring enquiries in the recruiter CRM regardless of which
-- hiring landing page created them, and ensure the recruiter work queue links
-- to the exact lead instead of a generic filtered list.

create or replace function public.classify_lead_type()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.source_page in ('content_role_brief','public_role_brief','service_match_request','industry_match_request','blog_match_request') then
    new.lead_type := 'client_hiring';
  elsif new.lead_type is null
     or (tg_op='UPDATE' and (new.source_page is distinct from old.source_page or new.service is distinct from old.service) and new.lead_type=old.lead_type) then
    new.lead_type := case
      when lower(coalesce(new.service,'')) like '%virtual assistant account%' then 'va_support'
      when lower(coalesce(new.service,'')) like '%privacy%' or lower(coalesce(new.service,'')) like '%data request%' then 'privacy'
      when lower(coalesce(new.service,'')) like '%client account support%' then 'client_support'
      else 'general'
    end;
  end if;
  return new;
end;
$function$;

create or replace function public.assign_lead_owner()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (
      new.lead_type='client_hiring'
      or new.source_page in ('content_role_brief','public_role_brief','service_match_request','industry_match_request','blog_match_request')
    )
    and new.owner_id is null
    and coalesce(new.crm_stage,'new') not in ('won','lost') then
    new.owner_id := public.default_recruiter_id();
  end if;
  return new;
end;
$function$;

-- Repair any historical hiring-page rows that were left as general/unowned.
update public.lead_intake l
set lead_type='client_hiring',
    owner_id=coalesce(l.owner_id, j.recruiter_id, public.default_recruiter_id())
from public.jobs j
where l.job_id=j.id
  and l.source_page in ('service_match_request','industry_match_request','blog_match_request','content_role_brief','public_role_brief')
  and (l.lead_type is distinct from 'client_hiring' or l.owner_id is null);

create or replace function public.recruiter_leads_page(
  p_view text default 'recent'::text,
  p_query text default null::text,
  p_owner_id uuid default null::uuid,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  with params as (
    select case when lower(coalesce(nullif(btrim(p_view),''),'recent')) in ('recent','attention','open','discovery','qualified','nurture','won','lost','all') then lower(coalesce(nullif(btrim(p_view),''),'recent')) else 'recent' end view_name,
      nullif(btrim(p_query),'') search_query,greatest(coalesce(p_page,1),1) page_number,least(greatest(coalesce(p_page_size,25),1),50) page_size
  ),filtered as materialized (
    select l.*,
      case when coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null and l.created_at<now()-interval '30 minutes' then 0
        when l.next_follow_up_at is not null and l.next_follow_up_at<now() and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') then 1
        when coalesce(l.crm_stage,'new')='new' then 2
        when l.next_follow_up_at is not null and l.next_follow_up_at<=now()+interval '24 hours' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') then 3 else 4 end priority
    from lead_intake l cross join params p
    where l.lead_type='client_hiring' and (
      (p.view_name='recent' and coalesce(l.crm_stage,'new') not in ('won','lost'))
      or p.view_name='all'
      or (p.view_name='attention' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') and (coalesce(l.crm_stage,'new')='new' or (l.next_follow_up_at is not null and l.next_follow_up_at<=now()+interval '24 hours')))
      or (p.view_name='open' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent'))
      or (p.view_name='discovery' and coalesce(l.crm_stage,'new')='discovery_booked')
      or (p.view_name='qualified' and coalesce(l.crm_stage,'new') in ('qualified','shortlist_sent'))
      or (p.view_name='nurture' and coalesce(l.crm_stage,'new')='nurture')
      or (p.view_name='won' and coalesce(l.crm_stage,'new')='won')
      or (p.view_name='lost' and coalesce(l.crm_stage,'new')='lost'))
      and (p_owner_id is null or l.owner_id=p_owner_id)
      and (p.search_query is null or concat_ws(' ',l.id::text,l.name,l.email,l.company,l.service,l.message) ilike('%'||p.search_query||'%'))
  ),paged as (
    select f.*,row_number() over(order by case when p.view_name='recent' then 0 else f.priority end asc,f.created_at desc,f.id desc) sort_index
    from filtered f cross join params p
    order by case when p.view_name='recent' then 0 else f.priority end asc,f.created_at desc,f.id desc
    offset ((select page_number-1 from params)*(select page_size from params)) limit (select page_size from params)
  ),enriched as (
    select ((to_jsonb(pg)-'priority'-'sort_index')||jsonb_build_object('latest_activity',case when la.id is null then null else to_jsonb(la) end,'contact_count',coalesce(ac.contact_count,0),'latest_proposal',case when lp.id is null then null else to_jsonb(lp) end)) row_data,pg.sort_index
    from paged pg
    left join lateral(select a.id,a.subject_id,a.action,a.description,a.created_at from recruiter_activity a where a.subject_type='lead' and a.subject_id=pg.id and (a.action like 'client_contact_%' or a.action='client_followup_sent' or a.action like 'proposal_%') order by a.created_at desc limit 1) la on true
    left join lateral(select count(*)::int contact_count from recruiter_activity a where a.subject_type='lead' and a.subject_id=pg.id and (a.action like 'client_contact_%' or a.action='client_followup_sent' or a.action like 'proposal_%')) ac on true
    left join lateral(select pr.id,pr.lead_id,pr.public_token,pr.status,pr.role_title,pr.service_model,pr.placement_fee,pr.managed_markup_percent,pr.estimated_monthly_total,pr.expires_at,pr.sent_at,pr.viewed_at,pr.changes_requested_at,pr.accepted_at,pr.declined_at,pr.decline_reason,pr.created_at from lead_proposals pr where pr.lead_id=pg.id order by pr.created_at desc limit 1) lp on true
  ),metrics as (
    select count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new')='new' and first_contact_at is null)::int needs_first_contact,
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') and next_follow_up_at is not null and next_follow_up_at<=now())::int followups_due,
      count(*) filter(where lead_type='client_hiring' and discovery_scheduled_at is not null and discovery_completed_at is null and discovery_scheduled_at>=now()-interval '2 hours')::int discovery_booked,
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('qualified','shortlist_sent'))::int qualified,
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new')='won' and won_at is not null and won_at>=date_trunc('month',now()))::int won_this_month,
      coalesce(sum(estimated_value_usd) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')),0)::numeric open_pipeline_value
    from lead_intake
  )
  select jsonb_build_object('metrics',jsonb_build_object('needs_first_contact',m.needs_first_contact,'followups_due',m.followups_due,'discovery_booked',m.discovery_booked,'qualified',m.qualified,'won_this_month',m.won_this_month,'open_pipeline_value',m.open_pipeline_value),'total',(select count(*)::int from filtered),'page',(select page_number from params),'page_size',(select page_size from params),'leads',coalesce((select jsonb_agg(e.row_data order by e.sort_index) from enriched e),'[]'::jsonb)) from metrics m;
$function$;

create or replace function public.recruiter_today_queue(p_user_id uuid, p_limit integer default 20)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  with items(priority_rank,priority,kind,id,title,subtitle,due_at,href,action_url,metadata,sort_distance) as (
    select case when t.due_at is not null and t.due_at<=now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end,t.priority,'task'::text,t.id,t.title,coalesce(nullif(t.description,''),'Recruiter task'),t.due_at,coalesce(t.href,'/workspace/recruiter/tasks'),null::text,jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id),abs(extract(epoch from(coalesce(t.due_at,now())-now()))) from recruiter_tasks t where t.assignee_id=p_user_id and t.status='todo' and (t.snoozed_until is null or t.snoozed_until<=now()) and (t.due_at is null or t.due_at between now()-interval '14 days' and now()+interval '1 day')
    union all select 0,'urgent'::text,'lead_first_contact'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),l.created_at,('/workspace/recruiter/leads?view=all&q='||l.id::text)::text,null::text,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),abs(extract(epoch from(now()-l.created_at))) from lead_intake l where coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null and l.created_at>=now()-interval '14 days' and l.owner_id=p_user_id and l.lead_type='client_hiring'
    union all select 0,'urgent'::text,'lead_followup'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),l.next_follow_up_at,('/workspace/recruiter/leads?view=all&q='||l.id::text)::text,null::text,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),abs(extract(epoch from(now()-l.next_follow_up_at))) from lead_intake l where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') and l.next_follow_up_at between now()-interval '7 days' and now() and not(coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null) and l.owner_id=p_user_id and l.lead_type='client_hiring'
    union all select 1,'high'::text,'discovery'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,'')),l.discovery_scheduled_at,('/workspace/recruiter/leads?view=all&q='||l.id::text)::text,l.discovery_meeting_url,jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),abs(extract(epoch from(l.discovery_scheduled_at-now()))) from lead_intake l where l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null and l.discovery_scheduled_at>=now()-interval '1 hour' and l.discovery_scheduled_at<=now()+interval '48 hours' and l.owner_id=p_user_id and l.lead_type='client_hiring'
    union all select 2,'normal'::text,'vetting'::text,vv.va_id,coalesce(nullif(p.full_name,''),'VA candidate'),'Recruiter review waiting'::text,vv.updated_at,('/workspace/recruiter/candidates/'||vv.va_id)::text,null::text,jsonb_build_object('va_id',vv.va_id),abs(extract(epoch from(now()-vv.updated_at))) from va_vetting vv left join profiles p on p.id=vv.va_id where vv.stage='recruiter_review' and vv.recruiter_id=p_user_id and vv.updated_at>=now()-interval '14 days'
    union all select case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,q.priority,q.action_type,q.subject_id,q.title,q.description,now()-(q.age_hours||' hours')::interval,case when q.subject_type='job' then '/workspace/recruiter/matching/'||q.subject_id when q.subject_type='va' then '/workspace/recruiter/candidates/'||q.subject_id when q.subject_type='lead' then '/workspace/recruiter/leads?view=all&q='||q.subject_id else q.href end,null::text,jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),(q.age_hours*3600)::numeric from recruiter_daily_action_queue(p_user_id) q where not(q.action_type='client_shortlist_waiting' and q.age_hours>=120)
  ),deduped as(select distinct on(kind,id) * from items order by kind,id,priority_rank asc,sort_distance asc),ranked as(select * from deduped order by priority_rank asc,sort_distance asc,title asc limit greatest(coalesce(p_limit,20),1))
  select coalesce(jsonb_agg(jsonb_build_object('priority',priority,'kind',kind,'id',id,'title',title,'subtitle',subtitle,'due_at',due_at,'href',href,'action_url',action_url,'metadata',metadata) order by priority_rank asc,sort_distance asc,title asc),'[]'::jsonb) from ranked;
$function$;
