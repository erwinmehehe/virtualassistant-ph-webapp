-- Run discovery-call reminder delivery independently of Vercel's daily maintenance cron.
-- A random scheduler token is generated inside Supabase Vault and is never stored in source.

do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'discovery_reminder_cron_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'discovery_reminder_cron_token',
      'Authenticates Supabase pg_cron requests to the discovery reminder endpoint'
    );
  end if;
end
$$;

create or replace function public.verify_discovery_reminder_cron_token(candidate text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'discovery_reminder_cron_token'
      and secret = candidate
  );
$$;

revoke all on function public.verify_discovery_reminder_cron_token(text) from public, anon, authenticated;
grant execute on function public.verify_discovery_reminder_cron_token(text) to service_role;

create or replace function private.trigger_discovery_reminder_sweep()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  scheduler_token text;
begin
  select secret
  into scheduler_token
  from vault.decrypted_secrets
  where name = 'discovery_reminder_cron_token'
  limit 1;

  if scheduler_token is null then
    return null;
  end if;

  return net.http_get(
    url := 'https://virtualassistant.com.ph/api/cron/discovery-reminders',
    params := '{}'::jsonb,
    headers := jsonb_build_object('x-discovery-cron-token', scheduler_token),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.trigger_discovery_reminder_sweep() from public, anon, authenticated;
grant execute on function private.trigger_discovery_reminder_sweep() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'discovery-reminder-sweep'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end
$$;

select cron.schedule(
  'discovery-reminder-sweep',
  '*/15 * * * *',
  'select private.trigger_discovery_reminder_sweep();'
);
