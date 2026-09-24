-- Finish Australian VA Fundamentals and Australian Trades Administration lesson artifacts.
-- Preserve lesson IDs and learner progress.

with artifact_specs(course_slug,lesson_slug,template_title,template_text,checklist_items) as (
values
('australian-va-fundamentals','how-australian-small-businesses-work-with-vas','Australian VA delegation and authority map','Business:
Location / state:
Decision owner:
Task / workflow:
VA may do:
VA must confirm:
VA must not decide:
Approved source / SOP:
Customer / supplier impact:
Exception:
Escalation owner:
Next checkpoint:
Evidence link:','["The business context and decision owner are explicit.","Routine admin ownership is separated from commercial, legal, tax, HR, or specialist decisions.","The approved source/SOP is identified.","The VA does not convert vague delegation into unlimited authority.","Customer/supplier impact is visible.","Exceptions have an owner and next checkpoint."]'::jsonb),
('australian-va-fundamentals','australian-business-language-dates-and-communication','Australian communication and date-verification sheet','Recipient:
Australian location / state:
Original wording / date:
Potential ambiguity:
Verified meaning:
Australian date format:
Terminology / spelling check:
Phone / state format:
Message draft:
Source checked:
Approval needed:
Final status:','["Ambiguous numeric dates are verified before sending.","Australian spelling/terminology is natural without forced slang.","State, phone, and date formats are internally consistent.","The message does not change the underlying business meaning.","Any uncertain business term is checked from a source.","Final status shows whether the message is ready or held."]'::jsonb),
('australian-va-fundamentals','australian-time-zones-daylight-saving-and-scheduling','Australian time-zone and DST scheduling record','Meeting / task:
Date:
Sydney / Melbourne time:
Brisbane time:
Perth time:
Manila time:
DST applies where?:
Calendar time zone:
Recurrence rule:
Participant expectation:
Verification source:
Risk / ambiguity:
Final invite status:
Recheck date:','["The actual date and locations drive the time conversion.","Sydney/Melbourne, Brisbane, Perth, and Manila are not treated as one offset.","DST assumptions are checked for the relevant date.","Recurring meetings are tested across DST boundaries.","The calendar event carries an explicit time zone.","Participants receive a clear local-time expectation."]'::jsonb),
('australian-va-fundamentals','australian-privacy-personal-information-and-offshore-va-access','Australian personal-information minimisation and access log','Task:
Business:
Data source:
Fields available:
Fields actually needed:
Fields excluded:
Approved system:
Offshore / external access:
Sharing destination:
Retention / working-copy note:
Privacy concern:
Owner / escalation:
Evidence:','["Only data needed for the task is used.","Unrelated identity, health, payment, or contact data is excluded.","Work stays in approved systems/channels.","Offshore/external access is treated as a controlled business decision.","Copies/exports are not created merely for convenience.","Privacy concerns are escalated rather than interpreted as legal conclusions."]'::jsonb),
('australian-va-fundamentals','abn-gst-bas-invoices-and-finance-terminology-for-vas','Australian finance-admin terminology and escalation sheet','Document / supplier:
ABN shown:
Invoice / reference:
Amount:
GST shown:
Source evidence:
Administrative check:
Mismatch / uncertainty:
What the VA may do:
What requires bookkeeper / accountant / BAS-agent review:
Reviewer question:
Status:
Evidence link:','["The VA records what the document shows without inventing tax treatment.","ABN, GST, BAS, payroll, super, and ATO terms are used accurately.","Administrative completeness is separated from tax/accounting judgment.","Mismatch evidence is preserved.","The reviewer question is precise.","The status remains pending until authorised review resolves the issue."]'::jsonb),
('australian-va-fundamentals','australian-customer-service-and-administrative-follow-up','Australian customer follow-up and escalation log','Customer:
Location / state:
Job / account:
Customer message:
Verified system facts:
What is missing:
Approved response:
Action completed:
Internal escalation:
Owner:
Customer checkpoint:
Next action:
Evidence:','["Customer wording is acknowledged without adopting unsupported conclusions.","System facts are verified before promising a result.","The VA does not invent refunds, bookings, pricing, or service outcomes.","Internal escalation is specific.","The customer gets a realistic checkpoint.","The system record and message stay consistent."]'::jsonb),
('australian-va-fundamentals','daily-handoffs-between-the-philippines-and-australia','Philippines-to-Australia daily handoff board','Item:
Australian owner / team:
Australian location:
PH completion time:
AU local time:
Status:
Completed work:
Blocked by:
Decision / approval needed:
Customer / supplier waiting?:
Deadline / checkpoint:
Next owner:
Evidence link:
Priority:','["Local times are explicit for both Philippines and Australia.","Completed, blocked, and pending-decision items are distinct.","Items with Australian-day deadlines are surfaced before routine work.","Waiting customers/suppliers are visible.","The next owner and checkpoint are named.","The handoff does not mark blocked work as complete."]'::jsonb),
('australian-va-fundamentals','australian-va-composite-work-simulation','Banksia Business Services Australian VA control-desk portfolio','SHIFT:
VA location:
Client HQ:
Highest-priority item:

COMMUNICATION
Customer / supplier items:
Date / wording checks:
Messages sent / held:

TIME ZONES
Meetings:
DST / recurrence risks:

PRIVACY
Data minimised:
Access / sharing concerns:

FINANCE ADMIN
Invoice / GST issues:
Reviewer questions:

HANDOFF
Completed:
Blocked:
Approvals:
Next owners:
AU deadlines:
Evidence links:','["All work uses one consistent Australian client context.","Time-zone/date decisions are explicit and verified.","Privacy minimisation is reflected in actual working notes.","Finance/tax questions stay within admin boundaries.","Customer follow-up uses verified evidence and checkpoints.","The final handoff is usable by the Australian team without reconstruction."]'::jsonb),
('australian-trades-administration','from-customer-enquiry-to-completed-job','Trade job intake and lifecycle record','Job:
Customer:
Suburb:
Reported issue:
Customer''s diagnosis / wording:
Neutral job description:
Job status:
Required trade / capability:
Source evidence:
Customer communication:
Exception:
Decision owner:
Next action:
Next checkpoint:','["Customer symptoms are recorded without turning their diagnosis into fact.","Job identity, customer, suburb, and status are correct.","Trade/capability need is visible without diagnosing the technical cause.","Customer communication matches the system record.","Exceptions route to the correct owner.","The job can move to the next stage without missing context."]'::jsonb),
('australian-trades-administration','emergency-urgent-and-routine-job-triage','Trades triage and emergency-routing queue','Job:
Customer / suburb:
Reported condition:
Approved triage category:
Approved script / rule:
Immediate admin action:
Do not advise:
Technician / owner route:
Customer message:
Response deadline:
Status:
Evidence:
Next checkpoint:','["Triage category comes from approved business rules/scripts.","The VA does not provide technical or safety advice beyond the approved script.","Potential emergencies are routed promptly to the authorised trade/owner.","Customer wording is preserved accurately.","Status and response deadline are visible.","No technical diagnosis is invented."]'::jsonb),
('australian-trades-administration','scheduling-technicians-travel-and-job-windows','Technician dispatch feasibility board','Job:
Suburb:
Requested window:
Required capability:
Technician:
Prior job / location:
Travel buffer:
Parts / access dependency:
Estimated duration:
Existing commitments:
Feasible?:
Customer promise allowed?:
Owner / dispatcher decision:
Next action:','["Technician capability matches the job requirement.","Travel and prior-job location are considered.","Existing jobs, buffers, parts, and access dependencies are visible.","Calendar availability alone is not treated as feasibility.","No appointment is promised until the schedule is actually workable.","Exceptions have a dispatcher/owner decision path."]'::jsonb),
('australian-trades-administration','quote-administration-and-follow-up','Trade quote administration and approval tracker','Job / quote:
Customer:
Quote version:
Approved scope source:
Approved price:
Sent date:
Customer question / counter-offer:
VA response:
Technical scope question:
Commercial decision needed:
Decision owner:
Follow-up date:
Status:
Evidence:','["The correct quote version and approved scope are identified.","The VA does not negotiate price or alter scope.","Customer counter-offers are recorded accurately.","Technical and commercial questions are routed separately.","Follow-up timing is visible.","Customer communication matches the approved decision."]'::jsonb),
('australian-trades-administration','customer-updates-delays-and-job-completion','Trade job status and customer-update record','Job:
Technician note:
Verified status:
Temporary / final work:
Part / return visit needed:
Customer impact:
Approved update:
ETA / checkpoint:
Evidence required for completion:
Owner:
System status:
Next action:
Handoff:','["Technician notes are translated into accurate admin status without inventing technical meaning.","Temporary repair and completed work are not confused.","Parts/return visits remain open dependencies.","Customer messaging avoids unsupported timing promises.","Completion requires the business''s required evidence.","System status and customer update remain aligned."]'::jsonb),
('australian-trades-administration','supplier-parts-and-purchase-administration','Trades parts and supplier dependency tracker','Job:
Part / material:
Requested spec / reference:
Supplier:
Availability:
Alternative offered:
Price / lead time:
Technical suitability decision:
Spend approval:
Order status:
Customer/job impact:
Decision owner:
Next checkpoint:
Evidence:','["The requested part/spec and source are recorded.","An alternative part is not treated as technically acceptable by the VA.","Price/lead-time facts are separated from technical suitability.","Spend approval is explicit.","The affected customer/job remains linked to the dependency.","Next checkpoint and decision owner are clear."]'::jsonb),
('australian-trades-administration','invoicing-payment-follow-up-and-accounting-handoff','Job-to-invoice evidence and accounting handoff','Job:
Completion status:
Technician evidence:
Approved quote / scope:
Materials / variation:
Draft invoice:
Missing item:
GST / accounting uncertainty:
Admin action:
Accounting reviewer:
Customer payment status:
Follow-up allowed:
Final readiness:
Evidence link:','["The job is actually ready for invoicing from the required evidence.","Quote/scope, materials, and approved variations are reconciled.","Missing items are not silently omitted.","GST/accounting treatment is routed to the appropriate reviewer.","Payment follow-up uses an issued/approved invoice state.","Final readiness is evidence-based."]'::jsonb),
('australian-trades-administration','australian-trades-composite-work-simulation','Redgum Trade Services dispatch and admin control-desk portfolio','SHIFT:
Service area:
Highest-priority job:

TRIAGE / DISPATCH
Emergency / urgent:
Technician capability:
Schedule conflicts:
Containment:

QUOTES / PARTS
Quotes awaiting decision:
Parts blockers:
Approval owners:

CUSTOMERS
Updates due:
Delays:
Next checkpoints:

INVOICING
Jobs ready:
Evidence gaps:
Accounting questions:

HANDOFF
Open risks:
Owners:
Deadlines:
Evidence links:','["Jobs are prioritised from approved triage rules and business impact.","Dispatch respects capability, geography, travel, and commitments.","The VA does not make technical, safety, pricing, or spend decisions outside authority.","Quote/parts/invoice dependencies stay linked to the job.","Customer updates match verified field/system status.","The final handoff gives the owner/dispatcher a usable control picture."]'::jsonb)
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
('australian-va-fundamentals','australian-time-zones-daylight-saving-and-scheduling','Worked example: ''Australia time'' is not a usable scheduling rule','A Sydney manager asks for a recurring 9:00 meeting and a Brisbane supplier joins. In September the local times may align differently than after daylight saving begins in Sydney. Do not save a permanent UTC offset from memory. Anchor the event to the intended Australian location/time zone, test a date after the DST transition, and show Brisbane/Manila participants what local time they should expect.'),
('australian-va-fundamentals','australian-privacy-personal-information-and-offshore-va-access','Worked example: access to a spreadsheet does not make every field necessary','A complaints file includes customer names, addresses, card-reference fragments, health notes, and complaint categories. The task is to summarise complaint themes. Use only the fields required for that purpose in the approved environment and exclude unrelated sensitive data. If broader offshore access or export is unclear, route the access/process question to the client rather than inventing a legal answer.'),
('australian-va-fundamentals','abn-gst-bas-invoices-and-finance-terminology-for-vas','Worked example: recognising GST language is not the same as deciding GST treatment','A supplier invoice shows an ABN and a GST amount that differs from a previous invoice. The VA can check references, totals, document completeness, and prior records, then flag the mismatch. The VA should not decide the tax treatment or change the GST coding without the client''s authorised bookkeeper/accountant/BAS process.'),
('australian-va-fundamentals','daily-handoffs-between-the-philippines-and-australia','Worked example: handoff priority follows the Australian workday, not inbox order','At 4:30 PM Manila time, a Perth customer is waiting for a booking decision due later that day, a Melbourne manager has an approval request, and two routine tasks are complete. The handoff should surface the time-sensitive Australian-day items first, with local times, owner, blocker, and checkpoint, while completed routine items can sit lower in the summary.'),
('australian-trades-administration','from-customer-enquiry-to-completed-job','Worked example: record symptoms, not the customer''s diagnosis','A customer says, ''The pump is dead and needs replacing.'' The observed facts are that it will not start and an error light is showing. Record those facts and the customer''s wording, then route the job to the appropriate technician. Do not turn the customer''s suggested diagnosis or replacement request into the confirmed scope.'),
('australian-trades-administration','emergency-urgent-and-routine-job-triage','Worked example: an emergency script is a routing control, not a licence to diagnose','A caller reports a burning smell and asks whether it is safe to keep using the outlet. The VA follows the company''s approved emergency script and escalation path, records the reported condition, and routes the matter to the authorised electrical response. The VA should not improvise technical safety advice or downgrade the issue based on personal judgment.'),
('australian-trades-administration','scheduling-technicians-travel-and-job-windows','Worked example: an empty calendar slot can still be impossible','A technician appears free at 2 PM but is finishing a job 45 minutes away, the new job needs a capability they do not hold, and the customer requests a fixed 2:00 arrival. The correct admin action is to test capability, travel, prior-job risk, parts/access, and available alternatives before making a customer promise.'),
('australian-trades-administration','invoicing-payment-follow-up-and-accounting-handoff','Worked example: completed job status does not make the invoice ready','A job is marked complete, but the technician note lists an approved additional material that is missing from the draft invoice and the GST treatment is uncertain. Reconcile the job evidence and approved variation, hold final invoice readiness for the missing item, and route GST/accounting treatment to the authorised finance process rather than guessing.')
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
where slug in ('australian-va-fundamentals','australian-trades-administration');
