-- Treat historically closed spam/duplicates as junk rather than legitimate opportunities.
create or replace function public.agency_revenue_attribution_metrics(
  p_days integer default 90,
  p_recruiter_id uuid default null,
  p_model text default 'first_touch'
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  with params as (
    select
      least(greatest(coalesce(p_days,90),30),365)::int as days,
      now() - make_interval(days => least(greatest(coalesce(p_days,90),30),365)) as cutoff,
      case when p_model = 'last_touch' then 'last_touch' else 'first_touch' end as model
  ),
  proposal_by_lead as (
    select
      lp.lead_id,
      count(*) filter (where lp.sent_at is not null or lp.status in ('sent','accepted','declined','changes_requested'))::int as proposals,
      count(*) filter (where lp.status = 'accepted' or lp.accepted_at is not null)::int as accepted
    from public.lead_proposals lp
    group by lp.lead_id
  ),
  payment_by_lead as (
    select
      coalesce(p.lead_id,j.lead_id) as lead_id,
      count(*) filter (where p.status in ('paid','release_pending','released'))::int as paid_payments,
      coalesce(sum(p.amount_total) filter (where p.status in ('paid','release_pending','released')),0)::numeric as collected_revenue_usd
    from public.payments p
    left join public.jobs j on j.id = p.job_id
    where coalesce(p.lead_id,j.lead_id) is not null
    group by coalesce(p.lead_id,j.lead_id)
  ),
  cohort as (
    select
      l.id,
      l.status,
      l.crm_stage,
      l.won_at,
      l.discovery_scheduled_at,
      l.discovery_completed_at,
      l.estimated_value_usd,
      l.lost_reason_code,
      (
        l.status = 'spam'
        or l.lost_reason_code in ('spam','duplicate')
      ) as is_junk,
      coalesce(pb.proposals,0) as proposals,
      coalesce(pb.accepted,0) as accepted,
      coalesce(pay.paid_payments,0) as paid_payments,
      coalesce(pay.collected_revenue_usd,0) as collected_revenue_usd,
      case when p.model = 'last_touch'
        then coalesce(
          nullif(l.attribution ->> 'last_touch_source',''),
          nullif(l.attribution ->> 'utm_source',''),
          nullif(l.attribution ->> 'referrer_host',''),
          nullif(l.source_page,''),
          'direct'
        )
        else coalesce(
          nullif(l.attribution ->> 'first_touch_source',''),
          nullif(l.attribution ->> 'utm_source',''),
          nullif(l.attribution ->> 'referrer_host',''),
          nullif(l.source_page,''),
          'direct'
        )
      end as source,
      case when p.model = 'last_touch'
        then coalesce(nullif(l.attribution ->> 'last_touch_medium',''),nullif(l.attribution ->> 'utm_medium',''))
        else coalesce(nullif(l.attribution ->> 'first_touch_medium',''),nullif(l.attribution ->> 'utm_medium',''))
      end as medium,
      case when p.model = 'last_touch'
        then coalesce(nullif(l.attribution ->> 'last_touch_campaign',''),nullif(l.attribution ->> 'utm_campaign',''))
        else coalesce(nullif(l.attribution ->> 'first_touch_campaign',''),nullif(l.attribution ->> 'utm_campaign',''))
      end as campaign
    from public.lead_intake l
    cross join params p
    left join proposal_by_lead pb on pb.lead_id = l.id
    left join payment_by_lead pay on pay.lead_id = l.id
    where l.lead_type = 'client_hiring'
      and l.created_at >= p.cutoff
      and (p_recruiter_id is null or l.owner_id = p_recruiter_id)
  ),
  grouped as (
    select
      source,
      medium,
      campaign,
      count(*)::int as total_inquiries,
      count(*) filter (where not is_junk)::int as leads,
      count(*) filter (where status='spam' or lost_reason_code='spam')::int as spam_leads,
      count(*) filter (where is_junk)::int as junk_leads,
      count(*) filter (
        where not is_junk
          and (crm_stage in ('qualified','terms_sent','shortlist_sent','won') or won_at is not null)
      )::int as qualified,
      count(*) filter (where not is_junk and discovery_scheduled_at is not null)::int as discovery_booked,
      count(*) filter (where not is_junk and discovery_completed_at is not null)::int as discovery_completed,
      count(*) filter (where not is_junk and proposals > 0)::int as proposal_leads,
      coalesce(sum(proposals) filter (where not is_junk),0)::int as proposals,
      count(*) filter (where not is_junk and accepted > 0)::int as proposal_accepted,
      count(*) filter (where not is_junk and (crm_stage = 'won' or won_at is not null))::int as customers,
      count(*) filter (where not is_junk and crm_stage = 'lost')::int as lost_leads,
      coalesce(sum(
        case when not is_junk and crm_stage not in ('won','lost')
          then coalesce(estimated_value_usd,0) else 0 end
      ),0)::numeric as open_pipeline_value_usd,
      coalesce(sum(case when not is_junk then coalesce(estimated_value_usd,0) else 0 end),0)::numeric as pipeline_value_usd,
      coalesce(sum(
        case when not is_junk and (crm_stage='won' or won_at is not null)
          then coalesce(estimated_value_usd,0) else 0 end
      ),0)::numeric as won_value_usd,
      coalesce(sum(case when not is_junk then collected_revenue_usd else 0 end),0)::numeric as collected_revenue_usd,
      coalesce(sum(paid_payments) filter (where not is_junk),0)::int as paid_payments
    from cohort
    group by source,medium,campaign
  ),
  loss_counts as (
    select source,medium,campaign,coalesce(lost_reason_code,'other') as reason_code,count(*)::int as n
    from cohort
    where not is_junk and crm_stage='lost'
    group by source,medium,campaign,coalesce(lost_reason_code,'other')
  ),
  ranked_losses as (
    select source,medium,campaign,reason_code,n,
      row_number() over(partition by source,medium,campaign order by n desc,reason_code asc) as rn
    from loss_counts
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'source',g.source,
      'medium',g.medium,
      'campaign',g.campaign,
      'total_inquiries',g.total_inquiries,
      'leads',g.leads,
      'spam_leads',g.spam_leads,
      'junk_leads',g.junk_leads,
      'spam_rate',case when g.total_inquiries>0 then round((g.spam_leads::numeric/g.total_inquiries)*100,1) else 0 end,
      'junk_rate',case when g.total_inquiries>0 then round((g.junk_leads::numeric/g.total_inquiries)*100,1) else 0 end,
      'qualified',g.qualified,
      'discovery_booked',g.discovery_booked,
      'discovery_completed',g.discovery_completed,
      'proposal_leads',g.proposal_leads,
      'proposals',g.proposals,
      'proposal_accepted',g.proposal_accepted,
      'proposal_acceptance_rate',case when g.proposal_leads>0 then round((g.proposal_accepted::numeric/g.proposal_leads)*100,1) else 0 end,
      'customers',g.customers,
      'lost_leads',g.lost_leads,
      'top_loss_reason_code',rl.reason_code,
      'open_pipeline_value_usd',g.open_pipeline_value_usd,
      'pipeline_value_usd',g.pipeline_value_usd,
      'won_value_usd',g.won_value_usd,
      'avg_customer_value_usd',case when g.customers>0 then round(g.won_value_usd/g.customers,2) else 0 end,
      'collected_revenue_usd',g.collected_revenue_usd,
      'collected_revenue_per_customer_usd',case when g.customers>0 then round(g.collected_revenue_usd/g.customers,2) else 0 end,
      'paid_payments',g.paid_payments,
      'revenue_per_lead_usd',case when g.leads>0 then round(g.collected_revenue_usd/g.leads,2) else 0 end
    )
    order by g.collected_revenue_usd desc,g.customers desc,g.won_value_usd desc,g.leads desc,g.source asc
  ),'[]'::jsonb)
  from grouped g
  left join ranked_losses rl
    on rl.source is not distinct from g.source
   and rl.medium is not distinct from g.medium
   and rl.campaign is not distinct from g.campaign
   and rl.rn=1
$function$;

revoke all on function public.agency_revenue_attribution_metrics(integer,uuid,text) from public, anon, authenticated;
grant execute on function public.agency_revenue_attribution_metrics(integer,uuid,text) to service_role;

comment on function public.agency_revenue_attribution_metrics(integer,uuid,text)
is 'Service-role-only source-quality attribution. Spam/duplicates are reported as junk but excluded from legitimate lead and conversion denominators.';
