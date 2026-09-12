-- v4150: Make the existing RLS-with-no-policy tables explicitly server-only.
-- These tables already deny anon/authenticated row access because RLS is enabled
-- and no policies exist. Revoking table privileges makes that intent explicit and
-- removes unnecessary Data API privileges without changing allowed application flows.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'action_rate_limits',
    'admin_audit_log',
    'admin_settings',
    'analytics_events',
    'app_error_events',
    'bench_memberships',
    'job_shortlist_candidates',
    'lead_intake',
    'outbound_email_events',
    'recruiter_activity',
    'recruiter_notes',
    'skills_tests',
    'va_profile_reminders',
    'vetting_scorecards',
    'web_design_pampanga_leads',
    'workflow_reminders'
  ] loop
    execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);
  end loop;
end
$$;
