-- Keep outbound_email_events.status aligned with the states emitted by
-- src/lib/email.ts and the Resend webhook. The old constraint rejected
-- 'sending' before the atomic idempotency claim could reserve a key.

alter table public.outbound_email_events
  drop constraint if exists outbound_email_events_status_check;

alter table public.outbound_email_events
  add constraint outbound_email_events_status_check
  check (
    status in (
      'sending',
      'sent',
      'failed',
      'delivered',
      'bounced',
      'complained',
      'suppressed',
      'skipped_quota',
      'suppression_unavailable',
      'duplicate_prevented'
    )
  );
