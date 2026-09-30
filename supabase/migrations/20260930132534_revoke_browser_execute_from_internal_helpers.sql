-- Production-applied 2026-09-30.
-- These helpers are internal trigger/normalization functions. Browser roles do
-- not call them directly, so remove the legacy RPC surface.

revoke execute on function public.classify_lead_type() from public, anon, authenticated;
revoke execute on function public.crm_normalize_company_name(text) from public, anon, authenticated;
revoke execute on function public.ensure_job_slug() from public, anon, authenticated;
revoke execute on function public.payments_touch_updated_at() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.validate_review_parties() from public, anon, authenticated;

grant execute on function public.classify_lead_type() to service_role;
grant execute on function public.crm_normalize_company_name(text) to service_role;
grant execute on function public.ensure_job_slug() to service_role;
grant execute on function public.payments_touch_updated_at() to service_role;
grant execute on function public.touch_updated_at() to service_role;
grant execute on function public.validate_review_parties() to service_role;
