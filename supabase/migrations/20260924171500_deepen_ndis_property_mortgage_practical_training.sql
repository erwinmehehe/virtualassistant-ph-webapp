-- Deepen NDIS, Property Management Australia, and Mortgage Broking Australia
-- with practical learner work while preserving current regulatory/editorial guidance.
-- Lesson IDs, learner progress, enrollment state, and current publication state are preserved.
-- This migration does not reintroduce retired specialist-review gates.

with specs(
  course_slug,
  lesson_slug,
  exercise_title,
  exercise_text,
  deliverable,
  worked_title,
  worked_text
) as (
  values

  -- NDIS ADMINISTRATION
  (
    'ndis-administration-fundamentals',
    'ndis-ecosystem-participants-providers-and-va-boundaries',
    'Build the NDIS provider authority and handoff map',
    'Evergreen Supports asks a VA to manage participant records, service-agreement follow-up, roster evidence, invoice administration, and routine communications. Map the actors, systems, delegated tasks, and the funding, support-planning, clinical, safeguarding, registration, pricing, and compliance decisions that must stay with authorised owners.',
    'An NDIS authority map showing actor, system, task, information needed, action allowed, decision outside the VA role, escalation owner, and evidence source.',
    null,
    null
  ),
  (
    'ndis-administration-fundamentals',
    '2026-provider-registration-changes-and-sil-administration-awareness',
    'Build the 2026 registration evidence and status tracker',
    'Evergreen Supports has a SIL registration workstream with an application lodged, several evidence requests, and an old pre-July-2026 checklist still in the shared drive. Build the status tracker using only current confirmed evidence, label application versus approved status precisely, and route interpretation questions to the compliance owner.',
    'A registration tracker showing registration group/workstream, current confirmed status, source and checked date, evidence requested, due date, owner, blocked item, public-claim state, and escalation question.',
    'Registration judgment: submitted is not approved',
    'The provider has submitted an application and wants the website changed to say fully registered. The VA records the submission date and source, leaves the public claim unchanged, and asks the responsible compliance owner to approve any wording only after the authoritative registration decision is available.'
  ),
  (
    'ndis-administration-fundamentals',
    'participant-intake-consent-privacy-and-record-setup',
    'Resolve the participant authority and privacy queue',
    'A family member requests a participant schedule, one participant file has an unclear nominee field, and another record contains unnecessary copied identity documents. Verify approved authority evidence, minimise the information used, and document what can be completed versus what must be held.',
    'A participant privacy and authority register with participant reference, requester, authority evidence, permitted disclosure, minimum necessary data, action taken, held information, privacy owner, and next checkpoint.',
    'Authority judgment: relationship is not permission',
    'A participant sister asks for the weekly support schedule, but the provider record does not show her as an authorised contact. The VA records the request, checks the provider-approved authority evidence, does not disclose the schedule, and routes the authority question to the responsible provider contact.'
  ),
  (
    'ndis-administration-fundamentals',
    'service-agreements-and-administrative-change-tracking',
    'Run the service-agreement version and change-control log',
    'Evergreen Supports has an unsigned revised service agreement, a participant request to remove a cancellation clause, and a pending price change that has not yet been agreed. Preserve every version and separate document administration from negotiation or legal/compliance interpretation.',
    'A service-agreement change log with participant reference, current version, requested change, source, approval owner, participant discussion/agreement state, signature state, effective date, superseded version, and next action.',
    null,
    null
  ),
  (
    'ndis-administration-fundamentals',
    'rosters-support-logs-case-notes-and-evidence-administration',
    'Reconcile the roster and delivered-support evidence queue',
    'The roster shows four shifts, but two support logs are missing, one shift duration differs from the roster, and a worker note appears to have been copied into the wrong participant record. Build the exception queue without rewriting worker-authored evidence.',
    'A support-evidence reconciliation sheet showing participant, rostered support, delivered evidence, mismatch, missing record, privacy issue, correction allowed, worker/manager owner, claim readiness, and audit trail.',
    null,
    null
  ),
  (
    'ndis-administration-fundamentals',
    'ndis-invoices-plan-management-types-and-payment-requests',
    'Prepare the NDIS invoice and payment-pathway exception tracker',
    'Evergreen Supports has self-managed, plan-managed, and agency-managed participants in the same billing queue. One invoice is rejected, one payer destination is unclear, and one service record is incomplete. Identify the payment pathway and required evidence without deciding funding eligibility or changing the claim to make it pass.',
    'A payment-pathway tracker showing participant, management type, invoice/claim reference, payer destination, service evidence, rejection or hold reason, action allowed, funding/claim decision to route, owner, and resubmission state.',
    'Claim judgment: rejection is not permission to change the service story',
    'A payment request is rejected while the roster and support log do not agree. The VA captures the rejection reason, compares the approved records, places the claim on hold, and routes the discrepancy to the billing/service owner. The VA does not alter dates, duration, item, or narrative merely to obtain payment.'
  ),
  (
    'ndis-administration-fundamentals',
    'pricing-cancellations-travel-and-billing-exceptions',
    'Build the NDIS pricing and billing exception workpaper',
    'A queue contains a late-cancellation question, travel billing, a support item whose 2026-27 price needs confirmation, and a remote-pricing exception. Use the current approved pricing source and service evidence, recording uncertainty rather than choosing the most convenient code or amount.',
    'A pricing exception workpaper showing support item, date, quantity/unit, location category, current source and effective date, cancellation/travel context, evidence, calculated admin input, unresolved pricing question, reviewer, and status.',
    'Pricing judgment: do not make the claim fit',
    'The historical invoice used a 2025-26 price, but the support date falls under the 2026-27 schedule. The VA records the service date, current official pricing source, item details, and mismatch, then asks the authorised billing owner to confirm treatment. The old amount is not copied forward simply because it was previously accepted.'
  ),
  (
    'ndis-administration-fundamentals',
    'complaints-incidents-safeguarding-and-escalation',
    'Run the complaint and incident escalation log',
    'A participant complaint alleges worker misconduct, another message may describe a serious incident, and a staff member asks the VA whether it is legally reportable. Preserve the participant wording, apply the provider escalation protocol immediately, and keep reportability/safeguarding determinations with authorised owners.',
    'An incident/complaint log with exact reported wording, received time, immediate safety flag from protocol, evidence preserved, action taken, escalation destination, statutory/reportability question, owner, due checkpoint, and communication record.',
    'Incident judgment: escalate first, classify second',
    'A participant message describes an event that could require urgent safeguarding attention. The VA timestamps the report, preserves the participant wording, follows the provider immediate-escalation protocol, and notifies the designated owner. The VA does not decide whether the event is legally reportable before escalating it.'
  ),
  (
    'ndis-administration-fundamentals',
    'ndis-admin-qa-record-integrity-and-provider-handoffs',
    'Build the NDIS provider admin control board',
    'Audit Evergreen Supports for unresolved consent questions, unsigned agreements, missing support logs, claim holds, pricing exceptions, incident follow-ups, and registration evidence tasks. Build one control board that makes overdue and blocked work visible without turning the VA into the compliance decision maker.',
    'A provider control board with workflow, participant/provider reference, status, evidence gap, due date, owner, decision boundary, risk/escalation trigger, last action, and next checkpoint.',
    null,
    null
  ),
  (
    'ndis-administration-fundamentals',
    'ndis-administration-composite-work-simulation',
    'Final simulation: run the Evergreen Supports NDIS admin desk',
    'Use one connected Evergreen Supports case. Work through participant authority, service-agreement changes, roster/evidence discrepancies, claim/payment-pathway exceptions, 2026-27 pricing questions, complaint/incident escalation, and registration evidence. Finish with an end-of-shift provider handoff.',
    'A complete Evergreen Supports NDIS admin control pack combining privacy/authority, agreements, service evidence, claims, pricing, incident escalation, registration status, and provider handoff.',
    null,
    null
  ),

  -- PROPERTY MANAGEMENT AUSTRALIA
  (
    'property-management-administration-australia',
    'australian-property-management-operating-model-and-va-boundaries',
    'Build the property jurisdiction and authority matrix',
    'Harbourview Property Management supports homes in NSW, Victoria, and Queensland. Map each portfolio task to the property jurisdiction, approved source/process, VA action, and the tenancy, trust/bond, legal, licensing, pricing, and owner decisions that must stay with authorised local staff.',
    'A jurisdiction and authority matrix showing property, state/territory, workflow, approved source, action allowed, decision restricted, local owner, and escalation trigger.',
    null,
    null
  ),
  (
    'property-management-administration-australia',
    'owner-tenant-property-and-privacy-data-administration',
    'Audit the owner, tenant, and property data register',
    'The portfolio contains duplicate tenant contacts, an outdated owner bank-detail note, unnecessary identity documents in a shared folder, and conflicting property facts. Clean only what the evidence supports and route sensitive or financial changes through the approved process.',
    'A data-quality register with property/contact, source of truth, duplicate/conflict, sensitive data, correction allowed, verification required, bank-detail risk, owner, and audit note.',
    null,
    null
  ),
  (
    'property-management-administration-australia',
    'leasing-enquiries-applications-and-anti-discrimination-boundaries',
    'Run the rental-application fairness and privacy queue',
    'A leasing queue includes an applicant with young children, an applicant whose social-media profile was added to the file, and another whose unredacted bank transactions were collected. Build the admin queue using approved objective criteria and data-minimisation rules without steering, ranking, or rejecting applicants yourself.',
    'A rental-application administration sheet with property, applicant reference, required evidence, unnecessary/sensitive data, approved criteria checked, missing information, action allowed, decision owner, and communication state.',
    'Application judgment: administrative completeness is not tenant selection',
    'An applicant has young children and a staff note suggests that may be inconvenient for the property. The VA removes the unsupported consideration from their own workflow, records only approved application facts, and routes the complete file to the authorised property manager. The VA does not downgrade or discourage the applicant.'
  ),
  (
    'property-management-administration-australia',
    'rent-arrears-receipts-and-financial-administration',
    'Prepare the rent-ledger and arrears evidence tracker',
    'One tenant appears in arrears, but the ledger also shows an unmatched receipt and a recent reversal. Another file contains a proposed payment plan. Reconcile the evidence and prepare the handoff without deciding legal breach, rent increase, waiver, or termination action.',
    'A rent administration tracker with property/tenancy, jurisdiction, ledger balance, receipts/reversals/credits, mismatch, communication, approved admin action, legal/financial decision owner, and next checkpoint.',
    'Arrears judgment: a ledger is evidence, not legal authority',
    'The ledger shows an overdue balance, but a receipt with the correct tenant reference is still unmatched. The VA records the receipt and ledger evidence, holds any escalation that depends on the final balance, and asks the authorised property manager to confirm the account and next tenancy action.'
  ),
  (
    'property-management-administration-australia',
    'maintenance-emergencies-contractors-and-owner-approvals',
    'Run the maintenance risk and contractor queue',
    'Harbourview receives a report of water entering through a ceiling near a light fitting, a routine leaking tap, and a quote above the owner approval limit. Use the agency emergency/escalation rules, contractor panel, strata/body-corporate checks, and spend limits without diagnosing the technical cause.',
    'A maintenance queue with property, jurisdiction, reported issue, safety/serious-risk flag from protocol, access, strata/body-corporate context, contractor, quote/spend boundary, owner approval, tenant update, and next checkpoint.',
    'Maintenance judgment: triage is not diagnosis',
    'A tenant reports water entering the ceiling near a light fitting. The VA treats it as a serious-risk escalation under the agency protocol, contacts the approved emergency pathway, records access and notifications, and avoids diagnosing whether the electrical system is safe.'
  ),
  (
    'property-management-administration-australia',
    'inspections-access-notices-and-calendar-coordination',
    'Build the inspection and entry-notice control sheet',
    'An inspection needs rescheduling across properties in more than one jurisdiction. For each property, identify the exact purpose for entry, local notice/form requirements, permitted timing/frequency, service evidence, tenant response, and authorised owner before adding the calendar event.',
    'An access-control sheet with property, jurisdiction, purpose, required notice/form, service date/evidence, permitted date/time, frequency check, tenant communication, calendar status, owner, and exception.',
    'Access judgment: a calendar event is not permission to enter',
    'A Queensland routine inspection is on the calendar, but proof of the required notice is missing. The VA does not treat the calendar booking as authority to enter. The file is held until the authorised property manager confirms the correct local notice process and service evidence.'
  ),
  (
    'property-management-administration-australia',
    'renewals-vacates-bonds-and-handover-administration',
    'Prepare the renewal, vacate, and bond evidence register',
    'A vacating tenancy has condition-report photos, invoices, an unmatched rent receipt, and proposed bond deductions. Another tenancy is approaching renewal. Organise the evidence by jurisdiction and status without deciding notice validity, bond entitlement, or tenancy-law outcomes.',
    'A renewal/vacate/bond register with property, jurisdiction, stage, notice/evidence, condition comparison, invoices, ledger issue, proposed deduction, authorised outcome owner, tenant communication, and handover status.',
    'Bond judgment: evidence first, entitlement second',
    'The owner proposes a bond deduction for damage, but the incoming condition report and contractor invoice do not clearly support the amount and an unmatched rent receipt is still open. The VA prepares the evidence pack and leaves the deduction/entitlement decision to the authorised local property manager.'
  ),
  (
    'property-management-administration-australia',
    'property-management-australia-composite-simulation',
    'Final simulation: run the Harbourview mixed-jurisdiction property desk',
    'Use one connected Harbourview portfolio covering NSW, Victoria, and Queensland. Resolve application/privacy issues, rent-ledger exceptions, urgent and routine maintenance, access notices, renewals/vacates, and bond evidence. Finish with a jurisdiction-aware portfolio handoff.',
    'A complete Harbourview property-management control pack covering jurisdiction, applications, privacy/data, rent evidence, maintenance, access, renewal/vacate/bond work, owners, and next checkpoints.',
    null,
    null
  ),

  -- MORTGAGE BROKING AUSTRALIA
  (
    'mortgage-broking-administration-australia',
    'australian-mortgage-broking-model-licensing-and-va-boundaries',
    'Build the mortgage-administration authority matrix',
    'Southern Cross Mortgage uses a VA for document intake, fact-find data entry, lender research support, application packaging, condition tracking, and settlement administration. Map each task against what the VA can prepare and what constitutes broker-only credit judgment or advice.',
    'A mortgage authority matrix showing task, source system, admin action, regulated/broker-only judgment, authorised owner, evidence required, and escalation trigger.',
    null,
    null
  ),
  (
    'mortgage-broking-administration-australia',
    'client-enquiry-identity-privacy-and-document-intake',
    'Run the secure mortgage document-intake checklist',
    'A client file contains identity documents, bank statements, payslips, a missing latest payslip, and files copied to a personal cloud folder. Rebuild the intake record using data-minimisation and approved storage rules, identifying missing and unnecessary information without assessing the loan.',
    'A secure intake checklist with client/file reference, requested document, necessity/purpose, received state, secure location, missing/stale item, privacy issue, action taken, owner, and deadline.',
    null,
    null
  ),
  (
    'mortgage-broking-administration-australia',
    'fact-find-data-entry-requirements-objectives-and-financial-position-support',
    'Build the fact-find contradiction and evidence log',
    'The client file shows living expenses lower than the prior fact find, a liability on a bank statement that is absent from the current fact find, and an outdated payslip. Preserve each source fact and contradiction rather than changing inputs to improve serviceability.',
    'A fact-find evidence log with field, source, current value, conflicting value, missing/stale evidence, administrative update allowed, broker verification required, owner, and status.',
    'Fact-find judgment: data entry is not a serviceability edit',
    'A recurring liability appears on the bank statement but not in the current fact find. The VA records the contradiction and source, leaves both facts visible, and asks the broker to verify the financial position. The liability is not omitted simply because it may reduce borrowing capacity.'
  ),
  (
    'mortgage-broking-administration-australia',
    'product-and-lender-research-support-without-recommendation',
    'Prepare the dated lender research table',
    'Research supplied lender options using the approved sources. Record rate, fees/features/policy facts, source, checked date, and staleness/conflict flags. Do not rank a lender as best or convert factual research into a product recommendation.',
    'A lender research table with lender/product, factual feature, rate/fee data supplied, source, checked date, staleness flag, policy uncertainty, client-file relevance note, and broker decision field.',
    'Research judgment: facts can be compared; recommendations belong to the broker',
    'Lender A has the lowest headline rate, but its research row is the oldest. The VA flags the checked date, refreshes the factual source if permitted, and presents the updated facts without calling Lender A the best option. The authorised broker makes the recommendation and best-interests judgment.'
  ),
  (
    'mortgage-broking-administration-australia',
    'application-packaging-submission-and-lender-conditions',
    'Build the application readiness and disclosure tracker',
    'A broker-approved application is being packaged, but the latest payslip is missing and one disclosure/evidence item is incomplete. Build the readiness checklist, preserve contradictions, and hold submission if required evidence is missing rather than changing the story to fit the lender.',
    'An application tracker with client/file, broker-approved lender/product, required document, source/evidence, disclosure/evidence state, contradiction, submission hold, lender condition, owner, and deadline.',
    null,
    null
  ),
  (
    'mortgage-broking-administration-australia',
    'valuations-conditional-approval-documents-and-pre-settlement-tracking',
    'Run the valuation and conditional-approval control board',
    'The file has conditional approval, an open valuation, a missing updated payslip, and a settlement target approaching. Track exact status, dependencies, expiry/due dates, and owner without describing the loan as unconditionally approved or guaranteed to settle.',
    'A conditions board with item, authoritative status, source, condition/dependency, due/expiry date, client action, broker/lender owner, admin follow-up, settlement impact, and next checkpoint.',
    'Approval judgment: conditional is conditional',
    'The lender has issued conditional approval but the valuation and updated payslip remain outstanding. The VA records the exact lender status, tracks both conditions and due dates, and tells stakeholders only that the file is conditionally approved. It is not described as formally approved or ready for settlement.'
  ),
  (
    'mortgage-broking-administration-australia',
    'settlement-post-settlement-crm-and-referral-administration',
    'Prepare the settlement and post-settlement handoff',
    'A file is approaching settlement with lender/conveyancer checkpoints, CRM tasks, and a referral follow-up. Build the handoff using authoritative confirmations only and keep product suitability, credit advice, and recommendation questions with the broker.',
    'A settlement handoff with settlement target, authoritative confirmation, outstanding dependency, lender/conveyancer/client owner, admin action, CRM update, referral follow-up, broker-only question, and completion evidence.',
    'Settlement judgment: successful settlement needs authoritative confirmation',
    'The scheduled settlement time passes but no authoritative completion confirmation has arrived. The VA keeps the CRM status pending, checks the approved lender/conveyancer channel, and records successful settlement only after the authoritative confirmation is received.'
  ),
  (
    'mortgage-broking-administration-australia',
    'mortgage-broking-administration-australia-composite-simulation',
    'Final simulation: run the Southern Cross Mortgage file desk',
    'Use one connected Southern Cross Mortgage client file. Resolve secure intake gaps, fact-find contradictions, dated lender research, application/disclosure readiness, conditional-approval conditions, valuation and settlement tasks, and final broker handoff without making a lender/product recommendation.',
    'A complete Southern Cross Mortgage file-control pack covering intake, fact-find evidence, dated research, submission/disclosure status, conditions, valuation, settlement, CRM, broker decisions, and next checkpoints.',
    null,
    null
  )
),
targets as (
  select l.id, l.content, s.*
  from specs s
  join public.training_courses c on c.slug = s.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id and l.slug = s.lesson_slug
  where l.is_published = true
),
cleaned as (
  select
    t.id,
    t.course_slug,
    t.lesson_slug,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.worked_title,
    t.worked_text,
    coalesce(
      jsonb_agg(block order by ord)
        filter (where block->>'type' not in ('exercise','template','checklist')),
      '[]'::jsonb
    ) as teaching_content
  from targets t
  cross join lateral jsonb_array_elements(t.content) with ordinality source(block, ord)
  group by
    t.id, t.course_slug, t.lesson_slug, t.exercise_title, t.exercise_text,
    t.deliverable, t.worked_title, t.worked_text
),
rebuilt as (
  select
    c.id,
    c.teaching_content
    || case
      when c.worked_text is null then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object('type','heading','text','Expert worked example'),
        jsonb_build_object('type','scenario','title',c.worked_title,'text',c.worked_text)
      )
    end
    || jsonb_build_array(
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
            when 'ndis-administration-fundamentals' then 'NDIS administration workpaper'
            when 'property-management-administration-australia' then 'Property management workpaper'
            when 'mortgage-broking-administration-australia' then 'Mortgage administration workpaper'
          end,
        'text',
          case c.course_slug
            when 'ndis-administration-fundamentals' then $tpl$Participant / provider reference:
Workflow:
Current status:
Source / evidence:
Source checked date:
Verified facts:
Missing / conflicting evidence:
Administrative action:
Decision outside VA role:
Authorised owner:
Due date / statutory checkpoint:
Communication:
Next checkpoint:
Audit note:$tpl$
            when 'property-management-administration-australia' then $tpl$Property / tenancy / applicant:
Jurisdiction:
Workflow:
Current status:
Approved source / form:
Verified facts:
Evidence / notice / ledger status:
Privacy / safety / financial issue:
Administrative action:
Legal / tenancy / bond / licensed decision:
Authorised local owner:
Communication:
Due date:
Next checkpoint:
Audit note:$tpl$
            when 'mortgage-broking-administration-australia' then $tpl$Client / file:
Workflow stage:
Source document / system:
Checked date:
Verified facts:
Missing / stale evidence:
Contradiction / condition:
Administrative action:
Broker-only credit judgment:
Authorised owner:
Due / expiry date:
Client / lender / third-party communication:
Next checkpoint:
Audit note:$tpl$
          end
      ),
      jsonb_build_object(
        'type','checklist',
        'title',
          case c.course_slug
            when 'ndis-administration-fundamentals' then 'NDIS admin QA'
            when 'property-management-administration-australia' then 'Property admin QA'
            when 'mortgage-broking-administration-australia' then 'Mortgage admin QA'
          end,
        'items',
          case c.course_slug
            when 'ndis-administration-fundamentals' then jsonb_build_array(
              'The participant/provider reference and workflow are correctly identified.',
              'Current official or provider-approved source evidence is recorded where the task is date-sensitive.',
              'Participant privacy, consent, worker evidence, and service records are not changed from assumption.',
              'Funding, support-planning, clinical, safeguarding, registration, pricing, legal, and compliance judgments stay with authorised owners.',
              'Claims and billing exceptions remain evidence-based and unresolved uncertainty stays visible.',
              'The next owner, due date, and checkpoint are explicit.'
            )
            when 'property-management-administration-australia' then jsonb_build_array(
              'The property jurisdiction is identified before applying a notice, entry, rent, bond, or tenancy workflow.',
              'Applicant, tenant, owner, and property data use approved sources and minimum necessary information.',
              'Safety issues are escalated using agency protocol without technical diagnosis.',
              'Legal, tenancy, bond/trust, discrimination, licensing, and enforcement decisions stay with authorised local staff.',
              'Notice, ledger, condition, contractor, and communication evidence remains visible.',
              'The next owner, due date, and checkpoint are explicit.'
            )
            when 'mortgage-broking-administration-australia' then jsonb_build_array(
              'Source documents, checked dates, and contradictions are preserved accurately.',
              'Sensitive client information stays in approved systems and unnecessary data is not retained.',
              'Lender/product research remains factual and dated rather than ranked or recommended.',
              'Borrowing-capacity, suitability, best-interests, recommendation, credit assistance, and advice stay with the authorised broker/licensee process.',
              'Conditional approval, conditions, valuation, disclosure, and settlement status are not overstated.',
              'The next owner, due date, and checkpoint are explicit.'
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

-- NDIS final assessment: one connected provider case.
update public.training_assessments a
set
  title = 'Evergreen Supports NDIS Administration Final Work Simulation',
  instructions = 'Work from one connected fictional NDIS provider case. Use the Evergreen Supports evidence pack to make defensible administrative decisions about participant authority/privacy, service-agreement version control, delivered-support evidence, claim/payment pathways, current pricing exceptions, complaints/incidents, and 2026 registration administration. Show what you completed, what you deliberately held, the evidence used, the authorised owner, and the next checkpoint. Do not provide funding, legal, clinical, support-planning, pricing, registration, compliance, safeguarding, incident-reportability, or claim-eligibility advice.',
  pass_score = 80,
  rubric = '[
    {"id":"evidence","label":"NDIS evidence accuracy","weight":20,"description":"Uses participant, provider, service, billing, and registration records accurately and keeps missing or conflicting evidence visible."},
    {"id":"participant","label":"Participant privacy and agreement administration","weight":15,"description":"Handles authority, consent, minimum-necessary information, service-agreement versions, and communications without inventing rights or agreement."},
    {"id":"service_billing","label":"Service evidence and billing control","weight":20,"description":"Reconciles rosters/support evidence and routes claims, payment-pathway, pricing, cancellation, and travel exceptions from current evidence."},
    {"id":"boundaries","label":"Safeguarding, funding, and compliance boundaries","weight":20,"description":"Escalates clinical, support-planning, funding, safeguarding, incident-reportability, registration, pricing, legal, and compliance decisions to authorised owners.","hard_fail":true},
    {"id":"qa","label":"Provider QA and status control","weight":15,"description":"Tracks current sources, due dates, agreement/claim/registration status, unresolved evidence, and provider handoffs accurately."},
    {"id":"handoff","label":"Provider handoff","weight":10,"description":"Clearly separates completed administration, held work, decision owners, due dates, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"provider","title":"Evergreen Supports provider brief","kind":"policy","content":"Evergreen Supports is a fictional Australian NDIS provider. The VA may maintain approved participant administration, agreement tracking, roster/support evidence queues, invoice and claim administration, routine communications, registration evidence tracking, and provider QA. Funding decisions, plan interpretation, support planning, clinical judgment, safeguarding/reportability determinations, registration/compliance interpretation, pricing judgment, and legal advice stay with authorised owners."},
    {"id":"participants","title":"Participant administration queue","kind":"csv","content":"reference,issue,status\nP01,Family member requests schedule but authority unclear,Hold\nP02,Revised service agreement unsigned; requested cancellation-clause change,Owner review\nP03,Rostered 4h but support log shows 3h,Evidence mismatch\nP04,Plan-managed invoice rejected,Review reason/evidence\nP05,Complaint alleges worker misconduct,Immediate escalation"},
    {"id":"billing","title":"Pricing and claim evidence","kind":"csv","content":"reference,service_date,issue\nP03,2026-09-21,Support duration mismatch\nP04,2026-09-20,Rejected payment request\nP06,2026-09-22,Late-cancellation question\nP07,2026-09-22,Travel billing question\nP08,2026-09-23,2025-26 price copied into 2026-27 period"},
    {"id":"registration","title":"2026 registration workstream","kind":"document","content":"SIL registration application lodged. Current evidence request remains open. Shared drive contains an older pre-July-2026 checklist. Public website currently says application in progress. VA must use current official Commission/provider-approved sources and must not change the public claim to registered without authoritative approval."},
    {"id":"handoff","title":"Provider handoff standard","kind":"checklist","content":"Preserve participant wording and source evidence; record management/payment pathway; use current dated pricing/registration sources; keep unresolved claims visible; escalate safeguarding immediately under provider protocol; identify owner and due date for every held item."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'ndis-administration-fundamentals';

-- Property final assessment: one mixed-jurisdiction portfolio.
update public.training_assessments a
set
  title = 'Harbourview Property Management Australia Final Work Simulation',
  instructions = 'Work from one connected fictional mixed-jurisdiction portfolio. Use the Harbourview evidence pack to make defensible administrative decisions about applicant/privacy handling, rent-ledger exceptions, maintenance triage, inspection/access notices, renewals, vacates, and bond evidence. Identify jurisdiction before applying any notice, entry, rent, bond, or tenancy workflow. Show what you completed, what you held, the source/evidence used, the authorised local owner, and the next checkpoint. Do not make tenant-selection, legal, tenancy-rights, bond/trust, licensing, technical-diagnosis, or enforcement decisions.',
  pass_score = 80,
  rubric = '[
    {"id":"jurisdiction","label":"Jurisdiction-first workflow accuracy","weight":20,"description":"Identifies the correct state/territory and uses the agency current local workflow before acting on tenancy administration."},
    {"id":"privacy_fairness","label":"Application privacy and fairness","weight":15,"description":"Uses minimum necessary applicant/tenant data and avoids discriminatory steering, ranking, or unsupported selection decisions."},
    {"id":"rent_maintenance","label":"Rent and maintenance administration","weight":20,"description":"Reconciles ledger evidence and maintenance/vendor tasks without treating records as legal authority or diagnosing technical issues."},
    {"id":"boundaries","label":"Tenancy, bond, legal, and licensed boundaries","weight":20,"description":"Keeps tenancy-law, entry-right, bond/trust, enforcement, licensing, discrimination, and entitlement decisions with authorised local staff.","hard_fail":true},
    {"id":"qa","label":"Notice, evidence, and status QA","weight":15,"description":"Preserves notice/service, condition, invoice, ledger, contractor, access, and communication evidence with exact status."},
    {"id":"handoff","label":"Portfolio handoff","weight":10,"description":"Clearly separates completed administration, held work, local owners, due dates, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"portfolio","title":"Harbourview mixed-jurisdiction portfolio","kind":"csv","content":"property,jurisdiction,issue\n12 Palm St,NSW,Applicant file includes young children note\n8 Lake Rd,VIC,Rent ledger shows arrears plus unmatched receipt\n44 Hill Ave,QLD,Water entering ceiling near light fitting\n17 Oak Dr,QLD,Routine inspection booked but proof of notice missing\n5 River Rd,NSW,Owner emailed changed bank details\n22 King St,VIC,Vacate with proposed bond deduction and incomplete condition evidence"},
    {"id":"applications","title":"Application and privacy evidence","kind":"document","content":"One applicant file contains copied social-media information. Another includes unredacted bank transaction history beyond the approved application checklist. Agency process requires objective approved criteria and data minimisation. The VA does not select, rank, discourage, or reject applicants."},
    {"id":"tenancy","title":"Rent, access, and vacate evidence","kind":"document","content":"8 Lake Rd has an unmatched receipt and recent reversal. 17 Oak Dr has a calendar event but no visible proof of the required local entry notice. 22 King St has condition photos and invoices, but evidence does not yet support the proposed bond deduction amount."},
    {"id":"maintenance","title":"Maintenance and authority rules","kind":"policy","content":"Immediate safety/serious property risks use the agency emergency escalation pathway. Use preferred contractor, owner spend-limit, and strata/body-corporate processes. The VA does not diagnose technical cause, decide legal access rights, determine bond entitlement, or issue legal/tenancy advice."},
    {"id":"handoff","title":"Portfolio handoff standard","kind":"checklist","content":"Jurisdiction identified; local notice/process source recorded; privacy and applicant data minimised; ledger evidence reconciled before arrears escalation; serious maintenance escalated immediately; bond/vacate evidence separated from entitlement decision; local owner and next checkpoint recorded."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'property-management-administration-australia';

-- Mortgage final assessment: one connected client file.
update public.training_assessments a
set
  title = 'Southern Cross Mortgage Administration Final Work Simulation',
  instructions = 'Work from one connected fictional Australian mortgage-broking client file. Use the Southern Cross Mortgage evidence pack to prepare secure document intake, fact-find contradiction tracking, dated factual lender research, application/disclosure readiness, lender-condition and valuation tracking, settlement administration, and the final broker handoff. Preserve source facts and contradictions. Do not recommend or rank a lender/product, assess borrowing capacity or suitability, make a best-interests conclusion, decide that a credit contract is not unsuitable, provide credit assistance, or give legal/financial advice.',
  pass_score = 80,
  rubric = '[
    {"id":"evidence","label":"Mortgage file evidence accuracy","weight":20,"description":"Uses client, document, lender, and status records accurately and preserves contradictions, missing items, and checked dates."},
    {"id":"intake_factfind","label":"Secure intake and fact-find control","weight":15,"description":"Uses data minimisation, approved storage, exact source values, and clear contradiction/missing-evidence tracking."},
    {"id":"research_application","label":"Research and application administration","weight":20,"description":"Produces dated factual lender research, broker-approved packaging, disclosure/evidence tracking, and condition follow-up without converting research into a recommendation."},
    {"id":"boundaries","label":"Credit, privacy, and broker-only judgment boundaries","weight":20,"description":"Does not make lender/product recommendations, borrowing-capacity, suitability, not-unsuitable, best-interests, legal/financial advice, or regulated credit-assistance judgments.","hard_fail":true},
    {"id":"qa","label":"Approval, condition, and settlement QA","weight":15,"description":"Tracks authoritative status, conditions, valuation, due/expiry dates, disclosure evidence, and settlement confirmation without overstating progress."},
    {"id":"handoff","label":"Broker handoff","weight":10,"description":"Clearly separates completed administration, held items, broker decisions, owners, due dates, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"client","title":"Southern Cross client file checklist","kind":"csv","content":"item,status,issue\nIdentity documents,Complete,None\nLatest payslip,Missing,Only prior pay period available\nBank statements,Complete,Recurring liability visible\nLiving expenses,Entered,Lower than previous fact find\nExisting liabilities,Conflict,Statement liability absent from current fact find\nProperty contract,Complete,None"},
    {"id":"research","title":"Dated lender research extract","kind":"csv","content":"lender,headline_rate,feature_or_policy,checked_date,status\nLender A,5.89%,Offset available,2026-09-12,Older research\nLender B,5.99%,Different fee structure,2026-09-23,Current\nLender C,6.05%,Fast stated turnaround,2026-09-23,Current"},
    {"id":"conditions","title":"Application and condition register","kind":"csv","content":"item,status,owner\nBroker lender/product approval,Approved,Broker\nCredit guide evidence,Recorded,Admin\nProposal document evidence,Missing,Broker/admin review\nApplication submission,Ready pending holds,Admin\nValuation,Open,Broker/lender\nUpdated payslip,Missing,Client\nSettlement target,2026-10-02,Broker/conveyancer"},
    {"id":"scope","title":"Mortgage administration authority matrix","kind":"policy","content":"VA may collect approved documents, enter source data, preserve contradictions, prepare dated factual lender research, package broker-approved applications, track disclosure evidence, manage lender conditions, coordinate settlement administration, and maintain CRM records. Recommendation, ranking as best, borrowing-capacity judgment, suitability/not-unsuitable assessment, best-interests conclusion, legal/financial advice, and regulated credit assistance stay with the appropriately authorised broker/licensee process."},
    {"id":"handoff","title":"Broker handoff standard","kind":"checklist","content":"Missing/stale documents visible; contradictions preserved; lender research includes source and checked date; broker-approved lender/product recorded without VA recommendation; disclosure evidence and conditions tracked; conditional approval not overstated; successful settlement recorded only after authoritative confirmation."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'mortgage-broking-administration-australia';

update public.training_courses
set
  summary = case slug
    when 'ndis-administration-fundamentals' then 'Practical NDIS provider administration training for VAs covering participant authority and privacy, agreements, support evidence, payment pathways, current pricing exceptions, incident escalation, 2026 registration administration, QA, and provider handoffs.'
    when 'property-management-administration-australia' then 'Practical Australian property-management administration training for VAs covering jurisdiction-first workflows, application privacy, rent evidence, maintenance, entry notices, renewals, vacates, bonds, and portfolio handoffs.'
    when 'mortgage-broking-administration-australia' then 'Practical Australian mortgage-broking administration training for VAs covering secure intake, fact-find evidence, dated lender research, application/disclosure readiness, conditions, valuation, settlement, CRM, and broker handoffs.'
  end,
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'ndis-administration-fundamentals',
  'property-management-administration-australia',
  'mortgage-broking-administration-australia'
);
