-- VirtualAssistant.com.ph standalone marketplace schema
-- Run in a new Supabase project's SQL editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('client', 'va', 'recruiter', 'admin');
create type public.job_status as enum ('draft', 'pending', 'published', 'closed');
create type public.application_status as enum ('new', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected', 'withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text,
  website text,
  industry text,
  timezone text,
  team_size text,
  hiring_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.va_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  slug text unique,
  headline text,
  bio text,
  primary_category text,
  categories text[] not null default '{}',
  skills text[] not null default '{}',
  tools text[] not null default '{}',
  industries text[] not null default '{}',
  languages text[] not null default '{}',
  years_experience integer check (years_experience is null or years_experience >= 0),
  weekly_hours integer check (weekly_hours is null or weekly_hours between 1 and 80),
  schedule text,
  overlap_hours integer check (overlap_hours is null or overlap_hours between 0 and 12),
  hourly_rate numeric(8,2) check (hourly_rate is null or hourly_rate >= 5),
  portfolio_url text,
  linkedin_url text,
  resume_path text,
  directory_visible boolean not null default false,
  availability_status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_intake (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  service text,
  company text,
  hours text,
  start_time text,
  timezone text,
  message text,
  source_page text,
  page_url text,
  session_id uuid,
  status text not null default 'new' check (status in ('new','converted','archived')),
  sales_stage text not null default 'new' check (sales_stage in ('new','contacted','qualified','proposal','won','lost')),
  follow_up_on date,
  sales_notes text check (char_length(sales_notes) <= 4000),
  client_id uuid references public.profiles(id) on delete set null,
  job_id uuid,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  client_id uuid references public.profiles(id) on delete set null,
  lead_id uuid unique references public.lead_intake(id) on delete set null,
  requested_va_id uuid references public.profiles(id) on delete set null,
  title text not null,
  company_name text,
  summary text,
  description text,
  responsibilities text[] not null default '{}',
  required_skills text[] not null default '{}',
  required_tools text[] not null default '{}',
  categories text[] not null default '{}',
  hours_per_week integer check (hours_per_week is null or hours_per_week between 1 and 80),
  min_hourly_rate numeric(8,2) check (min_hourly_rate is null or min_hourly_rate >= 5),
  max_hourly_rate numeric(8,2) check (max_hourly_rate is null or max_hourly_rate >= 5),
  constraint jobs_hourly_rate_order_check check (min_hourly_rate is null or max_hourly_rate is null or max_hourly_rate >= min_hourly_rate),
  timezone text,
  overlap_hours integer check (overlap_hours is null or overlap_hours between 0 and 12),
  live_coverage_exception boolean not null default false,
  schedule_notes text,
  onboarding_plan text,
  direct_feedback boolean not null default true,
  engagement_length text,
  start_timing text,
  service_model text not null default 'curated_placement' check (service_model in ('curated_placement','managed_service')),
  status public.job_status not null default 'draft',
  rejection_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_intake add constraint lead_intake_job_fk foreign key (job_id) references public.jobs(id) on delete set null;

create index jobs_client_id_idx on public.jobs(client_id);
create index jobs_requested_va_id_idx on public.jobs(requested_va_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_public_lookup_idx on public.jobs(status, slug, published_at desc);
create index jobs_categories_gin on public.jobs using gin(categories);

-- Public job URLs use a readable slug. Preserve the original slug when a title changes.
create or replace function public.ensure_job_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 2;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    return new;
  end if;

  base_slug := 'j-' || trim(both '-' from regexp_replace(lower(coalesce(nullif(new.title, ''), 'virtual-assistant-role')), '[^a-z0-9]+', '-', 'g'));
  if base_slug = 'j-' then
    base_slug := 'j-virtual-assistant-role';
  end if;
  candidate := base_slug;

  while exists(select 1 from public.jobs where slug = candidate and id <> new.id) loop
    candidate := base_slug || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists jobs_ensure_slug on public.jobs;
create trigger jobs_ensure_slug
before insert on public.jobs
for each row execute procedure public.ensure_job_slug();


create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'new',
  cover_note text,
  match_score integer check (match_score is null or match_score between 0 and 100),
  profile_snapshot jsonb not null default '{}'::jsonb,
  client_note text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, va_id)
);

create index applications_job_id_idx on public.applications(job_id);
create index applications_va_id_idx on public.applications(va_id);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index application_status_history_app_idx on public.application_status_history(application_id, created_at);

create table public.saved_jobs (
  va_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (va_id, job_id)
);

create table public.saved_vas (
  client_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, va_id)
);
create index saved_vas_client_created_idx on public.saved_vas(client_id, created_at desc);

