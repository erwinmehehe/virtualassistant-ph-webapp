drop policy if exists "message_flags_server_only" on public.message_flags;
create policy "message_flags_server_only"
on public.message_flags
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists message_flags_reviewed_by_idx
  on public.message_flags(reviewed_by)
  where reviewed_by is not null;

create index if not exists profiles_banned_by_idx
  on public.profiles(banned_by)
  where banned_by is not null;
