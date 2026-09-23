-- Strengthen practical assessment quality and review requirements.

alter table public.training_assessments
  add column if not exists rubric jsonb not null default '[]'::jsonb,
  add column if not exists resource_pack jsonb not null default '[]'::jsonb;

alter table public.training_assessment_submissions
  add column if not exists rubric_scores jsonb not null default '{}'::jsonb;

update public.training_courses
set review_requirement = 'specialist',
    specialist_reviewed_by = null,
    specialist_reviewer_role = null,
    specialist_review_notes = null,
    specialist_reviewed_at = null,
    status = 'draft',
    published_at = null,
    updated_at = now()
where slug in (
  'australian-allied-health-administration',
  'cliniko-for-virtual-assistants',
  'australian-bookkeeping-administration',
  'xero-workflows-for-virtual-assistants',
  'myob-workflows-for-virtual-assistants'
);
