-- Keep pg_net out of the API-exposed public schema.
-- The extension still creates and uses its own net schema.
-- Refuse to reinstall while requests are queued so no in-flight request is lost.

do $$
begin
  if (select count(*) from net.http_request_queue) <> 0 then
    raise exception 'pg_net request queue is not empty; refusing to reinstall';
  end if;
end
$$;

drop extension pg_net;
create extension pg_net with schema extensions;
