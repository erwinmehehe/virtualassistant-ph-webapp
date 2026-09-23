-- Release software-focused Australian specialization courses after consolidating
-- repeated currency warnings into one course-level notice.

do $$
declare
  target_courses integer;
begin
  select count(*)
  into target_courses
  from public.training_courses
  where slug in (
    'servicem8-for-virtual-assistants',
    'cliniko-for-virtual-assistants',
    'xero-workflows-for-virtual-assistants',
    'myob-workflows-for-virtual-assistants'
  );

  if target_courses <> 4 then
    raise exception 'Expected four Australia software courses before release';
  end if;

  if exists (
    select 1
    from public.training_courses c
    where c.slug in (
      'servicem8-for-virtual-assistants',
      'cliniko-for-virtual-assistants',
      'xero-workflows-for-virtual-assistants',
      'myob-workflows-for-virtual-assistants'
    )
      and (c.trademark_disclaimer is null or length(trim(c.trademark_disclaimer)) < 100)
  ) then
    raise exception 'Every Australia software course needs one substantive course-level notice';
  end if;

  if exists (
    select 1
    from public.training_courses c
    join public.training_modules m on m.course_id = c.id
    join public.training_lessons l on l.module_id = m.id
    cross join lateral jsonb_array_elements(l.content) block
    where c.slug in (
      'servicem8-for-virtual-assistants',
      'cliniko-for-virtual-assistants',
      'xero-workflows-for-virtual-assistants',
      'myob-workflows-for-virtual-assistants'
    )
      and block->>'type' = 'callout'
      and block->>'title' in ('Keep this current', 'Local rules matter')
  ) then
    raise exception 'Repeated per-lesson currency boilerplate remains';
  end if;

  if exists (
    select 1
    from public.training_courses c
    where c.slug in (
      'servicem8-for-virtual-assistants',
      'cliniko-for-virtual-assistants',
      'xero-workflows-for-virtual-assistants',
      'myob-workflows-for-virtual-assistants'
    )
      and not exists (
        select 1
        from public.training_assessments a
        where a.course_id = c.id
          and a.assessment_type = 'practical'
      )
  ) then
    raise exception 'Every Australia software course needs a practical final assessment';
  end if;
end $$;

update public.training_lessons l
set
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(l.content_version, 3),
  updated_at = now()
where l.module_id in (
  select m.id
  from public.training_modules m
  join public.training_courses c on c.id = m.course_id
  where c.slug in (
    'servicem8-for-virtual-assistants',
    'cliniko-for-virtual-assistants',
    'xero-workflows-for-virtual-assistants',
    'myob-workflows-for-virtual-assistants'
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
    'servicem8-for-virtual-assistants',
    'cliniko-for-virtual-assistants',
    'xero-workflows-for-virtual-assistants',
    'myob-workflows-for-virtual-assistants'
  )
);

update public.training_courses
set
  review_requirement = 'editorial',
  status = 'published',
  published_at = coalesce(published_at, now()),
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = greatest(content_version, 3),
  updated_at = now()
where slug in (
  'servicem8-for-virtual-assistants',
  'cliniko-for-virtual-assistants',
  'xero-workflows-for-virtual-assistants',
  'myob-workflows-for-virtual-assistants'
);
