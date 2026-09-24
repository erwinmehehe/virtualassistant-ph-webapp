-- Add worked examples and sharpen final assessments for the next five core VA courses.
-- Courses: Real Estate, Medical / Healthcare, Bookkeeping, Payroll, and Airbnb / Short-Term Rental.
-- Worked examples model judgment immediately before the learner exercise.
-- Assessment updates keep the existing evidence packs, add one scenario/control resource,
-- and replace the generic rubric with course-specific criteria.

with worked_examples (
  course_slug,
  key_kind,
  lesson_key,
  example_title,
  example_text
) as (
  values
  (
    'real-estate-virtual-assistant',
    'slug',
    'lead-intake-qualification-support-and-crm-hygiene',
    'Worked example: correct the record before advancing the lead',
    'Two enquiries appear to be the same buyer: one record has a mobile number and a viewing request, while the older record has the same email and an agent note. Do not create a third record or mark the lead qualified. Verify the identity, preserve the existing history, merge only under the client''s CRM rule, record the viewing request, and leave qualification to the authorised sales or licensed owner.'
  ),
  (
    'real-estate-virtual-assistant',
    'slug',
    'listing-coordination-and-asset-checklists',
    'Worked example: a newer seller email is not automatically the listing source of truth',
    'The approved listing sheet says three bedrooms, while a later seller email says four. The brochure draft already says four. Pause publication, record the discrepancy, keep the approved source visible, and route the material fact change to the authorised listing owner. Speed is not worth publishing a property fact that has not been formally confirmed.'
  ),
  (
    'real-estate-virtual-assistant',
    'slug',
    'contract-to-close-administration-boundaries',
    'Worked example: track conflicting dates without interpreting the contract',
    'The CRM shows settlement on Friday, while the signed document folder contains a later date. Do not decide which date legally controls. Record both sources, flag the mismatch, stop dependent reminders that could mislead the team, and ask the authorised transaction owner to confirm the operative date before updating the workflow.'
  ),
  (
    'real-estate-virtual-assistant',
    'slug',
    'maintenance-and-property-management-support',
    'Worked example: urgency does not create spending authority',
    'A tenant reports a leaking tap and a contractor quotes 1,200 while the VA approval limit is 500. Log the issue, preserve photos and quote details, communicate the current status to the tenant using the approved wording, and escalate the spend decision. Do not approve the quote merely because the tenant wants an immediate answer.'
  ),

  (
    'medical-healthcare-virtual-assistant',
    'id',
    '22000003-0000-4000-8000-000000000012',
    'Worked example: reduce the data before doing the task',
    'You need to confirm tomorrow''s appointment contact details, but the export also contains diagnoses, medication, balances, and clinical notes. Use only the fields needed for the administrative purpose, keep the work in the approved system, and ask for a reduced export if the workflow supports it. Access to extra data is not a reason to copy or retain it.'
  ),
  (
    'medical-healthcare-virtual-assistant',
    'id',
    '22000003-0000-4000-8000-000000000031',
    'Worked example: scheduling rules do not answer a clinical question',
    'A patient asks to move Friday''s appointment and says their symptoms are worse today. You may handle the scheduling part under the clinic rule, but you should not decide whether Friday is clinically safe. Preserve the patient''s wording and route the clinical statement through the approved escalation pathway before closing the administrative task.'
  ),
  (
    'medical-healthcare-virtual-assistant',
    'id',
    '22000003-0000-4000-8000-000000000042',
    'Worked example: claim status is not a coverage decision',
    'A payer portal shows a claim rejected for missing information. The record also contains a note questioning the code. The VA can document the rejection, gather the missing administrative document, and route the coding question. Do not change the code or tell the patient the service is not covered unless an authorised billing owner has made that determination.'
  ),
  (
    'medical-healthcare-virtual-assistant',
    'id',
    '22000003-0000-4000-8000-000000000052',
    'Worked example: preserve the patient''s words when escalating',
    'A patient says, "I feel much worse and I''m dizzy." A strong administrative note does not translate that into a diagnosis or downgrade it to "routine callback." Record the wording and time, apply only the clinic''s documented urgency-routing rule, identify the receiving clinician or queue, and track the handoff until the administrative responsibility is complete.'
  ),

  (
    'bookkeeping-administration',
    'id',
    '22000006-0000-4000-8000-000000000012',
    'Worked example: changed bank details require independent verification',
    'A familiar supplier emails new bank details and asks for today''s payment. The invoice itself is legitimate. Do not treat the email as enough evidence for the bank change. Put the payment on hold, follow the independent verification process, retain the old and proposed details in the audit trail, and route final approval to the authorised owner.'
  ),
  (
    'bookkeeping-administration',
    'id',
    '22000006-0000-4000-8000-000000000032',
    'Worked example: preparation is separate from payment authority',
    'A payment batch contains three approved bills and one invoice with no purchase-order evidence. Prepare the valid items, hold the exception, show why it is blocked, and send the batch for authorised review. Do not remove the warning, invent an approval, or release payment just to meet the supplier''s requested date.'
  ),
  (
    'bookkeeping-administration',
    'id',
    '22000006-0000-4000-8000-000000000051',
    'Worked example: an unmatched amount is a question, not an adjustment',
    'The bank shows a 2,200 customer deposit with no exact receivable match. One invoice is 2,150 and another customer owes 2,200. Do not force the transaction to the closest-looking record. Document the unmatched evidence, check approved references, keep the reconciliation exception open, and send a precise reviewer question.'
  ),
  (
    'bookkeeping-administration',
    'id',
    '22000006-0000-4000-8000-000000000052',
    'Worked example: month-end readiness can be incomplete without being hidden',
    'The month-end checklist is nearly complete, but one supplier statement is missing and two bank items remain unreconciled. A good handoff marks the pack as not fully ready, lists the missing evidence, assigns owners, and separates administrative completion from accounting sign-off. Do not mark the period complete because the deadline is close.'
  ),

  (
    'payroll-administration',
    'id',
    '22000014-0000-4000-8000-000000000012',
    'Worked example: payroll bank changes need stronger evidence than email',
    'An employee emails a new bank account shortly before payroll cut-off. Even if the message comes from the usual address, follow the payroll change-verification rule, limit access to the people who need the data, and keep the change on hold until approved evidence is complete. Urgency does not weaken payroll security controls.'
  ),
  (
    'payroll-administration',
    'id',
    '22000014-0000-4000-8000-000000000021',
    'Worked example: missing manager approval stays visible',
    'A timesheet has 46 hours entered but no manager approval. Last period the employee worked similar overtime. Historical pattern is not approval. Flag the record before cut-off, route it to the responsible manager, show the payroll impact if unresolved, and keep the hours in exception status until the documented approval arrives.'
  ),
  (
    'payroll-administration',
    'id',
    '22000014-0000-4000-8000-000000000041',
    'Worked example: investigate the variance before normalising it',
    'Draft payroll is 11 percent higher than the prior period, mostly from overtime and a new bonus line. Do not call the increase normal or assume it is wrong. Reconcile the changed categories to approved inputs, isolate unexplained items, document what is verified, and route unresolved variance to the payroll reviewer before approval.'
  ),
  (
    'payroll-administration',
    'id',
    '22000014-0000-4000-8000-000000000042',
    'Worked example: a late change after approval requires change control',
    'A manager sends a pay-change request after the payroll reviewer has approved the batch. Do not silently edit the approved version. Record the request and effective date, identify the affected employee and totals, reopen the approval step under the client''s rule, and make sure the payment file is not treated as final until reapproval is complete.'
  ),

  (
    'airbnb-short-term-rental-virtual-assistant',
    'id',
    '22000015-0000-4000-8000-000000000022',
    'Worked example: contain a calendar conflict before promising a stay',
    'The channel shows a property available, but the PMS contains an owner block for the same dates. Do not confirm the guest based on the channel alone. Treat the PMS as the configured source of truth, preserve both timestamps, stop any automated promise if possible, and escalate the sync conflict before changing availability.'
  ),
  (
    'airbnb-short-term-rental-virtual-assistant',
    'id',
    '22000015-0000-4000-8000-000000000032',
    'Worked example: resolve the service issue without inventing compensation',
    'A guest reports no hot water late at night and asks for a full refund immediately. Start the approved incident workflow, verify the issue and vendor response, communicate what is confirmed, and route any refund or compensation beyond your authority to the owner. Fast acknowledgement is good; an unauthorised financial promise is not.'
  ),
  (
    'airbnb-short-term-rental-virtual-assistant',
    'id',
    '22000015-0000-4000-8000-000000000042',
    'Worked example: maintenance severity and spend approval are different questions',
    'A vendor can attend a leaking appliance now but quotes above the approved spend limit. Record the guest impact, secure the immediate safety or containment step if the SOP allows it, preserve the quote, and escalate spend approval. Do not lower the severity because approval is pending, and do not approve the cost because the issue is urgent.'
  ),
  (
    'airbnb-short-term-rental-virtual-assistant',
    'id',
    '22000015-0000-4000-8000-000000000051',
    'Worked example: use the owner''s discount rule, not your own sales instinct',
    'A guest asks for 25 percent off a longer stay while the owner rule allows the VA to approve up to 10 percent. You can present the approved 10 percent option or escalate the larger request with the relevant stay context. Do not create a new discount because the booking looks valuable.'
  )
),
targets as (
  select l.id, w.example_title, w.example_text
  from worked_examples w
  join public.training_courses c on c.slug = w.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and (
     (w.key_kind = 'id' and l.id::text = w.lesson_key)
     or
     (w.key_kind = 'slug' and l.slug = w.lesson_key)
   )
  where l.is_published = true
),
rebuilt as (
  select
    t.id,
    coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (where b.ord < ex.exercise_ord),
      '[]'::jsonb
    )
    || jsonb_build_array(
      jsonb_build_object(
        'type', 'callout',
        'title', t.example_title,
        'text', t.example_text
      )
    )
    || coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (where b.ord >= ex.exercise_ord),
      '[]'::jsonb
    ) as content
  from targets t
  join lateral (
    select min(b2.ord) as exercise_ord
    from jsonb_array_elements(
      (select l2.content from public.training_lessons l2 where l2.id = t.id)
    ) with ordinality b2(block, ord)
    where b2.block->>'type' = 'exercise'
  ) ex on ex.exercise_ord is not null
  cross join lateral jsonb_array_elements(
    (select l3.content from public.training_lessons l3 where l3.id = t.id)
  ) with ordinality b(block, ord)
  where not exists (
    select 1
    from jsonb_array_elements(
      (select l4.content from public.training_lessons l4 where l4.id = t.id)
    ) existing
    where existing->>'type' = 'callout'
      and existing->>'title' = t.example_title
  )
  group by t.id, t.example_title, t.example_text, ex.exercise_ord
)
update public.training_lessons l
set
  content = r.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id;

