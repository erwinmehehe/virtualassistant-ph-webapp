-- v4151: Make intentionally server-only RLS tables explicit.
-- Client table privileges are already revoked by v4150. These rejection policies
-- document the intended no-client-access posture and satisfy the Supabase RLS
-- advisor without granting any new access. service_role continues to bypass RLS.

do $$
declare
  table_name text;
  policy_name text;
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
    policy_name := 'server_only_no_client_access';
    execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      policy_name,
      table_name
    );
  end loop;
end
$$;
