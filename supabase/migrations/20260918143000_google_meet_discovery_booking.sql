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


alter table public.candidate_interviews
  add column if not exists calendar_event_id text,
  add column if not exists meeting_provider text;

update public.candidate_interviews
set meeting_provider = case
  when meeting_url like '%zoom.%' then 'zoom'
  when meeting_url like '%meet.google.com%' then 'google_meet'
  else meeting_provider
end
where meeting_url is not null
  and meeting_provider is null;

comment on column public.candidate_interviews.calendar_event_id is
  'Google Calendar event ID backing the candidate interview.';
comment on column public.candidate_interviews.meeting_provider is
  'Meeting provider for the candidate interview, for example google_meet.';
