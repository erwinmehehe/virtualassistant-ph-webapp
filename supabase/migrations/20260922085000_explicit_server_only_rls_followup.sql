-- Make newly added server-only operational tables explicit to the RLS advisor.
-- Client access stays denied; service_role continues to bypass RLS.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'candidate_interviews',
    'email_suppressions',
    'placement_checkins',
    'placement_offers',
    'placement_support_requests',
    'va_public_profile_consent_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'server_only_no_client_access', table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      'server_only_no_client_access',
      table_name
    );
  end loop;
end
$$;
