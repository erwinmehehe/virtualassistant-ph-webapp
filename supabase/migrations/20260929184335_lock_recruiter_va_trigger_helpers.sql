-- Lock recruiter-to-VA trigger-only validators out of the Data API.
-- These helpers are invoked only by database triggers and are not application RPCs.

revoke execute on function public.validate_recruiter_va_thread() from public, anon, authenticated;
revoke execute on function public.validate_recruiter_va_message() from public, anon, authenticated;

grant execute on function public.validate_recruiter_va_thread() to service_role;
grant execute on function public.validate_recruiter_va_message() to service_role;
