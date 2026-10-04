-- Restore specialist-review classification after historical release migrations
-- reset or bypassed the original gate. This migration intentionally does not
-- invent reviewer evidence or silently change current learner availability.
-- Once a specialist-gated course is edited or moved back to draft, the app
-- requires a current approved specialist review before it can be published.

update public.training_courses
set review_requirement = 'specialist',
    updated_at = now()
where slug in (
  'real-estate-virtual-assistant',
  'medical-healthcare-virtual-assistant',
  'bookkeeping-administration',
  'payroll-administration',
  'australian-allied-health-administration',
  'cliniko-for-virtual-assistants',
  'australian-bookkeeping-administration',
  'xero-workflows-for-virtual-assistants',
  'myob-workflows-for-virtual-assistants',
  'ndis-administration-fundamentals',
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
)
  and review_requirement is distinct from 'specialist';
