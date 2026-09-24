-- Normalize historical discovery rows where a later cancellation superseded
-- an earlier reschedule. Keep old calendar/provider fields for audit history.
update public.lead_intake
set discovery_outcome = 'cancelled'
where discovery_outcome = 'rescheduled'
  and discovery_cancelled_at is not null
  and discovery_scheduled_at is null;
