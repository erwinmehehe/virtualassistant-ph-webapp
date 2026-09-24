-- Persist each learner's chosen Australian training specialisation.
-- Training preferences belong to auth users so training-only accounts do not
-- need a VA marketplace profile.

create table if not exists public.training_learner_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  australia_specialization text
    check (australia_specialization in (
      'tradie-operations',
      'property-management',
      'ndis-allied-health',
      'mortgage-broking'
    )),
  australia_selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_learner_preferences enable row level security;

grant select, insert, update on public.training_learner_preferences to authenticated;

create policy "learners read own training preferences"
on public.training_learner_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "learners create own training preferences"
on public.training_learner_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "learners update own training preferences"
on public.training_learner_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Preserve intent for existing learners. If a learner has touched more than
-- one specialisation, use the most recently started defining course.
with signals as (
  select
    e.user_id,
    e.started_at,
    case
      when c.slug in ('australian-trades-administration','servicem8-for-virtual-assistants')
        then 'tradie-operations'
      when c.slug = 'property-management-administration-australia'
        then 'property-management'
      when c.slug in ('ndis-administration-fundamentals','australian-allied-health-administration')
        then 'ndis-allied-health'
      when c.slug = 'mortgage-broking-administration-australia'
        then 'mortgage-broking'
      else null
    end as specialization
  from public.training_enrollments e
  join public.training_courses c on c.id = e.course_id
  where c.slug in (
    'australian-trades-administration',
    'servicem8-for-virtual-assistants',
    'property-management-administration-australia',
    'ndis-administration-fundamentals',
    'australian-allied-health-administration',
    'mortgage-broking-administration-australia'
  )
),
ranked as (
  select *,
    row_number() over (partition by user_id order by started_at desc) as rn
  from signals
  where specialization is not null
)
insert into public.training_learner_preferences (
  user_id,
  australia_specialization,
  australia_selected_at
)
select user_id,specialization,started_at
from ranked
where rn = 1
on conflict (user_id) do nothing;
