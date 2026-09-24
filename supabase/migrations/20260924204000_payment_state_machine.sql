-- Payment integrity hardening: atomic state transitions, checkout claims,
-- provider event deduplication, and refund/dispute reconciliation.

alter table public.payments
  alter column platform_cut_percent set default 0;

alter table public.payments
  add column if not exists provider_checkout_url text,
  add column if not exists checkout_claim_token uuid,
  add column if not exists checkout_claimed_at timestamptz,
  add column if not exists provider_refund_id text,
  add column if not exists provider_disputed_at timestamptz,
  add column if not exists provider_dispute_reason text;

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
    'void'
  )
);

create unique index if not exists payments_provider_session_unique_idx
  on public.payments(provider_session_id)
  where provider_session_id is not null;

create unique index if not exists payments_provider_payment_unique_idx
  on public.payments(provider_payment_id)
  where provider_payment_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  source text not null default 'application',
  from_status text,
  to_status text,
  action text not null,
  external_reference text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_payment_created_idx
  on public.payment_events(payment_id, created_at desc);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from public, anon, authenticated;
grant all on public.payment_events to service_role;

create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  livemode boolean not null default false,
  payment_id uuid references public.payments(id) on delete set null,
  provider_object_id text,
  metadata jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique(provider, provider_event_id)
);

create index if not exists payment_provider_events_payment_idx
  on public.payment_provider_events(payment_id, received_at desc);

create index if not exists payment_provider_events_unprocessed_idx
  on public.payment_provider_events(received_at)
  where processed_at is null;

alter table public.payment_provider_events enable row level security;
revoke all on public.payment_provider_events from public, anon, authenticated;
grant all on public.payment_provider_events to service_role;

create or replace function public.transition_payment_state(
  p_payment_id uuid,
  p_expected_status text,
  p_new_status text,
  p_actor_id uuid default null,
  p_source text default 'application',
  p_external_reference text default null,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
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

  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status <> p_expected_status then
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  if not (
    (p_expected_status = 'awaiting_payment' and p_new_status = 'checkout_pending') or
    (p_expected_status = 'checkout_pending' and p_new_status = 'awaiting_payment') or
    (p_expected_status in ('awaiting_payment','checkout_pending') and p_new_status = 'paid') or
    (p_expected_status = 'paid' and p_new_status in ('disputed','released','provider_disputed')) or
    (p_expected_status = 'disputed' and p_new_status in ('paid','refund_pending','provider_disputed')) or
    (p_expected_status = 'refund_pending' and p_new_status in ('disputed','refunded','provider_disputed')) or
    (p_expected_status = 'released' and p_new_status = 'provider_disputed') or
    (p_expected_status = 'provider_disputed' and p_new_status in ('paid','refund_pending','refunded'))
  ) then
    raise exception 'invalid_payment_transition:%->%', p_expected_status, p_new_status;
  end if;

  update public.payments
  set
    status = p_new_status,
    released_at = case when p_new_status = 'released' then now() else released_at end,
    released_by = case when p_new_status = 'released' then p_actor_id else released_by end,
    release_note = case when p_new_status = 'released' then nullif(btrim(p_note), '') else release_note end,
    disputed_at = case when p_new_status = 'disputed' then now() else disputed_at end,
    disputed_by = case when p_new_status = 'disputed' then p_actor_id else disputed_by end,
    dispute_reason = case when p_new_status = 'disputed' then nullif(btrim(p_note), '') else dispute_reason end,
    dispute_resolved_at = case
      when p_expected_status in ('disputed','provider_disputed') and p_new_status in ('paid','refunded') then now()
      else dispute_resolved_at
    end,
    dispute_resolved_by = case
      when p_expected_status in ('disputed','provider_disputed') and p_new_status in ('paid','refund_pending','refunded') then p_actor_id
      else dispute_resolved_by
    end,
    dispute_resolution = case
      when p_expected_status in ('disputed','provider_disputed') and p_new_status in ('paid','refund_pending','refunded') then nullif(btrim(p_note), '')
      else dispute_resolution
    end,
    provider_disputed_at = case when p_new_status = 'provider_disputed' then now() else provider_disputed_at end,
    provider_dispute_reason = case when p_new_status = 'provider_disputed' then nullif(btrim(p_note), '') else provider_dispute_reason end,
    updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, actor_id, source, from_status, to_status, action,
    external_reference, note, metadata
  ) values (
    p_payment_id, p_actor_id, coalesce(nullif(p_source,''),'application'),
    p_expected_status, p_new_status, 'state_transition',
    p_external_reference, p_note, coalesce(p_metadata,'{}'::jsonb)
  );

  return v_payment;
end;
$$;

