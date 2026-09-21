create or replace function public.merge_discovery_booking_lead(
  canonical_lead_id uuid,
  booking_lead_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical_row public.lead_intake%rowtype;
  booking_row public.lead_intake%rowtype;
  merged_message text;
begin
  if canonical_lead_id is null
     or booking_lead_id is null
     or canonical_lead_id = booking_lead_id then
    raise exception 'Invalid lead merge request';
  end if;

  select *
  into canonical_row
  from public.lead_intake
  where id = canonical_lead_id
  for update;

  select *
  into booking_row
  from public.lead_intake
  where id = booking_lead_id
  for update;

  if canonical_row.id is null or booking_row.id is null then
    raise exception 'Lead merge target not found';
  end if;

  if lower(trim(coalesce(canonical_row.email, ''))) <> lower(trim(coalesce(booking_row.email, ''))) then
    raise exception 'Lead emails do not match';
  end if;

  if lower(trim(coalesce(canonical_row.company, ''))) <> lower(trim(coalesce(booking_row.company, ''))) then
    raise exception 'Lead companies do not match';
  end if;

  if canonical_row.discovery_scheduled_at is not null then
    raise exception 'Canonical lead already has a discovery booking';
  end if;

  if booking_row.discovery_scheduled_at is null then
    raise exception 'Booking lead has no discovery slot';
  end if;

  merged_message := case
    when nullif(trim(canonical_row.message), '') is null then booking_row.message
    when nullif(trim(booking_row.message), '') is null then canonical_row.message
    when trim(canonical_row.message) = trim(booking_row.message) then canonical_row.message
    else canonical_row.message || E'\n\n--- Discovery booking details ---\n' || booking_row.message
  end;

  -- Release unique booking keys from the temporary booking row before moving
  -- them onto the canonical hiring lead.
  update public.lead_intake
  set
    discovery_scheduled_at = null,
    discovery_manage_token_hash = null
  where id = booking_lead_id;

  update public.lead_intake
  set
    name = coalesce(nullif(trim(booking_row.name), ''), canonical_row.name),
    phone = coalesce(nullif(trim(booking_row.phone), ''), canonical_row.phone),
    service = coalesce(nullif(trim(booking_row.service), ''), canonical_row.service),
    company = coalesce(nullif(trim(booking_row.company), ''), canonical_row.company),
    hours = coalesce(nullif(trim(booking_row.hours), ''), canonical_row.hours),
    budget = coalesce(nullif(trim(booking_row.budget), ''), canonical_row.budget),
    start_time = coalesce(nullif(trim(booking_row.start_time), ''), canonical_row.start_time),
    timezone = coalesce(nullif(trim(booking_row.timezone), ''), canonical_row.timezone),
    message = merged_message,
    status = booking_row.status,
    crm_stage = booking_row.crm_stage,
    client_id = coalesce(booking_row.client_id, canonical_row.client_id),
    stage_updated_at = booking_row.stage_updated_at,
    discovery_scheduled_at = booking_row.discovery_scheduled_at,
    discovery_duration_minutes = booking_row.discovery_duration_minutes,
    discovery_meeting_url = booking_row.discovery_meeting_url,
    discovery_notes = concat_ws(E'\n\n',
      nullif(trim(canonical_row.discovery_notes), ''),
      nullif(trim(booking_row.discovery_notes), '')
    ),
    discovery_manage_token_hash = booking_row.discovery_manage_token_hash,
    discovery_manage_token = booking_row.discovery_manage_token,
    discovery_zoom_meeting_id = booking_row.discovery_zoom_meeting_id,
    discovery_outcome = booking_row.discovery_outcome,
    discovery_cancelled_at = booking_row.discovery_cancelled_at,
    discovery_rescheduled_at = booking_row.discovery_rescheduled_at,
    discovery_reminder_24h_sent_at = booking_row.discovery_reminder_24h_sent_at,
    discovery_reminder_1h_sent_at = booking_row.discovery_reminder_1h_sent_at,
    discovery_calendar_event_id = booking_row.discovery_calendar_event_id,
    discovery_meeting_provider = booking_row.discovery_meeting_provider
  where id = canonical_lead_id;

  update public.jobs
  set lead_id = canonical_lead_id
  where lead_id = booking_lead_id;

  update public.lead_proposals
  set lead_id = canonical_lead_id
  where lead_id = booking_lead_id;

  update public.recruiter_activity
  set subject_id = canonical_lead_id
  where subject_type = 'lead'
    and subject_id = booking_lead_id;

  update public.recruiter_notes
  set subject_id = canonical_lead_id
  where subject_type = 'lead'
    and subject_id = booking_lead_id;

  update public.recruiter_tasks
  set subject_id = canonical_lead_id
  where subject_type = 'lead'
    and subject_id = booking_lead_id;

  update public.workflow_reminders
  set subject_id = canonical_lead_id
  where subject_type = 'lead'
    and subject_id = booking_lead_id;

  delete from public.lead_intake
  where id = booking_lead_id;

  return canonical_lead_id;
end;
$$;

revoke all on function public.merge_discovery_booking_lead(uuid, uuid) from public, anon, authenticated;
grant execute on function public.merge_discovery_booking_lead(uuid, uuid) to service_role;
