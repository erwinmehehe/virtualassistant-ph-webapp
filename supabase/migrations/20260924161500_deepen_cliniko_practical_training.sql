-- Deepen the published Cliniko course with software-specific practical artifacts,
-- worked examples for high-judgment workflows, and one connected allied-health capstone.
-- Existing lesson IDs, learner progress, enrollment state, and publication state are preserved.

with specs(
  lesson_slug,
  exercise_title,
  exercise_text,
  deliverable,
  template_title,
  template_text,
  checklist_title,
  checklist_items,
  worked_title,
  worked_text
) as (
  values
  (
    'cliniko-practice-workflow-and-va-permissions',
    'Build the Cliniko access and authority matrix',
    'Harbour Allied Health hires a VA for bookings, reminders, basic patient-detail updates, invoice sending, and routine payment follow-up. Map each duty to the minimum Cliniko access needed, name the information the VA should not open or change for convenience, and identify the owner for clinical, privacy, finance, and settings exceptions.',
    'A Cliniko access matrix showing task, minimum role/access, data needed, prohibited area, escalation owner, and review trigger.',
    'Cliniko access and authority matrix',
    $tpl$Task:
Cliniko area:
Minimum role / access:
Information needed:
Information not needed:
Action allowed:
Action not allowed:
Approval / escalation owner:
Reason for escalation:
Access review trigger:
Evidence / policy reference:$tpl$,
    'Cliniko access QA',
    '["Each permission is tied to an actual delegated task.","Clinical information is not opened or edited just because the account can access it.","Shared credentials and convenience-based Administrator access are rejected.","Finance, privacy, clinical, and settings decisions have named owners.","The record states when access should be reviewed or reduced.","The next administrator can understand why each access choice exists."]'::jsonb,
    null,
    null
  ),
  (
    'patient-records-forms-and-administrative-data-quality',
    'Resolve the patient identity and record-quality queue',
    'Two Harbour Allied Health records use the same patient name and mobile number but show different dates of birth. A new secure form has also arrived against one record. Build the investigation log without merging, overwriting, or moving the form until the approved identity checks resolve the conflict.',
    'A patient identity-resolution log showing records compared, verified fields, conflicts, safe admin action, information left untouched, owner, and final disposition.',
    'Cliniko patient identity-resolution log',
    $tpl$Patient reference:
Record A:
Record B:
Matching fields:
Conflicting fields:
Approved identity evidence checked:
Form / document location:
Administrative correction allowed:
Change intentionally not made:
Privacy / clinical issue:
Escalation owner:
Final disposition:
Audit note:$tpl$,
    'Patient record QA',
    '["Search-before-create and duplicate checks are documented.","Conflicting identity evidence stays visible until resolved.","The learner does not infer identity from name or mobile number alone.","Clinical content and practitioner-authored information remain untouched.","Forms remain attached to the correct verified record.","The final action and escalation trail are auditable."]'::jsonb,
    'Identity conflict: do not merge from a near match',
    'Harbour Allied Health has two records for Alex Morgan. Both show the same mobile number, but Record A has DOB 1988-04-12 and Record B has DOB 1989-04-12. A secure intake form is attached to Record B. The VA records the conflict, checks the clinic-approved identity sources, leaves the form where it is, and asks the authorised practice owner to resolve the DOB conflict before any merge. The worked result is a documented hold, not a guessed correction.'
  ),
  (
    'appointments-appointment-types-and-practitioner-calendars',
    'Prepare the Cliniko appointment decision sheet',
    'A new physiotherapy patient asks to shorten an initial appointment to fit a calendar gap. Harbour Allied Health lists Initial Physiotherapy as 60 minutes and Follow-up Physiotherapy as 30 minutes. The VA must preserve the approved appointment type, practitioner, location, and pre-appointment requirements while escalating any clinical or service-type change.',
    'An appointment decision sheet with patient reference, approved appointment type, duration, practitioner, location, constraints, conflict, safe action, escalation, and confirmation state.',
    'Cliniko appointment decision sheet',
    $tpl$Patient reference:
Requested appointment:
Approved appointment type:
Approved duration:
Practitioner:
Business location:
Patient constraints:
Calendar conflict:
Referral / form requirement:
Action I can take:
Clinical / service decision to route:
Escalation owner:
Confirmation status:
Audit note:$tpl$,
    'Appointment QA',
    '["The approved appointment type is used rather than invented to fit a gap.","Practitioner, duration, and location are verified together.","Patient constraints are recorded without converting them into clinical triage.","Referral or form dependencies are checked.","Any service-type or clinical decision is routed to the authorised owner.","The confirmation reflects the final approved booking state."]'::jsonb,
    'Scheduling judgment: protect the service rule',
    'The patient requests a 30-minute slot because they are busy, but the clinic brief says all new physiotherapy patients use the 60-minute Initial Physiotherapy type. The VA offers available 60-minute options, records the patient constraint, and asks the practitioner or authorised scheduler to decide if an exception is clinically appropriate. The VA does not relabel the visit as a follow-up merely to make the calendar fit.'
  ),
  (
    'confirmations-sms-and-email-reminders-and-follow-up-messages',
    'Run the Cliniko reminder and secure-form exception queue',
    'Harbour Allied Health has three exceptions: one patient did not receive a reminder, one patient opted out of SMS, and one new patient has not returned a secure form. Investigate configuration and record status first, then prepare only the approved administrative follow-up.',
    'A reminder and secure-form exception log showing appointment, channel preference, template/config checks, send history, form status, safe follow-up, escalation trigger, and owner.',
    'Cliniko reminder and form exception log',
    $tpl$Patient reference:
Appointment:
Appointment type:
Preferred / permitted channel:
Reminder template:
Template linked correctly:
Reminder history / status:
Secure form required:
Secure form status:
Administrative follow-up:
Message sent / held:
Exception:
Escalation trigger:
Owner:
Next checkpoint:$tpl$,
    'Reminder and form QA',
    '["Appointment status is checked before any manual follow-up.","Communication preferences are respected.","Template, appointment-type, and history checks happen before blaming patient data.","Secure form receipt is tracked without clinically interpreting answers.","Sensitive or urgent form content is routed to the practitioner.","The next action and owner are explicit."]'::jsonb,
    null,
    null
  ),
  (
    'creating-and-sending-cliniko-invoices',
    'Complete the Cliniko invoice pre-send QA worksheet',
    'Harbour Allied Health has a completed appointment ready for invoicing, but the patient says a previous invoice PDF showed different provider information. Use the approved appointment and billing records to prepare the invoice, verify the patient-facing output, and hold any unsupported service, provider, price, or third-party changes for review.',
    'A pre-send invoice QA worksheet covering source appointment, patient/business/practitioner, approved item and price, patient-facing PDF check, recipient/channel, exception, approver, and send state.',
    'Cliniko invoice pre-send QA worksheet',
    $tpl$Patient reference:
Appointment / service reference:
Business / location:
Practitioner:
Invoice date:
Approved billable item:
Approved price / amount:
Third-party payer:
Patient-facing PDF checked:
Recipient verified:
Approved send channel:
Mismatch / exception:
Change I can make:
Change requiring approval:
Approver:
Send status:
Evidence / audit note:$tpl$,
    'Invoice QA',
    '["The invoice is tied to the correct completed appointment or approved service record.","Patient, business, practitioner, item, and amount come from approved evidence.","Patient-facing output is checked when the issue concerns the PDF.","No provider, service description, price, funding, or tax field is invented.","Recipient and channel are verified before sending.","Exceptions remain visible with an owner instead of being silently normalised."]'::jsonb,
    'Invoice judgment: verify the output before changing data',
    'The patient says their previous invoice PDF displayed provider information that is not obvious on the current edit screen. The VA opens the appointment-linked invoice workflow, verifies the approved practitioner and business details, previews the patient-facing output, and records what actually appears. If the output still conflicts with the approved practice record, the VA holds the send and escalates the configuration question instead of editing provider details by guesswork.'
  ),
  (
    'payments-outstanding-invoices-and-xero-handoff',
    'Build the Cliniko payment and Xero handoff log',
    'Cliniko shows Invoice HAH-2048 as outstanding for $165. The clinic bank feed and Xero queue contain a $165 receipt with a matching patient reference, but Cliniko does not show it allocated. Document the evidence, stop duplicate chasing, and prepare a finance handoff without marking the invoice paid from assumption.',
    'A payment and Xero handoff log showing Cliniko invoice status, payment evidence, Xero evidence, mismatch, action taken, communication hold, finance decision required, reviewer, and reconciliation outcome.',
    'Cliniko payment and Xero handoff log',
    $tpl$Patient / payer reference:
Cliniko invoice:
Cliniko status:
Invoice amount:
Cliniko payment record:
Bank evidence:
Xero evidence:
Potential match:
Evidence still missing:
Patient reminder sent / held:
Administrative action:
Allocation / refund / write-off decision:
Finance reviewer:
Reconciliation outcome:
Next checkpoint:
Audit note:$tpl$,
    'Payment and Xero QA',
    '["Cliniko status is checked before another payment reminder is sent.","Bank or Xero evidence is treated as evidence to investigate, not permission to force an allocation.","The learner prevents duplicate chasing while the mismatch is reviewed.","Refunds, write-offs, tax treatment, and reconciliation decisions stay with finance authority.","The handoff gives the reviewer enough evidence to resolve the mismatch.","Final status is recorded only after authorised confirmation."]'::jsonb,
    'Payment judgment: evidence is not the same as allocation authority',
    'Invoice HAH-2048 is outstanding in Cliniko, while the Xero queue shows a $165 receipt carrying the same patient reference. The VA captures the Cliniko invoice number, amount, receipt evidence, date, and Xero reference, places the patient reminder on hold, and sends the discrepancy to the finance reviewer. The VA does not mark Cliniko paid or create a second transaction until the authorised reviewer confirms the correct allocation.'
  ),
  (
    'cliniko-admin-qa-and-composite-va-simulation',
    'Final simulation: run the Harbour Allied Health Cliniko desk',
    'Use one connected Harbour Allied Health case from start to finish. Resolve the access concern, patient identity conflict, appointment change, reminder/form exception, invoice QA issue, and payment/Xero mismatch. Finish with a concise end-of-shift handoff that distinguishes completed admin work from decisions still owned by the practitioner, privacy lead, practice owner, or finance reviewer.',
    'A complete Cliniko control pack containing the access matrix, identity-resolution log, appointment decision sheet, reminder/form exception log, invoice QA worksheet, payment/Xero handoff, and end-of-shift summary.',
    'Harbour Allied Health Cliniko control pack',
    $tpl$PRACTICE: Harbour Allied Health

1. ACCESS
Task / minimum access:
Over-permissioned account:
Action:
Owner:

2. PATIENT IDENTITY
Records compared:
Conflict:
Evidence checked:
Safe disposition:
Owner:

3. APPOINTMENT
Approved type / duration:
Practitioner / location:
Requested change:
Safe action:
Decision owner:

4. REMINDER / FORM
Communication preference:
Reminder history:
Form status:
Follow-up:
Escalation:

5. INVOICE
Appointment / invoice:
Approved item / amount:
Patient-facing QA:
Exception:
Send state:

6. PAYMENT / XERO
Cliniko status:
Bank / Xero evidence:
Mismatch:
Reminder hold:
Finance handoff:

7. END-OF-SHIFT HANDOFF
Completed:
Held:
Decisions needed:
Owners:
Deadlines / next checkpoints:
Evidence links:$tpl$,
    'Cliniko capstone QA',
    '["Every action traces back to the same Harbour Allied Health evidence pack.","Patient identity is resolved cautiously and no unsupported merge is performed.","Scheduling follows the approved appointment type and practitioner rules.","Reminder and secure-form work respects communication and clinical boundaries.","Invoice data comes from approved appointment and billing evidence.","Payment/Xero mismatch is handed off without forced reconciliation.","The final handoff clearly separates completed work, held work, decision owners, and next checkpoints."]'::jsonb,
    null,
    null
  )
),
targets as (
  select
    l.id,
    l.content,
    s.*
  from specs s
  join public.training_courses c
    on c.slug = 'cliniko-for-virtual-assistants'
  join public.training_modules m
    on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and l.slug = s.lesson_slug
  where l.is_published = true
),
cleaned as (
  select
    t.id,
    t.lesson_slug,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items,
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
    t.id,
    t.lesson_slug,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items,
    t.worked_title,
    t.worked_text
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
          'title',c.template_title,
          'text',c.template_text
        ),
        jsonb_build_object(
          'type','checklist',
          'title',c.checklist_title,
          'items',c.checklist_items
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

update public.training_assessments a
set
  title = 'Harbour Allied Health Cliniko Final Work Simulation',
  instructions = 'Work from one connected fictional allied-health practice. Use the Harbour Allied Health evidence pack to make defensible administrative decisions about Cliniko access, duplicate patient identity, appointment scheduling, reminder and secure-form exceptions, invoice preparation, payment status, and the Xero handoff. Your work must show what you completed, what you deliberately held, the evidence used, the authorised decision owner, and the next checkpoint. Do not merge patient records from assumption, alter clinical information, downgrade an appointment type to fit the calendar, invent invoice or provider details, force a payment allocation, approve a refund or write-off, or make accounting decisions.',
  pass_score = 80,
  rubric = '[
    {"id":"evidence","label":"Cliniko evidence accuracy","weight":20,"description":"Uses the supplied Harbour Allied Health records accurately, distinguishes verified facts from assumptions, and keeps conflicting evidence visible."},
    {"id":"patient_schedule","label":"Patient and scheduling judgment","weight":20,"description":"Handles identity, appointment type, practitioner, location, reminders, and forms using approved administrative rules without making clinical decisions."},
    {"id":"billing_payment","label":"Invoice, payment, and Xero handoff","weight":20,"description":"Prepares invoice and payment work from approved evidence, prevents duplicate chasing, and routes allocation, refund, write-off, tax, or reconciliation decisions correctly."},
    {"id":"boundaries","label":"Privacy, clinical, and authority boundaries","weight":20,"description":"Uses minimum necessary access, protects patient information, and escalates decisions requiring practitioner, privacy, owner, or finance authority.","hard_fail":true},
    {"id":"qa","label":"QA and audit trail","weight":10,"description":"Checks patient-facing outputs, communication state, source records, and exceptions before closure and leaves an auditable record."},
    {"id":"handoff","label":"End-of-shift handoff","weight":10,"description":"Clearly separates completed work, held work, decision owners, deadlines, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"practice","title":"Harbour Allied Health operating brief","kind":"policy","content":"Harbour Allied Health is a fictional two-location physiotherapy and allied-health practice. Cliniko is the system of record for patient administration, appointments, reminders, invoices, and payments. The VA handles bookings, reminders, approved patient-detail updates, invoice sending, outstanding-balance follow-up, and administrative QA. Clinical interpretation, treatment notes, appointment-type exceptions requiring clinical judgment, privacy incidents, refunds/write-offs, accounting treatment, and Xero reconciliation decisions stay with the named authorised owner. Staff use individual accounts and minimum necessary access."},
    {"id":"patient_schedule","title":"Patient and appointment queue","kind":"csv","content":"reference,record,issue,appointment,practitioner,location,status\nP014,A,Same name/mobile as P087; DOB 1988-04-12,Initial Physiotherapy 60m,Dr Lee,North,Booked 2026-09-25 10:00\nP087,B,Same name/mobile as P014; DOB 1989-04-12; secure form attached,None,,,Duplicate review hold\nP102,C,Requests 30m instead of approved 60m initial,Initial Physiotherapy 60m,Dr Lee,North,Change requested\nP118,D,Reminder not received,Follow-up Physiotherapy 30m,Dr Chen,South,Booked 2026-09-25 14:30\nP121,E,SMS opt-out; secure form outstanding,Initial Occupational Therapy 60m,Dr Patel,South,Booked 2026-09-26 09:00"},
    {"id":"communications","title":"Reminder and form evidence","kind":"document","content":"P118: email reminder template is linked to the appointment type; reminder history shows no successful send; email address requires verification against the patient record. P121: patient preference says no SMS. Email is permitted. Secure intake form was sent through the approved Cliniko workflow and remains incomplete. Administrative staff may track receipt but must not interpret clinical answers."},
    {"id":"billing","title":"Invoice and payment evidence","kind":"csv","content":"patient,appointment,invoice,amount,cliniko_status,payment_evidence,xero_evidence\nP102,Initial Physiotherapy 60m,HAH-2047,195,Draft,None,None\nP118,Follow-up Physiotherapy 30m,HAH-2048,165,Outstanding,Bank receipt 165 with patient ref,Xero receipt 165 awaiting reconciliation\nP121,Initial Occupational Therapy 60m,HAH-2049,210,Draft,None,None"},
    {"id":"billing_rules","title":"Billing and Xero handoff rules","kind":"policy","content":"Invoices must use the approved appointment/service, practitioner/business details, and current price list. Verify patient-facing output before sending when a PDF/display mismatch is reported. Do not invent provider, service, funding, tax, or price data. When bank or Xero evidence suggests a payment that is not allocated in Cliniko, hold duplicate chasing, preserve the evidence, and route the reconciliation to the finance reviewer. Refunds, write-offs, credits, tax treatment, and final reconciliation are not VA decisions."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'cliniko-for-virtual-assistants';

update public.training_courses
set
  summary = 'Practical independent Cliniko workflow training for VAs supporting allied-health practices, with hands-on patient administration, scheduling, reminders and secure forms, invoice QA, payment follow-up, Xero handoff, permissions, and end-of-shift control work.',
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'cliniko-for-virtual-assistants';
