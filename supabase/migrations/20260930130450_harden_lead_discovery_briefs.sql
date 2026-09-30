-- Production-applied 2026-09-30.
-- Keep discovery sales briefs server-only even when the public schema is exposed through the Data API.

revoke all on table public.lead_discovery_briefs from anon, authenticated;
grant all on table public.lead_discovery_briefs to service_role;

create policy "lead_discovery_briefs_server_only"
on public.lead_discovery_briefs
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