create table public.job_invites (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(job_id, va_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

create table public.workrooms (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed')),
  kickoff_notes text,
  agreed_hourly_rate numeric(8,2),
  start_date date,
  agreed_schedule text,
  created_at timestamptz not null default now()
);

create table public.workroom_checklist (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  title text not null,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(workroom_id, title)
);

create table public.workroom_tasks (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null default current_date,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  note text,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  client_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 10 and 1600),
  visibility text not null default 'contract' check (visibility in ('public','contract')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_distinct_parties check (reviewer_id <> reviewee_id),
  unique (workroom_id, reviewer_id)
);

create index reviews_reviewee_idx on public.reviews(reviewee_id, created_at desc);
create index reviews_workroom_idx on public.reviews(workroom_id, created_at desc);

create or replace function public.validate_review_parties()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  room record;
begin
  select id, client_id, va_id into room from public.workrooms where id = new.workroom_id;
  if room.id is null then raise exception 'Workroom not found'; end if;
  if new.reviewer_id = room.client_id then
    if new.reviewee_id <> room.va_id then raise exception 'Client reviews must review the VA in this workroom'; end if;
  elsif new.reviewer_id = room.va_id then
    if new.reviewee_id <> room.client_id then raise exception 'VA reviews must review the client in this workroom'; end if;
    if new.visibility <> 'contract' then raise exception 'VA-to-client reviews are contract-only'; end if;
  else
    raise exception 'Reviewer is not a workroom participant';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_validate_parties on public.reviews;
create trigger reviews_validate_parties before insert or update on public.reviews
for each row execute procedure public.validate_review_parties();

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  referrer text,
  session_id text,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index analytics_events_session_idx on public.analytics_events(session_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_settings (
  id integer primary key default 1 check (id = 1),
  application_cc_email text not null default 'jrvsaccad@gmail.com',
  min_hourly_rate numeric(8,2) not null default 5,
  default_max_overlap integer not null default 4,
  default_placement_fee numeric(10,2) not null default 0,
  default_managed_markup_percent numeric(5,2) not null default 0,
  default_candidate_access_fee numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.admin_settings(id) values (1) on conflict do nothing;

-- Focus verticals keep the agency narrow enough to build reusable vetting and a reliable bench.
create table public.focus_verticals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  active boolean not null default true,
  bench_target integer not null default 5 check (bench_target between 1 and 25),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.focus_verticals (slug, name, description, bench_target, sort_order) values
  ('healthcare-dental', 'Healthcare & Dental', 'Front desk, scheduling, insurance support, billing coordination, and patient communication.', 5, 1),
  ('home-local-services', 'Home & Local Services', 'Moving, security, trades, dispatch, reception, customer support, and appointment coordination.', 5, 2),
  ('professional-growth', 'Professional Services & Growth', 'Executive support, lead generation, sales operations, marketing support, and client service.', 5, 3)
on conflict (slug) do nothing;

-- One short active test can be assigned to each VA category. Questions are stored as JSON so tests stay configurable.
create table public.skills_tests (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  title text not null,
  instructions text,
  duration_minutes integer not null default 20 check (duration_minutes between 5 and 90),
  passing_score integer not null default 70 check (passing_score between 1 and 100),
  questions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.va_test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.skills_tests(id) on delete restrict,
  va_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  auto_score integer check (auto_score is null or auto_score between 0 and 100),
  reviewer_score integer check (reviewer_score is null or reviewer_score between 0 and 100),
  final_score integer check (final_score is null or final_score between 0 and 100),
  reviewer_id uuid references public.profiles(id) on delete set null,
  review_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(test_id, va_id)
);

create table public.va_vetting (
  va_id uuid primary key references public.profiles(id) on delete cascade,
  stage text not null default 'profile' check (stage in ('profile','test','video','recruiter_review','finalist','approved','bench','rejected')),
  recruiter_id uuid references public.profiles(id) on delete set null,
  video_url text,
  video_submitted_at timestamptz,
  recruiter_interview_at timestamptz,
  recruiter_notes text,
  admin_notes text,
  approved_at timestamptz,
  rejected_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.vetting_scorecards (
  id uuid primary key default gen_random_uuid(),
  va_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  role_skills smallint not null check (role_skills between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  judgment smallint not null check (judgment between 1 and 5),
  reliability smallint not null check (reliability between 1 and 5),
  client_readiness smallint not null check (client_readiness between 1 and 5),
  total_score integer not null check (total_score between 20 and 100),
  recommendation text not null check (recommendation in ('reject','hold','finalist')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.bench_memberships (
  id uuid primary key default gen_random_uuid(),
  va_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  status text not null default 'active' check (status in ('active','paused')),
  priority integer not null default 3 check (priority between 1 and 5),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(va_id, category)
);

-- Commercial terms are private to the client and agency. Public job listings never expose these fields.
create table public.job_commercials (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  service_model text not null default 'curated_placement' check (service_model in ('curated_placement','managed_service')),
  placement_fee numeric(10,2),
  managed_markup_percent numeric(5,2),
  commercial_status text not null default 'not_quoted' check (commercial_status in ('not_quoted','quoted','accepted','invoiced','paid')),
  notes text,
  updated_at timestamptz not null default now()
);

-- Candidate identity/access is monetizable separately from job publication.
-- Application identity, private profiles, resumes, and messaging remain locked until paid/comped.
create table public.job_candidate_access (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  access_status text not null default 'locked' check (access_status in ('locked','requested','quoted','invoiced','paid','comped')),
  access_fee numeric(10,2) check (access_fee is null or access_fee >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  requested_at timestamptz,
  unlocked_at timestamptz,
  unlocked_by uuid references public.profiles(id) on delete set null,
  payment_reference text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.job_shortlist_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  match_confidence integer not null check (match_confidence between 0 and 100),
  shortlist_status text not null default 'proposed' check (shortlist_status in ('proposed','released','hidden')),
  staff_note text,
  created_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, va_id)
);
create index job_shortlist_candidates_job_idx on public.job_shortlist_candidates(job_id, shortlist_status);
create index job_shortlist_candidates_va_idx on public.job_shortlist_candidates(va_id);


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

-- Public-safe VA directory view. No email, phone, resume path, legal full name, or private account data.
create or replace view public.public_va_directory as
select
  v.user_id,
  v.slug,
  case
    when p.full_name is null or btrim(p.full_name) = '' then 'Vetted VA'
    when position(' ' in btrim(p.full_name)) = 0 then btrim(p.full_name)
    else split_part(btrim(p.full_name), ' ', 1) || ' ' || upper(left(reverse(split_part(reverse(btrim(p.full_name)), ' ', 1)), 1)) || '.'
  end as full_name,
  p.avatar_url,
  v.headline,
  v.bio,
  v.primary_category,
  v.categories,
  v.skills,
  v.tools,
  v.industries,
  v.languages,
  v.years_experience,
  v.weekly_hours,
  v.schedule,
  v.overlap_hours,
  null::text as portfolio_url,
  null::text as linkedin_url,
  v.availability_status,
  v.hourly_rate
from public.va_profiles v
join public.profiles p on p.id = v.user_id
join public.va_vetting vv on vv.va_id = v.user_id
where v.directory_visible = true
  and v.availability_status = 'available'
  and coalesce(v.years_experience, 0) >= 2
  and vv.stage in ('approved','bench');

revoke all on public.va_profiles from anon;
revoke all on public.profiles from anon;
grant select on public.public_va_directory to anon, authenticated;

create or replace view public.public_va_reviews as
select
  r.id,
  r.reviewee_id,
  r.rating,
  r.body,
  r.created_at,
  'Verified client'::text as reviewer_label
from public.reviews r
join public.workrooms w on w.id = r.workroom_id
join public.public_va_directory d on d.user_id = r.reviewee_id
where r.visibility = 'public'
  and r.reviewer_id = w.client_id
  and r.reviewee_id = w.va_id;

revoke all on public.public_va_reviews from anon, authenticated;
grant select on public.public_va_reviews to anon, authenticated;

-- Account bootstrap using signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case
    when new.raw_user_meta_data->>'role' = 'client' then 'client'::public.user_role
    else 'va'::public.user_role
  end;

  insert into public.profiles (id, role, full_name)
  values (new.id, requested_role, nullif(new.raw_user_meta_data->>'full_name', ''));

  if requested_role = 'client' then
    insert into public.client_profiles (user_id) values (new.id);
  elsif requested_role = 'va' then
    insert into public.va_profiles (user_id, slug)
    values (new.id, concat('va-', substr(new.id::text, 1, 8)));
    insert into public.va_vetting (va_id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Timestamp helper.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger client_profiles_touch before update on public.client_profiles for each row execute procedure public.touch_updated_at();
create trigger va_profiles_touch before update on public.va_profiles for each row execute procedure public.touch_updated_at();
create trigger jobs_touch before update on public.jobs for each row execute procedure public.touch_updated_at();
create trigger applications_touch before update on public.applications for each row execute procedure public.touch_updated_at();
create trigger workroom_tasks_touch before update on public.workroom_tasks for each row execute procedure public.touch_updated_at();
create trigger focus_verticals_touch before update on public.focus_verticals for each row execute procedure public.touch_updated_at();
create trigger skills_tests_touch before update on public.skills_tests for each row execute procedure public.touch_updated_at();
create trigger va_vetting_touch before update on public.va_vetting for each row execute procedure public.touch_updated_at();
create trigger bench_memberships_touch before update on public.bench_memberships for each row execute procedure public.touch_updated_at();
create trigger job_commercials_touch before update on public.job_commercials for each row execute procedure public.touch_updated_at();
create trigger job_candidate_access_touch before update on public.job_candidate_access for each row execute procedure public.touch_updated_at();
create trigger job_shortlist_candidates_touch before update on public.job_shortlist_candidates for each row execute procedure public.touch_updated_at();
create trigger reviews_touch before update on public.reviews for each row execute procedure public.touch_updated_at();

-- Row level security.
alter table public.lead_intake enable row level security;
alter table public.profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.va_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_invites enable row level security;
alter table public.conversations enable row level security;
alter table public.analytics_events enable row level security;
alter table public.application_status_history enable row level security;
alter table public.messages enable row level security;
alter table public.workrooms enable row level security;
alter table public.workroom_checklist enable row level security;
alter table public.workroom_tasks enable row level security;
alter table public.time_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_settings enable row level security;
alter table public.focus_verticals enable row level security;
alter table public.skills_tests enable row level security;
alter table public.va_test_attempts enable row level security;
alter table public.va_vetting enable row level security;
alter table public.vetting_scorecards enable row level security;
alter table public.bench_memberships enable row level security;
alter table public.job_commercials enable row level security;
alter table public.job_candidate_access enable row level security;
alter table public.job_shortlist_candidates enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_vas enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);

create policy "client profile own read" on public.client_profiles for select using (auth.uid() = user_id);
create policy "va profile own read" on public.va_profiles for select using (auth.uid() = user_id);
-- Profile mutations are server-only so approved public evidence cannot be changed outside re-review rules.

create policy "public published jobs" on public.jobs for select using (status = 'published');
create policy "clients own jobs read" on public.jobs for select using (auth.uid() = client_id);
-- Job creation/status changes are server-only after role and workflow validation.

create policy "va own applications" on public.applications for select using (auth.uid() = va_id);
-- Application creation/status changes are server-only after role and ownership validation.
create policy "clients see unlocked job applications" on public.applications for select using (
  exists (
    select 1 from public.jobs j
    join public.job_candidate_access ca on ca.job_id = j.id
    where j.id = job_id and j.client_id = auth.uid() and ca.access_status in ('paid','comped')
  )
);

create policy "saved jobs own" on public.saved_jobs for all using (auth.uid() = va_id) with check (auth.uid() = va_id);
create policy "clients own saved vas" on public.saved_vas for all to authenticated using (auth.uid() = client_id) with check (auth.uid() = client_id);

create policy "invites participant read" on public.job_invites for select using (auth.uid() = va_id or auth.uid() = client_id);


create policy "application participants read status history" on public.application_status_history for select using (
  exists (
    select 1 from public.applications a
    left join public.jobs j on j.id = a.job_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where a.id = application_id
      and (a.va_id = auth.uid() or (j.client_id = auth.uid() and ca.access_status in ('paid','comped')))
  )
);

create policy "conversation participants" on public.conversations for select using (
  auth.uid() = va_id
  or (
    auth.uid() = client_id
    and exists (
      select 1 from public.applications a
      join public.job_candidate_access ca on ca.job_id = a.job_id
      where a.id = application_id and ca.access_status in ('paid','comped')
    )
  )
);
-- Conversation creation and message read-state writes are server-only; message bodies remain immutable.
create policy "message participants read" on public.messages for select using (
  exists (
    select 1 from public.conversations c
    left join public.applications a on a.id = c.application_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where c.id = conversation_id
      and (c.va_id = auth.uid() or (c.client_id = auth.uid() and ca.access_status in ('paid','comped')))
  )
);
create policy "message participants send" on public.messages for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversations c
    left join public.applications a on a.id = c.application_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where c.id = conversation_id
      and (c.va_id = auth.uid() or (c.client_id = auth.uid() and ca.access_status in ('paid','comped')))
  )
);

create policy "workroom participants" on public.workrooms for select using (auth.uid() = client_id or auth.uid() = va_id);
-- Workroom, checklist, and task mutations are server actions after participant validation.

create policy "workroom checklist participants read" on public.workroom_checklist for select using (
  exists (select 1 from public.workrooms w where w.id = workroom_id and (w.client_id = auth.uid() or w.va_id = auth.uid()))
);

create policy "workroom task participants read" on public.workroom_tasks for select using (
  exists (select 1 from public.workrooms w where w.id = workroom_id and (w.client_id = auth.uid() or w.va_id = auth.uid()))
);

create policy "workroom time participants read" on public.time_entries for select using (
  exists (select 1 from public.workrooms w where w.id = workroom_id and (w.client_id = auth.uid() or w.va_id = auth.uid()))
);
create policy "va logs own pending time" on public.time_entries for insert with check (
  auth.uid() = va_id and status = 'pending' and exists (select 1 from public.workrooms w where w.id = workroom_id and w.va_id = auth.uid())
);
create policy "va deletes unapproved own time" on public.time_entries for delete using (auth.uid() = va_id and status <> 'approved');

create policy "review contract parties read" on public.reviews for select to authenticated
using (auth.uid() = reviewer_id or auth.uid() = reviewee_id);
-- Review writes are server-only after workroom participant validation.
revoke all on public.reviews from anon;
revoke insert, update, delete on public.reviews from authenticated;
grant select on public.reviews to authenticated;
grant all on public.reviews to service_role;

create policy "notifications own read" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications own update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications own delete" on public.notifications for delete using (auth.uid() = user_id);


-- VAs can see their own vetting progress and submit their own test/video data.
create policy "va vetting own read" on public.va_vetting for select using (auth.uid() = va_id);
create policy "va test own read" on public.va_test_attempts for select using (auth.uid() = va_id);
create policy "focus verticals public read" on public.focus_verticals for select using (active = true);
create policy "client commercials read" on public.job_commercials for select using (exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid()));
create policy "client candidate access read" on public.job_candidate_access for select using (exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid()));

-- Storage bucket for VA resumes. Private by design.
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict (id) do nothing;
create policy "VA upload own resume" on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "VA read own resume" on storage.objects for select to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "VA update own resume" on storage.objects for update to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "VA delete own resume" on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admin access is intentionally handled server-side using the service role after role verification.
