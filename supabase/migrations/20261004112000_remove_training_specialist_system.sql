-- Remove the VAPH training specialist-review subsystem.
-- Training publication continues to use editorial review plus lesson and assessment QA.

drop function if exists public.submit_external_training_specialist_review(uuid, text, jsonb, text);

drop table if exists public.training_specialist_review_invites cascade;
drop table if exists public.training_specialist_review_events cascade;
drop table if exists public.training_specialist_reviews cascade;
drop table if exists public.training_specialist_reviewers cascade;

alter table public.training_courses
  drop constraint if exists training_courses_review_requirement_check,
  drop column if exists specialist_reviewed_by,
  drop column if exists specialist_reviewer_role,
  drop column if exists specialist_review_notes,
  drop column if exists specialist_reviewed_at,
  drop column if exists review_requirement;
