-- Connect Australian VA Fundamentals and Australian Trades Administration final assessments.
-- Preserve assessment IDs, submissions, certificates, and learner history.

update public.training_assessments a
set
  instructions=$txt$Complete the Banksia Business Services Australian VA control-desk simulation as one coherent portfolio.

Banksia is a fictional Melbourne-based small business with customers and suppliers across Australia. You are a Philippines-based VA supporting routine administration, customer follow-up, scheduling, document handling, finance administration, and end-of-day handoff. You are expected to understand Australian business context without pretending to provide legal, tax, payroll, privacy, or other specialist advice.

Submit:
1. A delegation and authority map for the work in the queue.
2. Corrected Australian customer/supplier communications, including ambiguous dates and terminology.
3. A time-zone/DST scheduling record for the cross-state meeting request.
4. A privacy-safe working note showing which fields you used, excluded, and why.
5. A finance-admin exception sheet for the supplier invoice with a precise reviewer question.
6. A customer follow-up log for the service complaint and overdue document request.
7. A prioritised Australian-day work queue with owners and deadlines.
8. A Philippines-to-Australia end-of-day handoff.

Use only the supplied fictional evidence. Do not assume all Australian states share one time zone or daylight-saving rule. Do not determine GST, tax, payroll, legal, or regulatory treatment. Do not retain unrelated personal information just because it is present in a file. Distinguish what the VA can complete, what requires client approval, and what requires a qualified specialist.$txt$,
  resource_pack=jsonb_build_array(
    jsonb_build_object(
      'id','client_context','kind','document','title','Banksia Business Services client context',
      'content',$r$Client: Banksia Business Services
HQ: Melbourne, Victoria
VA location: Philippines
Business: general small-business administrative support and customer coordination
Primary client owner: Mia, Managing Director
Operations manager: Joel
Bookkeeping reviewer: external bookkeeper
VA delegated work: inbox triage, routine booking coordination, approved customer/supplier follow-up, document collation, data cleanup, meeting administration, handoffs
VA cannot decide: refunds outside approved process, GST/tax treatment, payroll/legal/regulatory questions, or privacy/legal interpretations
Current date for the exercise: 2 October 2026$r$
    ),
    jsonb_build_object(
      'id','queue','kind','csv','title','Banksia Australian work queue',
      'content',$r$item,location,request,status,deadline,owner_or_dependency
Q1,Melbourne,Supplier invoice has unclear GST treatment,Open,Today,Bookkeeper review needed
Q2,Perth,Customer requests appointment at "10:00 tomorrow",Open,Confirm today,Time zone must be explicit
Q3,Melbourne,Customer asks for refund after service complaint,Open,Today,Manager approval required
Q4,Melbourne,Complaint spreadsheet contains unnecessary identity and health data,Open,Before analysis,Minimise data before working
Q5,Brisbane,Supplier promised supporting document but has not sent it,Waiting,Today,Supplier follow-up
Q6,Melbourne,Manager needs end-of-day update,Open,Before Australian close,VA handoff
Q7,Sydney,Recurring monthly review meeting needs Brisbane and Manila attendees,Open,Schedule today,DST-aware recurrence$r$
    ),
    jsonb_build_object(
      'id','communications','kind','document','title','Australian communication and date samples',
      'content',$r$Old US-template line: "Your appointment is scheduled for 4/10/2026 at 10:00 AM."
Customer location: Perth.
Client note: "Please use our normal Australian customer tone. Do not use forced slang."

Supplier draft:
"Hi, just following up on invoice 884. Please send the missing supporting document so we can complete our admin review."

Service complaint:
Customer says: "I've already called twice and nobody came."
System: one appointment was cancelled; no replacement booking exists; no refund approval is recorded.$r$
    ),
    jsonb_build_object(
      'id','timezones','kind','dataset','title','Australian time-zone and DST exercise',
      'content',$r$Meeting owner: Sydney
Meeting rule: 10:00 Sydney local time on the first Thursday of each month
Participants: Sydney, Brisbane, Manila
Exercise period: September to December 2026
Separate booking request: Perth customer asks for "10:00 tomorrow"
Learner must identify the intended location/time zone, test the recurrence across the daylight-saving transition, and avoid using one memorised "Australia time" offset.$r$
    ),
    jsonb_build_object(
      'id','privacy_data','kind','csv','title','Complaint-analysis data sample',
      'content',$r$case_id,complaint_theme,customer_name,mobile,address,payment_reference,health_note,resolution_status
C01,Missed appointment,Avery Cole,0400000001,12 Sample St,REF-101,Asthma noted in unrelated profile,Open
C02,Slow reply,Taylor Reed,0400000002,44 Example Rd,REF-102,,Closed
C03,Billing question,Jordan Lee,0400000003,8 Demo Ave,REF-103,Medication note unrelated to complaint,Open
C04,Missed appointment,Casey Ng,0400000004,9 Test Cres,REF-104,,Open
Task: summarise complaint themes and resolution status. Names, mobile numbers, addresses, payment references and health notes are not required for the requested summary.$r$
    ),
    jsonb_build_object(
      'id','finance_admin','kind','document','title','Supplier invoice administration file',
      'content',$r$Supplier: Northshore Office Services
Invoice: NOS-884
ABN shown: 12 345 678 901
Invoice total: 1,100
GST line shown: 50
Previous similar invoice total: 1,100 with GST line 100
Purchase approval: present
Payment due date: 9 October 2026
VA task: verify administrative completeness, record the mismatch and prepare a precise question for the approved bookkeeping reviewer. The learner must not decide the correct GST treatment.$r$
    ),
    jsonb_build_object(
      'id','followup','kind','document','title','Customer and supplier follow-up records',
      'content',$r$Customer complaint
- Customer says nobody attended.
- System shows one cancelled booking.
- No replacement appointment exists.
- No refund approval exists.
- Operations manager owns the service-recovery decision.

Brisbane supplier
- Supporting compliance document requested on 30 September.
- Supplier said it would be sent by 1 October.
- No document received by 10:30 Brisbane time on 2 October.
- VA may send the approved document reminder and record the next checkpoint.$r$
    ),
    jsonb_build_object(
      'id','boundaries','kind','policy','title','Banksia Australian VA working boundaries',
      'content',$r$Use the client's approved process and current source records.
Make Australian locations, dates and time zones explicit when they affect the task.
Do not infer GST, tax, payroll, employment, legal, privacy-law or regulatory treatment.
Use only the personal information necessary for the approved task.
Do not copy sensitive data into unapproved tools or channels.
Refunds, commercial exceptions and specialist decisions require the named authorised owner.
Every blocked or escalated item needs an owner and checkpoint in the handoff.$r$
    )
  ),
  rubric=jsonb_build_array(
    jsonb_build_object('id','context','label','Australian context and source accuracy','weight',15,'description','Uses the supplied Australian locations, records, terminology and business context accurately without inventing missing facts.'),
    jsonb_build_object('id','scheduling','label','Dates, time zones and scheduling','weight',15,'description','Handles Australian date ambiguity, cross-state time zones and daylight-saving effects explicitly and produces a usable schedule record.'),
    jsonb_build_object('id','privacy','label','Privacy-safe administration','weight',15,'description','Uses only necessary personal information, keeps work in approved systems and documents access or data-minimisation concerns.'),
    jsonb_build_object('id','boundaries','label','Finance and professional boundaries','weight',20,'hard_fail',true,'description','Does not decide GST, tax, payroll, legal, regulatory, refund or other specialist matters outside delegated authority and routes them to the correct owner.'),
    jsonb_build_object('id','execution','label','Customer and administrative execution','weight',20,'description','Produces usable follow-ups, queue actions and working records based on verified evidence rather than general advice.'),
    jsonb_build_object('id','handoff','label','QA and Philippines-to-Australia handoff','weight',15,'description','Leaves completed, blocked and time-sensitive Australian-day work with clear evidence, owners, local deadlines and next checkpoints.')
  ),
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='australian-va-fundamentals'
  and a.is_published=true;

