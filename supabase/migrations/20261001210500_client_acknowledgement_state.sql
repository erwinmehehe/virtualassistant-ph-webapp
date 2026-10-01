-- Distinguish the automatic receipt email from real recruiter contact.
-- "New" continues to mean no human recruiter contact has happened yet.

alter table public.lead_intake
  add column if not exists acknowledgement_sent_at timestamptz;

comment on column public.lead_intake.acknowledgement_sent_at is
  'Timestamp of the automatic client hiring acknowledgement. Does not count as recruiter first_contact_at.';

with acknowledgements as (
  select
    substring(idempotency_key from '^lead-acknowledgement-([0-9a-f-]{36})$')::uuid as lead_id,
    min(created_at) as sent_at
  from public.outbound_email_events
  where event_type='lead_acknowledgement'
    and status in ('sent','delivered')
    and idempotency_key ~ '^lead-acknowledgement-[0-9a-f-]{36}$'
  group by 1
)
update public.lead_intake l
set acknowledgement_sent_at=a.sent_at
from acknowledgements a
where l.id=a.lead_id
  and l.acknowledgement_sent_at is null;
