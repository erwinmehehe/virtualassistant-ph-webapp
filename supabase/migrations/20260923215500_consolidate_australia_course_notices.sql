-- Consolidate repeated per-lesson currency/compliance boilerplate into one
-- course-level notice, and require specialist sign-off for regulated workflows.

with target_courses as (
  select id
  from public.training_courses
  where slug in (
    'servicem8-for-virtual-assistants',
    'cliniko-for-virtual-assistants',
    'xero-workflows-for-virtual-assistants',
    'myob-workflows-for-virtual-assistants',
    'ndis-administration-fundamentals',
    'property-management-administration-australia',
    'mortgage-broking-administration-australia'
  )
)
update public.training_lessons l
set
  content = cleaned.content,
  content_version = l.content_version + 1,
  reviewed_by = null,
  last_reviewed_at = null,
  updated_at = now()
from (
  select
    l2.id,
    coalesce(
      jsonb_agg(item.value order by item.ordinality)
        filter (
          where not (
            item.value->>'type' = 'callout'
            and item.value->>'title' in ('Keep this current', 'Local rules matter')
          )
        ),
      '[]'::jsonb
    ) as content
  from public.training_lessons l2
  join public.training_modules m2 on m2.id = l2.module_id
  where m2.course_id in (select id from target_courses)
  cross join lateral jsonb_array_elements(l2.content) with ordinality as item(value, ordinality)
  group by l2.id
) cleaned
where l.id = cleaned.id;

update public.training_courses
set
  trademark_disclaimer = case slug
    when 'servicem8-for-virtual-assistants' then
      'ServiceM8 is a trademark of its respective owner. This independent course is not affiliated with, certified by, or endorsed by ServiceM8. Product interfaces and features change. Check current official ServiceM8 documentation and the client''s approved setup before using a workflow.'
    when 'cliniko-for-virtual-assistants' then
      'Cliniko is a trademark of its respective owner. This independent course is not affiliated with, certified by, or endorsed by Cliniko. Product interfaces and features change. Check current official Cliniko documentation and the clinic''s approved setup before using a workflow.'
    when 'xero-workflows-for-virtual-assistants' then
      'Xero is a trademark of its respective owner. This independent course is not affiliated with, certified by, or endorsed by Xero. Product interfaces and Australian tax or payroll features change. Check current official Xero Australia documentation and the client or accountant''s approved workflow. This course is administrative training, not tax or accounting advice.'
    when 'myob-workflows-for-virtual-assistants' then
      'MYOB is a trademark of its respective owner. This independent course is not affiliated with, certified by, or endorsed by MYOB. Product interfaces and Australian tax or payroll features change. Check current official MYOB documentation and the client or accountant''s approved workflow. This course is administrative training, not tax or accounting advice.'
    when 'ndis-administration-fundamentals' then
      'NDIS and related names belong to the Australian Government and relevant agencies. This independent administrative course is not affiliated with, certified by, or endorsed by the NDIA or NDIS Quality and Safeguards Commission. Rules and guidance change. Check current official NDIA and Commission guidance plus the provider''s approved procedures before acting. This course does not provide legal, compliance, clinical, support-planning, or funding advice.'
    when 'property-management-administration-australia' then
      'Residential tenancy, licensing, notices, bonds, entry, repairs, rent increases, applications, and disclosure rules vary across Australian states and territories and change over time. Use the client''s current local SOPs and official state or territory sources before acting. This course is administrative training and does not provide legal advice or licensed property-management authority.'
    when 'mortgage-broking-administration-australia' then
      'This independent course is administrative training only. It does not authorize credit assistance, mortgage broking, lender or product recommendations, responsible-lending assessments, or financial advice. Australian credit law, lender policy, disclosure obligations, and settlement processes change. Check current ASIC guidance plus the broker, aggregator, lender, or licensee''s approved procedures before acting.'
    else trademark_disclaimer
  end,
  reviewed_by = null,
  last_reviewed_at = null,
  status = 'draft',
  published_at = null,
  updated_at = now()
where slug in (
  'servicem8-for-virtual-assistants',
  'cliniko-for-virtual-assistants',
  'xero-workflows-for-virtual-assistants',
  'myob-workflows-for-virtual-assistants',
  'ndis-administration-fundamentals',
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
);

update public.training_courses
set
  review_requirement = 'specialist',
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  status = 'draft',
  published_at = null,
  updated_at = now()
where slug in (
  'ndis-administration-fundamentals',
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
);
