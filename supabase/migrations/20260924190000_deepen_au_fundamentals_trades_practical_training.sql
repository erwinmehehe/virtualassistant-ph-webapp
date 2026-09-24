-- Deepen Australian VA Fundamentals and Australian Trades Administration
-- with first-class learner work, reusable artifacts, and connected capstones.
-- Existing lesson IDs, learner progress, enrollments, and publication state are preserved.

with specs(
  course_slug,
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

  -- AUSTRALIAN VA FUNDAMENTALS
  (
    'australian-va-fundamentals',
    'how-australian-small-businesses-work-with-vas',
    'Build the Australian client operating map',
    $e$Harbour Business Co is a fictional Melbourne-based small-business group. Map how the owner, VA, bookkeeper, external accountant, customers, suppliers, and specialist contractors interact. For each recurring admin task, state the system of record, what the VA owns, what requires approval, and the next handoff.$e$,
    'An operating map showing stakeholder, recurring task, source system, VA responsibility, approval boundary, owner, and handoff.',
    'Australian client operating map',
    $tpl$Stakeholder:
Recurring task:
System of record:
Input / trigger:
VA may complete:
Approval / specialist decision:
Owner:
Deadline / SLA:
Next handoff:
Evidence / link:$tpl$,
    'Operating map QA',
    '["Every recurring task has a system of record.","The VA role is separated from owner, finance, legal, technical, and specialist decisions.","Approval points are explicit.","Deadlines and service expectations are visible.","Handoffs name the next owner.","The map is usable without reconstructing the client workflow."]'::jsonb,
    null,
    null
  ),
  (
    'australian-va-fundamentals',
    'australian-business-language-dates-and-communication',
    'Prepare the Australian communication and date-control record',
    $e$Harbour Business Co sends a supplier note using 06/10/2026, a customer says they will call "arvo", and the owner asks for a concise update before COB. Rewrite the work into unambiguous Australian-business communication without changing meaning, and record any date or wording that needs confirmation.$e$,
    'A communication record with original wording, interpreted admin meaning, ambiguity, confirmed date/time, audience, concise message, and escalation if meaning is uncertain.',
    'Australian communication and date-control record',
    $tpl$Original request:
Audience:
Date as received:
Confirmed date format:
Time / time zone:
Australian term / shorthand:
Meaning confirmed:
Ambiguity:
Message to send:
Action owner:
Deadline:
Follow-up checkpoint:$tpl$,
    'Communication QA',
    '["Dates are converted into an unambiguous written format.","Australian shorthand is interpreted only when context supports it.","Unclear meaning is confirmed rather than guessed.","Tone is concise and professional.","The action and deadline are explicit.","The recipient can act without asking what the message means."]'::jsonb,
    'Date judgment: do not silently assume the format',
    $w$A supplier writes "delivery moved to 06/10/2026". The VA checks the Australian context, records 6 October 2026 in the internal task, and uses "6 October 2026" in the customer-facing update. If the source could reasonably use another date convention, the VA confirms rather than silently converting it.$w$
  ),
  (
    'australian-va-fundamentals',
    'australian-time-zones-daylight-saving-and-scheduling',
    'Build the Sydney-Brisbane-Manila calendar control sheet',
    $e$Harbour Business Co needs a recurring 10:00 AM Sydney meeting from September through December 2026 with a Brisbane supplier and a Philippines VA. Build the calendar control sheet using named time zones, identify the daylight-saving transition risk, and show the local-time impact before and after the October change.$e$,
    'A calendar control sheet with event city, named time zone, local time, attendee zones, recurrence, DST transition, confirmation, and exception note.',
    'Australia-Philippines calendar control sheet',
    $tpl$Event:
Primary city:
Named time zone:
Primary local time:
Date / recurrence:
Attendee 1 city / local time:
Attendee 2 city / local time:
DST transition crossed:
Before-transition check:
After-transition check:
Calendar source:
Confirmation sent:
Exception / ambiguity:
Owner:$tpl$,
    'Calendar QA',
    '["The event uses a named city/time zone rather than a memorised offset.","The actual meeting date is used for conversion.","Recurring events crossing daylight-saving changes are rechecked.","Brisbane is not assumed to follow Sydney daylight saving.","The Philippines attendee time is verified from the calendar.","Critical times are written with date and time zone when ambiguity matters."]'::jsonb,
    'DST judgment: the recurring meeting stays anchored to Sydney',
    $w$The meeting must remain 10:00 AM Sydney time. The VA creates the recurrence in the Sydney named time zone. When daylight saving begins, the calendar changes the Manila and Brisbane local display as required. The VA does not hard-code a Manila offset from September and reuse it through December.$w$
  ),
  (
    'australian-va-fundamentals',
    'australian-privacy-personal-information-and-offshore-va-access',
    'Run the privacy-safe data handling and incident log',
    $e$A Harbour Business Co spreadsheet includes full identity data that is not needed for the task, and a customer attachment was accidentally shared to the wrong external recipient. Minimise the working file, contain further sharing through the approved process, preserve the facts, and prepare the privacy-owner handoff without deciding the legal outcome.$e$,
    'A privacy work record showing task purpose, minimum necessary data, approved system, excess data removed from the working copy, incident facts, containment, owner, and next checkpoint.',
    'Australian privacy and incident work record',
    $tpl$Task purpose:
Approved system:
Data actually needed:
Excess data present:
Minimum working fields:
Access level:
External sharing:
Incident:
Time discovered:
Immediate containment:
Evidence preserved:
Person / privacy owner notified:
Decision the VA must not make:
Next checkpoint:$tpl$,
    'Privacy QA',
    '["Only information necessary for the admin task remains in the working view.","Client data stays in approved systems and accounts.","Wrong-recipient or exposed-link incidents are contained promptly.","Facts are preserved without spreading sensitive details further.","The VA does not decide legal notification or liability outcomes.","The privacy owner and next checkpoint are explicit."]'::jsonb,
    'Privacy judgment: contain first, interpret later',
    $w$A customer attachment was sent to the wrong external recipient. The VA stops further sharing where the client process allows, records the recipient, time, file, and actions taken, and escalates immediately to the named privacy owner. The VA does not email the file around internally for opinions or decide whether the incident legally requires notification.$w$
  ),
  (
    'australian-va-fundamentals',
    'abn-gst-bas-invoices-and-finance-terminology-for-vas',
    'Prepare the Australian finance-admin terminology handoff',
    $e$Harbour Business Co receives a supplier invoice with an ABN, GST amount, payment terms, and a manager note asking whether the transaction belongs in this BAS period. Extract the administrative facts, identify what can be checked, and route tax/BAS/accounting interpretation to the authorised finance owner.$e$,
    'A finance-admin handoff with document facts, ABN/invoice fields, GST shown, dates, payment terms, missing evidence, admin action, finance question, reviewer, and status.',
    'Australian finance-admin terminology handoff',
    $tpl$Document:
Supplier / customer:
ABN shown:
Invoice date:
Due date:
Amount:
GST shown:
Payment terms:
Source evidence:
Administrative check:
Missing / conflicting data:
GST / BAS / accounting question:
Finance reviewer:
Action taken:
Status:
Next checkpoint:$tpl$,
    'Finance terminology QA',
    '["Invoice facts are copied accurately from the source.","ABN, GST, BAS, payroll, and accounting terms are not treated as interchangeable.","The VA does not determine GST liability or BAS treatment from terminology alone.","Missing evidence stays visible.","The finance question is specific enough for a reviewer to answer.","Administrative completion is separated from professional judgment."]'::jsonb,
    null,
    null
  ),
  (
    'australian-va-fundamentals',
    'australian-customer-service-and-administrative-follow-up',
    'Run the Australian customer exception and follow-up queue',
    $e$Harbour Business Co has an overdue supplier response, a customer asking for a refund outside policy, a booking that needs rescheduling, and a complaint requiring owner review. Prioritise the queue, use approved facts and scripts, avoid unsupported promises, and set a clear owner and checkpoint for every unresolved item.$e$,
    'A customer-service exception queue with issue, verified facts, urgency, approved response, action taken, decision boundary, owner, promised checkpoint, and status.',
    'Australian customer exception and follow-up queue',
    $tpl$Customer / supplier:
Issue:
Received:
Verified facts:
Priority:
Approved policy / script:
Response sent:
Action completed:
Decision / exception required:
Owner:
Promised checkpoint:
Status:
Evidence / notes:$tpl$,
    'Customer follow-up QA',
    '["Priority reflects deadline, dependency, customer impact, and escalation risk.","Only verified facts are communicated.","Refunds, concessions, legal positions, and policy exceptions stay with authorised owners.","No unsupported promise is made.","Every unresolved item has an owner and checkpoint.","Follow-up history is visible."]'::jsonb,
    null,
    null
  ),
  (
    'australian-va-fundamentals',
    'daily-handoffs-between-the-philippines-and-australia',
    'Produce the Philippines-to-Australia end-of-day control handoff',
    $e$At 4:30 PM Philippines time, Harbour Business Co still has one customer issue waiting on owner approval, a supplier response due in Melbourne the next morning, an unresolved privacy incident, and a finance question for the bookkeeper. Build a handoff that lets the Australian team continue without reconstructing the day.$e$,
    'An end-of-day handoff showing completed work, open items, blocker, owner, Australian due time, evidence, risk, decision needed, and first next action.',
    'Philippines-to-Australia end-of-day handoff',
    $tpl$Date:
PH handoff time:
Australian client city:

COMPLETED
Item / evidence:

OPEN
Item:
Current status:
Blocker:
Australian due date/time:
Owner:
Decision needed:
Evidence / link:
Customer / supplier expectation:
First next action:

RISKS / ESCALATIONS
Issue:
Owner:
Checkpoint:$tpl$,
    'Handoff QA',
    '["The handoff uses the client city and Australian due time where timing matters.","Completed and open work are clearly separated.","Each blocker and decision has a named owner.","Customer promises and external deadlines are visible.","Evidence links or source references are included.","The Australian team can start from the handoff rather than re-reading the inbox."]'::jsonb,
    null,
    null
  ),
  (
    'australian-va-fundamentals',
    'australian-va-composite-work-simulation',
    'Final simulation: run the Harbour Business Co admin desk',
    $e$Use one connected Harbour Business Co case. Build the morning priority plan, resolve the communication/date issue, schedule the cross-city meeting, contain the privacy issue, prepare the finance-admin handoff, manage customer exceptions, and finish with the Philippines-to-Australia end-of-day control handoff.$e$,
    'A complete Harbour Business Co control pack combining operating map, communication/date record, calendar control, privacy log, finance handoff, customer queue, and end-of-day handoff.',
    'Harbour Business Co administration control pack',
    $tpl$BUSINESS: Harbour Business Co

1. OPERATING MAP
Task / system / owner / approval:

2. COMMUNICATION
Ambiguous wording / date:
Confirmed meaning:
Message:

3. CALENDAR
City / named time zone:
DST check:
Final event state:

4. PRIVACY
Minimum data:
Incident:
Containment:
Privacy owner:

5. FINANCE ADMIN
Invoice / finance facts:
Specialist question:
Reviewer:

6. CUSTOMER EXCEPTIONS
Priority item:
Response:
Decision owner:

7. EOD HANDOFF
Completed:
Open:
Owners:
Australian deadlines:
Evidence:
First next actions:$tpl$,
    'Australian VA capstone QA',
    '["All work uses one connected Harbour Business Co evidence trail.","Dates and time zones are explicit where ambiguity can change the outcome.","Privacy work uses minimum necessary data and escalates incidents correctly.","Finance work remains administrative and routes GST/BAS/accounting judgment.","Customer communication uses verified facts and approved authority.","The final handoff clearly identifies owners, Australian deadlines, evidence, and next actions."]'::jsonb,
    null,
    null
  ),

  -- AUSTRALIAN TRADES ADMINISTRATION
  (
    'australian-trades-administration',
    'from-customer-enquiry-to-completed-job',
    'Build the lead-to-paid trades job control board',
    $e$Harbourline Trade Services has a new enquiry, an accepted quote waiting for scheduling, a job requiring return work, and a completed job not yet invoiced. Build the job control board from enquiry through payment so every open item has a verified state, next action, owner, and dependency.$e$,
    'A trades job control board showing customer/job, lifecycle stage, verified state, dependency, next action, owner, customer update, financial state, and checkpoint.',
    'Trades lead-to-paid job control board',
    $tpl$Customer / job:
Lifecycle stage:
Verified current state:
Source system:
Dependency:
Next action:
Owner:
Customer update:
Quote / approval state:
Field evidence:
Invoice state:
Payment state:
Exception:
Next checkpoint:$tpl$,
    'Job-flow QA',
    '["Every job has one verified current state.","Accepted quotes have a scheduling next action.","Return work remains open until evidence supports completion.","Completed work reaches invoice/payment follow-up promptly.","Technical, commercial, and finance decisions stay with the correct owners.","Every exception has a next checkpoint."]'::jsonb,
    null,
    null
  ),
  (
    'australian-trades-administration',
    'emergency-urgent-and-routine-job-triage',
    'Run the trades enquiry triage and escalation log',
    $e$Harbourline receives three calls: a slow tap leak, water entering a ceiling near a light fitting, and a breaker that has tripped twice with no reported smoke or smell. Capture exact customer wording, apply only the approved triage matrix, and document which reports require immediate qualified escalation.$e$,
    'A triage log with customer wording, location, approved questions, matrix category, immediate action, qualified owner, timestamp, customer instruction, and next checkpoint.',
    'Trades enquiry triage and escalation log',
    $tpl$Customer / site:
Received time:
Exact customer wording:
People / immediate danger reported:
Approved questions asked:
Matrix category:
Immediate action:
Qualified escalation owner:
Customer instruction from approved script:
Booking action:
Technical conclusion intentionally not made:
Timestamp:
Next checkpoint:$tpl$,
    'Triage QA',
    '["Exact customer wording is preserved.","Only approved factual triage questions are used.","Serious-risk triggers are escalated immediately under the client process.","The VA does not diagnose technical safety.","Scheduling does not override the emergency pathway.","Escalation time and owner are recorded."]'::jsonb,
    'Triage judgment: escalation is not diagnosis',
    $w$A customer reports water entering the ceiling beside a light fitting. The VA records the exact wording, follows the serious-risk escalation path, and connects the customer to the approved qualified owner. The VA does not tell the customer the electrical system is safe or diagnose the source of the water.$w$
  ),
  (
    'australian-trades-administration',
    'scheduling-technicians-travel-and-job-windows',
    'Build the technician dispatch feasibility board',
    $e$Harbourline has a 90-minute electrical job requested for noon. The approved electrician is finishing another job 35 minutes away at 11:30, while another available technician does not have the required business-approved capability. Build the realistic dispatch plan and customer message without overpromising.$e$,
    'A dispatch board with job, required capability, technician, prior commitment, travel, duration, access/parts dependency, feasible window, customer promise, owner, and system action.',
    'Trades technician dispatch feasibility board',
    $tpl$Job:
Site / suburb:
Required capability:
Approved technician:
Prior commitment:
Travel time:
Job duration:
Access / induction:
Parts / equipment:
Requested window:
Feasible window:
Conflict:
Customer promise:
Dispatcher / owner decision:
System action:
Next checkpoint:$tpl$,
    'Dispatch QA',
    '["Capability is checked before availability.","Travel and realistic job duration are included.","Access, induction, parts, and equipment dependencies are visible.","An open calendar slot is not treated as capacity by itself.","Customer promises match the feasible plan.","Conflicts are escalated instead of hidden."]'::jsonb,
    'Dispatch judgment: an empty slot is not capacity',
    $w$The electrician appears free at noon, but the prior job ends at 11:30 and travel is about 35 minutes. The VA proposes the first realistic window after travel and setup, records the constraint, and gives the customer an approved arrival window. The VA does not assign an unqualified technician just because that person is closer.$w$
  ),
  (
    'australian-trades-administration',
    'quote-administration-and-follow-up',
    'Run the quote version, acceptance, and variation log',
    $e$A Harbourline customer has received Quote Q-204 v2 and asks whether one component can be removed for a lower price. Another customer accepted Q-205 online yesterday. Track version, customer question, acceptance evidence, follow-up automation, and the next action without negotiating scope or price.$e$,
    'A quote control log with job, version, approved scope/price, sent state, customer question, acceptance evidence, variation request, commercial owner, automation state, and next action.',
    'Trades quote acceptance and variation log',
    $tpl$Job:
Quote number / version:
Approved scope:
Approved price:
Sent date:
Customer question:
Acceptance evidence:
Variation requested:
Follow-up automation:
Pause / continue:
Admin response:
Scope / price decision owner:
Scheduling allowed:
Next action:
Evidence:$tpl$,
    'Quote QA',
    '["The current quote version is explicit.","Customer questions are separated from acceptance.","Accepted quotes have evidence.","Scope, price, discount, warranty, and variation decisions stay with authorised owners.","Automation is paused when it would duplicate or contradict a customer reply.","Scheduling starts only from a genuinely ready state."]'::jsonb,
    null,
    null
  ),
  (
    'australian-trades-administration',
    'customer-updates-delays-and-job-completion',
    'Build the customer delay, return-work, and completion exception log',
    $e$A Harbourline technician attended a site, uploaded photos, and recorded that a replacement part is required. The customer thinks the job is finished and asks when the invoice will arrive. Build the exception record, give a factual update, and keep the job open until the approved completion evidence is satisfied.$e$,
    'A completion exception log with job state, attendance evidence, missing work/evidence, return visit, customer expectation, approved update, invoice readiness, owner, and checkpoint.',
    'Trades completion and customer exception log',
    $tpl$Job:
Visit date:
Verified field evidence:
Missing Form / photo / note:
Return work:
Part dependency:
Current completion state:
Customer expectation:
Customer update:
Complaint / delay:
Invoice ready:
Technical decision owner:
Next visit / checkpoint:
Evidence:$tpl$,
    'Completion QA',
    '["Attendance is not confused with completed work.","Return work and parts dependencies keep the job open.","Required forms/photos/notes are checked individually.","The customer update states verified facts only.","Invoice readiness follows the business completion threshold.","The next owner and checkpoint are explicit."]'::jsonb,
    'Completion judgment: visit finished does not mean job finished',
    $w$The technician has left site, but the diary says a replacement part is required and a required completion form is missing. The VA tells the customer that further work is required, records the return-work dependency, and keeps invoicing on hold. The VA does not mark the job complete because the scheduled visit ended.$w$
  ),
  (
    'australian-trades-administration',
    'supplier-parts-and-purchase-administration',
    'Run the supplier, parts, and return-visit dependency tracker',
    $e$Harbourline has three jobs waiting on parts: one ordered, one backordered, and one quote awaiting owner approval because it exceeds the spend threshold. Track supplier evidence, ETA, approved spend, job/customer impact, and the return-visit dependency without authorising purchases outside the client rules.$e$,
    'A parts/supplier tracker with job, part, supplier, quote/order state, ETA, spend threshold, approval, customer impact, return-visit readiness, owner, and checkpoint.',
    'Trades supplier and parts dependency tracker',
    $tpl$Job:
Part / material:
Supplier:
Quote / PO / order:
Amount:
Spend threshold:
Approval evidence:
Order state:
ETA:
Backorder / substitute issue:
Technical substitute decision:
Customer impact:
Return visit ready:
Owner:
Next checkpoint:$tpl$,
    'Supplier QA',
    '["The part is tied to the correct job.","Quote, approval, order, and delivery states are distinct.","Spend above authority limits is held for approval.","Substitute-part or technical suitability decisions stay with qualified owners.","Customer timing reflects real supplier evidence.","Return work is scheduled only when dependencies are ready."]'::jsonb,
    null,
    null
  ),
  (
    'australian-trades-administration',
    'invoicing-payment-follow-up-and-accounting-handoff',
    'Prepare the trades invoice and payment exception handoff',
    $e$Harbourline has one job ready to invoice, one customer claiming payment yesterday while the finance system shows an unmatched receipt, and one requested credit outside normal policy. Prepare invoice/payment administration from approved evidence, stop duplicate chasing where appropriate, and route credits, GST, write-offs, and reconciliation decisions.$e$,
    'An invoice/payment handoff with job, completion evidence, invoice state, amount, payment evidence, reminder state, mismatch, admin action, finance decision, reviewer, and next checkpoint.',
    'Trades invoice and payment exception handoff',
    $tpl$Job / invoice:
Completion evidence:
Invoice state:
Amount:
Customer payment claim:
Payment evidence:
Accounting match:
Reminder due:
Reminder sent / held:
Administrative action:
Credit / write-off / GST question:
Finance owner:
Review request appropriate:
Status:
Next checkpoint:$tpl$,
    'Invoice and payment QA',
    '["Billing starts from verified completion evidence.","Payment status is checked before chasing again.","An unmatched receipt remains an exception until finance confirms it.","Credits, write-offs, GST, and accounting treatment stay with authorised finance owners.","Review requests wait until the customer issue is genuinely resolved.","The handoff gives finance enough evidence to continue."]'::jsonb,
    'Payment judgment: hold duplicate chasing while finance verifies',
    $w$A customer says they paid yesterday and the finance system shows an unmatched receipt for the same amount. The VA records both pieces of evidence, pauses the next reminder under the client process, and sends the reconciliation exception to finance. The VA does not mark the invoice paid or create a credit just to clear the queue.$w$
  ),
  (
    'australian-trades-administration',
    'australian-trades-composite-work-simulation',
    'Final simulation: run the Harbourline lead-to-review control desk',
    $e$Use one connected Harbourline Trade Services shift. Triage incoming jobs, build the dispatch plan, control quote acceptance and variation, manage return-work and parts dependencies, prepare invoice/payment exceptions, and finish with a decision-ready owner/dispatcher/bookkeeper handoff.$e$,
    'A complete Harbourline trades operations control pack combining job flow, triage, dispatch, quote control, completion/return work, supplier dependencies, invoice/payment exceptions, and end-of-day handoff.',
    'Harbourline trades operations control pack',
    $tpl$BUSINESS: Harbourline Trade Services

1. JOB FLOW
New / quoted / scheduled / field / return / invoice / paid:

2. TRIAGE
Serious-risk reports:
Immediate escalation:
Routine queue:

3. DISPATCH
Capability / travel conflicts:
Feasible windows:
Customer promises:

4. QUOTES
Questions:
Acceptance:
Variations:
Commercial owners:

5. COMPLETION / RETURN WORK
Evidence gaps:
Parts / return visits:
Customer updates:

6. SUPPLIERS
Orders / backorders:
Spend approvals:
ETAs:

7. INVOICE / PAYMENT
Ready to invoice:
Payment exceptions:
Finance handoff:

8. EOD HANDOFF
Completed:
Open:
Owners:
Customer promises:
Next checkpoints:
Evidence:$tpl$,
    'Trades capstone QA',
    '["All jobs use one connected Harbourline evidence trail.","Serious-risk reports follow approved escalation without VA diagnosis.","Dispatch uses capability, travel, duration, and dependencies.","Quote scope/price decisions stay with authorised commercial owners.","Return work and parts dependencies prevent false completion.","Payment exceptions remain separate from finance reconciliation and credit decisions.","The final handoff identifies owners, customer promises, evidence, and next checkpoints."]'::jsonb,
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
    on c.slug = s.course_slug
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
    t.course_slug,
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
    t.course_slug,
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

-- Connected Australian VA Fundamentals capstone.
update public.training_assessments a
set
  title = 'Harbour Business Co Australian VA Fundamentals Final Simulation',
  instructions = 'Work from one connected fictional Australian small-business queue. Produce the Harbour Business Co morning priority plan, communication/date control, named-time-zone calendar decision, privacy-safe work record and incident handoff, finance-admin terminology handoff, customer exception queue, and Philippines-to-Australia end-of-day handoff. Use verified evidence only. Do not make legal/privacy determinations, GST/BAS/accounting judgments, refund or commercial exceptions, or specialist decisions outside the VA role.',
  pass_score = 80,
  rubric = '[
    {"id":"context","label":"Australian operating context","weight":20,"description":"Uses the supplied business, city, date, time-zone, communication, customer, and finance context accurately."},
    {"id":"execution","label":"Administrative execution","weight":20,"description":"Produces usable calendar, communication, customer-service, privacy, finance-admin, and handoff work rather than generic advice."},
    {"id":"boundaries","label":"Privacy, finance, and authority boundaries","weight":20,"description":"Uses minimum necessary data and routes legal/privacy, GST/BAS/accounting, refund, and specialist decisions to authorised owners.","hard_fail":true},
    {"id":"time","label":"Dates, time zones, and deadlines","weight":15,"description":"Uses unambiguous dates, named time zones, daylight-saving-aware scheduling, and clear Australian deadlines."},
    {"id":"qa","label":"Evidence and QA","weight":15,"description":"Checks source information, preserves ambiguity and incidents, and keeps unresolved items visible."},
    {"id":"handoff","label":"Cross-border handoff","weight":10,"description":"Clearly separates completed work, open items, owners, Australian deadlines, evidence, and first next actions."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"business","title":"Harbour Business Co operating brief","kind":"policy","content":"Harbour Business Co is a fictional Melbourne-based small-business group. The Philippines VA handles routine customer and supplier administration, calendars, document preparation, approved follow-up, privacy-safe working records, and end-of-day handoffs. Legal/privacy interpretation, GST/BAS/accounting decisions, payroll/statutory decisions, refunds or commercial exceptions, and specialist work stay with the named authorised owner."},
    {"id":"queue","title":"Morning administration queue","kind":"csv","content":"item,issue,owner_or_dependency\nCustomer booking,Needs reschedule before tomorrow,Operations owner\nSupplier delivery,Message says 06/10/2026,Confirm unambiguous date\nRecurring meeting,Sydney 10:00 Sep-Dec with Brisbane + Manila,DST-aware calendar\nCustomer attachment,Sent to wrong external recipient,Privacy owner\nSupplier invoice,ABN + GST shown; BAS-period question,Bookkeeper/accountant\nRefund request,Outside standard policy,Owner approval"},
    {"id":"calendar","title":"Cross-city scheduling facts","kind":"document","content":"Primary meeting city: Sydney. Supplier participant: Brisbane. VA participant: Philippines. Meeting must stay at 10:00 AM Sydney time from September through December 2026. Use named time zones and the actual recurrence dates; do not hard-code a fixed Manila or Brisbane offset."},
    {"id":"privacy","title":"Privacy-safe working rule","kind":"policy","content":"Use only the personal information reasonably necessary for the task, keep data in approved client systems, use individual client accounts, and escalate wrong-recipient or exposed-link incidents immediately. The VA records facts and containment but does not decide the legal notification outcome."},
    {"id":"handoff","title":"Cross-border handoff standard","kind":"checklist","content":"Completed and open work separated; client city and Australian deadline explicit; owner named; customer/supplier expectation visible; evidence/source included; privacy/finance/specialist decisions clearly held; first next action stated."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'australian-va-fundamentals';

-- Connected Australian Trades capstone.
update public.training_assessments a
set
  title = 'Harbourline Australian Trades Administration Final Simulation',
  instructions = 'Work from one connected fictional Australian trade-services shift. Produce the Harbourline job-control board, enquiry triage log, dispatch feasibility board, quote/variation log, completion and return-work record, supplier/parts tracker, invoice/payment handoff, and end-of-day owner/dispatcher/bookkeeper handoff. Use supplied evidence only. Do not diagnose technical safety, negotiate scope or price, approve purchases outside authority, certify completion without evidence, or make GST/accounting, credit, write-off, or reconciliation decisions.',
  pass_score = 80,
  rubric = '[
    {"id":"jobflow","label":"Job-flow control","weight":20,"description":"Keeps enquiry, quote, scheduling, field work, return work, invoicing, payment, and customer state connected and current."},
    {"id":"triage_dispatch","label":"Triage and dispatch judgment","weight":20,"description":"Uses approved risk triggers and capability/travel/duration dependencies without technical diagnosis or impossible scheduling."},
    {"id":"commercial","label":"Quote, supplier, and customer control","weight":15,"description":"Preserves quote versions, customer acceptance, spend limits, supplier dependencies, and approved customer promises."},
    {"id":"boundaries","label":"Technical, commercial, safety, and finance boundaries","weight":20,"description":"Keeps diagnosis, safety conclusions, scope/price, spend approval, credits/write-offs, GST/accounting, and reconciliation decisions with authorised owners.","hard_fail":true},
    {"id":"qa","label":"Completion and financial QA","weight":15,"description":"Requires real completion evidence, tracks return work, checks payment evidence, and keeps finance exceptions visible."},
    {"id":"handoff","label":"Trades operations handoff","weight":10,"description":"Clearly identifies completed work, open jobs, owners, customer promises, evidence, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"jobs","title":"Harbourline morning job board","kind":"csv","content":"job,stage,issue\nJ101,Enquiry,Water entering ceiling beside light fitting\nJ102,Quote,Q-204 v2 customer asks to remove component for lower price\nJ103,Accepted quote,Q-205 accepted online; not yet scheduled\nJ104,Scheduled,90m electrical job requested noon; electrician previous job ends 11:30 about 35m away\nJ105,Field visit,Replacement part required; completion form missing\nJ106,Waiting parts,Part backordered\nJ107,Completed,Ready to invoice\nJ108,Invoice outstanding,Customer says paid; similar unmatched receipt exists"},
    {"id":"staff","title":"Dispatch and authority facts","kind":"document","content":"Tech Alex is approved for electrical work. Tech Bea is available earlier but is not approved for the electrical job. Travel from Alex prior job to J104 is about 35 minutes. Commercial changes to quote scope/price require estimator or owner approval. Purchases above the client spend threshold require owner approval. Technical safety and diagnosis stay with qualified trade staff."},
    {"id":"completion","title":"Completion and supplier evidence","kind":"document","content":"J105 diary says return with replacement part RP-44. Photos are present but the required completion Form is missing. J106 part SP-19 is backordered with no confirmed arrival date. A visit ending does not establish completed work when return work or evidence remains open."},
    {"id":"finance","title":"Invoice and payment control rules","kind":"policy","content":"Invoice only from approved scope and completion evidence. Check payment evidence before reminders. An unmatched bank receipt is a finance exception, not authority for the VA to mark paid. Credits, write-offs, GST/accounting treatment, and reconciliation decisions belong to authorised finance owners. Ask for a review only when the customer issue is genuinely resolved."},
    {"id":"handoff","title":"Trades handoff standard","kind":"checklist","content":"Verified state for every job; serious-risk escalations timestamped; dispatch constraints visible; quote questions/acceptance separated; return-work and parts dependencies open; invoice/payment exceptions routed; customer promises and next owners explicit."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'australian-trades-administration';

update public.training_courses
set
  summary = case slug
    when 'australian-va-fundamentals' then 'Practical Australian VA foundation training covering business context, communication, dates and time zones, privacy-safe administration, finance terminology, customer follow-up, and Philippines-to-Australia handoffs.'
    when 'australian-trades-administration' then 'Practical Australian trades administration training covering lead-to-paid job flow, safety-aware triage, dispatch, quote control, customer exceptions, parts, invoicing/payment follow-up, and owner handoffs.'
  end,
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in ('australian-va-fundamentals','australian-trades-administration');
