-- Separate adjacent VA training courses by job outcome instead of repeating the same curriculum.
-- This is a content-only migration. It does not change course publication policy or learner progress.

with course_updates(slug,summary) as (
  values
    (
      'marketing-virtual-assistant',
      'Campaign-operations training for VAs coordinating briefs, assets, email, CRM segments, landing-page inputs, cross-channel launches, lead routing, analytics, and stakeholder handoffs. Platform-native social publishing, community management, and creator/UGC administration belong in the Social Media VA course.'
    ),
    (
      'social-media-virtual-assistant',
      'Platform-native social-media operations training for VAs handling content calendars, creative QA, captions, scheduling, publishing, comments and DMs, reputation escalation, social reporting, repurposing, and creator/UGC administration. Email, CRM, landing-page, and broader cross-channel campaign operations belong in the Marketing VA course.'
    ),
    (
      'operations-virtual-assistant',
      'Business-as-usual operations training for VAs running repeatable processes, SOPs, recurring controls, vendor coordination, operational handoffs, reconciliations, KPI reporting, bottleneck analysis, automation controls, and incident continuity. Time-bound project scope, milestones, change control, acceptance, and closeout belong in Project Management.'
    ),
    (
      'project-management-for-virtual-assistants',
      'Project-coordination training for VAs supporting finite initiatives with defined scope, deliverables, decision rights, dependencies, schedules, project boards, stakeholder updates, change control, QA and acceptance, handover, and closeout. Recurring BAU process ownership, vendor administration, SOP maintenance, and incident operations belong in Operations.'
    ),
    (
      'medical-healthcare-virtual-assistant',
      'Country-agnostic healthcare administration foundations for VAs: non-clinical role boundaries, privacy-safe handling, intake, referrals, scheduling, records, billing and claims support, routine patient communication, audit trails, and escalation. Australia-specific allied-health practice, funding, recall, and practitioner workflows belong in Australian Allied Health Administration.'
    ),
    (
      'australian-allied-health-administration',
      'Australian allied-health practice administration for VAs who already understand basic healthcare admin concepts. Focuses on Australian privacy context, practitioner workflows, referral readiness, appointment-type rules, recalls and waitlists, funding pathways, billing exceptions, and non-clinical practice escalation rather than reteaching generic healthcare administration.'
    ),
    (
      'bookkeeping-administration',
      'Software-neutral bookkeeping administration foundations for VAs: source evidence, coding questions, AP, payment preparation, AR, debtor follow-up, reconciliation preparation, month-end support, exception logs, audit trails, and professional boundaries. Australian GST/BAS/STP context and product-specific Xero or MYOB execution are taught separately.'
    ),
    (
      'australian-bookkeeping-administration',
      'Australian bookkeeping administration overlay for VAs who understand software-neutral bookkeeping workflows. Focuses on Australian source evidence, GST/BAS-sensitive exceptions, AP/AR controls, reconciliation handoffs, payroll/STP/super administration boundaries, BAS-pack preparation, and accountant or BAS-agent review.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Product-specific Xero workflow training for VAs applying approved bookkeeping procedures inside Xero for Australian businesses. Focuses on organisation access, contacts, invoices, bills, bank feeds and JAX, reconciliation exceptions, GST/BAS review evidence, payroll/STP handoffs, reports, and Xero-specific auditability rather than reteaching bookkeeping fundamentals.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'Product-specific MYOB Business workflow training for VAs applying approved bookkeeping procedures inside MYOB for Australian businesses. Focuses on business-file access, sales and purchases, banking and matching, reconciliation, GST/BAS review evidence, payroll/STP handoffs, reports, and MYOB-specific auditability rather than reteaching bookkeeping fundamentals.'
    )
)
update public.training_courses c
set summary = u.summary,
    content_version = c.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from course_updates u
where c.slug = u.slug;

