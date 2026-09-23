-- Reassert specialist-review publication state after concurrent course releases.
-- Any specialist-gated core course without specialist sign-off must remain draft.

update public.training_courses
set status = 'draft',
    published_at = null,
    updated_at = now()
where review_requirement = 'specialist'
  and specialist_reviewed_at is null
  and slug in (
    'real-estate-virtual-assistant',
    'medical-healthcare-virtual-assistant',
    'bookkeeping-administration',
    'payroll-administration'
  );
