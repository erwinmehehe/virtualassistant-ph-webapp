CREATE OR REPLACE FUNCTION public.recruiter_leads_page(p_view text DEFAULT 'recent'::text, p_query text DEFAULT NULL::text, p_owner_id uuid DEFAULT NULL::uuid, p_page integer DEFAULT 1, p_page_size integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with params as (
    select case when lower(coalesce(nullif(btrim(p_view),''),'recent')) in ('recent','attention','open','discovery','qualified','nurture','won','lost','all') then lower(coalesce(nullif(btrim(p_view),''),'recent')) else 'recent' end view_name,
      nullif(btrim(p_query),'') search_query,greatest(coalesce(p_page,1),1) page_number,least(greatest(coalesce(p_page_size,25),1),50) page_size
  ),filtered as materialized (
    select l.*,
      case when coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null and l.created_at<now()-interval '30 minutes' then 0
        when l.next_follow_up_at is not null and l.next_follow_up_at<now() and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture') then 1
        when coalesce(l.crm_stage,'new')='new' then 2
        when l.next_follow_up_at is not null and l.next_follow_up_at<=now()+interval '24 hours' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture') then 3 else 4 end priority
    from lead_intake l cross join params p
    where l.lead_type='client_hiring' and (
      (p.view_name='recent' and coalesce(l.crm_stage,'new') not in ('won','lost'))
      or p.view_name='all'
      or (p.view_name='attention' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture') and (coalesce(l.crm_stage,'new')='new' or (l.next_follow_up_at is not null and l.next_follow_up_at<=now()+interval '24 hours')))
      or (p.view_name='open' and coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent'))
      or (p.view_name='discovery' and coalesce(l.crm_stage,'new')='discovery_booked')
      or (p.view_name='qualified' and coalesce(l.crm_stage,'new') in ('qualified','terms_sent','shortlist_sent'))
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
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture') and next_follow_up_at is not null and next_follow_up_at<=now())::int followups_due,
      count(*) filter(where lead_type='client_hiring' and discovery_scheduled_at is not null and discovery_completed_at is null and discovery_scheduled_at>=now()-interval '2 hours')::int discovery_booked,
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('qualified','terms_sent','shortlist_sent'))::int qualified,
      count(*) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new')='won' and won_at is not null and won_at>=date_trunc('month',now()))::int won_this_month,
      coalesce(sum(estimated_value_usd) filter(where lead_type='client_hiring' and coalesce(crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture')),0)::numeric open_pipeline_value
    from lead_intake
  )
  select jsonb_build_object('metrics',jsonb_build_object('needs_first_contact',m.needs_first_contact,'followups_due',m.followups_due,'discovery_booked',m.discovery_booked,'qualified',m.qualified,'won_this_month',m.won_this_month,'open_pipeline_value',m.open_pipeline_value),'total',(select count(*)::int from filtered),'page',(select page_number from params),'page_size',(select page_size from params),'leads',coalesce((select jsonb_agg(e.row_data order by e.sort_index) from enriched e),'[]'::jsonb)) from metrics m;
$function$


revoke execute on function public.recruiter_leads_page(text,text,uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.recruiter_leads_page(text,text,uuid,integer,integer) to service_role;
