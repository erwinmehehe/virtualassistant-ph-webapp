-- Provider-side reconciliation helpers for refunds and payment disputes.
-- These functions deliberately accept multiple prior states because provider
-- events can originate outside the app (for example a PayMongo dashboard refund).

create or replace function public.mark_payment_refunded_from_provider(
  p_payment_id uuid,
  p_provider_event_id text,
  p_provider_refund_id text default null
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
  if v_payment.status = 'refunded' then return v_payment; end if;
  if v_payment.status not in ('paid','disputed','provider_disputed','refund_pending','released') then
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  v_from := v_payment.status;
  update public.payments
  set status = 'refunded',
      provider_refund_id = coalesce(p_provider_refund_id, provider_refund_id),
      dispute_resolved_at = coalesce(dispute_resolved_at, now()),
      dispute_resolution = coalesce(dispute_resolution, 'Refund confirmed by payment provider'),
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, external_reference
  ) values (
    p_payment_id, 'paymongo_webhook', v_from, 'refunded',
    'provider_refund_confirmed', coalesce(p_provider_event_id, p_provider_refund_id)
  );

  return v_payment;
end;
$$;

revoke all on function public.mark_payment_refunded_from_provider(uuid,text,text) from public, anon, authenticated;
grant execute on function public.mark_payment_refunded_from_provider(uuid,text,text) to service_role;

create or replace function public.mark_payment_provider_disputed(
  p_payment_id uuid,
  p_provider_event_id text,
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
  if v_payment.status = 'provider_disputed' then return v_payment; end if;
  if v_payment.status not in ('paid','disputed','refund_pending','released') then
    raise exception 'payment_state_conflict:%', v_payment.status;
  end if;

  v_from := v_payment.status;
  update public.payments
  set status = 'provider_disputed',
      provider_disputed_at = coalesce(provider_disputed_at, now()),
      provider_dispute_reason = coalesce(nullif(btrim(p_reason), ''), provider_dispute_reason, 'Payment provider marked this transaction disputed'),
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  insert into public.payment_events(
    payment_id, source, from_status, to_status, action, external_reference, note
  ) values (
    p_payment_id, 'paymongo_webhook', v_from, 'provider_disputed',
    'provider_dispute_opened', p_provider_event_id, p_reason
  );

  return v_payment;
end;
$$;

revoke all on function public.mark_payment_provider_disputed(uuid,text,text) from public, anon, authenticated;
grant execute on function public.mark_payment_provider_disputed(uuid,text,text) to service_role;
