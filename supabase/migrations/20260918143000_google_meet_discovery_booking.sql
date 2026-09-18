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


create or replace function public.candidate_interview_reminder_sweep()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare r record; sent24 integer:=0; sent1 integer:=0; completed integer:=0; begin
  for r in
    select ci.*,j.title
    from candidate_interviews ci join jobs j on j.id=ci.job_id
    where ci.status='scheduled' and ci.scheduled_at is not null
  loop
    if r.scheduled_at + make_interval(mins=>coalesce(r.duration_minutes,30)) <= now() then
      update candidate_interviews set status='completed',completed_at=coalesce(completed_at,now()),updated_at=now() where id=r.id;
      completed:=completed+1;
      continue;
    end if;
    if r.reminder_24h_sent_at is null and r.scheduled_at between now()+interval '23 hours' and now()+interval '25 hours' then
      insert into notifications(user_id,title,body,href,type,priority) values
        (r.client_id,'Interview tomorrow: '||r.title,'Your candidate interview is about 24 hours away. Open Interviews for the Google Meet link and details.','/workspace/client/interviews','interview','high'),
        (r.va_id,'Interview tomorrow: '||r.title,'Your client interview is about 24 hours away. Open Interviews for the Google Meet link and details.','/workspace/va/interviews','interview','high');
      update candidate_interviews set reminder_24h_sent_at=now(),updated_at=now() where id=r.id;
      sent24:=sent24+1;
    end if;
    if r.reminder_1h_sent_at is null and r.scheduled_at between now()+interval '30 minutes' and now()+interval '90 minutes' then
      insert into notifications(user_id,title,body,href,type,priority) values
        (r.client_id,'Interview starts soon: '||r.title,'Your candidate interview starts in about an hour. Open Interviews for the Google Meet link.','/workspace/client/interviews','interview','urgent'),
        (r.va_id,'Interview starts soon: '||r.title,'Your client interview starts in about an hour. Open Interviews for the Google Meet link.','/workspace/va/interviews','interview','urgent');
      update candidate_interviews set reminder_1h_sent_at=now(),updated_at=now() where id=r.id;
      sent1:=sent1+1;
    end if;
  end loop;
  return jsonb_build_object('reminders_24h',sent24,'reminders_1h',sent1,'completed',completed);
end;
$$;

revoke execute on function public.candidate_interview_reminder_sweep() from public,anon,authenticated;
grant execute on function public.candidate_interview_reminder_sweep() to service_role;
