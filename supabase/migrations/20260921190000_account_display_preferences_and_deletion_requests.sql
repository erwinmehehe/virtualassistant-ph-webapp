create table if not exists public.account_display_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  date_format text not null default 'medium' check (date_format in ('medium', 'short')),
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_display_preferences enable row level security;

revoke all on public.account_display_preferences from anon;
revoke delete on public.account_display_preferences from authenticated;
grant select, insert, update on public.account_display_preferences to authenticated;

drop policy if exists "users read own account display preferences" on public.account_display_preferences;
create policy "users read own account display preferences"
  on public.account_display_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users insert own account display preferences" on public.account_display_preferences;
create policy "users insert own account display preferences"
  on public.account_display_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own account display preferences" on public.account_display_preferences;
create policy "users update own account display preferences"
  on public.account_display_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status = 'pending'),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

revoke all on public.account_deletion_requests from anon;
revoke delete on public.account_deletion_requests from authenticated;
grant select, insert, update on public.account_deletion_requests to authenticated;

drop policy if exists "users read own account deletion requests" on public.account_deletion_requests;
create policy "users read own account deletion requests"
  on public.account_deletion_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users insert own account deletion requests" on public.account_deletion_requests;
create policy "users insert own account deletion requests"
  on public.account_deletion_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own account deletion requests" on public.account_deletion_requests;
create policy "users update own account deletion requests"
  on public.account_deletion_requests
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
