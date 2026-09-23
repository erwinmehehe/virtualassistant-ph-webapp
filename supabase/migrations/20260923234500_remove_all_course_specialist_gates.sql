-- Retire specialist review as a course publication requirement.
-- Course release now uses one rule set: editorial review + complete publishable
-- lessons + ready assessments. Historical specialist audit events are retained.

create temporary table retired_specialist_courses
on commit drop
as
select id
from public.training_courses
where review_requirement = 'specialist';

update public.training_specialist_review_invites
set
  status = 'revoked',
  updated_at = now()
where course_id in (select id from retired_specialist_courses)
  and status in ('pending', 'opened');

delete from public.training_specialist_reviews
where course_id in (select id from retired_specialist_courses);

update public.training_courses
set
  review_requirement = 'editorial',
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  updated_at = now()
where id in (select id from retired_specialist_courses);

-- Release former specialist-gated courses only when they already meet the
-- standard editorial publication checks. Incomplete courses stay draft, but
-- they are no longer blocked by any specialist/safety gate.
update public.training_courses course
set
  status = 'published',
  published_at = coalesce(course.published_at, now()),
  updated_at = now()
where course.id in (select id from retired_specialist_courses)
  and course.status <> 'archived'
  and course.reviewed_by is not null
  and course.last_reviewed_at is not null
  and exists (
    select 1
    from public.training_modules module
    join public.training_lessons lesson on lesson.module_id = module.id
    where module.course_id = course.id
  )
  and not exists (
    select 1
    from public.training_modules module
    join public.training_lessons lesson on lesson.module_id = module.id
    where module.course_id = course.id
      and (
        lesson.is_published is not true
        or jsonb_typeof(lesson.content) <> 'array'
        or jsonb_array_length(lesson.content) < 3
      )
  )
  and not exists (
    select 1
    from public.training_assessments assessment
    where assessment.course_id = course.id
      and (
        assessment.is_published is not true
        or assessment.instructions is null
        or length(trim(assessment.instructions)) < 100
        or assessment.pass_score is null
      )
  );
