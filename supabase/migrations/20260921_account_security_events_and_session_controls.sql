create table if not exists public.account_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  session_id uuid null,
  ip inet null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists account_security_events_user_created_idx
  on public.account_security_events (user_id, created_at desc);

alter table public.account_security_events enable row level security;

revoke all on public.account_security_events from anon;
revoke insert, update, delete on public.account_security_events from authenticated;
grant select on public.account_security_events to authenticated;

drop policy if exists "users read own account security events" on public.account_security_events;
create policy "users read own account security events"
  on public.account_security_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.list_own_auth_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  not_after timestamptz,
  refreshed_at timestamp,
  user_agent text,
  ip inet,
  aal text
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.not_after,
    s.refreshed_at,
    s.user_agent,
    s.ip,
    s.aal::text
  from auth.sessions s
  where s.user_id = (select auth.uid())
    and (s.not_after is null or s.not_after > now())
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_own_auth_sessions() from public, anon;
grant execute on function public.list_own_auth_sessions() to authenticated;

create or replace function public.revoke_own_auth_session(target_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_session_id uuid;
  deleted_count integer;
begin
  current_session_id := nullif((select auth.jwt()->>'session_id'), '')::uuid;

  if target_session_id is null or target_session_id = current_session_id then
    return false;
  end if;

  delete from auth.sessions
  where id = target_session_id
    and user_id = (select auth.uid());

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.revoke_own_auth_session(uuid) from public, anon;
grant execute on function public.revoke_own_auth_session(uuid) to authenticated;
