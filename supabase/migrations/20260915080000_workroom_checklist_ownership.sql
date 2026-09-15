alter table public.workroom_checklist add column if not exists owner_role text;
update public.workroom_checklist set owner_role=case when title='Review SOPs and training materials' then 'va' else 'client' end where owner_role is null;
alter table public.workroom_checklist alter column owner_role set default 'client';
alter table public.workroom_checklist alter column owner_role set not null;
alter table public.workroom_checklist drop constraint if exists workroom_checklist_owner_role_check;
alter table public.workroom_checklist add constraint workroom_checklist_owner_role_check check(owner_role in ('client','va'));

create or replace function public.confirm_hire_transaction(p_application_id uuid,p_client_id uuid,p_va_id uuid,p_job_id uuid,p_agreed_rate numeric,p_start_date date,p_schedule text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_room_id uuid; v_from_status public.application_status; begin
  if p_agreed_rate is null or p_agreed_rate<5 or p_agreed_rate>1000 then raise exception 'Invalid agreed hourly rate'; end if;
  if p_start_date is null then raise exception 'Start date is required'; end if;
  if char_length(trim(coalesce(p_schedule,''))) not between 3 and 500 then raise exception 'Agreed schedule is required'; end if;
  select a.status into v_from_status from public.applications a join public.jobs j on j.id=a.job_id where a.id=p_application_id and a.job_id=p_job_id and a.va_id=p_va_id and j.client_id=p_client_id for update of a;
  if not found then raise exception 'Application not found for this client'; end if;
  if v_from_status in ('hired','rejected','withdrawn') then raise exception 'Application cannot be hired from status %',v_from_status; end if;
  update public.applications set status='hired' where id=p_application_id;
  insert into public.application_status_history(application_id,from_status,to_status,changed_by,note) values(p_application_id,v_from_status,'hired',p_client_id,format('Final rate USD %s/hr; start %s; schedule confirmed',p_agreed_rate,p_start_date));
  insert into public.workrooms(application_id,job_id,client_id,va_id,status,agreed_hourly_rate,start_date,agreed_schedule) values(p_application_id,p_job_id,p_client_id,p_va_id,'active',p_agreed_rate,p_start_date,trim(p_schedule)) on conflict(application_id) do update set job_id=excluded.job_id,client_id=excluded.client_id,va_id=excluded.va_id,status='active',agreed_hourly_rate=excluded.agreed_hourly_rate,start_date=excluded.start_date,agreed_schedule=excluded.agreed_schedule returning id into v_room_id;
  insert into public.workroom_checklist(workroom_id,title,sort_order,owner_role) values
    (v_room_id,'Provide access to required tools and accounts',1,'client'),
    (v_room_id,'Review SOPs and training materials',2,'va'),
    (v_room_id,'Confirm communication and feedback cadence',3,'client'),
    (v_room_id,'Set first-week priorities and success expectations',4,'client')
  on conflict(workroom_id,title) do update set sort_order=excluded.sort_order,owner_role=excluded.owner_role;
  return v_room_id;
end;
$$;
