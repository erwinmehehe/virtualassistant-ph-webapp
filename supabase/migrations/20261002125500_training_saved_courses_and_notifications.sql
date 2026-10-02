-- Backend persistence for LMS saved courses and learner notifications.
-- Training accounts can exist without public.profiles rows, so these tables
-- reference auth.users directly instead of the workspace notifications table.

create table if not exists public.training_saved_courses (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists training_saved_courses_user_created_idx
  on public.training_saved_courses(user_id, created_at desc);

alter table public.training_saved_courses enable row level security;
revoke all on public.training_saved_courses from anon;
grant select, insert, delete on public.training_saved_courses to authenticated;

drop policy if exists "learners read own saved training courses" on public.training_saved_courses;
create policy "learners read own saved training courses"
  on public.training_saved_courses for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "learners save own published training courses" on public.training_saved_courses;
create policy "learners save own published training courses"
  on public.training_saved_courses for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.training_courses c
      where c.id = course_id and c.status = 'published'
    )
  );

drop policy if exists "learners remove own saved training courses" on public.training_saved_courses;
create policy "learners remove own saved training courses"
  on public.training_saved_courses for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.training_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'learning_update',
  title text not null,
  body text,
  href text,
  source_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create index if not exists training_notifications_user_created_idx
  on public.training_notifications(user_id, created_at desc);
create index if not exists training_notifications_user_unread_idx
  on public.training_notifications(user_id, created_at desc)
  where read_at is null;

alter table public.training_notifications enable row level security;
revoke all on public.training_notifications from anon;
grant select, update on public.training_notifications to authenticated;

drop policy if exists "learners read own training notifications" on public.training_notifications;
create policy "learners read own training notifications"
  on public.training_notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "learners mark own training notifications read" on public.training_notifications;
create policy "learners mark own training notifications read"
  on public.training_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Historical certificate activity appears in the feed but starts read so
-- existing learners are not flooded with artificial unread badges.
insert into public.training_notifications (
  user_id, type, title, body, href, source_key, read_at, created_at
)
select
  cert.user_id,
  'certificate_issued',
  'Certificate earned',
  c.title || ' is complete and your certificate is ready.',
  '/training/certificates/' || cert.credential_code,
  'certificate:' || cert.id::text,
  now(),
  cert.issued_at
from public.training_certificates cert
join public.training_courses c on c.id = cert.course_id
where cert.revoked_at is null
on conflict (user_id, source_key) do nothing;
