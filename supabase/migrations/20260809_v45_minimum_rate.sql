-- v4.5.0: align the marketplace floor to USD 5.00/hour.
-- Exactly USD 5.00 is valid. Any amount below USD 5.00 is rejected.

begin;

-- Replace legacy anonymous check constraints without depending on generated names.
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.va_profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%hourly_rate%'
  loop
    execute format('alter table public.va_profiles drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.va_profiles
  add constraint va_profiles_hourly_rate_floor_check
  check (hourly_rate is null or hourly_rate >= 5) not valid;

do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%min_hourly_rate%'
  loop
    execute format('alter table public.jobs drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.jobs
  add constraint jobs_min_hourly_rate_floor_check
  check (min_hourly_rate is null or min_hourly_rate >= 5) not valid;

do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%max_hourly_rate%' or pg_get_constraintdef(oid) ilike '%max_hourly_rate >= min_hourly_rate%')
  loop
    execute format('alter table public.jobs drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.jobs
  add constraint jobs_max_hourly_rate_floor_check
  check (max_hourly_rate is null or max_hourly_rate >= 5) not valid;

alter table public.jobs
  add constraint jobs_hourly_rate_order_check
  check (min_hourly_rate is null or max_hourly_rate is null or max_hourly_rate >= min_hourly_rate) not valid;

alter table public.admin_settings alter column min_hourly_rate set default 5;
update public.admin_settings set min_hourly_rate = 5 where id = 1 and min_hourly_rate is distinct from 5;

create or replace function public.confirm_hire_transaction(
  p_application_id uuid,
  p_client_id uuid,
  p_va_id uuid,
  p_job_id uuid,
  p_agreed_rate numeric,
  p_start_date date,
  p_schedule text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_from_status public.application_status;
begin
  if p_agreed_rate is null or p_agreed_rate < 5 or p_agreed_rate > 1000 then
    raise exception 'Invalid agreed hourly rate';
  end if;
  if p_start_date is null then
    raise exception 'Start date is required';
  end if;
  if char_length(trim(coalesce(p_schedule, ''))) not between 3 and 500 then
    raise exception 'Agreed schedule is required';
  end if;

  select a.status into v_from_status
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = p_application_id
    and a.job_id = p_job_id
    and a.va_id = p_va_id
    and j.client_id = p_client_id
  for update of a;

  if not found then
    raise exception 'Application not found for this client';
  end if;
  if v_from_status in ('hired', 'rejected', 'withdrawn') then
    raise exception 'Application cannot be hired from status %', v_from_status;
  end if;

  update public.applications set status = 'hired' where id = p_application_id;

  insert into public.application_status_history(application_id, from_status, to_status, changed_by, note)
  values (p_application_id, v_from_status, 'hired', p_client_id,
    format('Final rate USD %s/hr; start %s; schedule confirmed', p_agreed_rate, p_start_date));

  insert into public.workrooms(application_id, job_id, client_id, va_id, status, agreed_hourly_rate, start_date, agreed_schedule)
  values (p_application_id, p_job_id, p_client_id, p_va_id, 'active', p_agreed_rate, p_start_date, trim(p_schedule))
  on conflict (application_id) do update set
    job_id = excluded.job_id,
    client_id = excluded.client_id,
    va_id = excluded.va_id,
    status = 'active',
    agreed_hourly_rate = excluded.agreed_hourly_rate,
    start_date = excluded.start_date,
    agreed_schedule = excluded.agreed_schedule
  returning id into v_room_id;

  insert into public.workroom_checklist(workroom_id, title, sort_order) values
    (v_room_id, 'Confirm access to required tools', 1),
    (v_room_id, 'Review SOPs and training materials', 2),
    (v_room_id, 'Confirm communication and feedback cadence', 3),
    (v_room_id, 'Agree on first-week priorities', 4)
  on conflict (workroom_id, title) do update set sort_order = excluded.sort_order;

  return v_room_id;
end;
$$;

revoke all on function public.confirm_hire_transaction(uuid, uuid, uuid, uuid, numeric, date, text) from public, anon, authenticated;
grant execute on function public.confirm_hire_transaction(uuid, uuid, uuid, uuid, numeric, date, text) to service_role;

commit;
