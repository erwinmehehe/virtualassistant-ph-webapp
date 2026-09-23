-- Prevent concurrent workers from sending the same idempotent email twice.
-- Only in-flight and provider-accepted deliveries reserve a key so failed or
-- skipped attempts remain retryable.
drop index if exists public.outbound_email_events_idempotency_key_idx;

create unique index outbound_email_events_idempotency_key_idx
  on public.outbound_email_events (idempotency_key)
  where idempotency_key is not null
    and status in ('sending', 'sent', 'delivered', 'bounced', 'complained');
