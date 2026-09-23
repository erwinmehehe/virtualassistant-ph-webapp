-- Expand the free training roadmap to 15 courses.
-- All new courses and lessons are drafts. No learner can see them until
-- detailed content is written, reviewed, and explicitly published.

alter table public.training_courses
  add column if not exists recommended_order smallint
  check (recommended_order is null or recommended_order > 0);

update public.training_courses
set recommended_order = 1
where slug = 'virtual-assistant-foundations'
  and recommended_order is distinct from 1;

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000002', 'real-estate-virtual-assistant', 'Real Estate Virtual Assistant', 'Practical real estate administration training covering enquiries, CRM, listings, scheduling, transaction support, property-management support, communication, and handoffs without replacing licensed real estate work.',
  'industry', null, 300, 'draft', 1, 2, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000001', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Real Estate Operations', 'Understand how real estate teams work and where a VA can safely support them.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=1),
  'how-real-estate-businesses-and-teams-work', 'How Real Estate Businesses and Teams Work', 'Learn common roles, business models, and how work moves between agents, brokers, property managers, coordinators, and support staff.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=1),
  'the-real-estate-client-and-transaction-journey', 'The Real Estate Client and Transaction Journey', 'Map the journey from enquiry through appointment, listing, offer, transaction support, settlement or handoff, while recognizing tasks that require licensed staff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000002', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Leads and CRM', 'Keep lead data useful, follow-up visible, and handoffs clean.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=2),
  'lead-intake-qualification-support-and-crm-hygiene', 'Lead Intake, Qualification Support, and CRM Hygiene', 'Capture enquiries consistently, distinguish missing data from qualification decisions, and keep CRM records usable.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=2),
  'follow-up-workflows-and-database-management', 'Follow-Up Workflows and Database Management', 'Build follow-up queues, document touchpoints, and prevent leads from disappearing without making unauthorized sales promises.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000003', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Listings and Property Administration', 'Support listing workflows without inventing property information.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=3),
  'listing-coordination-and-asset-checklists', 'Listing Coordination and Asset Checklists', 'Coordinate photos, copy inputs, documents, approvals, and launch checklists while keeping source-of-truth data clear.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=3),
  'property-information-documents-and-quality-checks', 'Property Information, Documents, and Quality Checks', 'Review addresses, features, dates, links, and documents for completeness without changing regulated or contractual information.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000004', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Scheduling and Communication', 'Coordinate people, time zones, and property activity.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=4),
  'inspections-viewings-and-appointment-coordination', 'Inspections, Viewings, and Appointment Coordination', 'Schedule appointments, manage confirmations, buffers, cancellations, and handoffs.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=4),
  'buyer-seller-tenant-and-vendor-updates', 'Buyer, Seller, Tenant, and Vendor Updates', 'Write clear status updates, route questions to the correct person, and document unresolved issues.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000005', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Transaction and Property Support', 'Assist with high-volume administration while respecting boundaries.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=5),
  'contract-to-close-administration-boundaries', 'Contract-to-Close Administration Boundaries', 'Track milestones, documents, signatures, and outstanding items without interpreting contracts or giving legal advice.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=5),
  'maintenance-and-property-management-support', 'Maintenance and Property-Management Support', 'Log maintenance requests, coordinate approved vendors, communicate status, and escalate emergencies or authorization questions.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000002-0000-4000-8000-000000000006', (select id from public.training_courses where slug='real-estate-virtual-assistant'), 'Reporting and Simulation', 'Put the workflow together.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=6),
  'real-estate-reporting-and-daily-handoffs', 'Real Estate Reporting and Daily Handoffs', 'Build useful pipeline, activity, and exception reporting for a remote team.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000002-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='real-estate-virtual-assistant') and position=6),
  'composite-real-estate-va-work-simulation', 'Composite Real Estate VA Work Simulation', 'Work through a fictional day involving enquiries, CRM updates, a viewing conflict, listing assets, a maintenance issue, and an end-of-day handoff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000002',
  (select id from public.training_courses where slug='real-estate-virtual-assistant'),
  null,
  'Real Estate Virtual Assistant Final Work Simulation',
  'Complete a composite real estate administration simulation covering lead intake, CRM updates, listing coordination, scheduling, document tracking, communication, escalation, and handoff. Do not make licensed, contractual, legal, or pricing decisions.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000003', 'medical-healthcare-virtual-assistant', 'Medical / Healthcare Virtual Assistant', 'Healthcare administration fundamentals for VAs, focused on privacy, patient communication, intake, referrals, scheduling, records, billing support, and escalation without crossing into clinical work.',
  'industry', null, 300, 'draft', 1, 3, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000001', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Healthcare Administration Boundaries', 'Understand the difference between administrative support and clinical work.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=1),
  'what-a-healthcare-va-can-and-cannot-do', 'What a Healthcare VA Can and Cannot Do', 'Learn common non-clinical responsibilities, role boundaries, and why country, provider, and practice rules matter.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=1),
  'privacy-sensitive-data-and-minimum-necessary-access', 'Privacy, Sensitive Data, and Minimum Necessary Access', 'Handle patient information carefully, use approved systems, and avoid exposing health data through unsafe channels or tools.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000002', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Patient Intake and Records', 'Support accurate intake without diagnosing or interpreting clinical information.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=2),
  'patient-intake-and-demographic-checks', 'Patient Intake and Demographic Checks', 'Collect and verify approved administrative information, identify missing fields, and route clinical questions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=2),
  'referrals-documents-and-record-routing', 'Referrals, Documents, and Record Routing', 'Track referrals and documents, maintain status visibility, and escalate missing or urgent information.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000003', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Scheduling and Continuity', 'Keep appointments and follow-ups reliable.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=3),
  'appointment-scheduling-and-calendar-rules', 'Appointment Scheduling and Calendar Rules', 'Apply practice scheduling rules, provider availability, buffers, appointment types, and waitlists.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=3),
  'reminders-recalls-reschedules-and-no-shows', 'Reminders, Recalls, Reschedules, and No-Shows', 'Use approved templates and workflows to support continuity without making clinical judgments.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000004', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Billing and Claims Administration', 'Support the workflow without pretending to be a billing specialist where authorization is required.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=4),
  'billing-administration-and-payment-follow-up', 'Billing Administration and Payment Follow-Up', 'Prepare or track approved billing tasks, receipts, payment status, and patient account questions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=4),
  'claims-remittances-and-exception-tracking', 'Claims, Remittances, and Exception Tracking', 'Record claim or remittance statuses, identify exceptions, and route coding or clinical questions to qualified staff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000005', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Patient Communication and Escalation', 'Communicate calmly and safely.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=5),
  'patient-communication-for-administrative-requests', 'Patient Communication for Administrative Requests', 'Handle routine scheduling, document, payment, and practice-information questions in plain language.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=5),
  'urgent-clinical-and-complaint-escalation', 'Urgent, Clinical, and Complaint Escalation', 'Recognize when a message must move immediately to clinical or senior staff instead of being answered by the VA.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000003-0000-4000-8000-000000000006', (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'), 'Systems and Simulation', 'Bring privacy and workflow discipline together.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=6),
  'practice-systems-audit-trails-and-handoffs', 'Practice Systems, Audit Trails, and Handoffs', 'Keep notes, statuses, and handoffs complete inside approved systems.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000003-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='medical-healthcare-virtual-assistant') and position=6),
  'composite-healthcare-admin-simulation', 'Composite Healthcare Admin Simulation', 'Work through fictional intake, referral, scheduling, billing-status, privacy, and escalation scenarios.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000003',
  (select id from public.training_courses where slug='medical-healthcare-virtual-assistant'),
  null,
  'Medical / Healthcare Virtual Assistant Final Work Simulation',
  'Complete a composite healthcare administration simulation. The assessment must test privacy, scheduling, referral tracking, patient communication, billing-status administration, and escalation while avoiding clinical advice or diagnosis.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000004', 'executive-virtual-assistant', 'Executive Virtual Assistant', 'Advanced administrative support training for VAs handling executive inboxes, calendars, meetings, travel, research, priorities, stakeholder communication, and confidential information.',
  'skill', null, 300, 'draft', 1, 4, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000001', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Executive Support Fundamentals', 'Understand what changes when you support a busy decision-maker.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=1),
  'the-executive-assistant-operating-model', 'The Executive Assistant Operating Model', 'Learn how executive support differs from basic task execution and how to protect focus, context, and decision time.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=1),
  'confidentiality-judgment-and-authority', 'Confidentiality, Judgment, and Authority', 'Handle sensitive information, define approval boundaries, and know which decisions must stay with the executive.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000002', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Inbox and Calendar Ownership', 'Create reliable information and time systems.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=2),
  'executive-inbox-triage-and-drafting', 'Executive Inbox Triage and Drafting', 'Separate decisions, delegations, follow-ups, reference, and urgent issues while preserving context.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=2),
  'complex-calendar-management', 'Complex Calendar Management', 'Manage priorities, time zones, buffers, conflicts, holds, recurring meetings, and changes without calendar chaos.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000003', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Meetings and Stakeholders', 'Make meetings easier before, during, and after.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=3),
  'meeting-preparation-agendas-and-briefing-notes', 'Meeting Preparation, Agendas, and Briefing Notes', 'Prepare context, documents, attendee information, open decisions, and pre-reads.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=3),
  'minutes-actions-and-stakeholder-follow-up', 'Minutes, Actions, and Stakeholder Follow-Up', 'Turn meetings into owned actions, deadlines, and clear communication.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000004', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Travel and Logistics', 'Coordinate moving parts with fallback plans.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=4),
  'travel-planning-and-itinerary-administration', 'Travel Planning and Itinerary Administration', 'Build itineraries, compare options, document confirmations, and avoid making unauthorized purchases.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=4),
  'changes-disruptions-and-contingency-handoffs', 'Changes, Disruptions, and Contingency Handoffs', 'Respond to cancellations or changes with verified options and explicit approval points.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000005', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Priorities and Executive Information', 'Help the executive see what matters.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=5),
  'priority-management-and-decision-queues', 'Priority Management and Decision Queues', 'Maintain a visible list of decisions, deadlines, blocked items, and delegated work.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=5),
  'research-briefs-and-executive-summaries', 'Research, Briefs, and Executive Summaries', 'Produce concise, sourced information that supports decisions without hiding uncertainty.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000004-0000-4000-8000-000000000006', (select id from public.training_courses where slug='executive-virtual-assistant'), 'Executive Simulation', 'Combine the work under pressure.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=6),
  'daily-operating-rhythm-and-end-of-day-handoffs', 'Daily Operating Rhythm and End-of-Day Handoffs', 'Build morning reviews, checkpoints, and handoffs that reduce follow-up.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000004-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='executive-virtual-assistant') and position=6),
  'composite-executive-va-work-simulation', 'Composite Executive VA Work Simulation', 'Handle a fictional executive day with inbox issues, conflicting meetings, travel changes, research, and stakeholder follow-up.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000004',
  (select id from public.training_courses where slug='executive-virtual-assistant'),
  null,
  'Executive Virtual Assistant Final Work Simulation',
  'Complete a composite executive-support simulation involving inbox triage, calendar conflicts, meeting preparation, travel changes, research, confidential information, and executive handoff.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000005', 'marketing-virtual-assistant', 'Marketing Virtual Assistant', 'Marketing operations training for VAs supporting campaigns, content, email, CRM data, assets, analytics, and handoffs without presenting themselves as the client''s marketing strategist unless that is their role.',
  'skill', null, 300, 'draft', 1, 5, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000001', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Marketing Operations Foundations', 'Understand how campaigns, channels, assets, audiences, and reporting connect.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=1),
  'how-marketing-work-moves-from-brief-to-campaign', 'How Marketing Work Moves From Brief to Campaign', 'Learn the lifecycle from objective and audience to asset production, publishing, measurement, and iteration.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=1),
  'brand-claims-approvals-and-source-of-truth', 'Brand, Claims, Approvals, and Source of Truth', 'Keep brand assets, approved messaging, product facts, and review status organized.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000002', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Content Operations', 'Turn plans into consistent production.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=2),
  'content-calendars-briefs-and-production-tracking', 'Content Calendars, Briefs, and Production Tracking', 'Coordinate topics, owners, assets, due dates, approvals, and publishing status.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=2),
  'asset-coordination-and-quality-assurance', 'Asset Coordination and Quality Assurance', 'Check formats, links, copy, dates, names, and approved versions before publishing.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000003', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Email and CRM Support', 'Support campaigns without breaking consent or customer data workflows.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=3),
  'email-campaign-administration', 'Email Campaign Administration', 'Prepare lists, templates, links, tests, schedules, and approval checkpoints.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=3),
  'crm-segments-tags-and-campaign-data-hygiene', 'CRM Segments, Tags, and Campaign Data Hygiene', 'Maintain clean fields and segments while respecting consent and suppression rules.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000004', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Campaign Execution', 'Coordinate recurring marketing work.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=4),
  'campaign-launch-checklists-and-cross-channel-coordination', 'Campaign Launch Checklists and Cross-Channel Coordination', 'Manage launch dependencies, UTM inputs, assets, pages, email, and social scheduling.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=4),
  'community-lead-and-response-routing', 'Community, Lead, and Response Routing', 'Route replies, questions, leads, and complaints to the right owner.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000005', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Analytics and AI', 'Help teams learn without inventing insights.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=5),
  'marketing-reporting-and-basic-performance-interpretation', 'Marketing Reporting and Basic Performance Interpretation', 'Prepare consistent reports and distinguish observed results from assumptions about causation.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=5),
  'responsible-ai-in-marketing-operations', 'Responsible AI in Marketing Operations', 'Use AI for drafts and organization while verifying facts, brand claims, customer data, and final copy.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000005-0000-4000-8000-000000000006', (select id from public.training_courses where slug='marketing-virtual-assistant'), 'Marketing Simulation', 'Run a small campaign workflow.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=6),
  'agency-and-in-house-handoffs', 'Agency and In-House Handoffs', 'Work across designers, writers, clients, founders, and channel owners without losing approvals.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000005-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='marketing-virtual-assistant') and position=6),
  'composite-marketing-va-work-simulation', 'Composite Marketing VA Work Simulation', 'Coordinate a fictional campaign from brief through assets, publishing checks, lead routing, and reporting.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000005',
  (select id from public.training_courses where slug='marketing-virtual-assistant'),
  null,
  'Marketing Virtual Assistant Final Work Simulation',
  'Complete a composite marketing-operations simulation covering a brief, content calendar, asset QA, email/CRM preparation, campaign launch checks, response routing, and reporting.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000006', 'bookkeeping-administration', 'Bookkeeping Administration for Virtual Assistants', 'Bookkeeping-administration training covering source documents, accounts payable, accounts receivable, expense records, reconciliation preparation, month-end support, and financial-data handling without replacing qualified accounting or tax professionals.',
  'skill', null, 300, 'draft', 1, 6, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000001', (select id from public.training_courses where slug='bookkeeping-administration'), 'Bookkeeping Boundaries', 'Understand the administrative role and where professional accounting decisions begin.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=1),
  'bookkeeping-workflow-and-role-boundaries', 'Bookkeeping Workflow and Role Boundaries', 'Map transaction administration from source document to record, review, reconciliation, reporting, and professional oversight.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=1),
  'financial-data-privacy-access-and-audit-trail', 'Financial Data Privacy, Access, and Audit Trail', 'Protect bank, payroll, supplier, customer, and tax-related information and document changes.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000002', (select id from public.training_courses where slug='bookkeeping-administration'), 'Source Documents and Coding Support', 'Keep documents complete and traceable.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=2),
  'invoices-bills-receipts-and-supporting-documents', 'Invoices, Bills, Receipts, and Supporting Documents', 'Capture required fields, attach evidence, identify duplicates, and flag missing information.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=2),
  'categories-accounts-and-coding-questions', 'Categories, Accounts, and Coding Questions', 'Understand coding concepts well enough to prepare clean records while escalating uncertain classifications.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000003', (select id from public.training_courses where slug='bookkeeping-administration'), 'Accounts Payable', 'Support outgoing payments without unauthorized approval.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=3),
  'supplier-bills-and-approval-workflows', 'Supplier Bills and Approval Workflows', 'Track bills, due dates, approvals, duplicates, and supporting documents.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=3),
  'payment-preparation-and-supplier-follow-up', 'Payment Preparation and Supplier Follow-Up', 'Prepare approved payment information and resolve routine supplier questions without authorizing funds yourself.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000004', (select id from public.training_courses where slug='bookkeeping-administration'), 'Accounts Receivable', 'Keep invoicing and collections administration visible.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=4),
  'customer-invoices-credits-and-payment-status', 'Customer Invoices, Credits, and Payment Status', 'Create or track approved invoices and identify exceptions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=4),
  'overdue-accounts-and-debtor-follow-up', 'Overdue Accounts and Debtor Follow-Up', 'Use approved reminders, document promises, and escalate disputes or unusual requests.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000005', (select id from public.training_courses where slug='bookkeeping-administration'), 'Reconciliation and Period Support', 'Prepare clean information for review.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=5),
  'bank-reconciliation-preparation', 'Bank Reconciliation Preparation', 'Match transactions and supporting records, identify exceptions, and avoid forcing uncertain matches.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=5),
  'month-end-payroll-and-accountant-handoffs', 'Month-End, Payroll, and Accountant Handoffs', 'Prepare checklists, outstanding-item reports, documents, and clear questions for qualified reviewers.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000006-0000-4000-8000-000000000006', (select id from public.training_courses where slug='bookkeeping-administration'), 'Bookkeeping Simulation', 'Put the admin workflow together.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=6),
  'financial-reporting-support-and-exception-logs', 'Financial Reporting Support and Exception Logs', 'Prepare status reports without presenting unreviewed figures as professional advice.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000006-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='bookkeeping-administration') and position=6),
  'composite-bookkeeping-administration-simulation', 'Composite Bookkeeping Administration Simulation', 'Work through fictional bills, receipts, invoices, bank-feed exceptions, overdue accounts, and month-end handoff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000006',
  (select id from public.training_courses where slug='bookkeeping-administration'),
  null,
  'Bookkeeping Administration for Virtual Assistants Final Work Simulation',
  'Complete a composite bookkeeping-administration simulation covering AP, AR, source documents, reconciliation preparation, exception tracking, and reviewer handoff. Do not provide tax, accounting, or statutory advice.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000007', 'sales-lead-generation-virtual-assistant', 'Sales & Lead Generation Virtual Assistant', 'Sales-support training for VAs handling prospect research, lead data, CRM hygiene, outreach preparation, follow-ups, appointment setting, pipeline updates, and reporting.',
  'skill', null, 300, 'draft', 1, 7, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000001', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Sales Support Fundamentals', 'Understand the funnel and the VA''s role in keeping it moving.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=1),
  'sales-funnel-icp-and-lead-stages', 'Sales Funnel, ICP, and Lead Stages', 'Learn how ideal-customer criteria, funnel stages, ownership, and next actions connect.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=1),
  'ethical-lead-research-and-data-quality', 'Ethical Lead Research and Data Quality', 'Research business contacts carefully, document sources, and avoid fabricating or over-collecting personal data.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000002', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Prospecting and Lists', 'Build usable lead data.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=2),
  'prospect-research-and-list-building', 'Prospect Research and List Building', 'Capture fields that help the sales process rather than collecting data with no purpose.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=2),
  'deduplication-enrichment-and-crm-hygiene', 'Deduplication, Enrichment, and CRM Hygiene', 'Standardize records, detect duplicates, and record confidence or source where needed.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000003', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Outreach Support', 'Prepare relevant communication.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=3),
  'outreach-briefs-and-personalization', 'Outreach Briefs and Personalization', 'Use verified facts and clear value context without fake familiarity or invented research.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=3),
  'sequences-follow-ups-and-reply-triage', 'Sequences, Follow-Ups, and Reply Triage', 'Maintain follow-up cadence and route positive, negative, unsubscribe, and ambiguous replies correctly.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000004', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Appointment Setting', 'Turn interest into clean meetings.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=4),
  'qualification-support-and-discovery-boundaries', 'Qualification Support and Discovery Boundaries', 'Collect approved qualification information without pretending to be the closer or making commitments.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=4),
  'booking-calls-and-preventing-no-shows', 'Booking Calls and Preventing No-Shows', 'Confirm time zones, invite details, reminders, reschedules, and CRM updates.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000005', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Pipeline Operations', 'Keep opportunities visible.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=5),
  'crm-stages-notes-tasks-and-handoffs', 'CRM Stages, Notes, Tasks, and Handoffs', 'Update stages from evidence, record next steps, and avoid optimistic pipeline inflation.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=5),
  'sales-reporting-and-activity-metrics', 'Sales Reporting and Activity Metrics', 'Prepare lead, activity, booking, and conversion reports that distinguish activity from outcomes.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000007-0000-4000-8000-000000000006', (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'), 'Sales Simulation', 'Work a fictional pipeline.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=6),
  'escalations-objections-and-sensitive-replies', 'Escalations, Objections, and Sensitive Replies', 'Recognize replies that require sales, legal, billing, or management ownership.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000007-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='sales-lead-generation-virtual-assistant') and position=6),
  'composite-sales-and-lead-gen-simulation', 'Composite Sales & Lead Gen Simulation', 'Research leads, clean a list, prepare outreach, triage replies, book a call, update CRM, and hand off next actions.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000007',
  (select id from public.training_courses where slug='sales-lead-generation-virtual-assistant'),
  null,
  'Sales & Lead Generation Virtual Assistant Final Work Simulation',
  'Complete a composite sales-support simulation covering prospect research, data hygiene, outreach preparation, reply triage, appointment setting, CRM updates, and pipeline handoff.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000008', 'ecommerce-virtual-assistant', 'E-commerce Virtual Assistant', 'E-commerce operations training covering product data, orders, fulfilment, customer support, returns, inventory, promotions, marketplaces, and reporting.',
  'industry', null, 300, 'draft', 1, 8, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000001', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'E-commerce Operations', 'Understand the order and customer lifecycle.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=1),
  'how-an-online-store-operates', 'How an Online Store Operates', 'Map products, storefront, checkout, payment, fulfilment, support, returns, and reporting.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=1),
  'products-variants-skus-and-source-data', 'Products, Variants, SKUs, and Source Data', 'Keep product information accurate across names, prices, variants, inventory identifiers, and assets.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000002', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'Catalog Administration', 'Maintain clean product listings.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=2),
  'product-listing-and-content-qa', 'Product Listing and Content QA', 'Prepare titles, descriptions, images, attributes, links, and metadata from approved source information.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=2),
  'bulk-updates-collections-and-merchandising-support', 'Bulk Updates, Collections, and Merchandising Support', 'Use controlled imports and checklists to avoid large-scale catalog errors.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000003', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'Orders and Fulfilment', 'Keep order status reliable.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=3),
  'order-processing-and-exception-tracking', 'Order Processing and Exception Tracking', 'Track payment, fulfilment, address, stock, and fraud-review exceptions according to policy.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=3),
  'shipping-tracking-and-fulfilment-communication', 'Shipping, Tracking, and Fulfilment Communication', 'Coordinate approved shipping updates and investigate delayed or missing status information.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000004', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'Customer Experience', 'Handle common support with clear boundaries.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=4),
  'returns-refunds-exchanges-and-policy-based-support', 'Returns, Refunds, Exchanges, and Policy-Based Support', 'Apply approved policy, document exceptions, and escalate unauthorized refunds or disputes.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=4),
  'customer-service-across-email-chat-and-marketplaces', 'Customer Service Across Email, Chat, and Marketplaces', 'Answer routine questions consistently and preserve context across channels.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000005', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'Inventory and Promotions', 'Support commercial operations without making pricing strategy decisions.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=5),
  'inventory-monitoring-and-reorder-administration', 'Inventory Monitoring and Reorder Administration', 'Track stock signals, supplier updates, and exceptions without inventing availability.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=5),
  'promotions-discount-codes-and-launch-checklists', 'Promotions, Discount Codes, and Launch Checklists', 'Prepare approved promotions and verify dates, exclusions, links, and customer-facing copy.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000008-0000-4000-8000-000000000006', (select id from public.training_courses where slug='ecommerce-virtual-assistant'), 'E-commerce Simulation', 'Run a fictional store day.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=6),
  'store-reporting-and-marketplace-handoffs', 'Store Reporting and Marketplace Handoffs', 'Prepare order, support, stock, and exception summaries.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000008-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='ecommerce-virtual-assistant') and position=6),
  'composite-e-commerce-va-work-simulation', 'Composite E-commerce VA Work Simulation', 'Handle product updates, an order exception, a return, low stock, a promotion check, and end-of-day reporting.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000008',
  (select id from public.training_courses where slug='ecommerce-virtual-assistant'),
  null,
  'E-commerce Virtual Assistant Final Work Simulation',
  'Complete a composite e-commerce operations simulation covering product data, orders, fulfilment, support, returns, inventory, promotions, and reporting.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000009', 'social-media-virtual-assistant', 'Social Media Virtual Assistant', 'Social media operations training covering content calendars, briefs, asset workflows, captions, scheduling, moderation, escalation, analytics, and repurposing.',
  'skill', null, 300, 'draft', 1, 9, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000001', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Social Media Operations', 'Understand how strategy becomes repeatable publishing work.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=1),
  'channels-audiences-objectives-and-va-boundaries', 'Channels, Audiences, Objectives, and VA Boundaries', 'Translate an approved strategy into operational tasks without inventing business claims or brand direction.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=1),
  'content-calendars-and-approval-workflows', 'Content Calendars and Approval Workflows', 'Plan dates, formats, owners, assets, captions, approvals, and status.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000002', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Content Production Support', 'Coordinate assets and copy carefully.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=2),
  'creative-briefs-canva-workflows-and-asset-qa', 'Creative Briefs, Canva Workflows, and Asset QA', 'Prepare clear briefs and check dimensions, branding, text, source files, and approvals.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=2),
  'caption-drafting-hashtags-links-and-claims', 'Caption Drafting, Hashtags, Links, and Claims', 'Draft from approved facts, verify names and offers, and avoid fabricated statistics or endorsements.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000003', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Publishing', 'Schedule accurately.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=3),
  'scheduling-and-platform-publishing-checks', 'Scheduling and Platform Publishing Checks', 'Verify account, date, time zone, media, caption, tags, links, and preview before publishing.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=3),
  'campaign-and-launch-coordination', 'Campaign and Launch Coordination', 'Coordinate posts with email, landing pages, events, product launches, and deadlines.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000004', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Community Management', 'Respond without creating risk.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=4),
  'comments-dms-and-routine-community-replies', 'Comments, DMs, and Routine Community Replies', 'Use approved response rules and preserve tone while documenting important conversations.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=4),
  'complaints-sensitive-topics-and-escalation', 'Complaints, Sensitive Topics, and Escalation', 'Recognize customer-service, legal, safety, reputation, or policy issues that should not be improvised.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000005', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Measurement and Repurposing', 'Turn activity into reusable learning.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=5),
  'social-reporting-and-content-performance', 'Social Reporting and Content Performance', 'Prepare platform metrics and identify patterns without overstating cause and effect.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=5),
  'content-repurposing-and-responsible-ai', 'Content Repurposing and Responsible AI', 'Adapt approved content to new formats while checking accuracy, context, and brand fit.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000009-0000-4000-8000-000000000006', (select id from public.training_courses where slug='social-media-virtual-assistant'), 'Social Simulation', 'Run a week''s workflow.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=6),
  'influencer-and-ugc-administration', 'Influencer and UGC Administration', 'Track outreach, permissions, assets, deadlines, and usage status without inventing partnership terms.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000009-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='social-media-virtual-assistant') and position=6),
  'composite-social-media-va-simulation', 'Composite Social Media VA Simulation', 'Build and QA a fictional weekly calendar, schedule content, handle comments, escalate a complaint, and report results.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000009',
  (select id from public.training_courses where slug='social-media-virtual-assistant'),
  null,
  'Social Media Virtual Assistant Final Work Simulation',
  'Complete a composite social-media operations simulation covering planning, creative coordination, caption QA, scheduling, moderation, escalation, and reporting.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000010', 'customer-support-virtual-assistant', 'Customer Support Virtual Assistant', 'Customer-support training covering ticket triage, email/chat communication, knowledge-base use, troubleshooting boundaries, escalation, refunds, SLA awareness, CRM notes, and quality.',
  'skill', null, 300, 'draft', 1, 10, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000001', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Support Fundamentals', 'Understand what good support looks like.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=1),
  'customer-support-channels-roles-and-outcomes', 'Customer Support Channels, Roles, and Outcomes', 'Learn how email, chat, phone, social, and ticket systems fit into the customer journey.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=1),
  'tone-empathy-accuracy-and-ownership', 'Tone, Empathy, Accuracy, and Ownership', 'Communicate respectfully without using fake empathy or making promises you cannot keep.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000002', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Ticket Operations', 'Keep queues useful.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=2),
  'ticket-triage-priority-and-routing', 'Ticket Triage, Priority, and Routing', 'Classify by impact, urgency, account context, and ownership rather than simply by arrival time.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=2),
  'notes-tags-statuses-and-handoffs', 'Notes, Tags, Statuses, and Handoffs', 'Leave a clear internal record so another person can continue without rereading the entire history.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000003', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Knowledge and Troubleshooting', 'Solve approved problems consistently.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=3),
  'using-a-knowledge-base-without-copy-paste-support', 'Using a Knowledge Base Without Copy-Paste Support', 'Find the relevant procedure and adapt it to the customer''s actual question.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=3),
  'troubleshooting-boundaries-and-escalation', 'Troubleshooting Boundaries and Escalation', 'Collect evidence, try approved steps, and escalate when access, safety, money, privacy, or specialist knowledge is required.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000004', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Policies and Difficult Cases', 'Apply rules without escalating conflict.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=4),
  'refunds-credits-cancellations-and-policy-boundaries', 'Refunds, Credits, Cancellations, and Policy Boundaries', 'Explain approved policy clearly and identify exceptions that need authorization.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=4),
  'complaints-angry-customers-and-de-escalation', 'Complaints, Angry Customers, and De-Escalation', 'Acknowledge the issue, clarify facts, avoid argument, and route serious matters appropriately.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000005', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Service Quality', 'Measure useful outcomes.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=5),
  'sla-response-time-resolution-and-backlog', 'SLA, Response Time, Resolution, and Backlog', 'Understand operational metrics and how queue behavior affects customers.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=5),
  'quality-assurance-and-support-coaching-notes', 'Quality Assurance and Support Coaching Notes', 'Review accuracy, completeness, tone, policy adherence, and documentation.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000010-0000-4000-8000-000000000006', (select id from public.training_courses where slug='customer-support-virtual-assistant'), 'Support Simulation', 'Handle a mixed queue.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=6),
  'crm-and-cross-team-handoffs', 'CRM and Cross-Team Handoffs', 'Pass customer context to sales, billing, product, operations, or management without dropping ownership.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000010-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='customer-support-virtual-assistant') and position=6),
  'composite-customer-support-simulation', 'Composite Customer Support Simulation', 'Triage fictional tickets, draft responses, troubleshoot an approved issue, handle a refund boundary, and escalate a serious complaint.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000010',
  (select id from public.training_courses where slug='customer-support-virtual-assistant'),
  null,
  'Customer Support Virtual Assistant Final Work Simulation',
  'Complete a composite customer-support simulation covering ticket triage, written responses, knowledge-base use, troubleshooting, refund boundaries, escalation, CRM notes, and handoff.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000011', 'seo-virtual-assistant', 'SEO Virtual Assistant', 'Practical SEO support training covering search intent, keyword research, SERP analysis, on-page SEO, content briefs, internal linking, technical checks, Search Console, reporting, and quality control.',
  'skill', null, 300, 'draft', 1, 11, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000001', (select id from public.training_courses where slug='seo-virtual-assistant'), 'SEO Foundations', 'Understand what search optimization is trying to improve.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=1),
  'search-intent-crawling-indexing-and-rankings', 'Search Intent, Crawling, Indexing, and Rankings', 'Learn the difference between being discovered, indexed, ranked, and clicked.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=1),
  'keywords-topics-entities-and-cannibalization', 'Keywords, Topics, Entities, and Cannibalization', 'Understand why similar phrases do not always deserve separate pages.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000002', (select id from public.training_courses where slug='seo-virtual-assistant'), 'Keyword and SERP Research', 'Research demand and competition carefully.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=2),
  'keyword-research-and-opportunity-prioritization', 'Keyword Research and Opportunity Prioritization', 'Collect volume, difficulty, intent, geography, and business relevance instead of chasing volume alone.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=2),
  'serp-analysis-and-competitor-gap-research', 'SERP Analysis and Competitor Gap Research', 'Inspect what ranks, page type, content depth, features, and gaps before recommending a page.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000003', (select id from public.training_courses where slug='seo-virtual-assistant'), 'On-Page SEO', 'Improve pages without keyword stuffing.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=3),
  'titles-meta-descriptions-headings-and-search-intent', 'Titles, Meta Descriptions, Headings, and Search Intent', 'Write accurate search snippets and page structure aligned to user intent.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=3),
  'content-briefs-coverage-and-helpful-depth', 'Content Briefs, Coverage, and Helpful Depth', 'Turn research into a brief that supports useful content rather than repetitive filler.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000004', (select id from public.training_courses where slug='seo-virtual-assistant'), 'Site Architecture', 'Help search engines and users find important pages.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=4),
  'internal-linking-and-anchor-text', 'Internal Linking and Anchor Text', 'Choose relevant source pages, natural anchors, and destinations without mechanical linking.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=4),
  'canonicals-indexability-redirects-and-sitemap-basics', 'Canonicals, Indexability, Redirects, and Sitemap Basics', 'Recognize common technical SEO problems and know when developer support is required.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000005', (select id from public.training_courses where slug='seo-virtual-assistant'), 'Measurement and QA', 'Use data instead of assumptions.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=5),
  'google-search-console-and-performance-analysis', 'Google Search Console and Performance Analysis', 'Review queries, impressions, clicks, CTR, pages, and indexing signals with the right date and country context.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=5),
  'seo-qa-reporting-and-change-validation', 'SEO QA, Reporting, and Change Validation', 'Verify live pages, document evidence, and distinguish confirmed fixes from recommendations.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000011-0000-4000-8000-000000000006', (select id from public.training_courses where slug='seo-virtual-assistant'), 'SEO Simulation', 'Work a realistic SEO task.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=6),
  'responsible-ai-for-seo-work', 'Responsible AI for SEO Work', 'Use AI to assist research and drafting without inventing volume, links, sources, or audit findings.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000011-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='seo-virtual-assistant') and position=6),
  'composite-seo-va-work-simulation', 'Composite SEO VA Work Simulation', 'Analyze a fictional site''s keyword data and pages, propose on-page fixes, internal links, and technical checks, then produce a client-ready summary.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000011',
  (select id from public.training_courses where slug='seo-virtual-assistant'),
  null,
  'SEO Virtual Assistant Final Work Simulation',
  'Complete a composite SEO support simulation using provided keyword and page data. The learner must separate verified evidence from assumptions and produce practical on-page, internal-link, and technical recommendations.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000012', 'operations-virtual-assistant', 'Operations Virtual Assistant', 'Operations training for VAs supporting recurring workflows, SOPs, task systems, vendors, data, handoffs, incident escalation, KPIs, and process improvement.',
  'skill', null, 300, 'draft', 1, 12, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000001', (select id from public.training_courses where slug='operations-virtual-assistant'), 'Operations Foundations', 'Understand how recurring work becomes a system.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=1),
  'processes-inputs-outputs-owners-and-controls', 'Processes, Inputs, Outputs, Owners, and Controls', 'Map a process from trigger to completion and identify who owns each decision.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=1),
  'operational-risk-exceptions-and-escalation', 'Operational Risk, Exceptions, and Escalation', 'Distinguish routine variation from exceptions that need management attention.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000002', (select id from public.training_courses where slug='operations-virtual-assistant'), 'SOPs and Workflows', 'Make repeatable work easier to execute.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=2),
  'writing-and-maintaining-useful-sops', 'Writing and Maintaining Useful SOPs', 'Document steps, decisions, evidence, exceptions, and ownership without creating unreadable manuals.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=2),
  'checklists-templates-and-recurring-task-systems', 'Checklists, Templates, and Recurring Task Systems', 'Use lightweight tools to reduce memory-dependent work.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000003', (select id from public.training_courses where slug='operations-virtual-assistant'), 'Coordination', 'Keep people and external parties aligned.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=3),
  'vendor-supplier-and-contractor-administration', 'Vendor, Supplier, and Contractor Administration', 'Track requests, documents, deadlines, approvals, and follow-ups.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=3),
  'cross-team-handoffs-and-dependency-tracking', 'Cross-Team Handoffs and Dependency Tracking', 'Surface blockers, next owners, and due dates before work stalls.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000004', (select id from public.training_courses where slug='operations-virtual-assistant'), 'Data and Reporting', 'Create visibility.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=4),
  'operational-data-quality-and-reconciliation', 'Operational Data Quality and Reconciliation', 'Compare systems, identify exceptions, and avoid silently forcing mismatched records.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=4),
  'kpi-reporting-and-exception-summaries', 'KPI Reporting and Exception Summaries', 'Prepare useful operational metrics without hiding definitions or data limitations.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000005', (select id from public.training_courses where slug='operations-virtual-assistant'), 'Process Improvement', 'Improve carefully.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=5),
  'finding-bottlenecks-and-repeated-failure-points', 'Finding Bottlenecks and Repeated Failure Points', 'Use evidence from delays, rework, errors, and handoffs to identify improvement opportunities.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=5),
  'automation-awareness-and-safe-change-management', 'Automation Awareness and Safe Change Management', 'Identify repetitive work that may be automatable while preserving approvals, testing, and fallback procedures.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000012-0000-4000-8000-000000000006', (select id from public.training_courses where slug='operations-virtual-assistant'), 'Operations Simulation', 'Run a fictional operating day.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=6),
  'incident-coordination-and-business-continuity-handoffs', 'Incident Coordination and Business Continuity Handoffs', 'Document issues, owners, impact, actions, and unresolved decisions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000012-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='operations-virtual-assistant') and position=6),
  'composite-operations-va-simulation', 'Composite Operations VA Simulation', 'Handle vendor delays, recurring tasks, data mismatch, SOP gaps, KPI reporting, and an operational incident.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000012',
  (select id from public.training_courses where slug='operations-virtual-assistant'),
  null,
  'Operations Virtual Assistant Final Work Simulation',
  'Complete a composite operations simulation covering SOP use, recurring tasks, vendor coordination, data reconciliation, KPI reporting, process exceptions, and incident handoff.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000013', 'project-management-for-virtual-assistants', 'Project Management for Virtual Assistants', 'Project-coordination training covering scope, tasks, dependencies, timelines, meetings, risk, stakeholder communication, documentation, change control, quality, and closeout.',
  'skill', null, 300, 'draft', 1, 13, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000001', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Project Fundamentals', 'Understand temporary work with a defined outcome.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=1),
  'projects-scope-deliverables-and-success-criteria', 'Projects, Scope, Deliverables, and Success Criteria', 'Distinguish project work from ongoing operations and define what completion means.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=1),
  'roles-ownership-decisions-and-governance', 'Roles, Ownership, Decisions, and Governance', 'Clarify sponsor, owner, contributors, approvers, and escalation paths.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000002', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Planning', 'Turn goals into executable work.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=2),
  'tasks-dependencies-milestones-and-estimates', 'Tasks, Dependencies, Milestones, and Estimates', 'Break work down, show sequence, and avoid hiding dependencies.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=2),
  'timelines-capacity-and-realistic-scheduling', 'Timelines, Capacity, and Realistic Scheduling', 'Build schedules around actual availability, risk, and review time.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000003', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Execution', 'Keep progress visible.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=3),
  'project-boards-statuses-and-work-in-progress', 'Project Boards, Statuses, and Work-in-Progress', 'Maintain an accurate view of what is not started, active, blocked, waiting, and complete.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=3),
  'meetings-notes-decisions-and-action-tracking', 'Meetings, Notes, Decisions, and Action Tracking', 'Use meetings to resolve work and record decisions rather than create more ambiguity.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000004', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Risk and Communication', 'Surface trouble early.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=4),
  'risks-issues-dependencies-and-escalation', 'Risks, Issues, Dependencies, and Escalation', 'Track potential problems separately from problems already happening.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=4),
  'stakeholder-updates-and-status-reporting', 'Stakeholder Updates and Status Reporting', 'Report progress, blockers, decisions, scope, and next milestones concisely.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000005', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Change and Quality', 'Protect the agreed outcome.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=5),
  'scope-changes-requests-and-change-control', 'Scope Changes, Requests, and Change Control', 'Record new requests and their impact instead of silently absorbing unlimited work.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=5),
  'quality-checks-acceptance-and-rework', 'Quality Checks, Acceptance, and Rework', 'Define review criteria and document what was accepted or returned.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000013-0000-4000-8000-000000000006', (select id from public.training_courses where slug='project-management-for-virtual-assistants'), 'Closeout and Simulation', 'Finish cleanly.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=6),
  'project-handover-documentation-and-retrospective', 'Project Handover, Documentation, and Retrospective', 'Close open items, transfer ownership, archive evidence, and capture lessons learned.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000013-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='project-management-for-virtual-assistants') and position=6),
  'composite-project-coordination-simulation', 'Composite Project Coordination Simulation', 'Plan and coordinate a fictional website launch with dependencies, delays, stakeholder changes, QA, and final handover.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000013',
  (select id from public.training_courses where slug='project-management-for-virtual-assistants'),
  null,
  'Project Management for Virtual Assistants Final Work Simulation',
  'Complete a composite project-coordination simulation covering scope, task planning, dependencies, timeline, risk, status communication, change control, QA, and closeout.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000014', 'payroll-administration', 'Payroll Administration for Virtual Assistants', 'Payroll-administration training for VAs supporting timesheets, employee data, leave, payroll inputs, approvals, exception tracking, pay-run preparation, reporting, and secure handoff without providing statutory or tax advice.',
  'skill', null, 300, 'draft', 1, 14, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000001', (select id from public.training_courses where slug='payroll-administration'), 'Payroll Boundaries and Privacy', 'Understand high-risk data and approval limits.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=1),
  'payroll-workflow-roles-and-country-specific-rules', 'Payroll Workflow, Roles, and Country-Specific Rules', 'Map inputs, review, pay run, reporting, and statutory handoffs while recognizing that rules differ by country.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=1),
  'employee-data-confidentiality-and-access-control', 'Employee Data, Confidentiality, and Access Control', 'Protect bank, tax, salary, leave, and identity information with minimum necessary access.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000002', (select id from public.training_courses where slug='payroll-administration'), 'Inputs', 'Prepare clean payroll data.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=2),
  'timesheets-hours-overtime-and-cut-offs', 'Timesheets, Hours, Overtime, and Cut-Offs', 'Collect and validate approved time inputs without deciding disputed hours yourself.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=2),
  'leave-new-starters-leavers-and-employee-changes', 'Leave, New Starters, Leavers, and Employee Changes', 'Track approved changes and missing information before payroll cut-off.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000003', (select id from public.training_courses where slug='payroll-administration'), 'Pay Components', 'Understand the data without pretending to be a payroll professional.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=3),
  'earnings-allowances-deductions-and-reimbursements', 'Earnings, Allowances, Deductions, and Reimbursements', 'Recognize common input categories and escalate unclear treatment.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=3),
  'benefits-contributions-and-statutory-items-awareness', 'Benefits, Contributions, and Statutory Items Awareness', 'Understand that country-specific statutory handling requires qualified guidance or approved system rules.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000004', (select id from public.training_courses where slug='payroll-administration'), 'Pay-Run Support', 'Prepare for review.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=4),
  'pre-payroll-checks-and-exception-reports', 'Pre-Payroll Checks and Exception Reports', 'Find missing timesheets, unusual changes, duplicate inputs, and approval gaps.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=4),
  'approval-payment-and-payslip-administration', 'Approval, Payment, and Payslip Administration', 'Support approved steps without authorizing funds or changing protected figures outside process.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000005', (select id from public.training_courses where slug='payroll-administration'), 'After Payroll', 'Close the cycle cleanly.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=5),
  'payroll-queries-corrections-and-escalation', 'Payroll Queries, Corrections, and Escalation', 'Document employee questions and route disputes, tax issues, or sensitive corrections appropriately.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=5),
  'reports-reconciliations-and-finance-handoffs', 'Reports, Reconciliations, and Finance Handoffs', 'Prepare approved reports and exception notes for finance or payroll specialists.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000014-0000-4000-8000-000000000006', (select id from public.training_courses where slug='payroll-administration'), 'Payroll Simulation', 'Run a fictional payroll support cycle.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=6),
  'payroll-calendar-and-recurring-controls', 'Payroll Calendar and Recurring Controls', 'Maintain cut-offs, approval dates, pay dates, and recurring compliance handoffs.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000014-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='payroll-administration') and position=6),
  'composite-payroll-administration-simulation', 'Composite Payroll Administration Simulation', 'Process fictional timesheet, leave, starter, reimbursement, missing-approval, and correction scenarios through a controlled handoff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000014',
  (select id from public.training_courses where slug='payroll-administration'),
  null,
  'Payroll Administration for Virtual Assistants Final Work Simulation',
  'Complete a composite payroll-administration simulation covering timesheets, employee changes, leave, pre-payroll checks, approvals, exception tracking, payroll queries, and finance handoff. Do not provide tax or statutory advice.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

