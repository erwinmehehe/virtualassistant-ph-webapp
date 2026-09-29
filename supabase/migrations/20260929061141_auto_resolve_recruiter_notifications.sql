
create or replace function private.notify_staff_of_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_recipient uuid;
begin
  v_recipient := coalesce(new.owner_id, public.default_recruiter_id());
  if v_recipient is null then
    return new;
  end if;

  insert into public.notifications (user_id, title, body, href, type)
  select
    p.id,
    'New client request',
    coalesce(nullif(new.company, ''), nullif(new.name, ''), 'A prospective client') ||
      ' needs a first response within 30 minutes.',
    '/workspace/recruiter/crm/' || new.id::text,
    'lead_first_response'
  from public.profiles p
  where p.id = v_recipient
    and p.role in ('recruiter', 'admin')
    and p.account_status = 'active';

  return new;
end;
$function$;

revoke execute on function private.notify_staff_of_new_lead() from public, anon, authenticated;

create or replace function private.resolve_lead_first_response_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.first_contact_at is not null
     or coalesce(new.crm_stage, 'new') <> 'new' then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where done_at is null
       and type = 'lead_first_response'
       and href = '/workspace/recruiter/crm/' || new.id::text;
  end if;
  return new;
end;
$function$;

drop trigger if exists resolve_lead_first_response_notifications on public.lead_intake;
create trigger resolve_lead_first_response_notifications
after update of first_contact_at, crm_stage on public.lead_intake
for each row
execute function private.resolve_lead_first_response_notifications();

revoke execute on function private.resolve_lead_first_response_notifications() from public, anon, authenticated;

create or replace function private.resolve_role_needs_candidates_from_shortlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.shortlist_status in ('proposed', 'released') then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where done_at is null
       and title like 'Role needs candidates:%'
       and href = '/workspace/recruiter/roles/' || new.job_id::text;
  end if;
  return new;
end;
$function$;

drop trigger if exists resolve_role_needs_candidates_from_shortlist on public.job_shortlist_candidates;
create trigger resolve_role_needs_candidates_from_shortlist
after insert or update of shortlist_status on public.job_shortlist_candidates
for each row
execute function private.resolve_role_needs_candidates_from_shortlist();

revoke execute on function private.resolve_role_needs_candidates_from_shortlist() from public, anon, authenticated;

create or replace function private.resolve_role_needs_candidates_from_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status in ('interview', 'offered') then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where done_at is null
       and title like 'Role needs candidates:%'
       and href = '/workspace/recruiter/roles/' || new.job_id::text;
  end if;
  return new;
end;
$function$;

drop trigger if exists resolve_role_needs_candidates_from_application on public.applications;
create trigger resolve_role_needs_candidates_from_application
after insert or update of status on public.applications
for each row
execute function private.resolve_role_needs_candidates_from_application();

revoke execute on function private.resolve_role_needs_candidates_from_application() from public, anon, authenticated;

create or replace function private.resolve_role_needs_candidates_from_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status not in ('pending', 'published')
     or (
       new.hiring_stage is not null
       and new.hiring_stage not in ('ready_to_recruit', 'sourcing')
     ) then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where done_at is null
       and title like 'Role needs candidates:%'
       and href = '/workspace/recruiter/roles/' || new.id::text;
  end if;
  return new;
end;
$function$;

drop trigger if exists resolve_role_needs_candidates_from_job on public.jobs;
create trigger resolve_role_needs_candidates_from_job
after update of hiring_stage, status on public.jobs
for each row
execute function private.resolve_role_needs_candidates_from_job();

revoke execute on function private.resolve_role_needs_candidates_from_job() from public, anon, authenticated;

update public.notifications
   set done_at = coalesce(done_at, now()),
       read_at = coalesce(read_at, now()),
       snoozed_until = null
 where done_at is null
   and title in ('New client request', 'Lead response due in 10 minutes', '30-minute response target missed')
   and href = '/workspace/recruiter/leads?view=attention'
   and created_at < now() - interval '24 hours';

update public.notifications n
   set done_at = coalesce(n.done_at, now()),
       read_at = coalesce(n.read_at, now()),
       snoozed_until = null
 where n.done_at is null
   and n.title like 'Role needs candidates:%'
   and n.href ~ '^/workspace/recruiter/roles/[0-9a-f-]{36}$'
   and exists (
     select 1
     from public.jobs j
     where j.id = substring(n.href from '/workspace/recruiter/roles/([0-9a-f-]{36})')::uuid
       and (
         j.status not in ('pending', 'published')
         or (j.hiring_stage is not null and j.hiring_stage not in ('ready_to_recruit', 'sourcing'))
         or exists (
           select 1
           from public.job_shortlist_candidates s
           where s.job_id = j.id
             and s.shortlist_status in ('proposed', 'released')
         )
         or exists (
           select 1
           from public.applications a
           where a.job_id = j.id
             and a.status in ('interview', 'offered')
         )
       )
   );
