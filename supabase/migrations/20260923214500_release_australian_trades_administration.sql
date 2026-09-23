-- Release the reviewed Australian Trades Administration course.
-- Editorial review confirms enquiry-to-review operations, dispatch and scheduling, quote follow-up, supplier dependencies, completion evidence, invoice/payment administration, review-request safeguards, and a practical final simulation.

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
    select id from public.training_courses where slug = 'australian-trades-administration'
  )
);

update public.training_assessments
set
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id from public.training_courses where slug = 'australian-trades-administration'
);

update public.training_courses
set
  status = 'published',
  published_at = coalesce(published_at, now()),
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(content_version, 2),
  updated_at = now()
where slug = 'australian-trades-administration';
