-- VAPH training uses one publication standard:
-- editorial review + complete lesson QA + complete assessment QA.
-- Historical specialist review tables are retained for audit history only.

update public.training_courses
set review_requirement = 'editorial',
    specialist_reviewed_by = null,
    specialist_reviewer_role = null,
    specialist_review_notes = null,
    specialist_reviewed_at = null,
    updated_at = now()
where review_requirement is distinct from 'editorial'
   or specialist_reviewed_by is not null
   or specialist_reviewer_role is not null
   or specialist_review_notes is not null
   or specialist_reviewed_at is not null;

update public.training_specialist_review_invites
set status = 'revoked',
    updated_at = now()
where status in ('pending', 'opened');
