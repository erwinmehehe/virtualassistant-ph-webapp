-- Record the production profile-activity and lead-blocklist RLS hardening.
-- Idempotent because production received this hotfix before the migration file landed on main.

drop policy if exists "lead blocklist deny clients" on public.lead_blocklist;
create policy "lead blocklist deny clients"
on public.lead_blocklist
for all
to anon, authenticated
using (false)
with check (false);

grant update (last_active_at) on public.profiles to authenticated;

drop policy if exists "profiles own activity update" on public.profiles;
create policy "profiles own activity update"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
