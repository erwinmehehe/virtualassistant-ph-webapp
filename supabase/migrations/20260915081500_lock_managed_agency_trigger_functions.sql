revoke execute on function public.assign_job_recruiter() from public, anon, authenticated;
revoke execute on function public.assign_lead_owner() from public, anon, authenticated;
revoke execute on function public.create_placement_followup_tasks() from public, anon, authenticated;
revoke execute on function public.enforce_client_visible_shortlist() from public, anon, authenticated;

grant execute on function public.assign_job_recruiter() to service_role;
grant execute on function public.assign_lead_owner() to service_role;
grant execute on function public.create_placement_followup_tasks() to service_role;
grant execute on function public.enforce_client_visible_shortlist() to service_role;
