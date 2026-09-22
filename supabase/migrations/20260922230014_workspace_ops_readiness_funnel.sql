create or replace function public.work_readiness_queue(
  p_actor_id uuid,
  p_limit integer default 200
)
returns jsonb
language sql
stable
security invoker
set search_path = 'pg_catalog', 'public'
as $function$
with actor as (
  select 1
  from public.profiles p
  where p.id = p_actor_id
    and p.account_status = 'active'
    and p.role::text in ('recruiter','admin')
),
rows as (
  select
    v.user_id,
    p.full_name,
    p.avatar_url,
    v.work_setup_computer,
    v.work_setup_os,
    v.work_setup_ram_gb,
    v.primary_internet,
    v.backup_internet,
    v.backup_power,
    v.headset_ready,
    v.webcam_ready,
    v.quiet_workspace,
    v.work_setup_submitted_at,
    v.work_setup_verified_at,
    v.work_setup_verification_notes
  from public.va_profiles v
  join public.profiles p on p.id = v.user_id
  cross join actor
  where v.work_setup_submitted_at is not null
    and p.account_status = 'active'
  order by v.work_setup_submitted_at asc
  limit least(greatest(coalesce(p_limit,200),1),500)
)
select jsonb_build_object(
  'rows',
  coalesce((select jsonb_agg(to_jsonb(r) order by r.work_setup_submitted_at asc) from rows r),'[]'::jsonb)
);
$function$;

revoke all on function public.work_readiness_queue(uuid,integer) from public;
revoke all on function public.work_readiness_queue(uuid,integer) from anon;
revoke all on function public.work_readiness_queue(uuid,integer) from authenticated;
grant execute on function public.work_readiness_queue(uuid,integer) to service_role;

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
    l.id,l.crm_stage,l.discovery_scheduled_at,l.discovery_completed_at,l.won_at,l.job_id,l.created_at
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
      where lp.lead_id=s.id and lp.status in ('sent','changes_requested','accepted')
    ) as has_proposal,
    exists(
      select 1 from public.lead_proposals lp
      where lp.lead_id=s.id and (lp.status='accepted' or lp.accepted_at is not null)
    ) as has_accepted_proposal,
    exists(
      select 1 from public.jobs j
      where (j.lead_id=s.id or j.id=s.job_id) and j.published_at is not null
    ) as has_active_job_order
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
    ) as is_qualified
  from sales_progress sp
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
  'sales',jsonb_build_object(
    'leads',s.leads,
    'calls_booked',s.calls_booked,
    'discovery_completed',s.discovery_completed,
    'qualified',s.qualified,
    'proposals',s.proposals,
    'clients_won',s.clients_won,
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
$function$;

revoke all on function public.agency_funnel_metrics(integer,uuid) from public;
revoke all on function public.agency_funnel_metrics(integer,uuid) from anon;
revoke all on function public.agency_funnel_metrics(integer,uuid) from authenticated;
grant execute on function public.agency_funnel_metrics(integer,uuid) to service_role;
