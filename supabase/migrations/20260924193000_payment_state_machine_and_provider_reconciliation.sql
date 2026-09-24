-- Atomic payment transitions, checkout idempotency, and provider reconciliation.
-- All status changes are forced through service-role-only RPCs that lock the payment row.

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in (
    'draft',
    'awaiting_payment',
    'checkout_pending',
    'paid',
    'disputed',
    'refund_pending',
    'release_pending',
    'released',
    'failed',
    'refunded',
    'chargeback',
    'void'
  ));

alter table public.payments alter column platform_cut_percent set default 0;

alter table public.payments
  add column if not exists checkout_claim_token uuid,
  add column if not exists checkout_claimed_at timestamptz,
  add column if not exists checkout_idempotency_key text,
  add column if not exists provider_checkout_url text,
  add column if not exists provider_refund_id text,
  add column if not exists provider_refund_status text,
  add column if not exists provider_dispute_id text,
  add column if not exists provider_dispute_status text,
  add column if not exists provider_dispute_reason text,
  add column if not exists provider_disputed_at timestamptz,
  add column if not exists dispute_source text,
  add column if not exists provider_last_event_id text,
  add column if not exists provider_last_event_at timestamptz;

create unique index if not exists payments_provider_session_unique_idx
  on public.payments(provider_session_id)
  where provider_session_id is not null;

create unique index if not exists payments_provider_payment_unique_idx
  on public.payments(provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists payments_provider_refund_unique_idx
  on public.payments(provider_refund_id)
  where provider_refund_id is not null;

create table if not exists public.payment_state_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  source text not null,
  external_reference text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_state_events_payment_idx
  on public.payment_state_events(payment_id, created_at desc);

alter table public.payment_state_events enable row level security;
revoke all on public.payment_state_events from public, anon, authenticated;
grant all on public.payment_state_events to service_role;

create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  resource_id text,
  payment_id uuid references public.payments(id) on delete set null,
  processing_started_at timestamptz,
  processed_at timestamptz,
  processing_status text not null default 'received',
  error_message text,
  created_at timestamptz not null default now(),
  unique(provider, event_id)
);

create index if not exists payment_provider_events_payment_idx
  on public.payment_provider_events(payment_id, created_at desc);

alter table public.payment_provider_events enable row level security;
revoke all on public.payment_provider_events from public, anon, authenticated;
grant all on public.payment_provider_events to service_role;

create or replace function public.enforce_payment_state_machine()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status is distinct from new.status
     and coalesce(current_setting('app.payment_state_transition', true), '') <> 'allowed' then
    raise exception 'payment_status_transition_requires_rpc';
  end if;
  return new;
end;
$$;

drop trigger if exists payments_require_state_machine on public.payments;
create trigger payments_require_state_machine
before update of status on public.payments
for each row execute function public.enforce_payment_state_machine();