-- Put the scope distinction inside the learner experience, not only in catalogue copy.
with scope_notes(slug,title,note) as (
  values
    (
      'marketing-virtual-assistant',
      'Course scope: campaign operations',
      'This course owns the operational layer of marketing campaigns: briefs, asset readiness, email, CRM segments, landing-page inputs, cross-channel launch dependencies, lead routing, reporting, and stakeholder handoffs. Use Social Media Virtual Assistant for platform-native publishing, comments and DMs, community moderation, creator coordination, and UGC usage rights.'
    ),
    (
      'social-media-virtual-assistant',
      'Course scope: social channel operations',
      'This course owns social-channel execution: platform-ready creative, captions, scheduling, publishing, community responses, reputation escalation, platform reporting, repurposing, creators, and UGC permissions. Use Marketing Virtual Assistant for email, CRM segmentation, landing-page coordination, broader campaign operations, and cross-channel launch management.'
    ),
    (
      'operations-virtual-assistant',
      'Course scope: recurring business operations',
      'Operations is ongoing business-as-usual work. This course owns repeatable processes, SOPs, recurring controls, vendors, operational handoffs, reconciliations, KPI monitoring, bottleneck removal, automation controls, and incident continuity. Use Project Management for a finite initiative with a defined scope, milestone plan, change log, acceptance criteria, and closeout.'
    ),
    (
      'project-management-for-virtual-assistants',
      'Course scope: finite projects',
      'Project management is temporary work with a defined outcome and end point. This course owns scope, deliverables, project decision rights, dependencies, schedules, project boards, risks, change requests, acceptance, handover, and closeout. Use Operations for recurring BAU processes, SOP ownership, vendor routines, operational KPI cycles, and incident continuity.'
    ),
    (
      'medical-healthcare-virtual-assistant',
      'Course scope: healthcare administration foundations',
      'This course teaches healthcare administration patterns that transfer across practices and countries: privacy-safe handling, intake, referrals, scheduling, billing support, patient communication, audit trails, and escalation. Country-specific funding rules, Australian allied-health appointment structures, recalls, and practitioner workflows belong in Australian Allied Health Administration.'
    ),
    (
      'australian-allied-health-administration',
      'Course scope: Australian allied-health practice operations',
      'This course assumes basic healthcare administration concepts and applies them to Australian allied-health practice operations. Focus on practitioner calendars, referral readiness, recalls and waitlists, Australian privacy context, funding-pathway administration, billing exceptions, and practice handoffs. It does not repeat the full generic Healthcare VA foundation.'
    ),
    (
      'bookkeeping-administration',
      'Course scope: software-neutral bookkeeping administration',
      'Learn the bookkeeping workflow before learning a jurisdiction or product. This course owns source evidence, coding questions, AP, payment preparation, AR, collections administration, reconciliation preparation, month-end support, exception logs, and reviewer handoffs without depending on Xero, MYOB, GST/BAS, or STP.'
    ),
    (
      'australian-bookkeeping-administration',
      'Course scope: Australian bookkeeping overlay',
      'This course assumes the software-neutral bookkeeping workflow and adds Australian operating context: GST/BAS-sensitive evidence, Australian AP/AR controls, reconciliation exceptions, payroll/STP/super handoffs, BAS-pack preparation, and qualified reviewer boundaries. Xero and MYOB courses teach how approved procedures are executed inside those products.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Course scope: execute approved work inside Xero',
      'This is a product workflow course, not a second bookkeeping foundations course. Use approved bookkeeping rules and learn where Xero-specific records, statuses, bank feeds, JAX, reports, GST/BAS review evidence, payroll/STP handoffs, and audit history fit. When the accounting treatment itself is uncertain, route the decision to the authorised finance reviewer.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'Course scope: execute approved work inside MYOB Business',
      'This is a product workflow course, not a second bookkeeping foundations course. Use approved bookkeeping rules and learn how MYOB Business handles sales, purchases, banking, reconciliation, GST/BAS review evidence, payroll/STP handoffs, reports, and auditability. When the accounting treatment itself is uncertain, route the decision to the authorised finance reviewer.'
    )
),
first_lessons as (
  select distinct on (c.id)
    c.id as course_id,
    c.slug,
    l.id as lesson_id
  from public.training_courses c
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id
  join scope_notes s on s.slug = c.slug
  order by c.id,m.position,l.position
)
update public.training_lessons l
set content = case
      when exists (
        select 1
        from jsonb_array_elements(l.content) b
        join scope_notes s on s.slug = f.slug
        where b->>'type' = 'callout' and b->>'title' = s.title
      )
      then l.content
      else l.content || jsonb_build_array(
        jsonb_build_object('type','callout','title',s.title,'text',s.note)
      )
    end,
    content_version = l.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from first_lessons f
