-- Conversion safety + attribution hardening.
-- Keeps proposal state transitions atomic, removes paginated Auth email lookup,
-- and stores first-party attribution on client hiring leads.

alter table public.lead_intake
  add column if not exists attribution jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lead_intake'::regclass
      and conname = 'lead_intake_attribution_object_check'
  ) then
    alter table public.lead_intake
      add constraint lead_intake_attribution_object_check
      check (jsonb_typeof(attribution) = 'object');
  end if;
end $$;

create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select u.id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  order by u.created_at asc
  limit 1
$function$;

revoke all on function public.find_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;

comment on function public.find_auth_user_id_by_email(text)
is 'Service-role-only exact Auth identity lookup used by accepted client handoff. Avoids paginated Auth enumeration.';

create or replace function public.respond_to_lead_proposal_atomic(
  p_token uuid,
  p_decision text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_proposal public.lead_proposals%rowtype;
  v_lead public.lead_intake%rowtype;
  v_now timestamptz := clock_timestamp();
  v_reason text := left(btrim(coalesce(p_reason, '')), 2000);
  v_changes boolean := p_decision = 'changes';
begin
  if p_token is null or p_decision not in ('changes', 'decline') or char_length(v_reason) < 5 then
    return jsonb_build_object('ok', false, 'code', 'invalid_response');
  end if;

  select *
  into v_proposal
  from public.lead_proposals
  where public_token = p_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'proposal_not_found');
  end if;

  if (v_proposal.status = 'changes_requested' and v_changes)
     or (v_proposal.status = 'declined' and not v_changes) then
    return jsonb_build_object(
      'ok', true,
      'code', 'already_responded',
      'already_responded', true,
      'proposal_id', v_proposal.id,
      'lead_id', v_proposal.lead_id,
      'decision', p_decision
    );
  end if;

  if v_proposal.status <> 'sent' then
    return jsonb_build_object('ok', false, 'code', 'proposal_unavailable');
  end if;

  if v_proposal.expires_at is not null and v_proposal.expires_at < v_now then
    update public.lead_proposals
      set status = 'expired', updated_at = v_now
    where id = v_proposal.id;
    return jsonb_build_object('ok', false, 'code', 'proposal_expired');
  end if;

  select *
  into v_lead
  from public.lead_intake
  where id = v_proposal.lead_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'lead_not_found');
  end if;

  if v_changes then
    update public.lead_proposals
    set
      status = 'changes_requested',
      changes_requested_at = v_now,
      declined_at = null,
      decline_reason = v_reason,
      updated_at = v_now
    where id = v_proposal.id;

    update public.lead_intake
    set
      crm_stage = 'qualified',
      status = 'converted',
      next_follow_up_at = null,
      stage_updated_at = v_now,
      lost_at = null,
      lost_reason = null
    where id = v_lead.id;

    insert into public.recruiter_activity (
      subject_type, subject_id, action, description, actor_id, metadata
    ) values (
      'lead',
      v_lead.id,
      'proposal_changes_requested',
      'Client requested proposal changes: ' || v_reason,
      null,
      jsonb_build_object('proposal_id', v_proposal.id, 'reason', v_reason, 'atomic', true)
    );
  else
    update public.lead_proposals
    set
      status = 'declined',
      changes_requested_at = null,
      declined_at = v_now,
      decline_reason = v_reason,
      updated_at = v_now
    where id = v_proposal.id;

    update public.lead_intake
    set
      crm_stage = 'lost',
      status = 'archived',
      next_follow_up_at = null,
      stage_updated_at = v_now,
      lost_at = v_now,
      lost_reason = v_reason
    where id = v_lead.id;

    insert into public.recruiter_activity (
      subject_type, subject_id, action, description, actor_id, metadata
    ) values (
      'lead',
      v_lead.id,
      'proposal_declined',
      'Client declined proposal: ' || v_reason,
      null,
      jsonb_build_object('proposal_id', v_proposal.id, 'reason', v_reason, 'atomic', true)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'responded',
    'already_responded', false,
    'proposal_id', v_proposal.id,
    'lead_id', v_lead.id,
    'decision', p_decision
  );
end;
$function$;

revoke all on function public.respond_to_lead_proposal_atomic(uuid, text, text) from public, anon, authenticated;
grant execute on function public.respond_to_lead_proposal_atomic(uuid, text, text) to service_role;

comment on function public.respond_to_lead_proposal_atomic(uuid, text, text)
is 'Atomically applies proposal change/decline responses and the matching lead CRM transition. Service-role only.';

