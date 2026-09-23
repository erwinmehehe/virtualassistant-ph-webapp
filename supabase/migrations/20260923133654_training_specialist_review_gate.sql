-- Add a reusable specialist-review gate for high-risk training content.
-- Editorial review remains required for every course. Courses marked specialist
-- also need an explicit subject-matter review before publication.

alter table public.training_courses
  add column if not exists review_requirement text not null default 'editorial'
    check (review_requirement in ('editorial', 'specialist')),
  add column if not exists specialist_reviewed_by text,
  add column if not exists specialist_reviewer_role text,
  add column if not exists specialist_review_notes text,
  add column if not exists specialist_reviewed_at timestamptz;

update public.training_courses
set review_requirement = 'specialist',
    specialist_reviewed_by = null,
    specialist_reviewer_role = null,
    specialist_review_notes = null,
    specialist_reviewed_at = null,
    status = 'draft',
    published_at = null
where slug in (
  'real-estate-virtual-assistant',
  'medical-healthcare-virtual-assistant',
  'bookkeeping-administration',
  'payroll-administration'
);
