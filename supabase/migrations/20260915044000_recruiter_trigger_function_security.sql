-- Trigger functions must not be callable as public RPC endpoints.
revoke execute on function public.trigger_refresh_job_matches() from public, anon, authenticated;
revoke execute on function public.trigger_refresh_va_matches() from public, anon, authenticated;
revoke execute on function public.trigger_refresh_vetting_matches() from public, anon, authenticated;
revoke execute on function public.trigger_interview_request() from public, anon, authenticated;
