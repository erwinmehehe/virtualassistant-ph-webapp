-- v4.13.8: give notifications a type.
--
-- The VA dashboard decided whether a notification was a recruiter request by
-- running /update|profile|recruiter/i over its title and body. Any notification
-- containing the word "update" was promoted into the next-best-action panel,
-- displacing real offers and interviews.
--
-- The column is nullable and additive: untagged notifications keep working
-- exactly as before, and senders can be tagged incrementally.

alter table public.notifications add column if not exists type text;

-- Only the typed rows are ever filtered on, so the index skips the rest.
create index if not exists notifications_user_type_idx
  on public.notifications(user_id, type)
  where type is not null;

-- Backfill the two the dashboard cares about, matched on the exact titles the
-- application has been sending.
update public.notifications
set type = 'profile_update_request'
where type is null
  and title = 'Please update your VA profile';

update public.notifications
set type = 'profile_approved'
where type is null
  and title = 'Your VA profile is approved';

select type, count(*) from public.notifications group by type order by 2 desc;
