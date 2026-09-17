-- Cohort-based agency funnel metrics.
-- Sales, recruiting, and retention use different source cohorts so stage ratios
-- do not pretend unrelated records belong to one linear funnel.

create or replace function public.agency_funnel_metrics(
  p_days integer default 90,
  p_recruiter_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
with params as (
  select
    least(greatest(coalesce(p_days,90),30),365)::int as days,
    now() - make_interval(days => least(greatest(coalesce(p_days,90),30),365)) as cutoff,
    current_date - least(greatest(coalesce(p_days,90),30),365) as cutoff_date
),
sales_cohort as materialized (
  select l.id,l.crm_stage,l.discovery_completed_at,l.job_id,l.created_at
  from lead_intake l cross join params p
  where l.lead_type='client_hiring'
    and l.created_at>=p.cutoff
    and (p_recruiter_id is null or l.owner_id=p_recruiter_id)
),
sales_progress as (
  select s.*,
    exists(
      select 1 from lead_proposals lp
      where lp.lead_id=s.id and lp.status in ('sent','changes_requested','accepted')
    ) as has_terms_evidence,
    exists(
      select 1 from jobs j
      where (j.lead_id=s.id or j.id=s.job_id)
        and j.published_at is not null
    ) as has_active_job_order
  from sales_cohort s
),
sales as (
  select
    count(*)::int leads,
    count(*) filter(where discovery_completed_at is not null)::int discovery_completed,
    count(*) filter(where crm_stage in ('qualified','terms_sent','won') or has_terms_evidence or has_active_job_order)::int qualified,
    count(*) filter(where has_active_job_order)::int active_job_orders
  from sales_progress
),
recruiting_cohort as materialized (
  select j.id,j.published_at
  from jobs j cross join params p
  where j.published_at is not null
    and j.published_at>=p.cutoff
    and (p_recruiter_id is null or j.recruiter_id=p_recruiter_id)
),
recruiting_progress as (
  select r.*,
    (select min(s.released_at) from job_shortlist_candidates s where s.job_id=r.id and s.shortlist_status='released' and s.released_at is not null) as first_shortlist_at,
    exists(select 1 from candidate_interviews ci where ci.job_id=r.id and ci.status<>'cancelled') as has_interview,
    exists(select 1 from placement_offers po where po.job_id=r.id and po.status<>'cancelled') as has_offer,
    exists(select 1 from workrooms w where w.job_id=r.id) as has_placement,
    (select min(w.start_date) from workrooms w where w.job_id=r.id and w.start_date is not null) as first_start_date
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
  from workrooms w
  join jobs j on j.id=w.job_id
  where w.start_date is not null
    and (p_recruiter_id is null or j.recruiter_id=p_recruiter_id)
),
retention as (
  select
    count(*) filter(where placement_stage<>'ended')::int active_placements,
    count(*) filter(
      where start_date+30 between (select cutoff_date from params) and current_date
    )::int eligible_30d,
    count(*) filter(
      where start_date+30 between (select cutoff_date from params) and current_date
        and (ended_at is null or ended_at::date>=start_date+30)
    )::int retained_30d,
    count(*) filter(
      where start_date+90 between (select cutoff_date from params) and current_date
    )::int eligible_90d,
    count(*) filter(
      where start_date+90 between (select cutoff_date from params) and current_date
        and (ended_at is null or ended_at::date>=start_date+90)
    )::int retained_90d
  from retention_base
)
select jsonb_build_object(
  'days',(select days from params),
  'sales',jsonb_build_object(
    'leads',s.leads,
    'discovery_completed',s.discovery_completed,
    'qualified',s.qualified,
    'active_job_orders',s.active_job_orders
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
from sales s cross join recruiting r cross join retention t;
$$;

revoke execute on function public.agency_funnel_metrics(integer,uuid) from public,anon,authenticated;
grant execute on function public.agency_funnel_metrics(integer,uuid) to service_role;
