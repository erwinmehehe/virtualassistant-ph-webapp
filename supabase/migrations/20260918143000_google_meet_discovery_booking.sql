alter table public.lead_intake
  add column if not exists discovery_calendar_event_id text,
  add column if not exists discovery_meeting_provider text;

update public.lead_intake
set discovery_meeting_provider = case
  when discovery_meeting_url like '%zoom.%' then 'zoom'
  when discovery_meeting_url like '%meet.google.com%' then 'google_meet'
  else discovery_meeting_provider
end
where discovery_meeting_url is not null
  and discovery_meeting_provider is null;

comment on column public.lead_intake.discovery_calendar_event_id is
  'Provider event identifier for the calendar event backing a discovery call.';

comment on column public.lead_intake.discovery_meeting_provider is
  'Meeting provider for the discovery call, for example google_meet.';
