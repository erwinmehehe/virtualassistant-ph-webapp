-- The recruiter-role repair runs only as a database trigger.
-- It must not be callable through PostgREST RPC by public users.

revoke execute on function public.reassign_open_client_leads_after_recruiter_change() from public;
revoke execute on function public.reassign_open_client_leads_after_recruiter_change() from anon;
revoke execute on function public.reassign_open_client_leads_after_recruiter_change() from authenticated;
grant execute on function public.reassign_open_client_leads_after_recruiter_change() to service_role;
