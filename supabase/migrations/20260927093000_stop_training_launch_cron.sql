do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'va-training-announcement-hourly'
  ) then
    perform cron.unschedule('va-training-announcement-hourly');
  end if;
end
$$;
