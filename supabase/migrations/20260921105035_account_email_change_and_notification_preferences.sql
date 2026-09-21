create table if not exists public.account_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hiring_updates boolean not null default true,
  booking_reminders boolean not null default true,
  candidate_activity boolean not null default true,
  product_emails boolean not null default false,
  security_alerts boolean not null default true check (security_alerts = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_notification_preferences enable row level security;

revoke all on public.account_notification_preferences from anon;
grant select, insert, update on public.account_notification_preferences to authenticated;
revoke delete on public.account_notification_preferences from authenticated;

drop policy if exists "users read own notification preferences" on public.account_notification_preferences;
create policy "users read own notification preferences"
  on public.account_notification_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users create own notification preferences" on public.account_notification_preferences;
create policy "users create own notification preferences"
  on public.account_notification_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id and security_alerts = true);

drop policy if exists "users update own notification preferences" on public.account_notification_preferences;
create policy "users update own notification preferences"
  on public.account_notification_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and security_alerts = true);

create table if not exists public.account_email_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  new_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  confirmed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists account_email_change_requests_user_created_idx
  on public.account_email_change_requests (user_id, created_at desc);

alter table public.account_email_change_requests enable row level security;
revoke all on public.account_email_change_requests from anon, authenticated;

drop policy if exists "server only email change requests" on public.account_email_change_requests;
create policy "server only email change requests"
  on public.account_email_change_requests
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.get_account_notification_preferences_by_email(target_email text)
returns table (
  hiring_updates boolean,
  booking_reminders boolean,
  candidate_activity boolean,
  product_emails boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    p.hiring_updates,
    p.booking_reminders,
    p.candidate_activity,
    p.product_emails
  from public.account_notification_preferences p
  join auth.users u on u.id = p.user_id
  where pg_catalog.lower(u.email) = pg_catalog.lower(target_email)
  limit 1;
$$;

revoke all on function public.get_account_notification_preferences_by_email(text) from public, anon, authenticated;
grant execute on function public.get_account_notification_preferences_by_email(text) to service_role;