create or replace function public.transition_payment_state(
  p_payment_id uuid,
  p_expected_status text,
  p_new_status text,
  p_actor_id uuid default null,
  p_source text default 'system',
  p_external_ref text default null,
  p_context jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_now timestamptz := now();
  v_allowed boolean := false;
  v_dispute_source text;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status <> p_expected_status then
    raise exception 'payment_state_conflict:%:%', v_payment.status, p_expected_status;
  end if;

  if p_expected_status = p_new_status then
    v_allowed := p_source in ('paymongo_api','paymongo_webhook','stripe_webhook','system');
  else
    v_allowed :=
      (p_expected_status = 'awaiting_payment' and p_new_status in ('checkout_pending','paid','failed','void')) or
      (p_expected_status = 'checkout_pending' and p_new_status in ('awaiting_payment','paid','failed','void')) or
      (p_expected_status = 'paid' and p_new_status in ('disputed','refund_pending','release_pending','released','refunded','chargeback')) or
      (p_expected_status = 'disputed' and p_new_status in ('paid','refund_pending','refunded','chargeback','void')) or
      (p_expected_status = 'refund_pending' and p_new_status in ('refunded','disputed','failed','chargeback')) or
      (p_expected_status = 'release_pending' and p_new_status in ('released','disputed','chargeback')) or
      (p_expected_status = 'released' and p_new_status in ('chargeback')) or
      (p_expected_status = 'failed' and p_new_status in ('awaiting_payment','void'));
  end if;

  if not v_allowed then
    raise exception 'invalid_payment_transition:%:%', p_expected_status, p_new_status;
  end if;

  if p_expected_status = 'disputed'
     and p_new_status = 'paid'
     and coalesce(nullif(p_context->>'provider_dispute_status',''), v_payment.provider_dispute_status, '') in ('under_review','pending','open') then
    raise exception 'provider_dispute_still_open';
  end if;

  v_dispute_source := case
    when p_context ? 'dispute_source' then nullif(p_context->>'dispute_source','')
    else v_payment.dispute_source
  end;

  perform set_config('app.payment_state_transition', 'allowed', true);

  update public.payments
  set
    status = p_new_status,
    paid_at = case
      when p_new_status = 'paid' then coalesce(paid_at, nullif(p_context->>'paid_at','')::timestamptz, v_now)
      else paid_at
    end,
    released_at = case
      when p_new_status = 'released' then coalesce(nullif(p_context->>'released_at','')::timestamptz, v_now)
      else released_at
    end,
    released_by = case
      when p_new_status = 'released' then coalesce(nullif(p_context->>'released_by','')::uuid, p_actor_id, released_by)
      else released_by
    end,
    release_note = case
      when p_new_status = 'released' then coalesce(nullif(p_context->>'release_note',''), release_note)
      else release_note
    end,
    disputed_at = case
      when p_new_status = 'disputed' then coalesce(disputed_at, nullif(p_context->>'disputed_at','')::timestamptz, v_now)
      else disputed_at
    end,
    disputed_by = case
      when p_new_status = 'disputed' then coalesce(nullif(p_context->>'disputed_by','')::uuid, p_actor_id, disputed_by)
      else disputed_by
    end,
    dispute_reason = case
      when p_new_status = 'disputed' then coalesce(nullif(p_context->>'dispute_reason',''), dispute_reason)
      else dispute_reason
    end,
    dispute_source = v_dispute_source,
    dispute_resolution = case
      when p_context ? 'dispute_resolution' then nullif(p_context->>'dispute_resolution','')
      else dispute_resolution
    end,
    dispute_resolved_at = case
      when p_context ? 'dispute_resolved_at' then coalesce(nullif(p_context->>'dispute_resolved_at','')::timestamptz, v_now)
      else dispute_resolved_at
    end,
    dispute_resolved_by = case
      when p_context ? 'dispute_resolved_by' then coalesce(nullif(p_context->>'dispute_resolved_by','')::uuid, p_actor_id)
      else dispute_resolved_by
    end,
    provider = case when p_context ? 'provider' then coalesce(nullif(p_context->>'provider',''), provider) else provider end,
    provider_session_id = case when p_context ? 'provider_session_id' then nullif(p_context->>'provider_session_id','') else provider_session_id end,
    provider_checkout_url = case when p_context ? 'provider_checkout_url' then nullif(p_context->>'provider_checkout_url','') else provider_checkout_url end,
    provider_payment_intent = case when p_context ? 'provider_payment_intent' then nullif(p_context->>'provider_payment_intent','') else provider_payment_intent end,
    provider_payment_id = case when p_context ? 'provider_payment_id' then nullif(p_context->>'provider_payment_id','') else provider_payment_id end,
    provider_refund_id = case when p_context ? 'provider_refund_id' then nullif(p_context->>'provider_refund_id','') else provider_refund_id end,
    provider_refund_status = case when p_context ? 'provider_refund_status' then nullif(p_context->>'provider_refund_status','') else provider_refund_status end,
    provider_dispute_id = case when p_context ? 'provider_dispute_id' then nullif(p_context->>'provider_dispute_id','') else provider_dispute_id end,
    provider_dispute_status = case when p_context ? 'provider_dispute_status' then nullif(p_context->>'provider_dispute_status','') else provider_dispute_status end,
    provider_dispute_reason = case when p_context ? 'provider_dispute_reason' then nullif(p_context->>'provider_dispute_reason','') else provider_dispute_reason end,
    provider_disputed_at = case when p_context ? 'provider_disputed_at' then coalesce(nullif(p_context->>'provider_disputed_at','')::timestamptz, v_now) else provider_disputed_at end,
    provider_last_event_id = case when p_context ? 'provider_last_event_id' then nullif(p_context->>'provider_last_event_id','') else provider_last_event_id end,
    provider_last_event_at = case when p_context ? 'provider_last_event_at' then coalesce(nullif(p_context->>'provider_last_event_at','')::timestamptz, v_now) else provider_last_event_at end,
    checkout_claim_token = case
      when p_new_status in ('paid','failed','refunded','chargeback','void') then null
      else checkout_claim_token
    end,
    checkout_claimed_at = case
      when p_new_status in ('paid','failed','refunded','chargeback','void') then null
      else checkout_claimed_at
    end
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_state_events(
    payment_id, from_status, to_status, actor_id, source, external_reference, context
  ) values (
    p_payment_id, p_expected_status, p_new_status, p_actor_id, p_source, p_external_ref, coalesce(p_context,'{}'::jsonb)
  );

  return v_payment;
end;
$$;

revoke all on function public.transition_payment_state(uuid,text,text,uuid,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.transition_payment_state(uuid,text,text,uuid,text,text,jsonb)
  to service_role;

create or replace function public.claim_payment_checkout(
  p_payment_id uuid,
  p_client_id uuid,
  p_claim_token uuid
)
returns table(
  claim_state text,
  payment_id uuid,
  amount_total numeric,
  description text,
  checkout_url text,
  claim_token uuid,
  idempotency_key text
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_key text;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id and client_id = p_client_id
  for update;

  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status = 'checkout_pending' and v_payment.provider_checkout_url is not null then
    return query select
      'ready'::text, v_payment.id, v_payment.amount_total, v_payment.description,
      v_payment.provider_checkout_url, v_payment.checkout_claim_token,
      v_payment.checkout_idempotency_key;
    return;
  end if;

  if v_payment.status = 'checkout_pending'
     and v_payment.checkout_claimed_at is not null
     and v_payment.checkout_claimed_at > now() - interval '5 minutes' then
    return query select
      'in_progress'::text, v_payment.id, v_payment.amount_total, v_payment.description,
      null::text, v_payment.checkout_claim_token,
      v_payment.checkout_idempotency_key;
    return;
  end if;

  if v_payment.status not in ('awaiting_payment','checkout_pending') then
    raise exception 'payment_not_awaiting_checkout:%', v_payment.status;
  end if;

  v_key := coalesce(v_payment.checkout_idempotency_key, 'payment-checkout-' || v_payment.id::text);

  if v_payment.status = 'awaiting_payment' then
    perform set_config('app.payment_state_transition', 'allowed', true);
    update public.payments
    set status = 'checkout_pending',
        checkout_claim_token = p_claim_token,
        checkout_claimed_at = now(),
        checkout_idempotency_key = v_key,
        provider = 'paymongo'
    where id = v_payment.id
    returning * into v_payment;

    insert into public.payment_state_events(
      payment_id, from_status, to_status, actor_id, source, external_reference, context
    ) values (
      v_payment.id, 'awaiting_payment', 'checkout_pending', p_client_id,
      'client_checkout', v_key, jsonb_build_object('claim_token', p_claim_token)
    );
  else
    update public.payments
    set checkout_claim_token = p_claim_token,
        checkout_claimed_at = now(),
        checkout_idempotency_key = v_key
    where id = v_payment.id
    returning * into v_payment;

    insert into public.payment_state_events(
      payment_id, from_status, to_status, actor_id, source, external_reference, context
    ) values (
      v_payment.id, 'checkout_pending', 'checkout_pending', p_client_id,
      'client_checkout_reclaim', v_key, jsonb_build_object('claim_token', p_claim_token)
    );
  end if;

  return query select
    'claimed'::text, v_payment.id, v_payment.amount_total, v_payment.description,
    v_payment.provider_checkout_url, v_payment.checkout_claim_token,
    v_payment.checkout_idempotency_key;
end;
$$;

revoke all on function public.claim_payment_checkout(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_payment_checkout(uuid,uuid,uuid) to service_role;

create or replace function public.finalize_payment_checkout(
  p_payment_id uuid,
  p_claim_token uuid,
  p_session_id text,
  p_checkout_url text,
  p_amount_php numeric,
  p_fx_rate numeric,
  p_payment_intent text default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then raise exception 'payment_not_found'; end if;
  if v_payment.status <> 'checkout_pending' then
    raise exception 'payment_state_conflict:%:checkout_pending', v_payment.status;
  end if;
  if v_payment.checkout_claim_token is distinct from p_claim_token then
    raise exception 'checkout_claim_conflict';
  end if;
  if p_amount_php is null or p_amount_php <= 0 or p_fx_rate is null or p_fx_rate <= 0 then
    raise exception 'invalid_checkout_amount_or_fx';
  end if;

  update public.payments
  set provider = 'paymongo',
      provider_session_id = p_session_id,
      provider_checkout_url = p_checkout_url,
      provider_payment_intent = coalesce(p_payment_intent, provider_payment_intent),
      charged_amount_php = p_amount_php,
      fx_rate_usd_php = p_fx_rate
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_state_events(
    payment_id, from_status, to_status, actor_id, source, external_reference, context
  ) values (
    p_payment_id, 'checkout_pending', 'checkout_pending', v_payment.client_id,
    'paymongo_api', p_session_id,
    jsonb_build_object('charged_amount_php', p_amount_php, 'fx_rate_usd_php', p_fx_rate)
  );

  return v_payment;
end;
$$;

revoke all on function public.finalize_payment_checkout(uuid,uuid,text,text,numeric,numeric,text)
  from public, anon, authenticated;
grant execute on function public.finalize_payment_checkout(uuid,uuid,text,text,numeric,numeric,text)
  to service_role;

create or replace function public.release_payment_checkout_claim(
  p_payment_id uuid,
  p_claim_token uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then return false; end if;
  if v_payment.status <> 'checkout_pending' then return false; end if;
  if v_payment.checkout_claim_token is distinct from p_claim_token then return false; end if;

  perform set_config('app.payment_state_transition', 'allowed', true);
  update public.payments
  set status = 'awaiting_payment',
      checkout_claim_token = null,
      checkout_claimed_at = null
  where id = p_payment_id;

  insert into public.payment_state_events(
    payment_id, from_status, to_status, actor_id, source, external_reference, context
  ) values (
    p_payment_id, 'checkout_pending', 'awaiting_payment', v_payment.client_id,
    'checkout_failed', v_payment.checkout_idempotency_key,
    jsonb_build_object('reason', left(coalesce(p_reason,''), 500))
  );

  return true;
end;
$$;

revoke all on function public.release_payment_checkout_claim(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.release_payment_checkout_claim(uuid,uuid,text)
  to service_role;

create or replace function public.claim_payment_provider_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_resource_id text default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event public.payment_provider_events%rowtype;
begin
  insert into public.payment_provider_events(
    provider, event_id, event_type, resource_id, processing_started_at, processing_status
  ) values (
    p_provider, p_event_id, p_event_type, p_resource_id, now(), 'processing'
  )
  on conflict(provider,event_id) do nothing
  returning * into v_event;

  if found then return 'claimed'; end if;

  select * into v_event
  from public.payment_provider_events
  where provider = p_provider and event_id = p_event_id
  for update;

  if v_event.processed_at is not null then return 'processed'; end if;
  if v_event.processing_started_at is not null
     and v_event.processing_started_at > now() - interval '5 minutes' then
    return 'in_progress';
  end if;

  update public.payment_provider_events
  set processing_started_at = now(),
      processing_status = 'processing',
      error_message = null
  where id = v_event.id;

  return 'claimed';
end;
$$;

revoke all on function public.claim_payment_provider_event(text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.claim_payment_provider_event(text,text,text,text)
  to service_role;

create or replace function public.complete_payment_provider_event(
  p_provider text,
  p_event_id text,
  p_payment_id uuid default null,
  p_resource_id text default null,
  p_processing_status text default 'processed',
  p_error_message text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.payment_provider_events
  set payment_id = coalesce(p_payment_id, payment_id),
      resource_id = coalesce(p_resource_id, resource_id),
      processing_status = left(coalesce(p_processing_status,'processed'), 50),
      error_message = case when p_error_message is null then null else left(p_error_message, 1000) end,
      processed_at = case when p_processing_status in ('processed','ignored','orphan') then now() else null end
  where provider = p_provider and event_id = p_event_id;
end;
$$;

revoke all on function public.complete_payment_provider_event(text,text,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.complete_payment_provider_event(text,text,uuid,text,text,text)
  to service_role;
