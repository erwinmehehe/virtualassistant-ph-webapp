-- Connect ServiceM8 and Australian Allied Health final assessments.
-- Preserve assessment IDs, submissions, certificates, and learner history.

update public.training_assessments a
set
  instructions=$txt$Complete the Harbour Field Services ServiceM8 operations simulation as one coherent control-desk portfolio.

Harbour Field Services is a fictional Australian field-service business using ServiceM8. You support client/job data quality, fixed job statuses, genuine waiting Queues, scheduling, quote administration, completion evidence, invoicing/payment exceptions, automation QA, and owner handoff. You are not the technician, estimator, accountant, or safety decision-maker.

Submit:
1. Corrected status and Queue decisions for all jobs.
2. Client/job-card data-quality notes, including the duplicate-client/history issue.
3. A dispatch feasibility board using staff capability, travel, duration, external blocks and access constraints.
4. A quote-acceptance/follow-up control record.
5. A completion-evidence and return-work record.
6. An invoice/payment reconciliation exception log.
7. An automation QA register identifying reply, stop, duplicate-contact and payment-exception conditions.
8. An end-of-day ServiceM8 owner handoff.

Use ServiceM8's four fixed job statuses correctly and use Queues only for genuine waiting conditions. Use the supplied fictional evidence only. Do not invent technical conclusions, pricing/scope approval, customer acceptance, safety decisions, GST/accounting treatment, credits/write-offs, payment reconciliation, or field completion.$txt$,
  resource_pack=jsonb_build_array(
    jsonb_build_object(
      'id','jobs','kind','csv','title','Harbour Field Services ServiceM8 morning queue',
      'content',$r$job,client,current_status,queue_or_state,issue
A,Northside Dental,Quote,Quote follow-up,Customer replied with a pricing/scope question; automation due 11:00
B,Oak & Co,Quote,Waiting for customer,Quote accepted online at 18:42 yesterday
C,Metro Clinic,Work Order,Scheduled 14:00,Assigned technician prior booking ends 13:45 about 35 minutes away
D,Parkview Offices,Work Order,Visit occurred,Photos present; required Form missing; Diary says return with replacement part
E,Riverbank Cafe,Completed,Invoice outstanding,Customer says paid yesterday; accounting has similar unmatched receipt
F,Willow Childcare,Work Order,Waiting for special-order part,Approved work cannot progress until part arrives$r$
    ),
    jsonb_build_object(
      'id','clients','kind','document','title','Client, job card and history notes',
      'content',$r$Job A client appears twice: "Northside Dental" and "North Side Dental". Same business address and phone, but no merge has been completed.
Job A current request: "Can option 2 exclude the monitoring component?"
Job C normally needs a two-hour booking and restricted-site induction.
Job D Diary note: "Temporary repair complete. Return with RP-44. Required completion Form still to be submitted."
Job E customer email: "Paid yesterday by bank transfer, please stop reminders."
Old Job History for Willow Childcare shows a prior failure of a different part. The current job has no technical diagnosis yet.$r$
    ),
    jsonb_build_object(
      'id','dispatch','kind','document','title','Staff capability and dispatch constraints',
      'content',$r$Tech Alex: qualified for Jobs C and F; prior job scheduled to 13:45, location about 35 minutes from Job C; external calendar block 16:30.
Tech Bea: not approved for restricted-site work at Job C; available 13:30-17:00.
Job C expected duration: two hours.
Job C site induction/access must be confirmed before arrival.
Dispatch rule: capability, travel, duration, access and existing commitments must all be checked before promising a time.$r$
    ),
    jsonb_build_object(
      'id','quotes','kind','document','title','Quote and acceptance evidence',
      'content',$r$Job A
Quote version: Q-A-v2
Status: Quote
Customer has not accepted.
Customer asks whether option 2 can exclude one component.
Quote-follow-up automation is scheduled.
VA may acknowledge and route the pricing/scope question; may not change approved scope or price.

Job B
Quote accepted online at 18:42 yesterday.
Acceptance is recorded.
No scheduling decision has yet been made.$r$
    ),
    jsonb_build_object(
      'id','completion','kind','document','title','Completion and return-work evidence',
      'content',$r$Job D
Current status: Work Order
Photos: uploaded
Checklist: all but one item complete
Required Form: missing
Diary: "Return with replacement part RP-44"
Customer has not yet been told a return visit is required.
No evidence says all physical work is complete.

Job F
Approved work is waiting for special-order part SP-19.
No field visit should be treated as completed while the part dependency remains.$r$
    ),
    jsonb_build_object(
      'id','payments','kind','document','title','Invoice and accounting exception file',
      'content',$r$Job E
ServiceM8 invoice: INV-E-771
ServiceM8 status: outstanding
Customer says bank transfer was made yesterday.
Accounting system: unmatched bank receipt for the same amount, but reference does not reliably identify INV-E-771.
Payment reminder automation is scheduled for this afternoon.
VA may contain duplicate chasing while finance investigates. VA may not mark paid, create a credit, write off the invoice, or decide GST/accounting treatment.$r$
    ),
    jsonb_build_object(
      'id','automation','kind','policy','title','ServiceM8 automation QA rules',
      'content',$r$Quote follow-up and overdue payment reminders are enabled.
Before manual or automated follow-up, check for customer replies, quote acceptance, completed/unsuccessful state, payment evidence and active exceptions.
Manual tasks must not duplicate an automation already scheduled for the same purpose.
A customer reply that requires staff judgment should be actioned before routine follow-up continues.
Full payment or an active reconciliation exception must be considered before additional payment chasing.$r$
    ),
    jsonb_build_object(
      'id','authority','kind','policy','title','Harbour Field Services ServiceM8 authority matrix',
      'content',$r$VA may maintain client/job records, update ServiceM8 statuses/Queues from verified workflow evidence, schedule within approved rules, send approved communications, prepare approved quote/invoice administration, check completion evidence and audit automation.
Technicians/field leaders decide technical diagnosis, technical completion, safety, part suitability and field scope.
Estimator/owner decides pricing, quote scope and commercial concessions.
Finance decides reconciliation, GST/accounting treatment, credits and write-offs.
No system access grants authority to invent a decision outside these boundaries.$r$
    )
  ),
  rubric=jsonb_build_array(
    jsonb_build_object('id','status','label','ServiceM8 status and Queue accuracy','weight',20,'description','Uses Quote, Work Order, Completed and Unsuccessful correctly, uses Queues only for genuine waits, and keeps system state aligned with actual workflow evidence.'),
    jsonb_build_object('id','data','label','Client, job-card and history accuracy','weight',10,'description','Protects useful history, handles duplicate/data-quality issues safely, and does not turn previous technical findings into current facts.'),
    jsonb_build_object('id','dispatch','label','Scheduling and dispatch feasibility','weight',15,'description','Accounts for capability, travel, duration, external blocks, access and existing commitments before confirming work.'),
    jsonb_build_object('id','execution','label','Quote-to-invoice workflow execution','weight',20,'description','Produces usable quote, follow-up, completion, return-work, invoice and payment-exception outputs from the supplied records.'),
    jsonb_build_object('id','boundaries','label','Technical, commercial, finance and safety boundaries','weight',20,'hard_fail',true,'description','Does not invent technical findings, pricing/scope approval, safety decisions, customer acceptance, accounting treatment, credits/write-offs or payment reconciliation.'),
    jsonb_build_object('id','automation','label','Automation QA and owner handoff','weight',15,'description','Identifies reply/acceptance/payment stop conditions, duplicate-contact risk, required system corrections, owners and next checkpoints.')
  ),
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='servicem8-for-virtual-assistants'
  and a.is_published=true;

