-- Preserve training-only accounts as learners rather than silently creating
-- VA candidate, vetting, and public-profile records. The existing auth trigger
-- defaults missing roles to VA, so training must be handled before that fallback.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_role public.user_role;
begin
  if new.raw_user_meta_data->>'account_type' = 'training'
     and coalesce(new.raw_user_meta_data->>'role', '') = '' then
    return new;
  end if;

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
$function$;

-- Free training is a standalone learning subsystem. It is intentionally
-- attached to auth.users rather than va_profiles so learning never depends on
-- joining the talent marketplace.

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  category text not null default 'foundation'
    check (category in ('foundation', 'software', 'industry', 'skill')),
  country_focus text,
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  content_version integer not null default 1 check (content_version > 0),
  trademark_disclaimer text,
  reviewed_by text,
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  title text not null,
  summary text,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  content jsonb not null default '[]'::jsonb,
  estimated_minutes smallint not null default 15
    check (estimated_minutes between 1 and 30),
  position integer not null check (position > 0),
  is_published boolean not null default false,
  content_version integer not null default 1 check (content_version > 0),
  reviewed_by text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, position)
);

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.training_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.training_assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  module_id uuid references public.training_modules(id) on delete cascade,
  title text not null,
  instructions text,
  assessment_type text not null default 'practical'
    check (assessment_type in ('knowledge', 'practical')),
  pass_score smallint check (pass_score between 0 and 100),
  position integer not null default 1 check (position > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.training_assessments(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'needs_revision')),
  score numeric(5,2) check (score between 0 and 100),
  feedback text,
  reviewer_id uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  credential_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, course_id)
);

create index if not exists training_modules_course_idx
  on public.training_modules(course_id, position);
create index if not exists training_lessons_module_idx
  on public.training_lessons(module_id, position);
create index if not exists training_enrollments_user_idx
  on public.training_enrollments(user_id);
create index if not exists training_enrollments_course_idx
  on public.training_enrollments(course_id);
create index if not exists training_progress_user_idx
  on public.training_lesson_progress(user_id);
create index if not exists training_assessments_course_idx
  on public.training_assessments(course_id, position);
create index if not exists training_submissions_user_idx
  on public.training_assessment_submissions(user_id, submitted_at desc);
create index if not exists training_certificates_user_idx
  on public.training_certificates(user_id);

alter table public.training_courses enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_lesson_progress enable row level security;
alter table public.training_assessments enable row level security;
alter table public.training_assessment_submissions enable row level security;
alter table public.training_certificates enable row level security;

grant select, insert, update, delete on public.training_courses to authenticated;
grant select, insert, update, delete on public.training_modules to authenticated;
grant select, insert, update, delete on public.training_lessons to authenticated;
grant select, insert on public.training_enrollments to authenticated;
grant select, insert, update on public.training_lesson_progress to authenticated;
grant select, insert, update, delete on public.training_assessments to authenticated;
grant select, insert, update on public.training_assessment_submissions to authenticated;
grant select, insert, update, delete on public.training_certificates to authenticated;

create policy "published training courses are readable"
on public.training_courses for select to authenticated
using (status = 'published');

create policy "admins manage training courses"
on public.training_courses for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "published training modules are readable"
on public.training_modules for select to authenticated
using (exists (
  select 1 from public.training_courses c
  where c.id = course_id and c.status = 'published'
));

create policy "admins manage training modules"
on public.training_modules for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "published training lessons are readable"
on public.training_lessons for select to authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.training_modules m
    join public.training_courses c on c.id = m.course_id
    where m.id = module_id and c.status = 'published'
  )
);

create policy "admins manage training lessons"
on public.training_lessons for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "learners read own enrollments"
on public.training_enrollments for select to authenticated
using ((select auth.uid()) = user_id);

create policy "learners enroll in published courses"
on public.training_enrollments for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.training_courses c
    where c.id = course_id and c.status = 'published'
  )
);

create policy "admins read training enrollments"
on public.training_enrollments for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "learners read own lesson progress"
on public.training_lesson_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "learners create own lesson progress"
on public.training_lesson_progress for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.training_lessons l
    join public.training_modules m on m.id = l.module_id
    join public.training_courses c on c.id = m.course_id
    where l.id = lesson_id
      and l.is_published = true
      and c.status = 'published'
  )
);

create policy "learners update own lesson progress"
on public.training_lesson_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "admins read lesson progress"
on public.training_lesson_progress for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "published assessments are readable"
on public.training_assessments for select to authenticated
using (
  is_published = true
  and exists (
    select 1 from public.training_courses c
    where c.id = course_id and c.status = 'published'
  )
);

create policy "admins manage training assessments"
on public.training_assessments for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "learners read own assessment submissions"
on public.training_assessment_submissions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "learners submit published assessments"
on public.training_assessment_submissions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.training_assessments a
    join public.training_courses c on c.id = a.course_id
    where a.id = assessment_id
      and a.is_published = true
      and c.status = 'published'
  )
);

create policy "admins read assessment submissions"
on public.training_assessment_submissions for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins review assessment submissions"
on public.training_assessment_submissions for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "learners read own certificates"
on public.training_certificates for select to authenticated
using ((select auth.uid()) = user_id);

create policy "admins manage training certificates"
on public.training_certificates for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));
