-- Finish ServiceM8 and Australian Allied Health reusable artifacts and expert modelling.
-- Preserve lesson IDs, progress, submissions, and certificates.

with artifact_specs(course_slug,lesson_slug,template_title,template_text,checklist_items) as (
values
('servicem8-for-virtual-assistants','servicem8-job-lifecycle-and-va-role','ServiceM8 status and Queue control board','Job:
Current core status:
Verified lifecycle state:
Queue / waiting condition:
Why waiting:
Action Required?:
VA action:
Customer response needed:
Technical / commercial decision owner:
Next checkpoint:
System change:
Evidence link:','["Core status uses Quote, Work Order, Completed, or Unsuccessful only.","Queue use represents a genuine waiting condition, not a custom filing label.","The system state matches what has actually happened.","VA action is separated from technician/commercial judgment.","Customer response requirements are visible.","Next checkpoint and evidence are recorded."]'::jsonb),
('servicem8-for-virtual-assistants','clients-job-cards-notes-and-history','ServiceM8 client and job-card data-quality record','Client:
Job:
Possible duplicate:
Verified identifiers:
Current job description:
Customer wording:
Historical job evidence:
What must not be inferred:
Diary note:
Correction / merge action:
Owner review:
Customer impact:
Next checkpoint:','["Duplicate client/job risk is checked before editing history.","Current symptoms/request are separated from prior technical findings.","The job description does not reuse an old diagnosis as a new fact.","Diary/history evidence is preserved.","Corrections do not erase useful audit context.","Any uncertain merge or identity decision has an owner."]'::jsonb),
('servicem8-for-virtual-assistants','scheduling-jobs-and-using-the-dispatch-view','ServiceM8 dispatch feasibility board','Job:
Customer / address:
Required capability:
Requested window:
Candidate staff:
Prior booking:
Travel / buffer:
External calendar block:
Expected duration:
Access / parts dependency:
Feasible?:
Customer promise:
Owner / dispatcher decision:
System action:
Next checkpoint:','["Capability, travel, prior work and duration are checked together.","An apparently open slot is not automatically treated as bookable.","External calendar and access/parts dependencies are considered.","Customer promises match verified feasibility.","The VA does not override technician/dispatcher constraints.","Final ServiceM8 action and checkpoint are explicit."]'::jsonb),
('servicem8-for-virtual-assistants','quotes-options-acceptance-and-follow-up','ServiceM8 quote acceptance and follow-up control log','Job:
Quote version / option:
Core status:
Quote sent:
Online acceptance:
Customer reply:
Automation scheduled:
Pause / cancel automation?:
Approved admin response:
Pricing / scope question:
Decision owner:
Schedule allowed?:
Next action:
Evidence:','["Quote status reflects actual acceptance state.","Customer questions are handled before duplicate automated follow-up.","The VA does not alter scope, option or price without approval.","Accepted quote state is distinguished from merely sent/replied.","Scheduling happens only when the job is genuinely ready.","Evidence and next action are recorded."]'::jsonb),
('servicem8-for-virtual-assistants','job-completion-forms-photos-and-follow-up','ServiceM8 completion evidence and return-work record','Job:
Core status:
Scheduled visit outcome:
Technician Diary:
Required Form:
Checklist:
Photos:
Signature / completion evidence:
Return work:
Part dependency:
Queue / task:
Customer update:
Invoice ready?:
Owner:
Next checkpoint:','["Scheduled visit completion is not confused with physical job completion.","Required Form/checklist/photo evidence is checked individually.","Return-work notes keep the job out of false completion.","Part dependencies are visible.","Invoice readiness follows actual completion evidence.","Customer messaging and next checkpoint match the verified state."]'::jsonb),
('servicem8-for-virtual-assistants','invoices-payments-statements-and-accounting-handoff','ServiceM8 invoice and payment exception reconciliation log','Job / invoice:
ServiceM8 invoice status:
Customer payment claim:
Payment evidence:
Accounting match:
Statement state:
Automation / reminder due:
Hold / continue reminder:
Customer response:
Finance exception:
Finance owner:
Write-off / credit boundary:
Next checkpoint:
Evidence:','["ServiceM8 invoice state and accounting evidence are compared separately.","A customer payment claim is not treated as reconciled payment without evidence.","Reminder automation is checked before manual chasing.","Possible matches stay exceptions until finance verification.","Credits, write-offs and tax/accounting judgments stay with authorised owners.","Customer communication gives a factual checkpoint."]'::jsonb),
('servicem8-for-virtual-assistants','automation-reminders-and-servicem8-workflow-qa','ServiceM8 automation QA and exception register','Workflow:
Job / client:
Trigger condition:
Current core status:
Queue / booking state:
Scheduled automation:
Customer reply present?:
Stop / pause condition:
Manual task overlap:
Duplicate-contact risk:
Exception owner:
Required correction:
Verification:
Final state:','["Trigger conditions are checked against current job state.","Customer replies are checked before further automated contact.","Accepted, completed, paid or otherwise resolved states stop inappropriate follow-up.","Manual tasks and automation do not duplicate the same customer contact.","Exceptions have an owner and correction.","Final state is verified after the change."]'::jsonb),
('servicem8-for-virtual-assistants','servicem8-composite-va-simulation','Harbour Field Services ServiceM8 control-desk portfolio','SHIFT:
Highest-priority job:

JOB STATE
Quote jobs:
Work Orders:
Completed:
Unsuccessful:
Queues / waiting:

DISPATCH
Feasibility conflicts:
Customer promises:

QUOTES / FOLLOW-UP
Replies:
Accepted quotes:
Automation holds:

COMPLETION / INVOICING
Evidence gaps:
Return work:
Payment exceptions:

HANDOFF
System changes:
Owner decisions:
Next checkpoints:
Evidence links:','["All jobs use the same four-status/Queue model consistently.","Dispatch decisions use capability, travel, duration and dependencies.","Quote replies and automation do not conflict.","Completion/invoice state follows actual evidence.","Payment exceptions stay separate from credits/write-offs/accounting decisions.","The handoff clearly identifies system changes, owners and next checkpoints."]'::jsonb),
('australian-allied-health-administration','how-australian-allied-health-practices-operate','Allied health admin authority and clinical-boundary map','Practice / service:
Administrative task:
Approved system:
VA may complete:
Practitioner must decide:
Practice manager decision:
Clinical question:
Funding / billing question:
Privacy concern:
Owner:
Next checkpoint:
Evidence link:','["Administrative work is separated from clinical assessment/treatment advice.","Clinical questions always route to the authorised practitioner.","Practice-management and billing/funding decisions have named owners.","The VA does not infer urgency, diagnosis or provider type.","Approved systems are identified.","Every routed item has a checkpoint."]'::jsonb),
('australian-allied-health-administration','australian-privacy-and-health-information-for-practice-admin','Health-information incident containment and escalation record','Incident:
Patient / record identifier:
Information involved:
Wrong recipient / access:
Time discovered:
Immediate containment:
Approved system note:
Who was notified internally:
What the VA must not decide:
Practice privacy owner:
Patient communication authorised?:
Next checkpoint:
Evidence / audit note:','["The incident is contained through the approved practice process.","Only necessary incident details are repeated in working notes.","The original error and actions are audit-ready.","The VA does not determine legal breach notification outcomes.","Patient communication occurs only through authorised practice decisions.","Practice/privacy owner and checkpoint are explicit."]'::jsonb),
('australian-allied-health-administration','patient-intake-forms-and-demographic-checks','Patient intake and referral-readiness exception tracker','Patient:
Administrative identifiers:
Contact detail conflict:
Consent / form state:
Referral present?:
Referral fields complete?:
Required admin item:
Missing / conflicting data:
Source to verify:
VA action:
Practitioner / manager decision:
Status:
Next checkpoint:','["Conflicting demographic details are verified rather than guessed.","Only required intake information is collected.","Referral completeness is checked administratively, not clinically interpreted.","Missing information stays visible.","Clinical/funding judgments are routed.","Status and next checkpoint are clear."]'::jsonb),
('australian-allied-health-administration','referrals-documents-and-practitioner-handoffs','Referral identity-resolution and practitioner handoff sheet','Referral:
Incoming source:
Patient details on referral:
Possible patient matches:
Identifiers compared:
Attachment held?:
Identity resolution action:
Referral admin completeness:
Clinical question / gap:
Practitioner:
Handoff note:
Audit evidence:
Status:
Next checkpoint:','["A referral is not attached while patient identity is ambiguous.","Multiple identifiers are compared using approved practice process.","The VA does not clinically interpret referral content.","Document source and handling are audit-ready.","The practitioner receives the relevant administrative gap.","Final attachment/handoff state is explicit."]'::jsonb),
('australian-allied-health-administration','scheduling-appointment-types-reminders-and-no-shows','Allied health appointment-fit and schedule exception board','Patient:
Requested appointment:
Practice appointment type:
Standard duration:
Practitioner capability:
Location / telehealth:
Room / resource:
Funding/admin dependency:
Requested time:
Calendar conflict:
Safe admin response:
Practitioner/manager decision:
Final booking state:
Reminder / no-show action:','["Appointment type and duration come from the practice matrix.","Practitioner capability is checked without clinical triage by the VA.","Shorter appointments are not invented to fit availability.","Room/location/telehealth dependencies are visible.","Funding/admin dependencies are separated from clinical suitability.","Final booking and reminder state are explicit."]'::jsonb),
('australian-allied-health-administration','recalls-waitlists-and-routine-patient-messages','Recall and waitlist source-validation queue','Patient:
Task type:
Recall / waitlist source:
Created by:
Reason recorded:
Due window:
Administrative instruction:
Source validated?:
Patient message:
Clinical wording avoided:
Owner:
Status:
Next checkpoint:
Audit note:','["Recall source and creator are verified before contact.","The VA does not infer clinical necessity from a vague task.","Patient messages stay administrative.","Due windows and priority follow the practice''s approved instruction.","Unclear recalls are routed rather than actioned blindly.","Audit note and owner are recorded."]'::jsonb),
('australian-allied-health-administration','billing-administration-funding-pathways-and-outstanding-accounts','Allied health billing and funding exception tracker','Patient / invoice:
Funding / payer pathway:
Referral / plan reference:
Service date:
Invoice field in question:
Source evidence:
Administrative mismatch:
VA correction allowed:
Eligibility / clinical / policy decision:
Reviewer:
Outstanding account action:
Status:
Next checkpoint:','["Invoice/reference fields are checked against approved source records.","Administrative correction is separated from funding eligibility or policy judgment.","The VA does not promise reimbursement or coverage.","Third-party rejection reasons are recorded accurately.","Reviewer questions are precise.","Outstanding-account actions follow the approved pathway."]'::jsonb),
('australian-allied-health-administration','australian-allied-health-composite-admin-simulation','Rivergum Allied Health administration control-desk portfolio','SHIFT:
Highest-priority admin issue:

INTAKE / REFERRALS
Missing forms:
Identity conflicts:
Referral gaps:
Practitioner handoffs:

SCHEDULING
Appointment exceptions:
Calendar conflicts:
Reminders / no-shows:

PRIVACY
Incidents:
Containment:
Practice owner:

BILLING / FUNDING
Rejected invoices:
Admin corrections:
Reviewer decisions:

PATIENT MESSAGES
Sent / held:
Clinical questions routed:

HANDOFF
Owners:
Next checkpoints:
Audit evidence:','["All patient/admin records use consistent source evidence.","Clinical questions and urgency decisions stay with practitioners.","Privacy incidents follow containment/escalation rather than VA legal judgment.","Scheduling uses the practice matrix and real resource constraints.","Funding/billing issues separate admin correction from eligibility/clinical decisions.","The handoff is privacy-safe, audit-ready and actionable."]'::jsonb)
),
targets as (
 select l.id,s.template_title,s.template_text,s.checklist_items
 from artifact_specs s
 join public.training_courses c on c.slug=s.course_slug
 join public.training_modules m on m.course_id=c.id
 join public.training_lessons l on l.module_id=m.id and l.slug=s.lesson_slug
 where l.is_published=true
),
rebuilt as (
 select t.id,
  jsonb_agg(case
    when b.block->>'type'='template' then jsonb_build_object(
      'type','template','title',t.template_title,'text',t.template_text
    )
    when b.block->>'type'='checklist' then jsonb_build_object(
      'type','checklist','title','Before you submit','items',t.checklist_items
    )
    else b.block end order by b.ord) as content
 from targets t
 cross join lateral jsonb_array_elements(
   (select l2.content from public.training_lessons l2 where l2.id=t.id)
 ) with ordinality b(block,ord)
 group by t.id,t.template_title,t.template_text,t.checklist_items
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

with worked_examples(course_slug,lesson_slug,example_title,example_text) as (
values
('servicem8-for-virtual-assistants','servicem8-job-lifecycle-and-va-role','Worked example: a Queue explains waiting; it does not replace core status','A customer has approved a quoted repair, so the job has moved beyond Quote. The required part will not arrive for three days. Keep the core lifecycle state aligned with approval to proceed and use a genuine waiting Queue for the part dependency. Do not invent a custom status such as ''Waiting Parts'' in place of ServiceM8''s fixed lifecycle status.'),
('servicem8-for-virtual-assistants','scheduling-jobs-and-using-the-dispatch-view','Worked example: an open Dispatch Board slot is not enough evidence to promise it','A 2:00 PM gap appears open, but the technician''s previous booking ends 30 minutes away at 1:45 and the new job normally takes two hours. Check capability, travel, duration, external blocks and later commitments before confirming. The visible gap is only one input to feasibility.'),
('servicem8-for-virtual-assistants','quotes-options-acceptance-and-follow-up','Worked example: a customer question interrupts routine follow-up','A quote-follow-up automation is scheduled, but the customer has replied asking whether an option can be changed. Do not let routine follow-up continue as if no reply exists. Record the question, pause/contain duplicate contact through the approved workflow, route the scope/pricing decision, and keep the job in the correct acceptance state until the customer actually approves.'),
('servicem8-for-virtual-assistants','invoices-payments-statements-and-accounting-handoff','Worked example: a matching-looking bank receipt is not yet reconciled payment','A customer says they paid yesterday and accounting shows an unmatched receipt for the same amount. That is evidence to investigate, not authority to mark the invoice paid or cancel the debt permanently. Hold duplicate chasing where appropriate, route the match to finance, and give the customer a factual reconciliation checkpoint.'),
('australian-allied-health-administration','how-australian-allied-health-practices-operate','Worked example: the VA routes the clinical question instead of choosing the provider','A new patient says their shoulder pain is severe and asks whether they need physiotherapy, occupational therapy or another service. The VA can collect the practice''s approved intake details and explain the administrative next step, but the clinical/service recommendation belongs to the authorised practitioner or practice workflow.'),
('australian-allied-health-administration','australian-privacy-and-health-information-for-practice-admin','Worked example: contain the privacy incident; do not decide the legal outcome','A referral PDF was sent to the wrong patient. Stop any further disclosure where possible, preserve the incident details, notify the practice''s authorised privacy/management owner, and follow the approved incident process. The VA should not independently decide whether formal breach notification is legally required.'),
('australian-allied-health-administration','referrals-documents-and-practitioner-handoffs','Worked example: a plausible patient match is not enough to attach a referral','Two patient records share the same surname and date of birth. Even if one record looks more likely from recent appointments, hold the attachment until identity is resolved using the practice''s approved identifiers/process. A wrong-record attachment creates a larger privacy and clinical-record problem than a short administrative delay.'),
('australian-allied-health-administration','billing-administration-funding-pathways-and-outstanding-accounts','Worked example: fix administrative evidence without deciding funding eligibility','A third-party invoice is rejected because one reference field does not match the referral record. The VA can compare the approved records, correct an authorised clerical error, and prepare the resubmission. If the rejection depends on eligibility, coverage, clinical criteria or policy interpretation, route that decision to the practice owner or authorised funding/billing reviewer.')
),
targets as (
 select l.id,w.example_title,w.example_text
 from worked_examples w
 join public.training_courses c on c.slug=w.course_slug
 join public.training_modules m on m.course_id=c.id
 join public.training_lessons l on l.module_id=m.id and l.slug=w.lesson_slug
 where l.is_published=true
),
rebuilt as (
 select t.id,
  coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord<ex.exercise_ord),'[]'::jsonb)
  || jsonb_build_array(jsonb_build_object('type','callout','title',t.example_title,'text',t.example_text))
  || coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord>=ex.exercise_ord),'[]'::jsonb) as content
 from targets t
 join lateral (
   select min(b2.ord) exercise_ord
   from jsonb_array_elements((select l2.content from public.training_lessons l2 where l2.id=t.id))
     with ordinality b2(block,ord)
   where b2.block->>'type'='exercise'
 ) ex on ex.exercise_ord is not null
 cross join lateral jsonb_array_elements((select l3.content from public.training_lessons l3 where l3.id=t.id))
   with ordinality b(block,ord)
 where not exists (
   select 1 from jsonb_array_elements((select l4.content from public.training_lessons l4 where l4.id=t.id)) e
   where e->>'type'='callout' and e->>'title'=t.example_title
 )
 group by t.id,t.example_title,t.example_text,ex.exercise_ord
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('servicem8-for-virtual-assistants','australian-allied-health-administration');
