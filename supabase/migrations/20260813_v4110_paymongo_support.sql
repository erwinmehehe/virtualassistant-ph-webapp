-- v4.11.0: PayMongo as the client payment collector, replacing Stripe.
-- Stripe does not support Philippine-registered businesses as a country of
-- operation, so the account created in this environment can never be
-- activated for real charges. PayMongo is PH-native (DTI/SEC + PH bank
-- account) and also unlocks GCash/Maya directly. PayMongo only settles in
-- PHP, so client-facing pricing stays in USD but the actual charge amount
-- is converted to PHP at checkout time -- these columns record exactly what
-- rate and PHP amount was used for that specific charge, so a ledger entry
-- is self-explaining even if the live rate later drifts.

alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider in ('stripe', 'paymongo', 'manual'));
alter table public.payments add column if not exists charged_amount_php numeric(12,2);
alter table public.payments add column if not exists fx_rate_usd_php numeric(10,4);
alter table public.payments alter column provider set default 'paymongo';

-- Cached USD->PHP rate so checkout doesn't hard-fail if the live FX lookup
-- is briefly unavailable, and so support can see what rate was last used.
alter table public.admin_settings add column if not exists usd_to_php_rate numeric(10,4);
alter table public.admin_settings add column if not exists usd_to_php_rate_updated_at timestamptz;
