-- VirtualAssistant.com.ph v4.0 conversion and product-safety upgrade

alter table public.jobs
  add column if not exists requested_va_id uuid references public.profiles(id) on delete set null;
create index if not exists jobs_requested_va_id_idx on public.jobs(requested_va_id);

alter table public.workrooms
  add column if not exists agreed_hourly_rate numeric(8,2),
  add column if not exists start_date date,
  add column if not exists agreed_schedule text;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  referrer text,
  session_id text,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events(session_id, created_at desc);
alter table public.analytics_events enable row level security;

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists application_status_history_app_idx on public.application_status_history(application_id, created_at);
alter table public.application_status_history enable row level security;
drop policy if exists "application participants read status history" on public.application_status_history;
create policy "application participants read status history" on public.application_status_history for select using (
  exists (
    select 1 from public.applications a
    left join public.jobs j on j.id = a.job_id
    where a.id = application_id
      and (a.va_id = auth.uid() or j.client_id = auth.uid())
  )
);


-- Atomically confirm a placement so application state, workroom terms, and onboarding cannot diverge.
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

  update public.applications
    set status = 'hired'
    where id = p_application_id;

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

alter table public.time_entries
  add column if not exists status text not null default 'pending',
  add column if not exists client_note text,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.time_entries add constraint time_entries_status_check check (status in ('pending','approved','changes_requested'));
exception when duplicate_object then null; end $$;

drop policy if exists "va deletes own time" on public.time_entries;
create policy "va deletes unapproved own time" on public.time_entries for delete using (
  auth.uid() = va_id and status <> 'approved'
);

-- Profile edits are server-only so material changes to approved public evidence can trigger re-review.
drop policy if exists "client profile own" on public.client_profiles;
drop policy if exists "va profile own" on public.va_profiles;
drop policy if exists "client profile own read" on public.client_profiles;
drop policy if exists "va profile own read" on public.va_profiles;
create policy "client profile own read" on public.client_profiles for select using (auth.uid() = user_id);
create policy "va profile own read" on public.va_profiles for select using (auth.uid() = user_id);

-- Harden workflow integrity: sensitive state changes are server-only after role/ownership checks.
-- This prevents authenticated users from bypassing application actions through direct Supabase API calls.
drop policy if exists "clients own jobs insert" on public.jobs;
drop policy if exists "clients own jobs update" on public.jobs;
drop policy if exists "clients own jobs delete" on public.jobs;

drop policy if exists "va create applications" on public.applications;
drop policy if exists "va withdraw application" on public.applications;
drop policy if exists "clients update job applications" on public.applications;

drop policy if exists "client create invites" on public.job_invites;
drop policy if exists "invite participant update" on public.job_invites;

drop policy if exists "conversation participants insert" on public.conversations;
drop policy if exists "message participants update" on public.messages;

drop policy if exists "client creates workroom" on public.workrooms;
drop policy if exists "workroom participants update" on public.workrooms;
drop policy if exists "workroom checklist participants update" on public.workroom_checklist;
drop policy if exists "client creates workroom checklist" on public.workroom_checklist;
drop policy if exists "client creates workroom tasks" on public.workroom_tasks;
drop policy if exists "workroom task participants update" on public.workroom_tasks;

drop policy if exists "va logs own time" on public.time_entries;
drop policy if exists "va logs own pending time" on public.time_entries;
create policy "va logs own pending time" on public.time_entries for insert with check (
  auth.uid() = va_id
  and status = 'pending'
  and exists (select 1 from public.workrooms w where w.id = workroom_id and w.va_id = auth.uid())
);

drop policy if exists "notifications own" on public.notifications;
drop policy if exists "notifications own read" on public.notifications;
drop policy if exists "notifications own update" on public.notifications;
drop policy if exists "notifications own delete" on public.notifications;
create policy "notifications own read" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications own update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications own delete" on public.notifications for delete using (auth.uid() = user_id);