join scope_notes s on s.slug = f.slug
where l.id = f.lesson_id;

-- Retitle ambiguous lessons so the catalogue itself communicates the course boundary.
with lesson_updates(course_slug,old_title,new_title,new_summary) as (
  values
    (
      'marketing-virtual-assistant',
      'Content Calendars, Briefs, and Production Tracking',
      'Campaign Content Briefs and Production Tracking',
      'Coordinate campaign content requirements, owners, assets, due dates, approvals, landing-page dependencies, and release status without turning this into platform-by-platform social publishing.'
    ),
    (
      'marketing-virtual-assistant',
      'Community, Lead, and Response Routing',
      'Campaign Lead Routing and Sales Handoff',
      'Route campaign responses and qualified lead signals into the correct CRM, sales, or service workflow instead of running social community management.'
    ),
    (
      'social-media-virtual-assistant',
      'Campaign and Launch Coordination',
      'Social Launch Coordination and Platform Readiness',
      'Coordinate social posts with an approved launch plan while owning platform readiness, scheduled content, social links, previews, and publishing checks rather than the full cross-channel campaign.'
    ),
    (
      'operations-virtual-assistant',
      'Cross-Team Handoffs and Dependency Tracking',
      'Recurring Operational Handoffs and Service Dependencies',
      'Track recurring handoffs, service dependencies, queues, owners, and due dates inside BAU operations before work stalls.'
    ),
    (
      'operations-virtual-assistant',
      'Automation Awareness and Safe Change Management',
      'Operational Automation and Controlled Process Changes',
      'Improve recurring workflows through small controlled changes, testing, approvals, rollback plans, and post-change checks without turning the work into formal project change control.'
    ),
    (
      'project-management-for-virtual-assistants',
      'Roles, Ownership, Decisions, and Governance',
      'Project Roles, Decision Rights, and Governance',
      'Clarify sponsor, project owner, contributors, approvers, decision rights, and escalation paths for a finite initiative.'
    ),
    (
      'australian-allied-health-administration',
      'Patient Intake, Forms, and Demographic Checks',
      'Australian Allied Health Intake, Forms, and Referral Readiness',
      'Prepare patient and referral records for an Australian allied-health practice, checking administrative completeness and routing gaps without making clinical or funding judgments.'
    ),
    (
      'australian-allied-health-administration',
      'Referrals, Documents, and Practitioner Handoffs',
      'Referral Readiness and Practitioner Handoffs',
      'Track referral requirements, supporting records, practitioner routing, and unresolved gaps so the clinician receives a complete administrative handoff.'
    ),
    (
      'australian-allied-health-administration',
      'Scheduling, Appointment Types, Reminders, and No-Shows',
      'Allied Health Appointment Types, Practitioner Calendars, and No-Shows',
      'Apply the practice appointment matrix across practitioner skill, visit type, duration, location, telehealth, room, funding workflow, reminder, and no-show rules.'
    ),
    (
      'australian-bookkeeping-administration',
      'Source Documents, Invoices, Bills, Receipts, and Data Quality',
      'Australian Source Documents and GST-Sensitive Evidence',
      'Apply Australian evidence and record-quality controls to invoices, bills, receipts, statements, and transactions that can flow into GST/BAS and reviewer workflows.'
    ),
    (
      'australian-bookkeeping-administration',
      'Accounts Payable, Approvals, and Payment Preparation',
      'Australian AP Controls and Payment Preparation',
      'Apply Australian business controls to bill entry, approvals, payment preparation, supplier verification, evidence retention, and reviewer exceptions.'
    ),
    (
      'australian-bookkeeping-administration',
      'Accounts Receivable, Invoicing, Credits, and Debtor Follow-Up',
      'Australian AR, Credits, and Debtor Administration',
      'Apply Australian bookkeeping-administration controls to approved invoicing, credits, statements, overdue balances, disputes, and reviewer handoffs.'
    ),
    (
      'australian-bookkeeping-administration',
      'Bank Reconciliation Preparation and Exception Management',
      'Australian Reconciliation Exceptions and GST Review Handoff',
      'Prepare bank and ledger exceptions with source evidence, GST-sensitive questions, and reviewer-ready notes rather than repeating basic reconciliation concepts.'
    ),
    (
      'australian-bookkeeping-administration',
      'Month-End Preparation, Reports, and Accountant Handoff',
      'Australian Month-End, BAS Pack, and Accountant Handoff',
      'Prepare the Australian month-end exception pack, GST/BAS-sensitive questions, payroll/STP handoffs, unresolved reconciliations, and source evidence for qualified review.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Sales Invoices, Credit Notes, and Customer Follow-Up',
      'Running Approved Sales Invoice and Credit Workflows in Xero',
      'Execute approved Xero sales-invoice, credit-note, payment-status, and customer-follow-up workflows while preserving approval and accounting boundaries.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Bills, Receipts, and Accounts Payable in Xero',
      'Capturing Bills and Source Documents in Xero',
      'Use Xero-specific bill and source-document workflows to capture clean evidence, avoid duplicates, and route approval or coding exceptions.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'GST, BAS, and Australian Tax Awareness in Xero',
      'Preparing Xero GST/BAS Review Evidence',
      'Use Xero GST/BAS-related records and reports to prepare review evidence and exceptions without deciding tax treatment or lodging on behalf of the authorised reviewer.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Payroll, STP, and Payroll-Admin Handoffs in Xero',
      'Preparing Xero Payroll/STP Admin Handoffs',
      'Use approved Xero payroll/STP workflows to prepare inputs, exceptions, reports, and handoffs while keeping statutory and payroll decisions with authorised staff.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Xero Reports, Month-End Support, and Composite Simulation',
      'Using Xero Reports for Month-End Review and Simulation',
      'Use Xero reports, statuses, reconciliation evidence, and audit history to build a reviewer-ready month-end handoff and complete the product-specific simulation.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'Sales, Purchases, Invoices, Bills, and Source Documents',
      'Running Sales and Purchase Workflows in MYOB Business',
      'Execute approved MYOB Business sales, purchase, invoice, bill, and source-document workflows while preserving reviewer and accounting boundaries.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'GST Reports, BAS Preparation, and Review Boundaries in MYOB',
      'Preparing MYOB GST/BAS Review Evidence',
      'Use MYOB GST/BAS reports and transaction evidence to prepare reviewer questions and exceptions without making GST treatment or lodgement decisions.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'MYOB Payroll, STP, Super, and Employee Admin Handoff',
      'Preparing MYOB Payroll/STP Admin Handoffs',
      'Use approved MYOB payroll, STP, super, and employee-admin workflows to prepare evidence and exceptions while leaving statutory decisions and declarations with authorised staff.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'MYOB Reports, Accountant Handoff, and Composite Simulation',
      'Using MYOB Reports for Accountant Handoff and Simulation',
      'Use MYOB reports, reconciliation evidence, payroll outputs, and audit trail to build an accountant-ready handoff and complete the product-specific simulation.'
    )
),
targets as (
  select l.id,u.new_title,u.new_summary
  from lesson_updates u
  join public.training_courses c on c.slug = u.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id and l.title = u.old_title
)
update public.training_lessons l
set title = t.new_title,
    summary = t.new_summary,
    content_version = l.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from targets t
