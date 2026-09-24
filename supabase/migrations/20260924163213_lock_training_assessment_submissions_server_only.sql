-- Training final assessment submissions are server-scored.
-- Learners may read their own submissions through RLS, but cannot create or mutate them directly.
drop policy if exists "learners submit published assessments"
  on public.training_assessment_submissions;

revoke insert, update, delete, truncate, references, trigger
  on table public.training_assessment_submissions
  from anon, authenticated;

revoke select
  on table public.training_assessment_submissions
  from anon;

grant select
  on table public.training_assessment_submissions
  to authenticated;