revoke all on function public.transition_payment_state(uuid,text,text,uuid,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.transition_payment_state(uuid,text,text,uuid,text,text,text,jsonb) to service_role;

create or replace function public.claim_payment_checkout(
  p_payment_id uuid,
  p_client_id uuid,
  p_claim_token uuid
)
returns table(
  payment_id uuid,
  description text,
  amount_total numeric,
  provider_checkout_url text,
  reuse_existing boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_payment public.payments%rowtype;
  v_stale boolean;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id and client_id = p_client_id
  for update;

  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status = 'checkout_pending' and v_payment.provider_checkout_url is not null then
    return query
      select v_payment.id, v_payment.description, v_payment.amount_total,
             v_payment.provider_checkout_url, true;
    return;
  end if;

  v_stale := v_payment.checkout_claimed_at is null
    or v_payment.checkout_claimed_at < now() - interval '10 minutes';

  if v_payment.status = 'checkout_pending' and not v_stale then
    raise exception 'checkout_in_progress';
  end if;

  if v_payment.status not in ('awaiting_payment','checkout_pending') then
    raise exception 'payment_not_awaiting_checkout:%', v_payment.status;
  end if;

  update public.payments
  set status = 'checkout_pending',
      checkout_claim_token = p_claim_token,
      checkout_claimed_at = now(),
      updated_at = now()
  where id = v_payment.id;

  insert into public.payment_events(
    payment_id, actor_id, source, from_status, to_status, action, metadata
  ) values (
    v_payment.id, p_client_id, 'client_checkout', v_payment.status,
    'checkout_pending', case when v_payment.status = 'checkout_pending' then 'checkout_reclaimed' else 'checkout_claimed' end,
    jsonb_build_object('claim_token', p_claim_token)
  );

  return query
    select v_payment.id, v_payment.description, v_payment.amount_total,
           null::text, false;
end;
$$;

revoke all on function public.claim_payment_checkout(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_payment_checkout(uuid,uuid,uuid) to service_role;

create or replace function public.attach_payment_checkout(
  p_payment_id uuid,
  p_claim_token uuid,
  p_provider_session_id text,
  p_checkout_url text,
  p_charged_amount_php numeric,
  p_fx_rate_usd_php numeric
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
  if v_payment.status <> 'checkout_pending' then raise exception 'payment_state_conflict:%', v_payment.status; end if;
  if v_payment.checkout_claim_token is distinct from p_claim_token then raise exception 'checkout_claim_conflict'; end if;

  update public.payments
  set provider = 'paymongo',
      provider_session_id = p_provider_session_id,
      provider_checkout_url = p_checkout_url,
      charged_amount_php = p_charged_amount_php,
      fx_rate_usd_php = p_fx_rate_usd_php,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, external_reference, metadata
  ) values (
    p_payment_id, 'paymongo_checkout', 'checkout_pending', 'checkout_pending',
    'checkout_attached', p_provider_session_id,
    jsonb_build_object('charged_amount_php', p_charged_amount_php, 'fx_rate_usd_php', p_fx_rate_usd_php)
  );

  return v_payment;
end;
$$;

revoke all on function public.attach_payment_checkout(uuid,uuid,text,text,numeric,numeric) from public, anon, authenticated;
grant execute on function public.attach_payment_checkout(uuid,uuid,text,text,numeric,numeric) to service_role;

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

  if not found or v_payment.status <> 'checkout_pending'
     or v_payment.checkout_claim_token is distinct from p_claim_token
     or v_payment.provider_session_id is not null then
    return false;
  end if;

  update public.payments
  set status = 'awaiting_payment',
      checkout_claim_token = null,
      checkout_claimed_at = null,
      updated_at = now()
  where id = p_payment_id;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, note
  ) values (
    p_payment_id, 'paymongo_checkout', 'checkout_pending', 'awaiting_payment',
    'checkout_claim_released', p_reason
  );

  return true;
end;
$$;

revoke all on function public.release_payment_checkout_claim(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.release_payment_checkout_claim(uuid,uuid,text) to service_role;

create or replace function public.mark_payment_paid_from_provider(
  p_payment_id uuid,
  p_provider_session_id text,
  p_provider_payment_intent text,
  p_provider_payment_id text,
  p_provider_event_id text
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

  if v_payment.status = 'paid' then
    return v_payment;
  end if;

  if v_payment.status not in ('awaiting_payment','checkout_pending') then
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  v_from := v_payment.status;

  update public.payments
  set status = 'paid',
      paid_at = coalesce(paid_at, now()),
      provider = 'paymongo',
      provider_session_id = coalesce(p_provider_session_id, provider_session_id),
      provider_payment_intent = coalesce(p_provider_payment_intent, provider_payment_intent),
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      checkout_claim_token = null,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, external_reference
  ) values (
    p_payment_id, 'paymongo_webhook', v_from, 'paid', 'provider_payment_paid',
    coalesce(p_provider_event_id, p_provider_payment_id, p_provider_session_id)
  );

  return v_payment;
end;
$$;

revoke all on function public.mark_payment_paid_from_provider(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.mark_payment_paid_from_provider(uuid,text,text,text,text) to service_role;

create or replace function public.record_payment_refund_requested(
  p_payment_id uuid,
  p_provider_refund_id text,
  p_external_reference text default null
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
  if v_payment.status <> 'refund_pending' then raise exception 'payment_state_conflict:%', v_payment.status; end if;

  update public.payments
  set provider_refund_id = p_provider_refund_id,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, external_reference
  ) values (
    p_payment_id, 'paymongo_refund', 'refund_pending', 'refund_pending',
    'provider_refund_requested', coalesce(p_external_reference, p_provider_refund_id)
  );

  return v_payment;
end;
$$;

revoke all on function public.record_payment_refund_requested(uuid,text,text) from public, anon, authenticated;
grant execute on function public.record_payment_refund_requested(uuid,text,text) to service_role;