where l.id = t.id;

-- Make each final simulation test the scope owned by its course.
with assessment_updates(course_slug,instructions) as (
  values
    (
      'marketing-virtual-assistant',
      'Complete the campaign-operations simulation. Submit: (1) a prioritized launch-risk list, (2) a campaign status update, (3) a corrected cross-channel pre-launch checklist covering approved assets, email, CRM, landing-page inputs, UTMs, owners, and release dependencies, (4) an outdated-price asset escalation, (5) a broken-link QA record, (6) a corrected CRM segment definition, (7) a lead-routing and sales-handoff correction, (8) an approval-status handoff for final creative, and (9) a post-launch performance report separating observed data from assumptions. Do not solve platform community moderation or creator/UGC rights here; those belong in the Social Media VA course.'
    ),
    (
      'social-media-virtual-assistant',
      'Complete the social-channel operations simulation. Submit: (1) a corrected platform content calendar, (2) creative and caption QA corrections, (3) platform-ready scheduling and publishing checks, (4) responses and escalation notes for comments and DMs, (5) a reputation-issue handoff, (6) creator/UGC permission tracking, and (7) a social performance report with evidence-based observations. Do not rebuild email, CRM, landing-page, or broader cross-channel campaign operations; those belong in the Marketing VA course.'
    ),
    (
      'operations-virtual-assistant',
      'Complete the recurring-operations simulation. Map the BAU process, prioritise operational exceptions, reconcile data, assess KPI movement, coordinate vendor and recurring-service handoffs, document the incident, propose a controlled process improvement, and produce a decision-ready manager summary plus end-of-shift handoff. The assessment should improve an ongoing operating system, not create project scope, milestone, change-request, acceptance, or closeout artifacts.'
    ),
    (
      'project-management-for-virtual-assistants',
      'Complete the finite project-coordination simulation. Define project scope and deliverables, decision rights, dependencies, milestones, capacity-aware schedule, project board status, risks and issues, stakeholder update, formal scope-change request, QA and acceptance plan, handover, and closeout. Do not turn this into recurring BAU SOP, vendor, KPI-cycle, or incident ownership; those belong in Operations.'
    ),
    (
      'medical-healthcare-virtual-assistant',
      'Complete the country-agnostic healthcare administration simulation. Submit a prioritized administrative queue, privacy-safe actions, patient-facing administrative messages, referral and record-routing notes, scheduling decisions based on supplied rules, billing/claims exceptions, a clinical escalation note preserving the patient wording, a privacy-incident note, and an end-of-shift handoff. Do not assume Australian allied-health funding pathways, practitioner appointment matrices, or country-specific regulatory rules.'
    ),
    (
      'australian-allied-health-administration',
      'Complete the Australian allied-health practice simulation. Submit: (1) a referral-readiness and intake exception list, (2) practitioner-calendar and appointment-type decisions based on the supplied practice matrix, (3) recall/waitlist actions, (4) privacy-safe patient messages, (5) funding-pathway and billing exceptions that are routed rather than interpreted, (6) practitioner and practice-manager handoffs, and (7) an end-of-day practice status summary. The assessment applies generic healthcare admin skills to Australian allied-health operations rather than retesting the full healthcare foundation.'
    ),
    (
      'bookkeeping-administration',
      'Complete the software-neutral bookkeeping-administration simulation. Review source evidence, build AP and payment exceptions, handle AR follow-up, prepare reconciliation evidence, identify missing month-end records, maintain audit trail, and produce a reviewer handoff. Do not rely on Xero or MYOB interface knowledge and do not answer Australia-specific GST/BAS/STP questions as part of this foundation.'
    ),
    (
      'australian-bookkeeping-administration',
      'Complete the Australian bookkeeping overlay simulation. Starting from a clean bookkeeping workflow, prepare GST/BAS-sensitive evidence and exception questions, apply Australian AP/AR controls, prepare reconciliation exceptions, create the payroll/STP/super handoff, assemble the month-end/BAS review pack, and identify every item requiring an accountant, bookkeeper, BAS agent, payroll owner, or business owner decision. Do not rely on Xero- or MYOB-specific clicks or interface states.'
    ),
    (
      'xero-workflows-for-virtual-assistants',
      'Complete the Xero product-workflow simulation. Use the supplied Xero-style records to prepare contact and invoice corrections, bill/source-document exceptions, bank-feed and JAX reconciliation review, GST/BAS review evidence, payroll/STP admin handoff, and month-end report pack with Xero-specific statuses and auditability. The assessment assumes bookkeeping concepts and tests execution inside Xero, not generic bookkeeping theory.'
    ),
    (
      'myob-workflows-for-virtual-assistants',
      'Complete the MYOB Business product-workflow simulation. Use the supplied MYOB-style records to prepare sales and purchase corrections, banking and reconciliation exceptions, GST/BAS review evidence, payroll/STP admin handoff, and accountant-ready reports with MYOB-specific workflow states and auditability. The assessment assumes bookkeeping concepts and tests execution inside MYOB Business, not generic bookkeeping theory.'
    )
)
update public.training_assessments a
set instructions = u.instructions,
    updated_at = now()
from assessment_updates u
join public.training_courses c on c.slug = u.course_slug
where a.course_id = c.id
  and a.assessment_type = 'practical';
