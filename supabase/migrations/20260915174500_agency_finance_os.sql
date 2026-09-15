-- Agency Finance OS.
-- Keep agency economics private and separate from the existing payments ledger,
-- which remains the source of truth for VA compensation collection/release.

alter table public.admin_settings add column if not exists finance_min_margin_percent numeric(5,2) not null default 15;
alter table public.admin_settings add column if not exists finance_target_margin_percent numeric(5,2) not null default 25;
alter table public.admin_settings add column if not exists finance_default_payment_cost_percent numeric(5,2) not null default 3;
alter table public.admin_settings add column if not exists finance_default_ops_cost_monthly numeric(12,2) not null default 0;
alter table public.admin_settings add column if not exists finance_invoice_overdue_days integer not null default 7;

alter table public.admin_settings drop constraint if exists admin_settings_finance_margin_check;
alter table public.admin_settings add constraint admin_settings_finance_margin_check check (
  finance_min_margin_percent between 0 and 100
  and finance_target_margin_percent between finance_min_margin_percent and 100
  and finance_default_payment_cost_percent between 0 and 100
  and finance_default_ops_cost_monthly >= 0
  and finance_invoice_overdue_days between 1 and 120
);

create table if not exists public.placement_finance_profiles (
  workroom_id uuid primary key references public.workrooms(id) on delete cascade,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  expected_monthly_client_revenue numeric(12,2) not null default 0 check (expected_monthly_client_revenue >= 0),
  expected_monthly_va_compensation numeric(12,2) not null default 0 check (expected_monthly_va_compensation >= 0),
  payment_cost_percent numeric(5,2) not null default 0 check (payment_cost_percent between 0 and 100),
  monthly_ops_cost numeric(12,2) not null default 0 check (monthly_ops_cost >= 0),
  other_monthly_cost numeric(12,2) not null default 0 check (other_monthly_cost >= 0),
  exception_status text not null default 'not_required' check (exception_status in ('not_required','pending','approved','rejected')),
  exception_reason text check (exception_reason is null or char_length(exception_reason) <= 3000),
  exception_requested_by uuid references public.profiles(id) on delete set null,
  exception_requested_at timestamptz,
  exception_reviewed_by uuid references public.profiles(id) on delete set null,
  exception_reviewed_at timestamptz,
  exception_review_note text check (exception_review_note is null or char_length(exception_review_note) <= 3000),
  reconciled_at timestamptz,
  reconciled_by uuid references public.profiles(id) on delete set null,
  reconciliation_note text check (reconciliation_note is null or char_length(reconciliation_note) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists placement_finance_exception_idx
  on public.placement_finance_profiles(exception_status,updated_at desc)
  where exception_status in ('pending','rejected');
create index if not exists placement_finance_reconciliation_idx
  on public.placement_finance_profiles(reconciled_at,updated_at desc);

create table if not exists public.placement_finance_adjustments (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  adjustment_type text not null check (adjustment_type in (
    'service_fee_revenue','placement_fee_revenue','other_revenue',
    'client_credit','refund','va_bonus','va_deduction',
    'payment_fee','fx_cost','ops_cost','other_cost'
  )),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  effective_date date not null default current_date,
  reason text not null check (char_length(btrim(reason)) between 3 and 3000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists placement_finance_adjustments_workroom_idx
  on public.placement_finance_adjustments(workroom_id,effective_date desc,created_at desc);
create index if not exists placement_finance_adjustments_payment_idx
  on public.placement_finance_adjustments(payment_id)
  where payment_id is not null;

create or replace function public.placement_finance_touch_updated_at()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists placement_finance_touch on public.placement_finance_profiles;
create trigger placement_finance_touch
before update on public.placement_finance_profiles
for each row execute function public.placement_finance_touch_updated_at();

alter table public.placement_finance_profiles enable row level security;
alter table public.placement_finance_adjustments enable row level security;

revoke all on table public.placement_finance_profiles from public,anon,authenticated;
revoke all on table public.placement_finance_adjustments from public,anon,authenticated;
grant select,insert,update,delete on table public.placement_finance_profiles to service_role;
grant select,insert,update,delete on table public.placement_finance_adjustments to service_role;

-- Explicitly deny browser roles even if grants change later. Server actions use
-- the service-role client and remain the only write path for agency economics.
drop policy if exists placement_finance_profiles_browser_deny on public.placement_finance_profiles;
create policy placement_finance_profiles_browser_deny on public.placement_finance_profiles
for all to anon,authenticated using (false) with check (false);

drop policy if exists placement_finance_adjustments_browser_deny on public.placement_finance_adjustments;
create policy placement_finance_adjustments_browser_deny on public.placement_finance_adjustments
for all to anon,authenticated using (false) with check (false);

revoke execute on function public.placement_finance_touch_updated_at() from public,anon,authenticated;
grant execute on function public.placement_finance_touch_updated_at() to service_role;