insert into public.training_courses (
  id, slug, title, summary, category, country_focus, estimated_minutes,
  status, content_version, recommended_order, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000015', 'airbnb-short-term-rental-virtual-assistant', 'Airbnb / Short-Term Rental Virtual Assistant', 'Short-term rental operations training covering booking administration, guest communication, calendars, turnovers, maintenance, check-in/out, issue escalation, reviews, and owner reporting.',
  'industry', null, 300, 'draft', 1, 15, now(), now()
)
on conflict (slug) do update
set recommended_order = excluded.recommended_order,
    estimated_minutes = excluded.estimated_minutes,
    updated_at = now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000001', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'Short-Term Rental Operations', 'Understand the guest and property lifecycle.', 1)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000011',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=1),
  'booking-lifecycle-and-channel-basics', 'Booking Lifecycle and Channel Basics', 'Map enquiry, booking, pre-arrival, stay, checkout, turnover, review, and reporting.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000012',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=1),
  'listing-information-house-rules-and-source-of-truth', 'Listing Information, House Rules, and Source of Truth', 'Keep property details, amenities, instructions, and policies accurate across approved channels.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000002', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'Reservations and Calendars', 'Prevent avoidable booking problems.', 2)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000021',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=2),
  'reservation-administration-and-guest-details', 'Reservation Administration and Guest Details', 'Verify dates, guest count, approved requirements, and booking status.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000022',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=2),
  'calendar-coordination-and-double-booking-prevention', 'Calendar Coordination and Double-Booking Prevention', 'Work with synced calendars, blocks, owner stays, maintenance holds, and change controls.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000003', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'Guest Communication', 'Provide clear service without making unauthorized promises.', 3)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000031',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=3),
  'pre-arrival-check-in-and-stay-messaging', 'Pre-Arrival, Check-In, and Stay Messaging', 'Send approved information at the right time and verify access instructions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000032',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=3),
  'questions-complaints-and-escalation', 'Questions, Complaints, and Escalation', 'Handle routine questions and recognize safety, refund, damage, discrimination, or platform-policy issues that require escalation.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000004', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'Turnovers and Property Readiness', 'Coordinate the physical operation remotely.', 4)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000041',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=4),
  'cleaning-linen-supplies-and-turnover-checklists', 'Cleaning, Linen, Supplies, and Turnover Checklists', 'Coordinate approved vendors, timings, readiness evidence, and exceptions.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000042',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=4),
  'maintenance-requests-and-emergency-routing', 'Maintenance Requests and Emergency Routing', 'Log issues, collect useful evidence, coordinate authorized work, and escalate emergencies.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000005', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'Commercial Administration', 'Support the owner without controlling pricing strategy unless assigned.', 5)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000051',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=5),
  'rates-discounts-fees-and-approval-boundaries', 'Rates, Discounts, Fees, and Approval Boundaries', 'Update approved pricing or promotions while keeping owner decisions and platform rules clear.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000052',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=5),
  'reviews-guest-records-and-owner-reporting', 'Reviews, Guest Records, and Owner Reporting', 'Coordinate review workflows and prepare occupancy, issue, maintenance, and guest-service summaries.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_modules (id, course_id, title, summary, position)
