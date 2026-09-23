-- Optional country-specific learning paths.
-- These group courses without making them prerequisites for hiring or training access.

create table if not exists public.training_learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  country_focus text,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_learning_path_courses (
  path_id uuid not null references public.training_learning_paths(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  position integer not null check (position > 0),
  is_optional boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (path_id, course_id),
  unique (path_id, position)
);

create index if not exists training_learning_path_courses_course_idx
  on public.training_learning_path_courses(course_id);

alter table public.training_learning_paths enable row level security;
alter table public.training_learning_path_courses enable row level security;

grant select, insert, update, delete on public.training_learning_paths to authenticated;
grant select, insert, update, delete on public.training_learning_path_courses to authenticated;

create policy "published training paths are readable"
on public.training_learning_paths for select to authenticated
using (status = 'published');

create policy "admins manage training paths"
on public.training_learning_paths for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "published training path courses are readable"
on public.training_learning_path_courses for select to authenticated
using (exists (
  select 1 from public.training_learning_paths p
  where p.id = path_id and p.status = 'published'
));

create policy "admins manage training path courses"
on public.training_learning_path_courses for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

insert into public.training_learning_paths (
  id, slug, title, summary, country_focus, status
) values (
  '30000000-0000-4000-8000-000000000001',
  'australia',
  'Working With Australian Businesses',
  'Optional Australia-specific training for Filipino Virtual Assistants covering local business context, industry administration, and commonly used software workflows.',
  'Australia',
  'draft'
)
on conflict (slug) do update
set title=excluded.title,
    summary=excluded.summary,
    country_focus=excluded.country_focus,
    updated_at=now();
