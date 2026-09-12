-- Enforce the 30-minute lead response target and aggregate the full conversion funnel.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.lead_intake
  add column if not exists first_response_due_at timestamptz;

update public.lead_intake
set first_response_due_at = created_at + interval '30 minutes'
where first_response_due_at is null;

create or replace function private.prepare_lead_response_sla()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.first_response_due_at := coalesce(new.first_response_due_at, new.created_at, now()) +
    case when new.first_response_due_at is null then interval '30 minutes' else interval '0 minutes' end;
  return new;
end;
$$;

drop trigger if exists prepare_lead_response_sla on public.lead_intake;
create trigger prepare_lead_response_sla
before insert on public.lead_intake
for each row execute function private.prepare_lead_response_sla();

create index if not exists lead_intake_first_response_due_idx
  on public.lead_intake (first_response_due_at)
  where first_contact_at is null and crm_stage = 'new';

create or replace function private.notify_staff_of_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, title, body, href)
  select
    p.id,
    'New client request',
    coalesce(nullif(new.company, ''), nullif(new.name, ''), 'A prospective client') ||
      ' needs a first response within 30 minutes.',
    '/workspace/recruiter/leads?view=attention'
  from public.profiles p
  where p.role in ('recruiter', 'admin')
    and p.account_status = 'active';
  return new;
end;
$$;

drop trigger if exists notify_staff_of_new_lead on public.lead_intake;
create trigger notify_staff_of_new_lead
after insert on public.lead_intake
for each row execute function private.notify_staff_of_new_lead();

create or replace function private.enforce_lead_response_sla()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  reminder_action text;
  reminder_title text;
  inserted_count integer := 0;
begin
  for item in
    select
      l.id as lead_id,
      l.first_response_due_at,
      coalesce(nullif(l.company, ''), nullif(l.name, ''), 'Client lead') as lead_name,
      p.id as recipient_id
    from public.lead_intake l
    join public.profiles p
      on p.role in ('recruiter', 'admin')
      and p.account_status = 'active'
      and (l.owner_id is null or p.id = l.owner_id)
    where l.crm_stage = 'new'
      and l.first_contact_at is null
      and l.first_response_due_at <= now() + interval '10 minutes'
  loop
    if item.first_response_due_at <= now() then
      reminder_action := 'first_response_overdue';
      reminder_title := '30-minute response target missed';
    else
      reminder_action := 'first_response_due_soon';
      reminder_title := 'Lead response due in 10 minutes';
    end if;

    insert into public.workflow_reminders (
      subject_type, subject_id, recipient_id, action,
      reminder_count, last_sent_at, updated_at
    ) values (
      'lead', item.lead_id, item.recipient_id, reminder_action,
      1, now(), now()
    )
    on conflict (subject_type, subject_id, recipient_id, action) do nothing;

    if found then
      insert into public.notifications (user_id, title, body, href)
      values (
        item.recipient_id,
        reminder_title,
        item.lead_name || ' is waiting for first contact.',
        '/workspace/recruiter/leads?view=attention'
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function private.prepare_lead_response_sla() from public, anon, authenticated;
revoke all on function private.notify_staff_of_new_lead() from public, anon, authenticated;
revoke all on function private.enforce_lead_response_sla() from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'lead-response-sla' limit 1;
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
  perform cron.schedule(
    'lead-response-sla',
    '*/5 * * * *',
    'select private.enforce_lead_response_sla()'
  );
end;
$$;

create or replace function public.recruiter_conversion_summary(p_since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'homepage_visits', count(*) filter (
      where event_name = 'page_view' and path in ('', '/')
    ),
    'form_starts', count(*) filter (where event_name = 'form_start'),
    'tracked_sessions', count(distinct session_id) filter (where session_id is not null)
  )
  from public.analytics_events
  where created_at >= p_since;
$$;

revoke all on function public.recruiter_conversion_summary(timestamptz) from public;
revoke all on function public.recruiter_conversion_summary(timestamptz) from anon, authenticated;
grant execute on function public.recruiter_conversion_summary(timestamptz) to service_role;

comment on function public.recruiter_conversion_summary(timestamptz)
is 'Returns top-of-funnel acquisition totals for recruiter conversion reporting. Service-role only.';