values ('21000015-0000-4000-8000-000000000006', (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'), 'STR Simulation', 'Manage a fictional multi-property day.', 6)
on conflict (course_id, position) do update
set title=excluded.title, summary=excluded.summary, updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000061',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=6),
  'vendor-and-multi-property-handoffs', 'Vendor and Multi-Property Handoffs', 'Track cleaners, maintenance, access, arrivals, departures, and exceptions across properties.', '[]'::jsonb, 25,
  1, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_lessons (
  id, module_id, slug, title, summary, content, estimated_minutes,
  position, is_published, content_version, created_at, updated_at
) values (
  '22000015-0000-4000-8000-000000000062',
  (select id from public.training_modules where course_id=(select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant') and position=6),
  'composite-short-term-rental-va-simulation', 'Composite Short-Term Rental VA Simulation', 'Handle a booking change, early-arrival request, turnover delay, maintenance problem, guest complaint, and owner handoff.', '[]'::jsonb, 25,
  2, false, 1, now(), now()
)
on conflict (module_id, slug) do update
set title=excluded.title,
    summary=excluded.summary,
    estimated_minutes=excluded.estimated_minutes,
    is_published=false,
    updated_at=now();

insert into public.training_assessments (
  id, course_id, module_id, title, instructions, assessment_type,
  pass_score, position, is_published, created_at, updated_at
) values (
  '23000000-0000-4000-8000-000000000015',
  (select id from public.training_courses where slug='airbnb-short-term-rental-virtual-assistant'),
  null,
  'Airbnb / Short-Term Rental Virtual Assistant Final Work Simulation',
  'Complete a composite short-term-rental operations simulation covering reservations, guest communication, calendar conflicts, turnover, maintenance, escalation, reviews, and owner reporting.',
  'practical', null, 1, false, now(), now()
)
on conflict (id) do update
set title=excluded.title,
    instructions=excluded.instructions,
    is_published=false,
    updated_at=now();

