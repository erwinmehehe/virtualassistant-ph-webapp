alter table public.outbound_email_events
  add column if not exists recipient_count integer not null default 0,
  add column if not exists priority text,
  add column if not exists idempotency_key text,
  add column if not exists skip_reason text,
  add column if not exists automation text;

alter table public.outbound_email_events
  drop constraint if exists outbound_email_events_priority_check;

alter table public.outbound_email_events
  add constraint outbound_email_events_priority_check
  check (priority is null or priority in ('critical','standard','low'));

alter table public.outbound_email_events
  drop constraint if exists outbound_email_events_recipient_count_check;

alter table public.outbound_email_events
  add constraint outbound_email_events_recipient_count_check
  check (recipient_count >= 0);

update public.outbound_email_events
set
  recipient_count = coalesce(array_length(string_to_array(recipient, ','), 1), 0),
  automation = coalesce(automation, event_type)
where recipient is not null
   or automation is null;

create index if not exists outbound_email_events_created_priority_idx
  on public.outbound_email_events (created_at desc, priority);

create index if not exists outbound_email_events_idempotency_key_idx
  on public.outbound_email_events (idempotency_key)
  where idempotency_key is not null;
