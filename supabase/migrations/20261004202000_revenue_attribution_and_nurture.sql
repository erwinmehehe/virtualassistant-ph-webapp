-- Revenue attribution and email-only long-term nurture automation.

alter table public.payments
  add column if not exists lead_id uuid references public.lead_intake(id) on delete set null,
  add column if not exists attribution_snapshot jsonb;

create index if not exists payments_lead_paid_idx
  on public.payments (lead_id, paid_at desc)
  where status in ('paid','release_pending','released');

create or replace function public.payments_attach_lead_attribution()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_lead_id uuid;
  v_attribution jsonb;
begin
  if tg_op = 'UPDATE' and old.lead_id is not null then
    new.lead_id := old.lead_id;
  elsif new.lead_id is null and new.job_id is not null then
    select j.lead_id into v_lead_id
    from public.jobs j
    where j.id = new.job_id;
    new.lead_id := v_lead_id;
  end if;

  if tg_op = 'UPDATE' and old.attribution_snapshot is not null then
    new.attribution_snapshot := old.attribution_snapshot;
  elsif new.attribution_snapshot is null and new.lead_id is not null then
    select l.attribution into v_attribution
    from public.lead_intake l
    where l.id = new.lead_id;
    new.attribution_snapshot := coalesce(v_attribution, '{}'::jsonb);
  end if;

  return new;
end;
$function$;

drop trigger if exists payments_attach_lead_attribution_trigger on public.payments;
create trigger payments_attach_lead_attribution_trigger
before insert or update of job_id, lead_id, attribution_snapshot
on public.payments
for each row
execute function public.payments_attach_lead_attribution();

update public.payments p
set
  lead_id = coalesce(p.lead_id, j.lead_id),
  attribution_snapshot = coalesce(p.attribution_snapshot, l.attribution, '{}'::jsonb)
from public.jobs j
left join public.lead_intake l on l.id = j.lead_id
where p.job_id = j.id
  and (p.lead_id is null or p.attribution_snapshot is null);

create or replace function public.preserve_lead_first_touch_attribution()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  k text;
  preserved jsonb := coalesce(new.attribution, '{}'::jsonb);
begin
  if old.attribution is null then
    return new;
  end if;

  foreach k in array array[
    'first_touch_source',
    'first_touch_medium',
    'first_touch_campaign',
    'first_touch_landing_page',
    'first_touch_at'
  ] loop
    if old.attribution ? k and nullif(old.attribution ->> k, '') is not null then
      preserved := jsonb_set(preserved, array[k], old.attribution -> k, true);
    end if;
  end loop;

  new.attribution := preserved;
  return new;
end;
$function$;

drop trigger if exists preserve_lead_first_touch_attribution_trigger on public.lead_intake;
create trigger preserve_lead_first_touch_attribution_trigger
before update of attribution
on public.lead_intake
for each row
execute function public.preserve_lead_first_touch_attribution();

create table if not exists public.lead_nurture_state (
  lead_id uuid primary key references public.lead_intake(id) on delete cascade,
  sequence text not null check (sequence in ('nurture','winback')),
  status text not null default 'active' check (status in ('active','paused','unsubscribed','completed')),
  step integer not null default 0 check (step >= 0 and step <= 3),
  next_send_at timestamptz,
  last_sent_at timestamptz,
  last_event text,
  paused_reason text,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_nurture_due_idx
  on public.lead_nurture_state (next_send_at asc)
  where status = 'active' and next_send_at is not null;

create unique index if not exists recruiter_tasks_open_nurture_review_unique
  on public.recruiter_tasks (subject_id, title)
  where subject_type = 'lead' and status = 'todo' and title = 'Review nurtured lead';

alter table public.lead_nurture_state enable row level security;
revoke all on table public.lead_nurture_state from public, anon, authenticated;
grant select, insert, update, delete on table public.lead_nurture_state to service_role;

drop policy if exists "deny browser access to lead nurture state" on public.lead_nurture_state;
create policy "deny browser access to lead nurture state"
  on public.lead_nurture_state
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

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
      l.crm_stage,
      l.won_at,
      l.discovery_scheduled_at,
      l.discovery_completed_at,
      l.estimated_value_usd,
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
      and l.status <> 'spam'
      and l.created_at >= p.cutoff
      and (p_recruiter_id is null or l.owner_id = p_recruiter_id)
  ),
  grouped as (
    select
      source,
      medium,
      campaign,
      count(*)::int as leads,
      count(*) filter (
        where crm_stage in ('qualified','terms_sent','shortlist_sent','won') or won_at is not null
      )::int as qualified,
      count(*) filter (where discovery_scheduled_at is not null)::int as discovery_booked,
      count(*) filter (where discovery_completed_at is not null)::int as discovery_completed,
      count(*) filter (where proposals > 0)::int as proposal_leads,
      sum(proposals)::int as proposals,
      count(*) filter (where accepted > 0)::int as proposal_accepted,
      count(*) filter (where crm_stage = 'won' or won_at is not null)::int as customers,
      coalesce(sum(coalesce(estimated_value_usd,0)),0)::numeric as pipeline_value_usd,
      coalesce(sum(case when crm_stage = 'won' or won_at is not null then coalesce(estimated_value_usd,0) else 0 end),0)::numeric as won_value_usd,
      coalesce(sum(collected_revenue_usd),0)::numeric as collected_revenue_usd,
      sum(paid_payments)::int as paid_payments
    from cohort
    group by source,medium,campaign
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'source',source,
      'medium',medium,
      'campaign',campaign,
      'leads',leads,
      'qualified',qualified,
      'discovery_booked',discovery_booked,
      'discovery_completed',discovery_completed,
      'proposal_leads',proposal_leads,
      'proposals',proposals,
      'proposal_accepted',proposal_accepted,
      'customers',customers,
      'pipeline_value_usd',pipeline_value_usd,
      'won_value_usd',won_value_usd,
      'collected_revenue_usd',collected_revenue_usd,
      'paid_payments',paid_payments,
      'revenue_per_lead_usd',case when leads > 0 then round(collected_revenue_usd / leads,2) else 0 end
    )
    order by collected_revenue_usd desc, customers desc, won_value_usd desc, leads desc, source asc
  ),'[]'::jsonb)
  from grouped
$function$;

revoke all on function public.agency_revenue_attribution_metrics(integer,uuid,text) from public, anon, authenticated;
grant execute on function public.agency_revenue_attribution_metrics(integer,uuid,text) to service_role;

comment on function public.agency_revenue_attribution_metrics(integer,uuid,text)
is 'Service-role-only first- or last-touch attribution through lead, proposal, customer, and collected payment revenue.';
