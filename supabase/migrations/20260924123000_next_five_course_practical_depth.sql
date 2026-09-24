-- Deepen the next five core VA courses with one clear first-class practical task per lesson.
-- Courses: Real Estate, Medical / Healthcare, Bookkeeping, Payroll, and Airbnb / Short-Term Rental.
-- Reuses the strongest existing lesson drill/scenario text, removes generic duplicate practice blocks,
-- and adds course-specific reusable templates and QA checklists.
-- Lesson IDs, progress, enrollment, assessment state, and publication state are preserved.

with specs(course_slug, key_kind, lesson_key, exercise_title, deliverable) as (
  values
  ('real-estate-virtual-assistant','slug','how-real-estate-businesses-and-teams-work','Build the real-estate authority and workflow map','A decision-rights and workflow map showing who owns pricing, contracts, tenancy/legal decisions, customer communication, source systems, approvals, and escalation paths.'),
  ('real-estate-virtual-assistant','slug','the-real-estate-client-and-transaction-journey','Map the client and transaction journey','A stage map with trigger, evidence, owner, deadline, blocker, decision boundary, and next handoff for each step from enquiry to close or archive.'),
  ('real-estate-virtual-assistant','slug','lead-intake-qualification-support-and-crm-hygiene','Clean the lead-intake and CRM queue','A lead-intake audit covering source, duplicate check, verified facts, missing fields, next action, owner, and any qualification decision that must stay with licensed or authorised staff.'),
  ('real-estate-virtual-assistant','slug','follow-up-workflows-and-database-management','Build the follow-up control queue','A follow-up queue with contact/property, reason, last activity, next action, due date, owner, status, escalation trigger, and evidence link.'),
  ('real-estate-virtual-assistant','slug','listing-coordination-and-asset-checklists','Run a listing launch control board','A listing launch board covering approved facts, photos/assets, copy, portal status, dependencies, approvals, blockers, publish state, and final QA.'),
  ('real-estate-virtual-assistant','slug','property-information-documents-and-quality-checks','Reconcile property facts and documents','A property-information QA log showing source of truth, conflicting values, document status, correction allowed, reviewer needed, and final verified state.'),
  ('real-estate-virtual-assistant','slug','inspections-viewings-and-appointment-coordination','Coordinate inspections and viewings without conflicts','An appointment-control sheet with attendee, property, access instructions, time zone, travel/setup dependency, confirmation state, owner, and contingency.'),
  ('real-estate-virtual-assistant','slug','buyer-seller-tenant-and-vendor-updates','Prepare stakeholder updates and escalations','A communication and handoff log for buyer/seller/tenant/vendor updates showing verified facts, approved response, action owner, authority boundary, deadline, and next checkpoint.'),
  ('real-estate-virtual-assistant','slug','contract-to-close-administration-boundaries','Track contract-to-close milestones safely','A milestone tracker with document, due date, responsible person, condition/status, evidence, discrepancy, legal/licensed decision owner, and escalation.'),
  ('real-estate-virtual-assistant','slug','maintenance-and-property-management-support','Run the maintenance triage and vendor queue','A maintenance queue with property, issue, severity, access, evidence, approved action, vendor/owner, quote or spend boundary, tenant update, and next checkpoint.'),
  ('real-estate-virtual-assistant','slug','real-estate-reporting-and-daily-handoffs','Produce a decision-ready real-estate handoff','A daily handoff showing priority files, overdue actions, blockers, appointments, maintenance/listing exceptions, decisions needed, owners, and tomorrow-first actions.'),
  ('real-estate-virtual-assistant','slug','composite-real-estate-va-work-simulation','Final simulation: run the real-estate admin desk','A complete real-estate admin control pack combining CRM cleanup, listing QA, appointment coordination, transaction milestones, maintenance exceptions, stakeholder updates, and end-of-day handoff.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000011','Build the healthcare VA authority and escalation map','An authority map separating routine administrative actions from clinical, billing, privacy, compliance, and manager decisions, with exact escalation routes.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000012','Audit a minimum-necessary health-data workflow','A privacy/access audit showing task purpose, minimum necessary data, approved system, access level, unsafe copies/channels, incident trigger, and privacy owner.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000021','Resolve a patient-intake discrepancy queue','A patient-intake sheet with identity/demographic fields, source, discrepancy, verified correction, missing information, non-clinical next action, owner, and handoff.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000022','Run a referral chain-of-custody tracker','A referral tracker with sender, patient reference, required documents, receipt date, completeness, destination, missing items, follow-up owner, and audit trail.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000031','Build the appointment control board','A scheduling board with patient reference, visit type from approved rules, provider, duration, location, restrictions, required prep, conflict, confirmation, and owner.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000032','Run the reminder, recall, and waitlist queue','A queue showing contact reason, approved script, due date, response, privacy check, booking action, escalation trigger, owner, and next checkpoint.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000041','Prepare the billing administration exception log','A billing-admin log with account reference, source document, status, amount/status where supplied, missing information, action allowed, coding/billing decision to route, and reviewer.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000042','Track claim status without inventing coverage decisions','A claim follow-up tracker with payer/source, submitted status, response, evidence, administrative next action, coding/coverage question to route, owner, and deadline.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000051','Write a patient administrative communication record','A patient communication note containing identity check, verified administrative facts, approved message, unresolved clinical/billing question, owner, promised checkpoint, and system record.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000052','Run the clinical/admin escalation log','An escalation record preserving the patient’s wording, urgency flag from the approved protocol, action taken, prohibited judgment, destination owner, timestamp, and follow-up.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000061','Create an audit-ready healthcare admin record','A factual work record showing task, source, minimum necessary data, action, system update, exception, escalation, owner, timestamp, and completion evidence.'),
  ('medical-healthcare-virtual-assistant','id','22000003-0000-4000-8000-000000000062','Final simulation: run the healthcare admin desk','A complete healthcare admin control pack covering intake, scheduling, referral status, billing/claim admin, patient messages, privacy controls, escalations, and shift handoff.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000011','Map bookkeeping admin boundaries and exception owners','A responsibility matrix showing routine admin actions, accountant/bookkeeper decisions, source evidence, approval points, exceptions, and reviewer ownership.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000012','Audit financial access and change controls','A finance-access control review covering permissions, source verification, bank-detail changes, approval route, audit evidence, risk flags, and remediation owner.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000021','Build the source-document and duplicate-exception register','A source-document register with supplier/customer, document reference, date, amount, duplicate signal, evidence, status, reviewer, and next action.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000022','Prepare a coding-query worksheet','A coding-support worksheet showing transaction, source document, historical treatment, approved chart/rule, uncertainty, question for reviewer, and no unsupported coding decision.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000031','Run the accounts-payable control queue','An AP queue with bill checks, duplicate status, due date, approval evidence, exception, payment readiness, owner, and next checkpoint.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000032','Prepare a payment batch without authorising it','A payment-preparation pack with payee, verified bank details, source bill, approval, amount, due date, fraud/change flag, reviewer, and release boundary.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000041','Run the accounts-receivable exception log','An AR tracker with customer, invoice, receipt/credit evidence, outstanding amount/status, mismatch, action, approval needed, and owner.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000042','Build the debtor follow-up queue','A debtor queue with invoice history, dispute status, approved wording, last contact, next contact date, escalation condition, owner, and evidence.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000051','Prepare the reconciliation discrepancy sheet','A reconciliation sheet separating matched items, missing records, duplicates, timing differences, unsupported corrections, reviewer questions, and evidence.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000052','Build the month-end readiness checklist','A month-end control checklist with source completeness, reconciliations, open AP/AR exceptions, payroll inputs, missing approvals, reviewer questions, and handoff state.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000061','Produce the finance administration reporting pack','A reviewer-ready pack containing exception log, outstanding items, reconciliation status, source links, material changes, unresolved questions, owners, and due dates.'),
  ('bookkeeping-administration','id','22000006-0000-4000-8000-000000000062','Final simulation: run the Cedar Lane bookkeeping desk','A complete bookkeeping-admin pack covering source documents, AP, payment preparation, AR, reconciliation, month-end readiness, exceptions, and reviewer handoff.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000011','Map payroll roles, controls, and decision boundaries','A payroll responsibility matrix separating data preparation, approval, statutory/tax decisions, payment release, review, and escalation.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000012','Audit payroll-data handling and bank-detail changes','A sensitive-data control log with source, approved channel, minimum access, bank-detail verification, change approval, incident flag, owner, and evidence.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000021','Run the timesheet exception queue','A timesheet queue with employee, period, submitted hours, approval state, missing/duplicate input, cut-off risk, manager action, owner, and next checkpoint.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000022','Build the employee-change register','A change register for starters, leavers, pay changes, bank changes, leave/status changes, effective date, source evidence, approval, payroll-period impact, and reviewer.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000031','Prepare the pay-input classification sheet','A payroll-input sheet showing pay component, source, period, approved category/rule, ambiguity, reviewer question, amount/status, and evidence.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000032','Route statutory and tax queries safely','A statutory-query log with employee question, verified payroll record, action the VA can take, tax/statutory decision to route, owner, response checkpoint, and audit note.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000041','Run the pre-payroll variance review','A pre-payroll QA sheet with current vs prior totals, material variance, employee-level exceptions, confirmed evidence, unresolved cause, reviewer, and go/no-go status.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000042','Control changes after payroll approval','A payroll change-control log with approved version, late change request, source, impact, reapproval requirement, payment boundary, owner, and final authorised state.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000051','Resolve an employee payroll query with evidence','A payroll-query case record with employee, period, issue, source records checked, verified discrepancy, action allowed, specialist decision needed, owner, and response.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000052','Prepare the post-payroll reconciliation handoff','A post-payroll pack comparing payroll report, payment/bank total, exceptions, unresolved differences, statutory/reporting handoff, reviewer, and completion evidence.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000061','Build the payroll calendar and recurring control board','A payroll calendar with cut-offs, approvals, holidays, dependencies, recurring controls, owners, exception triggers, and next-cycle preparation.'),
  ('payroll-administration','id','22000014-0000-4000-8000-000000000062','Final simulation: run the Harbor & Field payroll desk','A complete payroll-admin control pack covering timesheets, employee changes, pay inputs, pre-payroll QA, approvals, queries, reconciliation, deadlines, and specialist handoff.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000011','Map the guest journey and source systems','A guest-journey control map showing booking source, system of record, milestone, owner, guest communication, dependency, exception, and next handoff.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000012','Reconcile the property facts and check-in source of truth','A property facts sheet with approved check-in instructions, amenities, access, rules, conflicting sources, correction owner, guest-facing status, and verification date.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000021','Run the reservation exception tracker','A reservation tracker with booking, stay dates, guest request, approved rule, availability/dependency check, action allowed, owner decision, and guest update.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000022','Resolve a calendar and availability conflict','A calendar-conflict log with affected reservations, source calendars, timestamps, root mismatch, immediate containment, owner, guest-risk note, and recovery action.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000031','Prepare the guest messaging and access handoff','A guest communication record with booking context, approved instructions, access status, issue, response, privacy check, escalation trigger, and next checkpoint.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000032','Run the guest complaint and incident triage log','An incident log with guest issue, severity, safety/service impact, verified facts, immediate action, refund/compensation boundary, escalation owner, and communication timeline.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000041','Build the turnover readiness board','A turnover board with checkout/check-in window, cleaning status, linen/supplies, damage or missing items, inspection evidence, blocker, owner, and ready/not-ready decision.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000042','Run the maintenance and vendor incident queue','A maintenance queue with property, issue, severity, access, vendor, approval/spend boundary, evidence, guest impact, owner, ETA, and next checkpoint.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000051','Prepare a rate or discount approval request','A commercial-change request with stay dates, current rate/rule, guest request, occupancy/context supplied, action the VA can take, owner decision, and guest response after approval.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000052','Create the review and owner reporting pack','A post-stay record with verified events, guest issue/resolution, review-response draft, maintenance follow-up, owner metrics, exceptions, and next action.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000061','Build the multi-property shift handoff','A shift handoff covering arrivals, departures, turnovers, maintenance, unresolved guest messages, vendors, approvals, high-risk exceptions, owners, and next checkpoints.'),
  ('airbnb-short-term-rental-virtual-assistant','id','22000015-0000-4000-8000-000000000062','Final simulation: run the Coastline Stays control desk','A complete short-term-rental operations pack covering reservation/calendar controls, guest messaging, turnover, maintenance, complaints, commercial approvals, owner reporting, and shift handoff.')
),
targets as (
  select l.id, l.slug, l.content, s.course_slug, s.exercise_title, s.deliverable
  from specs s
  join public.training_courses c on c.slug = s.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and (
     (s.key_kind = 'id' and l.id::text = s.lesson_key)
     or (s.key_kind = 'slug' and l.slug = s.lesson_key)
   )
  where l.is_published = true
),
expanded as (
  select t.*, b.block, b.ord,
    lag(b.block) over (partition by t.id order by b.ord) as previous_block
  from targets t
  cross join lateral jsonb_array_elements(t.content) with ordinality b(block, ord)
),
source_text as (
  select id, course_slug, exercise_title, deliverable,
    coalesce(
      max(block->>'text') filter (
        where previous_block->>'type' = 'heading'
          and previous_block->>'text' = 'Work product drill'
          and block->>'type' = 'scenario'
      ),
      max(block->>'text') filter (where block->>'type' = 'exercise'),
      max(block->>'text') filter (where block->>'type' = 'scenario'),
      'Complete the practical work using only the supplied evidence and the approved client workflow.'
    ) as exercise_text
  from expanded
  group by id, course_slug, exercise_title, deliverable
),
cleaned as (
  select e.id, e.course_slug, st.exercise_title, st.deliverable, st.exercise_text,
    coalesce(
      jsonb_agg(e.block order by e.ord) filter (
        where e.block->>'type' not in ('exercise','template','checklist')
          and not (e.block->>'type' = 'heading' and e.block->>'text' = 'Work product drill')
          and not (
            e.previous_block->>'type' = 'heading'
            and e.previous_block->>'text' = 'Work product drill'
            and e.block->>'type' = 'scenario'
          )
      ),
      '[]'::jsonb
    ) as teaching_content
  from expanded e
  join source_text st on st.id = e.id
  group by e.id, e.course_slug, st.exercise_title, st.deliverable, st.exercise_text
),
rebuilt as (
  select c.id,
    c.teaching_content || jsonb_build_array(
      jsonb_build_object(
        'type','exercise',
        'title',c.exercise_title,
        'text',c.exercise_text,
        'deliverable',c.deliverable
      ),
      jsonb_build_object(
        'type','template',
        'title',
          case c.course_slug
            when 'real-estate-virtual-assistant' then 'Real-estate admin work product'
            when 'medical-healthcare-virtual-assistant' then 'Healthcare admin work product'
            when 'bookkeeping-administration' then 'Bookkeeping admin work product'
            when 'payroll-administration' then 'Payroll admin work product'
            when 'airbnb-short-term-rental-virtual-assistant' then 'Short-term rental operations work product'
          end,
        'text',
          case c.course_slug
            when 'real-estate-virtual-assistant' then $tpl$Property / contact / file:
Workflow stage:
Source of truth:
Verified facts:
Current status:
Deadline / appointment:
Owner:
Action I can take:
Decision / licensed action needed:
Approver / licensed owner:
Customer / tenant / vendor communication:
Evidence / document link:
Exception / blocker:
Next checkpoint:
Handoff:$tpl$
            when 'medical-healthcare-virtual-assistant' then $tpl$Patient / record reference:
Administrative task:
Approved system / source:
Minimum necessary information:
Verified facts:
Current status:
Action I can take:
Clinical / billing / privacy decision to route:
Destination owner:
Communication sent:
Audit note:
Exception / incident:
Next checkpoint:
Handoff:$tpl$
            when 'bookkeeping-administration' then $tpl$Record / transaction / document:
Period / date:
Source document:
Amount / status:
System:
Verified evidence:
Exception / mismatch:
Administrative action:
Approval required:
Accounting / tax decision to route:
Reviewer:
Next checkpoint:
Handoff:$tpl$
            when 'payroll-administration' then $tpl$Employee / payroll record:
Pay period:
Source input:
Effective date:
Amount / hours / status:
Approval evidence:
Exception / variance:
Administrative action:
Tax / statutory / payroll decision to route:
Reviewer / approver:
Payment boundary:
Next checkpoint:
Handoff:$tpl$
            when 'airbnb-short-term-rental-virtual-assistant' then $tpl$Property:
Booking / guest:
Stay dates:
Source system:
Current status:
Issue / request:
Verified facts:
Approved response / action:
Maintenance / vendor action:
Refund / discount / pricing boundary:
Owner / approver:
Guest communication:
Next checkpoint:
Shift handoff:$tpl$
          end
      ),
      jsonb_build_object(
        'type','checklist',
        'title',
          case c.course_slug
            when 'real-estate-virtual-assistant' then 'Real-estate admin QA'
            when 'medical-healthcare-virtual-assistant' then 'Healthcare admin QA'
            when 'bookkeeping-administration' then 'Bookkeeping admin QA'
            when 'payroll-administration' then 'Payroll admin QA'
            when 'airbnb-short-term-rental-virtual-assistant' then 'Short-term rental operations QA'
          end,
        'items',
          case c.course_slug
            when 'real-estate-virtual-assistant' then jsonb_build_array(
              'Property, contact, file, and workflow stage are correctly identified.',
              'Property facts and status come from the approved source of truth.',
              'Deadlines, appointments, owners, and blockers are explicit.',
              'Pricing, contract, tenancy, legal, trust/deposit, and licensed decisions stay with authorised staff.',
              'Customer-facing communication does not make an unapproved promise.',
              'The next owner can continue from the record without reconstructing the history.'
            )
            when 'medical-healthcare-virtual-assistant' then jsonb_build_array(
              'Only the minimum necessary health information is used.',
              'Work stays inside approved systems and administrative permissions.',
              'Clinical judgment, diagnosis, treatment, and coding/coverage decisions are not made by the VA.',
              'Urgent, privacy, clinical, billing, or compliance issues route to the correct authorised owner.',
              'The administrative note is factual, time-stamped, and audit-ready.',
              'The next owner and checkpoint are explicit.'
            )
            when 'bookkeeping-administration' then jsonb_build_array(
              'The source document, record, date/period, and status are identified before any change.',
              'Amounts and statuses are checked against supplied evidence.',
              'Duplicates, mismatches, missing approvals, and unresolved differences remain visible.',
              'Accounting, tax, coding, payment-authorisation, and professional judgments stay with authorised reviewers.',
              'The work leaves a reviewer-ready audit trail.',
              'Approval and next-owner responsibilities are explicit.'
            )
            when 'payroll-administration' then jsonb_build_array(
              'The correct employee, pay period, source input, and effective date are identified.',
              'Hours, pay inputs, changes, and totals are checked against approved evidence.',
              'Sensitive payroll data stays in approved systems and channels.',
              'Tax, statutory, classification, final payroll, and payment-release decisions stay with authorised staff.',
              'Late changes and variances trigger reapproval rather than silent edits.',
              'The work leaves an audit-ready reviewer handoff.'
            )
            when 'airbnb-short-term-rental-virtual-assistant' then jsonb_build_array(
              'Booking, guest, property, stay dates, and source record are verified.',
              'Guest communication uses approved property and booking information.',
              'Safety, access, refund, compensation, pricing, and policy exceptions are escalated correctly.',
              'Maintenance, turnover, or vendor work has a clear owner and status.',
              'No unverified promise is made to the guest.',
              'The next shift can continue from the handoff.'
            )
          end
      )
    ) as content
  from cleaned c
)
update public.training_lessons l
set
  content = r.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id
  and l.content is distinct from r.content;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'real-estate-virtual-assistant',
  'medical-healthcare-virtual-assistant',
  'bookkeeping-administration',
  'payroll-administration',
  'airbnb-short-term-rental-virtual-assistant'
);
