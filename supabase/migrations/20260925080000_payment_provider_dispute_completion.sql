-- Complete provider-side payment safety: atomic webhook claims and explicit
-- dispute/chargeback lifecycle. Service-role-only functions keep financial
-- reconciliation serialized with row locks.

alter table public.payment_provider_events
  add column if not exists processing_started_at timestamptz;

alter table public.payments
  add column if not exists provider_dispute_id text,
  add column if not exists provider_dispute_status text,
  add column if not exists provider_dispute_previous_status text,
  add column if not exists provider_dispute_resolved_at timestamptz,
  add column if not exists provider_dispute_outcome text;

create unique index if not exists payments_provider_dispute_unique_idx
  on public.payments(provider_dispute_id)
  where provider_dispute_id is not null;

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (
  status in (
    'draft',
    'awaiting_payment',
    'checkout_pending',
    'paid',
    'disputed',
    'provider_disputed',
    'refund_pending',
    'release_pending',
    'released',
    'failed',
    'refunded',
    'chargeback',
    'void'
  )
);

create or replace function public.claim_payment_provider_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_provider_object_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table(event_row_id uuid, claim_state text)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_id uuid;
  v_processed_at timestamptz;
  v_processing_started_at timestamptz;
begin
  insert into public.payment_provider_events(
    provider,
    provider_event_id,
    event_type,
    livemode,
    provider_object_id,
    metadata,
    processing_started_at
  ) values (
    p_provider,
    p_provider_event_id,
    p_event_type,
    coalesce(p_livemode, false),
    p_provider_object_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict(provider, provider_event_id) do nothing
  returning id into v_id;

  if v_id is not null then
    return query select v_id, 'claimed'::text;
    return;
  end if;

  select id, processed_at, processing_started_at
  into v_id, v_processed_at, v_processing_started_at
  from public.payment_provider_events
  where provider = p_provider
    and provider_event_id = p_provider_event_id
  for update;

  if v_processed_at is not null then
    return query select v_id, 'processed'::text;
    return;
  end if;

  if v_processing_started_at is not null
     and v_processing_started_at > now() - interval '5 minutes' then
    return query select v_id, 'in_progress'::text;
    return;
  end if;

  update public.payment_provider_events
  set processing_started_at = now(),
      processing_error = null,
      event_type = p_event_type,
      livemode = coalesce(p_livemode, false),
      provider_object_id = coalesce(p_provider_object_id, provider_object_id),
      metadata = coalesce(p_metadata, metadata)
  where id = v_id;

  return query select v_id, 'claimed'::text;
end;
$$;

revoke all on function public.claim_payment_provider_event(text,text,text,boolean,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.claim_payment_provider_event(text,text,text,boolean,text,jsonb)
  to service_role;

create or replace function public.complete_payment_provider_event(
  p_event_row_id uuid,
  p_payment_id uuid default null,
  p_processing_error text default null,
  p_mark_processed boolean default true
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.payment_provider_events
  set payment_id = coalesce(p_payment_id, payment_id),
      processed_at = case when p_mark_processed then now() else null end,
      processing_started_at = null,
      processing_error = case
        when p_processing_error is null then null
        else left(p_processing_error, 1000)
      end
  where id = p_event_row_id;
end;
$$;

revoke all on function public.complete_payment_provider_event(uuid,uuid,text,boolean)
  from public, anon, authenticated;
grant execute on function public.complete_payment_provider_event(uuid,uuid,text,boolean)
  to service_role;

create or replace function public.open_payment_provider_dispute(
  p_payment_id uuid,
  p_provider_event_id text,
  p_provider_dispute_id text default null,
  p_provider_status text default 'under_review',
  p_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_from text;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then raise exception 'payment_not_found'; end if;

  if v_payment.status = 'chargeback' then
    return v_payment;
  end if;

  if v_payment.status not in (
    'paid','disputed','provider_disputed','refund_pending','released','refunded'
  ) then
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  v_from := v_payment.status;

  update public.payments
  set status = 'provider_disputed',
      provider_dispute_previous_status = case
        when v_from = 'provider_disputed' then provider_dispute_previous_status
        else v_from
      end,
      provider_dispute_id = coalesce(p_provider_dispute_id, provider_dispute_id),
      provider_dispute_status = coalesce(nullif(btrim(p_provider_status), ''), provider_dispute_status, 'under_review'),
      provider_disputed_at = coalesce(provider_disputed_at, now()),
      provider_dispute_reason = coalesce(nullif(btrim(p_reason), ''), provider_dispute_reason, 'Payment provider opened a dispute'),
      provider_dispute_outcome = null,
      provider_dispute_resolved_at = null,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action,
    external_reference, note, metadata
  ) values (
    p_payment_id,
    'paymongo_webhook',
    v_from,
    'provider_disputed',
    case when v_from = 'provider_disputed' then 'provider_dispute_updated' else 'provider_dispute_opened' end,
    coalesce(p_provider_event_id, p_provider_dispute_id),
    p_reason,
    jsonb_build_object(
      'provider_dispute_id', p_provider_dispute_id,
      'provider_status', p_provider_status,
      'previous_status', case when v_from = 'provider_disputed' then v_payment.provider_dispute_previous_status else v_from end
    )
  );

  return v_payment;
end;
$$;

revoke all on function public.open_payment_provider_dispute(uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.open_payment_provider_dispute(uuid,text,text,text,text)
  to service_role;

create or replace function public.resolve_payment_provider_dispute(
  p_payment_id uuid,
  p_provider_event_id text,
  p_provider_dispute_id text default null,
  p_provider_status text default null,
  p_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_from text;
  v_outcome text;
  v_restore text;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then raise exception 'payment_not_found'; end if;

  v_outcome := lower(coalesce(nullif(btrim(p_provider_status), ''), 'unknown'));

  if v_payment.status = 'chargeback' and v_outcome in ('lost','closed_lost') then
    return v_payment;
  end if;

  if v_payment.status <> 'provider_disputed' then
    if v_payment.provider_dispute_id is not distinct from p_provider_dispute_id
       and lower(coalesce(v_payment.provider_dispute_outcome, '')) = v_outcome then
      return v_payment;
    end if;
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  v_from := v_payment.status;

  if v_outcome in ('won','closed_won') then
    v_restore := case v_payment.provider_dispute_previous_status
      when 'released' then 'released'
      when 'disputed' then 'disputed'
      when 'refund_pending' then 'refund_pending'
      when 'refunded' then 'refunded'
      else 'paid'
    end;
  elsif v_outcome in ('lost','closed_lost') then
    v_restore := 'chargeback';
  else
    v_restore := 'provider_disputed';
  end if;

  update public.payments
  set status = v_restore,
      provider_dispute_id = coalesce(p_provider_dispute_id, provider_dispute_id),
      provider_dispute_status = coalesce(nullif(btrim(p_provider_status), ''), provider_dispute_status),
      provider_dispute_reason = coalesce(nullif(btrim(p_reason), ''), provider_dispute_reason),
      provider_dispute_outcome = case
        when v_outcome in ('won','closed_won') then 'won'
        when v_outcome in ('lost','closed_lost') then 'lost'
        else provider_dispute_outcome
      end,
      provider_dispute_resolved_at = case
        when v_outcome in ('won','closed_won','lost','closed_lost') then now()
        else provider_dispute_resolved_at
      end,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action,
    external_reference, note, metadata
  ) values (
    p_payment_id,
    'paymongo_webhook',
    v_from,
    v_restore,
    case
      when v_outcome in ('won','closed_won') then 'provider_dispute_won'
      when v_outcome in ('lost','closed_lost') then 'provider_dispute_lost_chargeback'
      else 'provider_dispute_status_updated'
    end,
    coalesce(p_provider_event_id, p_provider_dispute_id),
    p_reason,
    jsonb_build_object(
      'provider_dispute_id', p_provider_dispute_id,
      'provider_status', p_provider_status,
      'restored_status', v_restore
    )
  );

  return v_payment;
end;
$$;

revoke all on function public.resolve_payment_provider_dispute(uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.resolve_payment_provider_dispute(uuid,text,text,text,text)
  to service_role;

-- Browser clients may see payment rows through existing scoped policies, but
-- provider dispute metadata and event-claim controls remain server managed.
