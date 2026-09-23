-- Remove the NDIS-only specialist review gate.
-- NDIS Administration Fundamentals now follows the standard editorial release
-- workflow. Existing specialist-review history is retained for audit, but the
-- course no longer appears in the specialist queue or requires specialist sign-off.

update public.training_specialist_review_invites
set
  status = 'revoked',
  updated_at = now()
where course_id = (
  select id
  from public.training_courses
  where slug = 'ndis-administration-fundamentals'
)
and status in ('pending', 'opened');

delete from public.training_specialist_reviews
where course_id = (
  select id
  from public.training_courses
  where slug = 'ndis-administration-fundamentals'
);

update public.training_courses
set
  review_requirement = 'editorial',
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  reviewed_by = coalesce(reviewed_by, 'VirtualAssistant.com.ph Editorial Team'),
  last_reviewed_at = coalesce(last_reviewed_at, now()),
  status = 'published',
  published_at = coalesce(published_at, now()),
  updated_at = now()
where slug = 'ndis-administration-fundamentals';
