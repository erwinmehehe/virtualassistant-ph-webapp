drop function if exists public.list_own_auth_sessions();
drop function if exists public.revoke_own_auth_session(uuid);

create or replace function public.list_auth_sessions_for_user(target_user_id uuid)
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
  where s.user_id = target_user_id
    and (s.not_after is null or s.not_after > pg_catalog.now())
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_auth_sessions_for_user(uuid) from public, anon, authenticated;
grant execute on function public.list_auth_sessions_for_user(uuid) to service_role;

create or replace function public.revoke_auth_session_for_user(
  target_user_id uuid,
  target_session_id uuid,
  current_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if target_user_id is null
     or target_session_id is null
     or current_session_id is null
     or target_session_id = current_session_id then
    return false;
  end if;

  delete from auth.sessions
  where id = target_session_id
    and user_id = target_user_id;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.revoke_auth_session_for_user(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.revoke_auth_session_for_user(uuid, uuid, uuid) to service_role;
