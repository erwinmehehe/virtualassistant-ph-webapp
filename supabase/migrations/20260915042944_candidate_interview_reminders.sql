-- Hourly candidate interview reminders and automatic completion.

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
        (r.client_id,'Interview tomorrow: '||r.title,'Your candidate interview is about 24 hours away. Open Interviews for the Zoom link and details.','/workspace/client/interviews','interview','high'),
        (r.va_id,'Interview tomorrow: '||r.title,'Your client interview is about 24 hours away. Open Interviews for the Zoom link and details.','/workspace/va/interviews','interview','high');
      update candidate_interviews set reminder_24h_sent_at=now(),updated_at=now() where id=r.id;
      sent24:=sent24+1;
    end if;
    if r.reminder_1h_sent_at is null and r.scheduled_at between now()+interval '30 minutes' and now()+interval '90 minutes' then
      insert into notifications(user_id,title,body,href,type,priority) values
        (r.client_id,'Interview starts soon: '||r.title,'Your candidate interview starts in about an hour. Open Interviews for the Zoom link.','/workspace/client/interviews','interview','urgent'),
        (r.va_id,'Interview starts soon: '||r.title,'Your client interview starts in about an hour. Open Interviews for the Zoom link.','/workspace/va/interviews','interview','urgent');
      update candidate_interviews set reminder_1h_sent_at=now(),updated_at=now() where id=r.id;
      sent1:=sent1+1;
    end if;
  end loop;
  return jsonb_build_object('reminders_24h',sent24,'reminders_1h',sent1,'completed',completed);
end;
$$;

revoke execute on function public.candidate_interview_reminder_sweep() from public,anon,authenticated;
grant execute on function public.candidate_interview_reminder_sweep() to service_role;

select cron.schedule('candidate-interview-reminders-hourly','7 * * * *',$$select public.candidate_interview_reminder_sweep();$$)
where not exists(select 1 from cron.job where jobname='candidate-interview-reminders-hourly');
