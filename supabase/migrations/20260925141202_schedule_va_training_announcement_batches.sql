create or replace function private.trigger_va_training_announcement_sweep()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  scheduler_token text;
begin
  select decrypted_secret
  into scheduler_token
  from vault.decrypted_secrets
  where name = 'discovery_reminder_cron_token'
  limit 1;

  if scheduler_token is null then
    return null;
  end if;

  return net.http_get(
    url := 'https://virtualassistant.com.ph/api/cron/va-training-announcement',
    headers := jsonb_build_object('x-discovery-cron-token', scheduler_token),
    timeout_milliseconds := 120000
  );
end;
$$;

revoke all on function private.trigger_va_training_announcement_sweep() from public, anon, authenticated;

select cron.schedule(
  'va-training-announcement-hourly',
  '37 * * * *',
  $$select private.trigger_va_training_announcement_sweep();$$
);
