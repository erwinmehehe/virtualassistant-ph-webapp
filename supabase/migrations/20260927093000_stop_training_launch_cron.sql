do $$
begin
  perform cron.unschedule('va-training-announcement-hourly');
exception
  when others then
    if sqlstate <> 'P0001' then
      raise;
    end if;
end
$$;
