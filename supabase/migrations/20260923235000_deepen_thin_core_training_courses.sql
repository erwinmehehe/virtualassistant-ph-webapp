-- Add concrete work-product drills to the seven thinner core specializations.

with drills(course_slug,lesson_title,prompt) as (
  values
    ('bookkeeping-administration','Bookkeeping Workflow and Role Boundaries','Build a one-page authority matrix for Cedar Lane Services: what the VA may prepare, what requires bookkeeper/accountant review, and what the VA must never approve. Include three ambiguous requests and the escalation owner for each.'),
    ('bookkeeping-administration','Financial Data Privacy, Access, and Audit Trail','Create an access-and-evidence checklist for a new bookkeeping VA. Mark which files should be view-only, which actions need approval, what must be logged, and how credentials or bank data should never be shared.'),
    ('bookkeeping-administration','Invoices, Bills, Receipts, and Supporting Documents','From the fictional AP file, create a source-document exception table showing what is complete, what is missing, what may be duplicate, and what cannot move to approval.'),
    ('bookkeeping-administration','Categories, Accounts, and Coding Questions','Write five reviewer-ready coding questions for ambiguous transactions. Each question must include the transaction evidence, what is known, what is uncertain, and avoid proposing tax/accounting treatment as fact.'),
    ('bookkeeping-administration','Supplier Bills and Approval Workflows','Prepare a supplier-bill approval queue with amount, due date, approver, source-document status, duplicate check, bank-detail status, and reason for any hold.'),
    ('bookkeeping-administration','Payment Preparation and Supplier Follow-Up','Prepare a payment-batch preflight note. Separate bills ready for approval from bills blocked by bank-detail verification, missing approval, duplicate risk, or incomplete evidence.'),
    ('bookkeeping-administration','Customer Invoices, Credits, and Payment Status','Build an AR status tracker that distinguishes issued, overdue, disputed, partially paid, credited, and payment-received-but-unmatched items.'),
    ('bookkeeping-administration','Overdue Accounts and Debtor Follow-Up','Draft two debtor follow-ups: one routine overdue reminder and one disputed-invoice acknowledgement. Include the CRM/accounting note you would leave after each message.'),
    ('bookkeeping-administration','Bank Reconciliation Preparation','Produce an unreconciled-items log from the fictional bank lines. For each line, list evidence checked, likely category of exception, and the reviewer decision still needed.'),
    ('bookkeeping-administration','Month-End, Payroll, and Accountant Handoffs','Create a month-end handoff checklist covering missing source documents, unresolved reconciliations, payroll-report availability, approval gaps, unusual transactions, and reviewer questions.'),
    ('bookkeeping-administration','Financial Reporting Support and Exception Logs','Turn five raw finance exceptions into a concise owner/accountant summary grouped by urgency, financial impact, and required decision.'),
    ('bookkeeping-administration','Composite Bookkeeping Administration Simulation','Complete the full source-document, AP, AR, reconciliation, month-end, and reviewer-handoff pack using the fictional resource files. Your output should be usable without the reviewer rereading the entire queue.'),
    ('sales-lead-generation-virtual-assistant','Sales Funnel, ICP, and Lead Stages','Map the fictional sales funnel from new lead to closed outcome. Define the evidence required to move a record into each stage and one example that should stay where it is.'),
    ('sales-lead-generation-virtual-assistant','Ethical Lead Research and Data Quality','Audit a 10-row prospect sample for source, relevance, duplication, stale employment, suppression status, and unnecessary personal data. Produce a clean-up decision for every row.'),
    ('sales-lead-generation-virtual-assistant','Prospect Research and List Building','Build a six-prospect research sheet using only verifiable business sources. Include source URL, checked date, role relevance, and a note explaining why each account fits the approved ICP.'),
    ('sales-lead-generation-virtual-assistant','Deduplication, Enrichment, and CRM Hygiene','Create a merge/dedupe plan for the fictional CRM. State which record should survive, which fields need verification, and what history must be preserved.'),
    ('sales-lead-generation-virtual-assistant','Outreach Briefs and Personalization','Write three personalization briefs that use verified company facts without pretending familiarity. Flag any fact that is too weak or stale to use.'),
    ('sales-lead-generation-virtual-assistant','Sequences, Follow-Ups, and Reply Triage','Triage the fictional reply queue into interested, referral, not interested, opt-out, objection, complaint, and unclear. Write the next CRM action and owner for each.'),
    ('sales-lead-generation-virtual-assistant','Qualification Support and Discovery Boundaries','Prepare a qualification note for a prospect who has the problem and timing but is not the decision maker. Separate confirmed facts from questions for the salesperson.'),
    ('sales-lead-generation-virtual-assistant','Booking Calls and Preventing No-Shows','Create an appointment-setting checklist with timezone confirmation, attendee details, agenda, reminders, reschedule path, CRM task, and handoff to the salesperson.'),
    ('sales-lead-generation-virtual-assistant','CRM Stages, Notes, Tasks, and Handoffs','Turn five messy interaction notes into concise CRM entries with stage, evidence, next action, owner, due date, and no invented sales conclusions.'),
    ('sales-lead-generation-virtual-assistant','Sales Reporting and Activity Metrics','Build a small funnel report from fictional activity counts. Calculate conversion between stages and explain one data-quality issue that prevents a confident conclusion.'),
    ('sales-lead-generation-virtual-assistant','Escalations, Objections, and Sensitive Replies','Draft safe responses to an opt-out, a complaint about data sourcing, and a pricing objection. Show which can be handled by the VA and which needs sales/privacy leadership.'),
    ('sales-lead-generation-virtual-assistant','Composite Sales & Lead Gen Simulation','Clean the fictional pipeline, apply suppression, triage replies, prepare qualification/booking handoffs, and produce a short funnel summary with data-quality caveats.'),
    ('social-media-virtual-assistant','Channels, Audiences, Objectives, and VA Boundaries','Create a channel-objective matrix for the fictional brand. For each channel, define audience, objective, allowed VA actions, approval owner, and one action that requires escalation.'),
    ('social-media-virtual-assistant','Content Calendars and Approval Workflows','Turn the fictional launch into a content calendar showing asset, channel, owner, approval state, dependency, due time, and publish blocker.'),
    ('social-media-virtual-assistant','Creative Briefs, Canva Workflows, and Asset QA','Write a production-ready creative brief for one carousel and a QA checklist covering dimensions, source copy, price, claim, CTA, alt text, links, and approval.'),
    ('social-media-virtual-assistant','Caption Drafting, Hashtags, Links, and Claims','Rewrite the unsupported ''best in Australia'' caption into a defensible version using only approved proof points. Record the claim you removed and why.'),
    ('social-media-virtual-assistant','Scheduling and Platform Publishing Checks','Produce a pre-publish checklist for the four launch posts and mark which ones must be stopped based on price, claim, link, and approval evidence.'),
    ('social-media-virtual-assistant','Campaign and Launch Coordination','Build a launch command sheet with go/no-go criteria, owner, monitoring window, rollback condition, and first-hour checks.'),
    ('social-media-virtual-assistant','Comments, DMs, and Routine Community Replies','Draft responses to an availability question, delivery question, routine product question, and creator inquiry, keeping account/order-specific details out of public replies.'),
    ('social-media-virtual-assistant','Complaints, Sensitive Topics, and Escalation','Handle the duplicate-charge complaint and misleading-ad accusation. Write the public acknowledgement, private handoff, evidence to preserve, and escalation owner.'),
    ('social-media-virtual-assistant','Social Reporting and Content Performance','Create a one-page report from fictional reach, engagement, clicks, saves, DMs, and conversions. Separate observed facts from hypotheses and propose two tests.'),
    ('social-media-virtual-assistant','Content Repurposing and Responsible AI','Build a repurposing matrix that turns one approved long-form asset into five channel-specific pieces without inventing claims, quotes, or data.'),
    ('social-media-virtual-assistant','Influencer and UGC Administration','Create a UGC rights tracker covering creator, asset, organic repost permission, paid-ad permission, term, territory, source evidence, and unresolved questions.'),
    ('social-media-virtual-assistant','Composite Social Media VA Simulation','Use the calendar, comment queue, rights note, and QA rules to produce the corrected launch plan, response set, escalation log, and reporting handoff.'),
    ('operations-virtual-assistant','Processes, Inputs, Outputs, Owners, and Controls','Map the fictional booking process as input -> step -> owner -> output -> control. Mark where a missing input should stop the process instead of creating downstream rework.'),
    ('operations-virtual-assistant','Operational Risk, Exceptions, and Escalation','Build an exception matrix for backlog, supplier delay, duplicates, KPI decline, and automation failure. Rank impact, urgency, owner, containment step, and escalation trigger.'),
    ('operations-virtual-assistant','Writing and Maintaining Useful SOPs','Rewrite a vague five-line SOP into a usable procedure with trigger, required inputs, steps, exception path, evidence, and completion definition.'),
    ('operations-virtual-assistant','Checklists, Templates, and Recurring Task Systems','Create a recurring operations checklist that distinguishes daily checks, weekly reconciliations, monthly reviews, owner, evidence, and missed-task escalation.'),
    ('operations-virtual-assistant','Vendor, Supplier, and Contractor Administration','Build a vendor tracker with contact, service, SLA, approval limit, open issue, next checkpoint, backup vendor, and document expiry where relevant.'),
    ('operations-virtual-assistant','Cross-Team Handoffs and Dependency Tracking','Create a dependency board for six tasks. Show predecessor, owner, due date, blocked reason, next action, and what downstream work is affected.'),
    ('operations-virtual-assistant','Operational Data Quality and Reconciliation','Reconcile two fictional operational lists and produce a discrepancy sheet for missing, duplicate, stale, and conflicting records.'),
    ('operations-virtual-assistant','KPI Reporting and Exception Summaries','Use the fictional weekly KPI extract to write a decision-ready summary: what changed, magnitude, likely evidence to investigate, and what is not yet proven.'),
    ('operations-virtual-assistant','Finding Bottlenecks and Repeated Failure Points','Create a bottleneck analysis using cycle time, queue size, rework, and missing-input evidence. Propose the smallest safe experiment and its success measure.'),
    ('operations-virtual-assistant','Automation Awareness and Safe Change Management','Write an automation-change brief for the broken booking task workflow: observed failure, impact, evidence, containment, proposed change, rollback, and validation steps.'),
    ('operations-virtual-assistant','Incident Coordination and Business Continuity Handoffs','Produce an incident timeline and handoff for a 45-minute manager absence. Include containment, customer impact, owners, decisions deferred, and recovery checkpoint.'),
    ('operations-virtual-assistant','Composite Operations VA Simulation','Use the incident queue, KPI data, and process notes to produce a prioritized response plan, exception log, process improvement proposal, and manager handoff.'),
    ('project-management-for-virtual-assistants','Projects, Scope, Deliverables, and Success Criteria','Write a one-page mini charter for the fictional portal launch: outcome, in-scope deliverables, exclusions, acceptance conditions, target date, sponsor, and unresolved assumptions.'),
    ('project-management-for-virtual-assistants','Roles, Ownership, Decisions, and Governance','Create a RACI-lite decision table for sponsor, developer, QA, marketing, client, and project coordinator. Separate task ownership from decision authority.'),
    ('project-management-for-virtual-assistants','Tasks, Dependencies, Milestones, and Estimates','Turn the portal launch into a dependency-based task list. Identify the critical dependency created by the late client spreadsheet and the milestone it threatens.'),
    ('project-management-for-virtual-assistants','Timelines, Capacity, and Realistic Scheduling','Build a revised schedule that accounts for QA duration and developer absence. Show where you need a sponsor decision instead of pretending the original date is guaranteed.'),
    ('project-management-for-virtual-assistants','Project Boards, Statuses, and Work-in-Progress','Create a board snapshot with clear status definitions and move five fictional tasks into the correct status based on actual evidence.'),
    ('project-management-for-virtual-assistants','Meetings, Notes, Decisions, and Action Tracking','Turn a messy meeting transcript into decisions, actions, owners, dates, risks, and unanswered questions. Do not record discussion as a decision unless someone actually decided.'),
    ('project-management-for-virtual-assistants','Risks, Issues, Dependencies, and Escalation','Build a RAID-style log for the late spreadsheet, staff absence, QA window, scope request, and launch-date pressure. State trigger and owner for each.'),
    ('project-management-for-virtual-assistants','Stakeholder Updates and Status Reporting','Write a weekly project update that explains progress, blockers, decisions needed, date risk, and next milestones without hiding uncertainty.'),
    ('project-management-for-virtual-assistants','Scope Changes, Requests, and Change Control','Prepare a change request for the new onboarding video: requested outcome, effort/dependency impact, schedule impact, options, approver, and decision status.'),
    ('project-management-for-virtual-assistants','Quality Checks, Acceptance, and Rework','Create an acceptance checklist for the portal covering functional QA, data migration, permissions, content, analytics, client sign-off, and rework ownership.'),
    ('project-management-for-virtual-assistants','Project Handover, Documentation, and Retrospective','Build the closeout/handover pack: final deliverables, owners, credentials/access handoff, unresolved items, maintenance notes, lessons learned, and archive location.'),
    ('project-management-for-virtual-assistants','Composite Project Coordination Simulation','Submit the charter, dependency plan, risk log, change request, stakeholder update, QA/acceptance plan, and closeout outline for the fictional portal launch.'),
    ('payroll-administration','Payroll Workflow, Roles, and Country-Specific Rules','Create a payroll authority matrix separating employee/manager input, VA preparation, payroll-specialist judgment, finance approval, and payment authorization.'),
    ('payroll-administration','Employee Data, Confidentiality, and Access Control','Design a minimum-access checklist for payroll work covering identity, bank, tax, pay, leave, benefits, exports, screenshots, retention, and incident reporting.'),
    ('payroll-administration','Timesheets, Hours, Overtime, and Cut-Offs','Build a timesheet exception sheet for missing approval, unusual overtime, duplicate entry, late submission, and conflicting hours. Add owner and cut-off impact.'),
    ('payroll-administration','Leave, New Starters, Leavers, and Employee Changes','Create an employee-change control log for starter, leaver, leave, bank update, pay-rate change, and role change. List required evidence and approvals.'),
    ('payroll-administration','Earnings, Allowances, Deductions, and Reimbursements','Prepare a pay-component exception table that separates approved recurring components from unusual or unsupported items needing payroll review.'),
    ('payroll-administration','Benefits, Contributions, and Statutory Items Awareness','Write a reviewer escalation note for a statutory/contribution anomaly without recommending a rate or legal treatment. Include source/effective-date requirements.'),
    ('payroll-administration','Pre-Payroll Checks and Exception Reports','Create the pre-payroll control checklist for the fictional 42-person pay run and mark each known blocker from the resource pack.'),
    ('payroll-administration','Approval, Payment, and Payslip Administration','Map the approval chain from draft payroll to final payment. Show which person may prepare, review, approve, release payment, and handle payslip distribution.'),
    ('payroll-administration','Payroll Queries, Corrections, and Escalation','Draft the employee reply for four missing hours and prepare the evidence/approval path for a correction without promising an off-cycle payment.'),
    ('payroll-administration','Reports, Reconciliations, and Finance Handoffs','Use the fictional variance report to write a finance handoff that explains the 11% increase, what is supported by evidence, and what still requires review.'),
    ('payroll-administration','Payroll Calendar and Recurring Controls','Build a two-cycle payroll calendar with input cut-off, manager approval, draft review, correction window, final approval, payment, reporting, and archive tasks.'),
    ('payroll-administration','Composite Payroll Administration Simulation','Submit the exception sheet, control checklist, bank-change verification plan, variance explanation, employee-query response, approval map, and specialist handoff.'),
    ('airbnb-short-term-rental-virtual-assistant','Booking Lifecycle and Channel Basics','Map a reservation from inquiry to post-stay across PMS/channel, guest communication, payment/approval boundary, turnover, maintenance, review, and owner reporting.'),
    ('airbnb-short-term-rental-virtual-assistant','Listing Information, House Rules, and Source of Truth','Audit a fictional listing against the approved property source record and produce a discrepancy log for amenities, fees, access, house rules, and check-in details.'),
    ('airbnb-short-term-rental-virtual-assistant','Reservation Administration and Guest Details','Build a reservation record that captures only necessary guest/contact details, dates, channel, payment status reference, special requests, risk flags, and next action.'),
    ('airbnb-short-term-rental-virtual-assistant','Calendar Coordination and Double-Booking Prevention','Resolve the fictional Property D channel/PMS conflict. Document the source of truth, immediate containment, channels to verify, and owner handoff.'),
    ('airbnb-short-term-rental-virtual-assistant','Pre-Arrival, Check-In, and Stay Messaging','Write a three-message sequence for pre-arrival, check-in day, and mid-stay using placeholders and clear escalation instructions without exposing access information too early.'),
    ('airbnb-short-term-rental-virtual-assistant','Questions, Complaints, and Escalation','Draft responses for a routine amenity question, a noise complaint, and a serious safety/maintenance issue. Show when the VA stops and escalates.'),
    ('airbnb-short-term-rental-virtual-assistant','Cleaning, Linen, Supplies, and Turnover Checklists','Turn the fictional same-day turnover into a timed readiness checklist with cleaner evidence, damage check, supplies, maintenance, final QA, and guest-ready confirmation.'),
    ('airbnb-short-term-rental-virtual-assistant','Maintenance Requests and Emergency Routing','Create a maintenance ticket for the damaged lamp and a separate emergency-routing note for the lockout. Include evidence, severity rule, vendor/owner approval, and checkpoint.'),
    ('airbnb-short-term-rental-virtual-assistant','Rates, Discounts, Fees, and Approval Boundaries','Prepare the response and approval note for the requested 25% discount when the VA has authority only up to 10%. Do not negotiate beyond the approved rule.'),
    ('airbnb-short-term-rental-virtual-assistant','Reviews, Guest Records, and Owner Reporting','Write a response draft to the negative review and an owner report that separates what happened, what was fixed, what evidence exists, and what follow-up is recommended.'),
    ('airbnb-short-term-rental-virtual-assistant','Vendor and Multi-Property Handoffs','Build an end-of-shift portfolio handoff for all four properties with guest status, turnover, maintenance, calendar risk, vendor owner, and next checkpoint.'),
    ('airbnb-short-term-rental-virtual-assistant','Composite Short-Term Rental VA Simulation','Use the portfolio board, turnover checklist, and owner rules to produce the full priority queue, guest/vendor messages, exception log, and owner handoff.')
), targets as (
  select l.id,d.prompt
  from drills d
  join public.training_courses c on c.slug=d.course_slug
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.title=d.lesson_title
)
update public.training_lessons l
set content = l.content || jsonb_build_array(
      jsonb_build_object('type','heading','text','Work product drill'),
      jsonb_build_object('type','scenario','title','Produce the artifact','text',t.prompt)
    ),
    content_version = l.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from targets t
where l.id=t.id
  and not exists (
    select 1 from jsonb_array_elements(l.content) b
    where b->>'type'='heading' and b->>'text'='Work product drill'
  );

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('bookkeeping-administration','sales-lead-generation-virtual-assistant','social-media-virtual-assistant','operations-virtual-assistant','project-management-for-virtual-assistants','payroll-administration','airbnb-short-term-rental-virtual-assistant');
