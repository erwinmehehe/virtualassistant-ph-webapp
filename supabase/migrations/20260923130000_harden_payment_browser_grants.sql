-- Browser roles only need read access to their own payment rows.
-- RLS remains the row-level authorization boundary, while all mutations
-- continue through server actions using the service-role client.

revoke all on table public.payments from anon, authenticated;
grant select on table public.payments to authenticated;

alter view public.va_payout_view set (security_invoker = true);
revoke all on table public.va_payout_view from anon, authenticated;
grant select on table public.va_payout_view to authenticated;
