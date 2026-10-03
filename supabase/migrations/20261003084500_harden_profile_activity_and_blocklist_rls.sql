-- Keep the service-only lead blocklist intent explicit without granting client table privileges.
create policy "lead blocklist deny clients"
on public.lead_blocklist
for all
to anon, authenticated
using (false)
with check (false);

-- Allow authenticated users to update only their own activity heartbeat.
grant update (last_active_at) on public.profiles to authenticated;

create policy "profiles own activity update"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
