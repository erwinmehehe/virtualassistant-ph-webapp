-- Make the server-only payment audit tables explicit to the RLS linter and
-- cover the actor FK used by audit/history queries.

drop policy if exists payment_events_browser_deny on public.payment_events;
create policy payment_events_browser_deny
on public.payment_events
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists payment_provider_events_browser_deny on public.payment_provider_events;
create policy payment_provider_events_browser_deny
on public.payment_provider_events
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists payment_events_actor_idx
  on public.payment_events(actor_id)
  where actor_id is not null;
