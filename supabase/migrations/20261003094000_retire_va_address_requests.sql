-- Retire the pre-placement home-address request workflow.
-- Existing saved addresses are preserved; this only closes outstanding prompts.
update public.notifications
set done_at = coalesce(done_at, now()),
    read_at = coalesce(read_at, now()),
    snoozed_until = null
where type = 'private_address_request'
  and done_at is null;