update public.training_assessments a
set
  instructions=$txt$Complete the Redgum Trade Services Australian field-service administration simulation as one coherent portfolio.

Redgum is a fictional Melbourne trade-services business with qualified plumbing and electrical technicians. You support enquiry intake, approved triage, dispatch administration, quote follow-up, parts coordination, customer updates, invoicing administration and end-of-day handoff. You are not the technician, estimator, electrician, plumber, accountant, or business owner.

Submit:
1. A prioritised job/triage queue using the approved business rules.
2. A technician dispatch feasibility board using capability, suburb, travel, duration and existing commitments.
3. A quote-administration record for the customer counter-offer.
4. Customer updates for the delayed/temporary-repair jobs.
5. A supplier/parts dependency tracker, including the offered alternative part.
6. A job-to-invoice evidence sheet with the missing material and GST/accounting question.
7. An overdue-account/admin follow-up record.
8. An end-of-day Redgum control-desk handoff with owners, risks and next checkpoints.

Use only the supplied fictional evidence. Do not diagnose technical faults, give electrical/plumbing safety advice beyond the approved business script, decide whether a substitute part is technically suitable, negotiate price, approve spend outside delegated authority, determine GST/accounting treatment, or promise arrival/completion times the dispatch evidence does not support.$txt$,
  resource_pack=jsonb_build_array(
    jsonb_build_object(
      'id','jobs','kind','csv','title','Redgum Trades dispatch queue',
      'content',$r$job,suburb,customer_request,status,reported_time
J101,Richmond,Active water leak,Unscheduled,08:05
J102,Carlton,Breaker keeps tripping and customer reports burning smell,Unscheduled,08:12
J103,Footscray,Hot-water service,Booked 13:00,07:50
J104,Southbank,Quote follow-up and customer counter-offer,Waiting approval,Yesterday
J105,Brunswick,Repair awaiting unavailable part,Booked tomorrow,Yesterday
J106,Fitzroy,Temporary repair completed and return visit needed,In progress,Yesterday
J107,St Kilda,Completed job awaiting invoice,Complete,Yesterday
J108,Collingwood,Issued invoice overdue,Accounts follow-up,7 days ago$r$
    ),
    jsonb_build_object(
      'id','dispatch','kind','document','title','Technician capability and dispatch constraints',
      'content',$r$Tech A: qualified plumbing technician; starts Richmond 08:30; booked Footscray 13:00; available to 15:00.
Tech B: qualified electrical technician; starts Carlton area 10:30; available to 17:00.
Tech C: mixed maintenance technician; fully booked today; not authorised for specialist electrical diagnosis.
Approved scheduling rule: check capability, geography/travel, current job risk, duration, parts/access and existing commitments before promising a window.
VA must not diagnose the fault or invent travel/arrival certainty.$r$
    ),
    jsonb_build_object(
      'id','authority','kind','policy','title','Redgum trades admin authority',
      'content',$r$VA may create/update jobs, follow the approved triage script, schedule within approved rules, track quotes, coordinate supplier information, draft customer updates, collate invoice evidence and send approved payment reminders.
Qualified technician/owner decides technical diagnosis, safety response beyond the approved script, suitability of alternative parts, scope changes and technical completion.
Owner/estimator decides quote negotiation and commercial concessions.
Approved finance reviewer decides GST/accounting treatment.
Spend above the delegated purchasing threshold requires owner approval.$r$
    ),
    jsonb_build_object(
      'id','field_notes','kind','document','title','Technician and job-status notes',
      'content',$r$J106 Fitzroy
Technician note: "Temporary repair completed. Replacement valve required. Part ordered. Return visit required."
No final completion evidence is recorded.

J107 St Kilda
Technician note: "Work complete. Replaced failed component and used additional approved material line MAT-44."
Photos and customer sign-off are attached.
Draft invoice currently excludes MAT-44.

J102 Carlton
Customer words: "Breaker keeps tripping. There is a burning smell near the outlet. Can we keep using it until you arrive?"
Learner must use the approved emergency-routing process rather than give improvised technical advice.$r$
    ),
    jsonb_build_object(
      'id','quotes','kind','document','title','Quote and customer follow-up file',
      'content',$r$J104 Southbank
Approved quote version Q-104-v3
Approved total: 4,850
Scope: approved by estimator
Sent: yesterday 14:20
Customer reply: "Can you do it for $500 less if we pay today?"
VA authority: may acknowledge and route the counter-offer; may not negotiate or change approved scope/price.
Estimator/owner decision required before any revised offer is communicated.$r$
    ),
    jsonb_build_object(
      'id','parts','kind','document','title','Supplier and parts dependency file',
      'content',$r$J105 Brunswick
Requested part: RP-220
Supplier: Metro Trade Supply
RP-220 status: unavailable for five business days
Supplier alternative: RP-220B, 12 percent cheaper, available today
No technician has confirmed technical suitability.
Purchase threshold: VA may prepare order information but owner approval is required above the delegated threshold.
Customer currently expects tomorrow's booking; no revised timing has been approved.$r$
    ),
    jsonb_build_object(
      'id','invoice','kind','document','title','Job-to-invoice and accounts file',
      'content',$r$J107 St Kilda
Job status: Complete
Approved quote: Q-107-v2
Field evidence: customer sign-off + photos
Additional approved material in technician note: MAT-44
Draft invoice: missing MAT-44
GST treatment on draft flagged as inconsistent with the finance template
VA task: reconcile source evidence, hold final readiness for the missing material and route GST/accounting treatment to the finance reviewer.

J108 Collingwood
Invoice INV-108 was issued from the approved system.
Invoice is 7 days overdue.
No dispute is recorded.
VA may send the approved reminder and record the next checkpoint.$r$
    ),
    jsonb_build_object(
      'id','triage','kind','policy','title','Approved Redgum triage and customer-contact rules',
      'content',$r$Potential electrical burning smell: use the approved emergency script immediately and route to the authorised electrical response. Do not provide improvised technical safety advice.
Active water leak: use the approved urgent leak triage workflow and route to the qualified plumbing response.
Routine booking/quote/payment follow-up may proceed through standard admin workflows.
Customer promises must reflect verified dispatch, quote, parts and job status.
A customer-suggested diagnosis must be recorded as customer wording, not confirmed technical fact.$r$
    ),
    jsonb_build_object(
      'id','eod','kind','csv','title','Redgum end-of-day control points',
      'content',$r$job,open_dependency,decision_owner,customer_waiting,next_checkpoint
J101,Qualified plumbing dispatch,Dispatcher/owner,Yes,Confirm approved response/window
J102,Electrical emergency routing,Qualified electrical response,Yes,Emergency-script checkpoint
J104,Customer counter-offer,Estimator/owner,Yes,Commercial decision
J105,Alternative part suitability and timing,Technician plus owner,Yes,Technical/parts decision
J106,Replacement part and return visit,Dispatcher,Yes,Schedule after part confirmation
J107,Missing invoice material and GST question,Finance reviewer,No,Invoice readiness review
J108,Overdue invoice follow-up,Accounts admin,Yes,Approved reminder then checkpoint$r$
    )
  ),
  rubric=jsonb_build_array(
    jsonb_build_object('id','triage','label','Triage and safety routing','weight',20,'hard_fail',true,'description','Uses approved emergency/urgent/routine rules, preserves reported symptoms and routes safety-sensitive work without providing unauthorised technical advice.'),
    jsonb_build_object('id','dispatch','label','Dispatch feasibility','weight',20,'description','Schedules from technician capability, geography, travel, duration, parts/access dependencies and existing commitments rather than calendar gaps alone.'),
    jsonb_build_object('id','job_evidence','label','Job lifecycle and field evidence','weight',15,'description','Keeps enquiry, field notes, temporary/final completion, parts and invoice evidence consistent across the job record.'),
    jsonb_build_object('id','boundaries','label','Technical, commercial and finance boundaries','weight',20,'hard_fail',true,'description','Does not diagnose faults, approve substitute parts, negotiate price, exceed spend authority or decide GST/accounting treatment.'),
    jsonb_build_object('id','communication','label','Customer and supplier communication','weight',10,'description','Writes clear updates based on verified status, approved decisions and realistic checkpoints without unsupported promises.'),
    jsonb_build_object('id','handoff','label','QA and operational handoff','weight',15,'description','Leaves jobs, quote/parts/invoice exceptions, owners, deadlines, evidence and next checkpoints clear for the owner/dispatcher/finance reviewer.')
  ),
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='australian-trades-administration'
  and a.is_published=true;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('australian-va-fundamentals','australian-trades-administration');
