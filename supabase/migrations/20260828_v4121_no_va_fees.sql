-- v4.12.1: VAs are never charged platform, application, or placement fees.
-- Client commercial fees are handled separately from VA compensation.

alter table public.payments alter column platform_cut_percent set default 0;

-- This project is pre-launch; normalize existing ledger rows so VA compensation
-- is never reduced by a platform percentage.
update public.payments
set platform_cut_percent = 0
where platform_cut_percent <> 0;

create or replace view public.va_payout_view as
select
  id,
  workroom_id,
  job_id,
  va_id,
  description,
  round(amount_total, 2) as payout_amount,
  currency,
  status,
  paid_at,
  released_at,
  created_at
from public.payments
where va_id = auth.uid();

grant select on public.va_payout_view to authenticated;