create or replace function public.finalize_lead_proposal_send_atomic(
  p_proposal_id uuid,
  p_lead_id uuid,
  p_actor_id uuid,
  p_sent_at timestamptz,
  p_expires_at timestamptz,
  p_send_count integer,
  p_next_follow_up_at timestamptz,
  p_follow_up_timezone text,
  p_role_title text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_proposal public.lead_proposals%rowtype;
  v_lead public.lead_intake%rowtype;
  v_sent_at timestamptz := coalesce(p_sent_at, clock_timestamp());
  v_expires_at timestamptz := coalesce(p_expires_at, v_sent_at + interval '7 days');
  v_send_count integer := greatest(coalesce(p_send_count, 1), 1);
begin
  perform 1
  from public.profiles
  where id = p_actor_id
    and role in ('recruiter'::public.user_role, 'admin'::public.user_role)
    and account_status = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'code', 'actor_invalid');
  end if;

  select *
  into v_proposal
  from public.lead_proposals
  where id = p_proposal_id
    and lead_id = p_lead_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'proposal_not_found');
  end if;

  if v_proposal.status = 'sent' then
    return jsonb_build_object(
      'ok', true,
      'code', 'already_sent',
      'already_sent', true,
      'proposal_id', v_proposal.id,
      'lead_id', v_proposal.lead_id
    );
  end if;

  if v_proposal.status not in ('draft', 'changes_requested') then
    return jsonb_build_object('ok', false, 'code', 'proposal_unavailable');
  end if;

  select *
  into v_lead
  from public.lead_intake
  where id = p_lead_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'lead_not_found');
  end if;

  update public.lead_proposals
  set
    status = 'sent',
    sent_at = v_sent_at,
    viewed_at = null,
    expires_at = v_expires_at,
    send_count = greatest(coalesce(send_count, 0), v_send_count),
    updated_at = v_sent_at
  where id = v_proposal.id;

  update public.lead_intake
  set
    crm_stage = 'terms_sent',
    status = 'converted',
    owner_id = coalesce(owner_id, p_actor_id),
    next_follow_up_at = p_next_follow_up_at,
    stage_updated_at = v_sent_at,
    lost_at = null,
    lost_reason = null
  where id = v_lead.id;

  insert into public.recruiter_activity (
    subject_type, subject_id, action, description, actor_id, metadata
  ) values (
    'lead',
    v_lead.id,
    'proposal_sent',
    'Hiring recommendation sent for ' || coalesce(nullif(btrim(p_role_title), ''), 'client role'),
    p_actor_id,
    jsonb_build_object(
      'proposal_id', v_proposal.id,
      'send_count', v_send_count,
      'expires_at', v_expires_at,
      'next_follow_up_at', p_next_follow_up_at,
      'follow_up_timezone', nullif(btrim(coalesce(p_follow_up_timezone, '')), ''),
      'follow_up_mode', case
        when nullif(btrim(coalesce(p_follow_up_timezone, '')), '') is null then 'relative_48h'
        else 'client_local_9am'
      end,
      'atomic', true
    )
  );

  return jsonb_build_object(
    'ok', true,
    'code', 'sent',
    'already_sent', false,
    'proposal_id', v_proposal.id,
    'lead_id', v_lead.id
  );
end;
$function$;

revoke all on function public.finalize_lead_proposal_send_atomic(uuid, uuid, uuid, timestamptz, timestamptz, integer, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.finalize_lead_proposal_send_atomic(uuid, uuid, uuid, timestamptz, timestamptz, integer, timestamptz, text, text) to service_role;

comment on function public.finalize_lead_proposal_send_atomic(uuid, uuid, uuid, timestamptz, timestamptz, integer, timestamptz, text, text)
is 'Atomically marks a delivered proposal sent and advances its lead to terms_sent. Service-role only.';

create or replace function public.agency_attribution_metrics(
  p_days integer default 90,
  p_recruiter_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  with params as (
    select
      least(greatest(coalesce(p_days, 90), 30), 365)::int as days,
      now() - make_interval(days => least(greatest(coalesce(p_days, 90), 30), 365)) as cutoff
  ),
  cohort as (
    select
      l.id,
      l.crm_stage,
      l.won_at,
      l.estimated_value_usd,
      l.source_page,
      l.attribution,
      coalesce(
        nullif(l.attribution ->> 'utm_source', ''),
        nullif(l.attribution ->> 'referrer_host', ''),
        nullif(l.source_page, ''),
        'direct'
      ) as source,
      nullif(l.attribution ->> 'utm_campaign', '') as campaign
    from public.lead_intake l
    cross join params p
    where l.lead_type = 'client_hiring'
      and l.status <> 'spam'
      and l.created_at >= p.cutoff
      and (p_recruiter_id is null or l.owner_id = p_recruiter_id)
  ),
  grouped as (
    select
      source,
      campaign,
      count(*)::int as leads,
      count(*) filter (
        where crm_stage in ('qualified', 'terms_sent', 'won')
           or won_at is not null
      )::int as qualified,
      count(*) filter (
        where crm_stage = 'won' or won_at is not null
      )::int as customers,
      coalesce(sum(
        case when crm_stage = 'won' or won_at is not null
          then coalesce(estimated_value_usd, 0)
          else 0
        end
      ), 0)::numeric as won_value_usd
    from cohort
    group by source, campaign
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'source', source,
        'campaign', campaign,
        'leads', leads,
        'qualified', qualified,
        'customers', customers,
        'won_value_usd', won_value_usd
      )
      order by customers desc, won_value_usd desc, leads desc, source asc
    ),
    '[]'::jsonb
  )
  from grouped
$function$;

revoke all on function public.agency_attribution_metrics(integer, uuid) from public, anon, authenticated;
grant execute on function public.agency_attribution_metrics(integer, uuid) to service_role;

comment on function public.agency_attribution_metrics(integer, uuid)
is 'Service-role-only lead source to customer/value attribution summary for the hiring funnel.';
