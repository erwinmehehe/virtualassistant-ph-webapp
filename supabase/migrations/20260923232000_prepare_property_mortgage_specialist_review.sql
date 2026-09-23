-- Prepare the remaining regulated Australian administration courses for
-- genuine specialist review. This does not publish either course.

update public.training_lessons l
set
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(l.content_version, 2),
  updated_at = now()
where l.module_id in (
  select m.id
  from public.training_modules m
  join public.training_courses c on c.id = m.course_id
  where c.slug in (
    'property-management-administration-australia',
    'mortgage-broking-administration-australia'
  )
);

update public.training_assessments a
set
  pass_score = 80,
  is_published = true,
  updated_at = now()
where a.course_id in (
  select id
  from public.training_courses
  where slug in (
    'property-management-administration-australia',
    'mortgage-broking-administration-australia'
  )
);

update public.training_courses
set
  review_requirement = 'specialist',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  status = 'draft',
  published_at = null,
  content_version = greatest(content_version, 2),
  updated_at = now()
where slug in (
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
);

-- Create review queue rows if they do not exist yet. Assignment remains blank
-- until a real specialist is chosen in the admin review queue.
insert into public.training_specialist_reviews (
  course_id,
  checklist,
  decision,
  review_revision,
  assigned_revision,
  created_at,
  updated_at
)
select
  c.id,
  '{}'::jsonb,
  'in_progress',
  1,
  null,
  now(),
  now()
from public.training_courses c
where c.slug in (
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
)
on conflict (course_id) do nothing;
