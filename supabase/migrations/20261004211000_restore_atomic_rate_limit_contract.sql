-- Restore the atomic action rate limiter that is already present in production.
-- The 2026-09-22 application hardening switched rate limiting to this RPC,
-- but the production database hotfix was never captured in migration history.
-- Browser roles remain explicitly denied; only trusted service_role code may call it.

begin;

create table if not exists public.action_rate_limits (
  id uuid primary key default gen_random_uuid(),
  action_key text not null,
  subject_hash text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint action_rate_limits_action_key_subject_hash_key unique (action_key, subject_hash)
);

create index if not exists action_rate_limits_updated_idx
  on public.action_rate_limits (updated_at);

alter table public.action_rate_limits enable row level security;

revoke all privileges on table public.action_rate_limits from anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger
  on table public.action_rate_limits
  to service_role;

drop policy if exists server_only_no_client_access on public.action_rate_limits;
create policy server_only_no_client_access
  on public.action_rate_limits
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.consume_action_rate_limit(
  p_action_key text,
  p_subject_hash text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = 'pg_catalog'
as $rate_limit$
declare
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
begin
  if coalesce(length(btrim(p_action_key)), 0) = 0
     or coalesce(length(btrim(p_subject_hash)), 0) = 0
     or p_max_attempts < 1
     or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.action_rate_limits(
    action_key,
    subject_hash,
    attempts,
    window_started_at,
    updated_at
  )
  values(
    p_action_key,
    p_subject_hash,
    1,
    v_now,
    v_now
  )
  on conflict (action_key, subject_hash)
  do update set
    attempts = case
      when public.action_rate_limits.window_started_at <= v_now - (p_window_seconds * interval '1 second')
        then 1
      else public.action_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.action_rate_limits.window_started_at <= v_now - (p_window_seconds * interval '1 second')
        then v_now
      else public.action_rate_limits.window_started_at
    end,
    updated_at = v_now
  returning attempts into v_attempts;

  return v_attempts <= p_max_attempts;
end;
$rate_limit$;

revoke all on function public.consume_action_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_action_rate_limit(text, text, integer, integer)
  to service_role;

commit;
