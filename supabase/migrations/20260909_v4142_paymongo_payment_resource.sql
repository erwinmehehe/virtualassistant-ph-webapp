-- v4.14.2: Store the PayMongo Payment resource ID used for refunds.
-- PayMongo refunds require a pay_... Payment ID, not the related pi_...
-- Payment Intent ID.

alter table public.payments
  add column if not exists provider_payment_id text;
