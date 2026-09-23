-- Release the reviewed Australian VA Fundamentals course.
-- Editorial review confirms Australian business context, time-zone handling, privacy-safe offshore work, finance-admin boundaries, customer communication, responsible AI use, and a practical final simulation.

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
    select id from public.training_courses where slug = 'australian-va-fundamentals'
  )
);

update public.training_assessments
set
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id from public.training_courses where slug = 'australian-va-fundamentals'
);

update public.training_courses
set
  status = 'published',
  published_at = coalesce(published_at, now()),
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(content_version, 2),
  updated_at = now()
where slug = 'australian-va-fundamentals';
