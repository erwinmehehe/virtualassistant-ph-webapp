-- v4.10.4: payment ledger + Stripe checkout collection.
-- Clients pay the platform upfront via Stripe. The platform holds the funds
-- (in the Stripe balance, not a self-custodied account) and an admin
-- manually releases the VA's share once work/hours are confirmed. Payout to
-- the VA (GCash/bank/Wise) happens outside this app for now; this table is
-- the source of truth for what is owed, held, and released.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid references public.workrooms(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid references public.profiles(id) on delete set null,
  description text not null,
  amount_total numeric(10,2) not null check (amount_total > 0),
  platform_cut_percent numeric(5,2) not null default 2 check (platform_cut_percent >= 0 and platform_cut_percent <= 100),
  currency text not null default 'usd',
  provider text not null default 'stripe' check (provider in ('stripe', 'manual')),
  provider_session_id text,
  provider_payment_intent text,
  status text not null default 'draft' check (status in ('draft', 'awaiting_payment', 'paid', 'release_pending', 'released', 'failed', 'refunded', 'void')),
  paid_at timestamptz,
  released_at timestamptz,
  released_by uuid references public.profiles(id) on delete set null,
  release_note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_client_idx on public.payments(client_id, created_at desc);
create index if not exists payments_va_idx on public.payments(va_id, created_at desc);
create index if not exists payments_status_idx on public.payments(status, created_at desc);

create or replace function public.payments_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments for each row execute procedure public.payments_touch_updated_at();

alter table public.payments enable row level security;

drop policy if exists "client reads own payments" on public.payments;
create policy "client reads own payments" on public.payments for select using (auth.uid() = client_id);

drop policy if exists "va reads own payments" on public.payments;
create policy "va reads own payments" on public.payments for select using (auth.uid() = va_id);

-- All writes go through server actions using the service role key, which
-- bypasses RLS. No direct client/VA insert or update policy is defined on
-- purpose: amounts and status transitions must stay staff-controlled.

grant select on public.payments to authenticated;
grant all on public.payments to service_role;

-- A read-safe view for VAs that hides the platform cut breakdown, showing
-- only what they are owed and its status. Filters by auth.uid() directly
-- rather than relying on the base table's RLS being inherited by the view,
-- since view security-invoker behavior varies by Postgres version.
create or replace view public.va_payout_view as
select
  id,
  workroom_id,
  job_id,
  va_id,
  description,
  round(amount_total - (amount_total * platform_cut_percent / 100), 2) as payout_amount,
  currency,
  status,
  paid_at,
  released_at,
  created_at
from public.payments
where va_id = auth.uid();

grant select on public.va_payout_view to authenticated;
