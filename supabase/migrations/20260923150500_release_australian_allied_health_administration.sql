-- Release the reviewed Australian Allied Health Administration course.
-- Course audit confirms concise lesson count, practical scenarios, handoffs, QA checks, and a practical final simulation.

update public.training_lessons
set
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(content_version, 2),
  updated_at = now()
where module_id in (
  select id
  from public.training_modules
  where course_id = (
    select id from public.training_courses where slug = 'australian-allied-health-administration'
  )
);

update public.training_assessments
set
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id from public.training_courses where slug = 'australian-allied-health-administration'
);

update public.training_courses
set
  status = 'published',
  published_at = coalesce(published_at, now()),
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(content_version, 2),
  updated_at = now()
where slug = 'australian-allied-health-administration';