update public.training_assessments a
set
  instructions=$txt$Complete the Rivergum Allied Health Australian practice-administration simulation as one coherent portfolio.

Rivergum is a fictional private allied-health practice with physiotherapy, occupational therapy and speech pathology services. You support intake, referrals, scheduling, recalls/waitlists, routine patient messaging, billing administration, privacy-safe records and practitioner/practice-manager handoffs. You are not a clinician, funding-eligibility decision-maker, privacy lawyer, or clinical triage service.

Submit:
1. An admin-authority and clinical-boundary map for the queue.
2. A privacy-incident containment and escalation record.
3. An intake/referral-readiness exception list.
4. A referral identity-resolution and practitioner handoff.
5. Appointment-type and calendar decisions using the supplied practice matrix.
6. Recall/waitlist actions and routine patient messages.
7. A billing/funding exception tracker for the rejected third-party invoice.
8. An end-of-day Rivergum practice-admin handoff.

Use only the supplied fictional evidence. Keep health information to the minimum necessary for the administrative task. Do not decide diagnosis, treatment, clinical urgency, provider suitability, funding eligibility, legal/privacy notification outcomes, or clinical interpretation. Route those decisions to the authorised practitioner or practice leadership.$txt$,
  resource_pack=jsonb_build_array(
    jsonb_build_object(
      'id','practice','kind','document','title','Rivergum Allied Health practice structure and authority',
      'content',$r$Practice: Rivergum Allied Health
Location: private Australian allied-health practice
Services: physiotherapy, occupational therapy, speech pathology
Practice manager: Elise
Clinical lead: Dr Taylor (administrative exercise role only)
VA may: intake/admin checks, referral tracking, scheduling from the approved matrix, recalls/waitlists from authorised tasks, routine messages, billing admin, outstanding-account admin and handoffs.
VA may not: diagnose, triage symptoms clinically, recommend treatment/provider type, decide funding eligibility, interpret clinical content, or determine legal/privacy notification outcomes.$r$
    ),
    jsonb_build_object(
      'id','queue','kind','csv','title','Rivergum practice admin queue',
      'content',$r$case,patient,issue,status
A,P01,Referral received in wrong inbox and consent form missing,Open
B,P02,Referral document may match two patient records,Hold
C,P03,Patient asks for 15-minute appointment although matrix says 45-minute initial,Open
D,P04,Recall says contact in 6 weeks but creator/reason unclear,Hold
E,P05,Third-party invoice rejected due referral-field mismatch,Open
F,P06,Patient asks whether worsening symptoms require urgent treatment,Escalate to clinician
G,P07,Referral PDF sent to wrong patient email,Privacy incident$r$
    ),
    jsonb_build_object(
      'id','patients','kind','csv','title','Intake, demographic and referral-readiness extract',
      'content',$r$patient,mobile_on_form,mobile_in_system,consent,referral,referral_admin_gap
P01,0400000101,0400000101,missing,yes,None
P02,0400000202,0400000202,yes,yes,Referral surname and DOB match two records
P03,0400000303,0400000303,yes,yes,None
P04,0400000404,0400000404,yes,yes,Recall provenance unclear
P05,0400000505,0400000505,yes,yes,Invoice field differs from referral admin field
P06,0400000606,0400000606,yes,yes,Clinical symptom question
P07,0400000707,0400000707,yes,yes,Referral emailed to wrong patient$r$
    ),
    jsonb_build_object(
      'id','appointments','kind','policy','title','Rivergum appointment and calendar matrix',
      'content',$r$Physiotherapy initial: 45 minutes, appropriate practitioner required.
Physiotherapy follow-up: 30 minutes unless practitioner instruction says otherwise.
Occupational therapy initial: 60 minutes.
Speech pathology initial: 60 minutes.
Telehealth availability varies by practitioner and appointment type.
The VA may offer only appointment types/durations defined by the matrix and actual practitioner/calendar/resource availability.
If the patient asks for a shorter or clinically different appointment, route the suitability question rather than altering the matrix.$r$
    ),
    jsonb_build_object(
      'id','recalls','kind','document','title','Recall and waitlist task records',
      'content',$r$P04 recall task: "Contact in 6 weeks."
Creator field: blank.
Reason field: blank.
No practitioner instruction is visible in the supplied task history.
Practice rule: vague recalls must be validated with the responsible practitioner/team before patient contact.

Waitlist note for P03: "Earlier appointment requested if physiotherapy initial becomes available."
No clinical-priority instruction is recorded.$r$
    ),
    jsonb_build_object(
      'id','billing','kind','document','title','Billing and funding exception file',
      'content',$r$P05 invoice: RG-552
Payer: third-party
Rejection message: referral/reference field mismatch
Invoice service date matches practice record.
One referral admin field differs between the invoice-support record and the referral.
VA may compare approved records and correct an authorised clerical mismatch.
If rejection depends on eligibility, coverage, policy, clinical criteria or referral validity, route to the authorised billing/practice reviewer.
Do not promise reimbursement or eligibility.$r$
    ),
    jsonb_build_object(
      'id','privacy','kind','document','title','Privacy incident and health-information handling file',
      'content',$r$P07 referral PDF was attached to an email sent to the wrong patient.
Error discovered 11 minutes after sending.
Practice mailbox retains the sent email record.
No learner action should delete the audit trail.
Approved admin expectation: contain any further disclosure where possible, notify the practice manager/privacy owner immediately, document what was sent and to whom, and await authorised instructions for recipient/patient communication and any formal notification decision.$r$
    ),
    jsonb_build_object(
      'id','boundaries','kind','policy','title','Rivergum allied-health administration boundaries',
      'content',$r$Use approved practice systems and minimum necessary health information.
Administrative staff may prepare/verify records and route gaps but must not clinically interpret referrals or symptoms.
Practitioners decide clinical urgency, suitability, diagnosis, treatment and care recommendations.
Practice leadership/authorised privacy owner decides legal/privacy incident outcomes.
Authorised billing/funding reviewers decide eligibility, coverage and policy questions.
Every held/escalated item requires an owner and next checkpoint.$r$
    ),
    jsonb_build_object(
      'id','messages','kind','document','title','Routine patient-message constraints',
      'content',$r$Messages may confirm administrative status, request missing forms, offer approved appointment options, acknowledge a billing exception, or state when a clinician/practice owner will respond.
Do not include unnecessary health details in subject lines or broad messages.
Do not tell a patient whether symptoms are urgent, which treatment they need, whether funding is guaranteed, or whether a privacy incident legally requires notification.$r$
    )
  ),
  rubric=jsonb_build_array(
    jsonb_build_object('id','intake','label','Intake, referral and identity accuracy','weight',20,'description','Uses the supplied patient/referral records accurately, resolves administrative gaps safely and does not attach documents while identity is ambiguous.'),
    jsonb_build_object('id','scheduling','label','Appointment and recall workflow execution','weight',15,'description','Uses the practice matrix, calendar constraints, recall provenance and waitlist instructions without inventing clinical priority or appointment type.'),
    jsonb_build_object('id','privacy','label','Health-information privacy and incident handling','weight',20,'hard_fail',true,'description','Uses minimum necessary information, contains/escalates privacy incidents appropriately, preserves audit evidence and does not decide legal notification outcomes.'),
    jsonb_build_object('id','boundaries','label','Clinical and funding boundaries','weight',20,'hard_fail',true,'description','Does not diagnose, triage symptoms, recommend treatment/provider type, decide funding eligibility or interpret clinical policy, and routes these decisions correctly.'),
    jsonb_build_object('id','billing','label','Billing and administrative exception handling','weight',10,'description','Distinguishes authorised clerical correction from eligibility, referral-validity or funding-policy decisions and leaves an auditable record.'),
    jsonb_build_object('id','handoff','label','Patient communication and practice handoff','weight',15,'description','Produces privacy-safe routine messages and a clear handoff with owners, held work, practitioner/practice decisions and next checkpoints.')
  ),
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='australian-allied-health-administration'
  and a.is_published=true;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('servicem8-for-virtual-assistants','australian-allied-health-administration');