-- Real Estate final assessment
update public.training_assessments a
set
  instructions = $ins$Complete the final real-estate administration desk simulation using only the supplied evidence. Submit: (1) a prioritised queue with reasons, (2) corrected CRM intake/follow-up notes, (3) a listing-fact QA record for 12 Palm St, (4) an inspection/viewing coordination plan, (5) a maintenance ticket and above-authority quote escalation, (6) a transaction/date discrepancy note without contract interpretation, (7) two stakeholder messages that make no unauthorised promise, and (8) an end-of-day handoff with owners, deadlines, blockers, and decisions needed. Every status change must cite the source record used. Do not negotiate price, interpret contracts or tenancy law, approve concessions/spend outside authority, or change material property facts without authorised confirmation.$ins$,
  rubric = $rubric$[
    {"id":"source_accuracy","label":"Property and source accuracy","weight":15,"description":"Uses the supplied listing, CRM and queue evidence accurately and keeps conflicting property facts visible until authorised confirmation."},
    {"id":"workflow_control","label":"Workflow and deadline control","weight":20,"description":"Maintains correct stages, appointments, owners, dependencies and due dates across listing, transaction and maintenance work."},
    {"id":"exception_judgment","label":"Exception handling and prioritisation","weight":20,"description":"Identifies material discrepancies, overdue work and high-impact exceptions, then routes them with clear evidence and next actions."},
    {"id":"boundaries","label":"Licensed, legal and commercial boundaries","weight":20,"description":"Does not negotiate, interpret contracts/tenancy rules, alter material facts, approve concessions or exceed spend authority; routes those decisions correctly.","hard_fail":true},
    {"id":"communication","label":"Stakeholder communication","weight":15,"description":"Produces factual, professional buyer/seller/tenant/vendor messages without unsupported commitments."},
    {"id":"handoff","label":"Audit trail and handoff","weight":10,"description":"Leaves source links, owners, deadlines, blockers and decisions needed so the next operator can continue immediately."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id' = 'real_estate_casefile'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {"id":"real_estate_casefile","title":"Transaction, viewing and maintenance casefile","kind":"document","content":"12 Palm St: viewing request tomorrow 10:00; approved listing says 3 bedrooms; seller email says 4 bedrooms but no authorised source update exists. 8 Lake Rd: CRM says settlement Friday while signed-document folder shows the following Tuesday; transaction owner has not confirmed which date controls. 17 Oak Dr: tenant reports active leak; contractor quote 1,200; VA spend authority is 500. Viewing coordinator has two appointments 30 minutes apart with 40 minutes travel time. Learner must preserve source conflicts, fix operational scheduling, and escalate licensed/legal/commercial decisions."}
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'real-estate-virtual-assistant';

-- Medical / Healthcare final assessment
update public.training_assessments a
set
  instructions = $ins$Complete the clinic administration desk simulation using only the supplied records and clinic rules. Submit: (1) a prioritised work queue, (2) intake/referral corrections and missing-item tracker, (3) a scheduling/recall action plan, (4) three patient-facing administrative messages, (5) one clinical escalation note that preserves the patient''s wording, (6) one privacy-incident record, (7) billing/claim exception notes that clearly separate administrative work from coding, coverage or medical-necessity decisions, and (8) an end-of-shift handoff. Use minimum necessary information and identify the authorised owner for every clinical, privacy, billing or compliance decision. Do not diagnose, interpret symptoms/results, recommend treatment, change clinical content, choose codes, or decide coverage.$ins$,
  rubric = $rubric$[
    {"id":"admin_accuracy","label":"Administrative accuracy and evidence","weight":15,"description":"Uses the supplied patient, referral, appointment and billing records accurately without inventing missing information."},
    {"id":"workflow","label":"Clinic workflow execution","weight":20,"description":"Moves intake, referral, scheduling, recall and billing-administration work through the correct queues with owners and checkpoints."},
    {"id":"scope_privacy","label":"Clinical scope and privacy protection","weight":25,"description":"Uses minimum necessary information, keeps data in approved workflows, and does not make clinical, coding, coverage or compliance judgments outside the VA role.","hard_fail":true},
    {"id":"escalation","label":"Escalation judgment","weight":15,"description":"Preserves patient wording, identifies the correct authorised owner and routes urgent, privacy, clinical and billing exceptions without diagnosis."},
    {"id":"communication","label":"Patient communication","weight":15,"description":"Writes clear administrative messages that protect privacy, avoid clinical advice and state realistic next checkpoints."},
    {"id":"handoff","label":"Audit-ready documentation and handoff","weight":10,"description":"Leaves factual notes, timestamps, owners, unresolved items and next actions another staff member can continue from."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id' = 'clinic_workflow'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {"id":"clinic_workflow","title":"Clinic workflow and escalation rules","kind":"policy","content":"Identity must be verified before account-specific discussion. Referral admin may chase missing provider number, referral document or consent but may not decide clinical appropriateness. Worsening symptoms or clinical questions are routed immediately to the clinical escalation queue using the patient''s words. Billing rejection caused by missing admin data may be corrected; coding, medical necessity and coverage decisions go to the billing owner. Privacy incidents are reported to the privacy owner immediately and the audit trail must be preserved."}
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'medical-healthcare-virtual-assistant';

-- Bookkeeping final assessment
update public.training_assessments a
set
  instructions = $ins$Complete the Cedar Lane bookkeeping-administration control pack from the supplied AP, bank and finance-control evidence. Submit: (1) the AP exception queue and duplicate decision log, (2) a payment-preparation batch with any blocked items clearly held, (3) an AR follow-up/exception note, (4) a reconciliation discrepancy sheet, (5) a month-end readiness checklist showing missing evidence, (6) precise reviewer questions for coding/accounting uncertainties, and (7) a final finance handoff with owners and deadlines. Do not guess tax/account codes, force reconciliations, authorise payments, change bank details without independent verification, or provide accounting/tax/payroll advice.$ins$,
  rubric = $rubric$[
    {"id":"source_control","label":"Source-document and evidence control","weight":20,"description":"Identifies the correct documents, amounts, dates, duplicate signals and bank evidence before proposing any administrative action."},
    {"id":"execution","label":"AP, AR and reconciliation execution","weight":25,"description":"Produces usable AP/payment-prep, AR and reconciliation work while keeping blocked or unmatched items visible."},
    {"id":"exceptions","label":"Exception and fraud-risk judgment","weight":15,"description":"Recognises bank-detail changes, duplicates, missing approvals and unexplained differences and routes them appropriately."},
    {"id":"boundaries","label":"Accounting, tax and payment-authority boundaries","weight":20,"description":"Does not guess coding/tax treatment, force balances, authorise payments or provide professional advice outside the delegated role.","hard_fail":true},
    {"id":"audit","label":"Audit trail and QA","weight":10,"description":"Preserves source evidence, reviewer questions, status and approval history so changes are reviewable."},
    {"id":"handoff","label":"Month-end and reviewer handoff","weight":10,"description":"Makes incomplete items, owners, due dates and reviewer decisions explicit rather than hiding them to appear complete."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id' = 'month_end'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {"id":"month_end","title":"Month-end readiness file","kind":"document","content":"Period end: 30 Sep 2026. Missing supplier statement: Metro IT. Customer invoice CL-221 remains disputed. Bank line 19 Sep Cloud subscription 89 has no book record. Customer deposit 2,200 remains unmatched. One proposed coding change has no reviewer approval. Payroll summary received but payroll variance review is still open. Finance owner requires an exception list before month-end sign-off."}
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'bookkeeping-administration';

-- Payroll final assessment
update public.training_assessments a
set
  instructions = $ins$Complete the Harbor & Field payroll-administration control pack using the supplied exception, variance and control files. Submit: (1) the timesheet/input exception queue, (2) employee-change register, (3) pre-payroll variance review, (4) bank-detail verification and sensitive-data handling note, (5) late-change/reapproval workflow, (6) missing-hours employee-query record, (7) post-payroll reconciliation handoff, and (8) the next-cycle calendar/checklist. Separate preparation from approval and payment release. Do not choose tax/statutory treatment, classify employment/pay items without an approved rule, bypass manager approval, or authorise payroll/payment.$ins$,
  rubric = $rubric$[
    {"id":"input_accuracy","label":"Payroll input accuracy","weight":20,"description":"Checks employee, period, timesheet, change and pay-input evidence and keeps incomplete or conflicting records on hold."},
    {"id":"variance","label":"Variance and exception control","weight":20,"description":"Explains material payroll changes from evidence, isolates unresolved causes and does not normalise unexplained differences."},
    {"id":"approval_security","label":"Approval and sensitive-data controls","weight":20,"description":"Protects payroll data, independently verifies sensitive bank changes, preserves approvals and applies change control after approval."},
    {"id":"boundaries","label":"Statutory, tax and payment-authority boundaries","weight":20,"description":"Does not decide tax/statutory treatment, unsupported classifications, final payroll approval or payment release outside delegated authority.","hard_fail":true},
    {"id":"queries","label":"Employee query handling","weight":10,"description":"Investigates payroll questions from source evidence, communicates factual status and routes specialist decisions correctly."},
    {"id":"handoff","label":"Reconciliation and next-cycle handoff","weight":10,"description":"Leaves totals, differences, deadlines, approvals, owners and next-cycle controls explicit and reviewable."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id' = 'payroll_calendar'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {"id":"payroll_calendar","title":"Payroll calendar and approval checkpoints","kind":"document","content":"Pay date: Fri 2 Oct 2026. Timesheet cut-off: Tue 29 Sep 12:00. Manager approval deadline: Tue 16:00. Payroll draft review: Wed 11:00. Final payroll approval: Thu 10:00. Bank/payment release: Thu 15:00 by authorised approver. Public holiday affects the following cycle. Any employee/pay change received after final approval requires documented impact review and reapproval before the payment file is treated as final."}
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'payroll-administration';

-- Airbnb / Short-Term Rental final assessment
update public.training_assessments a
set
  instructions = $ins$Complete the Coastline Stays multi-property operations desk using the supplied PMS, turnover and owner-rule evidence. Submit: (1) a prioritised portfolio queue, (2) calendar-conflict containment and recovery note, (3) guest messages for the active issues, (4) a turnover readiness board, (5) maintenance/vendor actions with approval boundaries, (6) a discount/refund approval request where needed, (7) owner reporting for unresolved risk, and (8) an end-of-shift handoff. Use the PMS as the configured source of truth, protect guest data, and do not promise refunds, compensation, discounts, availability or safety outcomes beyond verified evidence and delegated authority.$ins$,
  rubric = $rubric$[
    {"id":"prioritisation","label":"Portfolio prioritisation","weight":15,"description":"Orders guest, calendar, turnover and maintenance work by timing, guest impact, safety/service risk and dependency."},
    {"id":"communication","label":"Guest communication","weight":15,"description":"Writes clear, calm messages using verified property/booking facts and realistic checkpoints without unsupported promises."},
    {"id":"operations","label":"Calendar, turnover and maintenance execution","weight":20,"description":"Uses the configured source of truth, contains conflicts, keeps readiness visible and assigns vendor/maintenance ownership."},
    {"id":"boundaries","label":"Safety and commercial-authority boundaries","weight":20,"description":"Escalates safety, access, refund, compensation, pricing and policy exceptions rather than making decisions outside delegated authority.","hard_fail":true},
    {"id":"evidence","label":"Evidence and exception control","weight":15,"description":"Preserves booking/PMS state, photos/checklists, vendor quotes, owner rules and unresolved exceptions in the operating record."},
    {"id":"handoff","label":"Owner and shift handoff","weight":15,"description":"Leaves arrivals, departures, guest issues, approvals, maintenance, owners and next checkpoints clear for the next shift."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id' = 'guest_queue'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {"id":"guest_queue","title":"Guest messages and booking exceptions","kind":"document","content":"Property A arriving guest asks for 13:00 early check-in; cleaner currently estimates ready at 14:30. Property B in-stay guest reports lockout at 21:40; approved on-call locksmith process exists. Property C prospect asks for 25% long-stay discount; VA authority is 10%. Property D is available on a channel but PMS has an owner block. Property A prior guest also reports bedside-lamp damage; damage charge communication requires manager review after evidence is complete."}
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'airbnb-short-term-rental-virtual-assistant';

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
