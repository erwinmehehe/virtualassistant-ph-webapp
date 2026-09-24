-- Refresh ServiceM8 for Virtual Assistants against current official
-- ServiceM8 workflow behaviour. Keep the course focused on operational
-- execution, status accuracy, evidence, and exception handling.

update public.training_lessons
set
  title = 'ServiceM8 Job Lifecycle, Fixed Statuses, Queues, and VA Role',
  summary = 'Understand ServiceM8 as a job lifecycle with four fixed job statuses and separate queues for work waiting on something, so the system reflects real operational state instead of becoming a custom-label filing system.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Use ServiceM8's four fixed job statuses correctly",
      "Use Queues for work that is waiting on a next step rather than inventing permanent sub-statuses",
      "Separate software capability from the client's authority rules"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Current ServiceM8 guidance defines four fixed job statuses: Quote, Work Order, Completed, and Unsuccessful. These statuses cannot be customised because they are part of the platform's core job lifecycle. Queues sit alongside those statuses and are intended for jobs waiting on something before scheduling or completion, not as a general filing system for permanent custom stages."},
    {"type":"heading","text":"The four core statuses"},
    {"type":"list","items":[
      "Quote: the job needs a quote or is waiting for quote approval.",
      "Work Order: the customer has given the go-ahead and the work is active or ready to proceed.",
      "Completed: the physical work is complete and the job is ready for invoicing.",
      "Unsuccessful: the quote was not accepted or the job was cancelled."
    ]},
    {"type":"heading","text":"A practical VA workflow"},
    {"type":"steps","items":[
      "Confirm whether the new job should begin as Quote or Work Order under the client's process.",
      "Use a Queue only when the job is genuinely waiting for a defined item such as customer response, parts, approval, site access, or scheduling.",
      "Keep the core status aligned with the real job lifecycle rather than forcing it to represent every internal sub-stage.",
      "Remove or update queue placement when the waiting condition changes.",
      "Do not mark a Work Order Completed until the client's completion criteria are met.",
      "Do not mark a job Unsuccessful merely to clear it from the screen if the customer decision or cancellation is unresolved.",
      "Record the next action, owner, and evidence in the job record or approved task workflow."
    ]},
    {"type":"callout","title":"Status is operational truth","text":"Do not use Completed, Unsuccessful, or a Queue as a cleanup shortcut. The job card should tell the next office or field person what is actually true about the work."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Trying to create custom job statuses instead of using Queues correctly",
      "Leaving scheduled or completed work in an old waiting Queue",
      "Marking a job Completed because the booking time ended",
      "Marking an unaccepted quote Unsuccessful before the approved follow-up process is finished",
      "Treating broad ServiceM8 permission as authority to change commercial or technical state"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A quote has been sent and the customer has asked one question. Another job is approved but waiting for a special-order part. A third job finished on site but the technician says a return visit is needed. Assign the appropriate core status, Queue or waiting condition, and next action for each without using status as a filing shortcut."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use the four core statuses as designed.",
      "Use Queues for genuine waiting conditions.",
      "Keep status aligned with real work.",
      "Permission is not business authority."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'servicem8-job-lifecycle-and-va-role'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'Scheduling, Dispatch Board, Booking Links, and Smart Suggestions',
  summary = 'Schedule the right person for the right job by combining job requirements, staff capability, geography, travel, existing commitments, customer availability, and current ServiceM8 scheduling tools.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Use the Dispatch Board and job card as one scheduling workflow",
      "Evaluate smart or suggested booking times instead of accepting them blindly",
      "Coordinate booking links, reminders, external-calendar conflicts, and reschedules cleanly"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ServiceM8 scheduling can combine staff calendars, job bookings, external calendar busy time, booking links, and current smart scheduling features. The software can reduce back-and-forth, but it does not replace the business's rules about technician capability, service area, emergency priority, travel feasibility, access, or customer promises."},
    {"type":"heading","text":"A practical scheduling workflow"},
    {"type":"steps","items":[
      "Confirm the job status, job type, site, required capability, expected duration, urgency, and access constraints.",
      "Review the Dispatch Board and any imported external-calendar busy time.",
      "Evaluate suggested or available times against travel, preceding and following jobs, breaks, service-area rules, and technician capability.",
      "Use an SMS booking link only when the client's workflow allows the customer to choose from the presented availability.",
      "Once a booking is confirmed, make sure the job card contains the field information the assigned staff member needs.",
      "When the booking changes, update the ServiceM8 booking first and synchronise the customer and staff communication.",
      "Record unresolved scheduling exceptions rather than forcing the nearest open slot."
    ]},
    {"type":"callout","title":"Available is not automatically suitable","text":"A time can look open in the schedule and still be wrong because of travel, skills, job duration, access, emergency priority, external calendar commitments, or customer-specific constraints."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Accepting the first suggested booking time without checking travel",
      "Ignoring external-calendar busy blocks",
      "Assigning a technician without the required skill or business approval",
      "Using a booking link for work that needs office triage first",
      "Changing a booking without updating the customer",
      "Treating the calendar event as proof the customer agreed"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"ServiceM8 shows an apparently open 2:00 PM slot. The technician has an external calendar block ending at 1:30 PM, the prior ServiceM8 job is 35 minutes away, and the new job normally needs two hours. Explain whether you confirm, offer a different time, or escalate, and what you record."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Check capability, duration, geography, and travel.",
      "Treat suggestions as inputs.",
      "Synchronise customer and staff changes.",
      "Keep the job card current."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'scheduling-jobs-and-using-the-dispatch-view'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'Quotes, Options, Online Acceptance, and Follow-Up',
  summary = 'Prepare quotes from approved inputs, track customer questions and online acceptance, and understand how quote acceptance and follow-up automation affect job status.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare and send approved ServiceM8 quotes and quote options",
      "Distinguish customer questions from acceptance",
      "Understand how online acceptance and quote-follow-up automation interact with job status"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Current ServiceM8 quoting supports preset labour and materials, Bundles, multiple Quote Options, proposals, online quote viewing, customer questions, and online acceptance. When a quote is accepted online, ServiceM8 can move the job from Quote to Work Order. Quote Follow Up automation can also send scheduled email or SMS reminders and can optionally move old unaccepted quotes to Unsuccessful under configured rules."},
    {"type":"heading","text":"A practical quote workflow"},
    {"type":"steps","items":[
      "Confirm the technical scope, price inputs, labour, materials, Bundles, options, warranty wording, and approval owner.",
      "Build or QA the draft quote against those approved inputs.",
      "Send the quote through the approved ServiceM8 contact and channel.",
      "Watch the job Diary and quote state for questions, replies, resends, acceptance, or automation activity.",
      "Treat a question as a question, not as acceptance.",
      "After confirmed online or authorised acceptance, verify the job state and create the scheduling or next-work action.",
      "If quote follow-up automation is active, confirm scheduled messages are still appropriate before sending a manual follow-up."
    ]},
    {"type":"callout","title":"Acceptance changes the workflow","text":"Online quote acceptance can change a job to Work Order. Do not keep chasing an accepted quote, and do not manually force a job into Work Order when the business's acceptance or deposit rule has not been satisfied."},
    {"type":"heading","text":"Automation behaviour worth knowing"},
    {"type":"list","items":[
      "Quote follow-ups can be sent by email, SMS, or both.",
      "Scheduled quote follow-ups can stop when the customer accepts online, the job status changes, or certain customer replies require attention.",
      "Configured automation may move old unaccepted quotes to Unsuccessful, but jobs with outstanding replies or other conditions may be treated differently.",
      "The job Diary is the place to review scheduled automation activity and customer responses."
    ]},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Changing scope or margin without approval",
      "Sending the wrong quote version",
      "Treating a customer question as acceptance",
      "Manually following up while an automation is already scheduled",
      "Continuing quote reminders after online acceptance",
      "Scheduling work before the client's acceptance/deposit rule is met"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A customer replies to an automated quote follow-up asking whether one option can exclude a component. The quote remains unaccepted. Explain the job status, automation check, admin response, pricing handoff, and what must happen before scheduling."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use approved commercial inputs.",
      "Track questions and acceptance separately.",
      "Check automation before manual follow-up.",
      "Move the next action from verified status."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'quotes-options-acceptance-and-follow-up'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'Job Completion, Checklists, Forms, Photos, and Return Work',
  summary = 'Use job evidence, checklist completion, Forms, photos, signatures, technician notes, and return-work requirements to decide the administrative next step without assuming a scheduled visit means the job is complete.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Review completion evidence in the job card and Diary",
      "Use checklists and Forms as structured evidence rather than decorative paperwork",
      "Keep incomplete work and return visits visible before invoicing"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ServiceM8 checklists can assign required tasks, reminders, photo requirements, Forms, and asset-related requirements. Completion of checklist items is recorded against staff and time in the job Diary. ServiceM8 Forms can capture structured answers, photos, signatures, inspection or compliance information and save completed PDFs back to the job Diary. This gives the office a stronger evidence trail than simply assuming a job is finished because the booking ended."},
    {"type":"heading","text":"A practical completion workflow"},
    {"type":"steps","items":[
      "Review the technician's latest notes and job status.",
      "Check required checklist items and identify any incomplete tasks.",
      "Confirm required photos, signatures, Forms, inspection records, or customer approvals are present where the client's workflow requires them.",
      "Read the evidence for return-visit, parts, variation, access, safety, or customer issues.",
      "Create a return booking or waiting Queue/task when additional work is required.",
      "Send only approved factual customer updates based on technician evidence.",
      "Move the job to Completed only when the client's physical-work completion criteria are satisfied."
    ]},
    {"type":"callout","title":"Checklist complete does not equal every decision complete","text":"A checklist can prove required tasks were marked complete, but the VA should still inspect the job context for return work, customer questions, variations, missing technical evidence, or another reason the job is not ready for Completed status or invoicing."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Marking Completed when the diary says a return visit is required",
      "Ignoring an incomplete mandatory Form or photo task",
      "Rewriting sparse technician notes into a technical conclusion",
      "Sending a compliance claim based only on a checkbox",
      "Failing to create the next booking for return work",
      "Moving to invoicing while scope or variation issues remain unresolved"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The technician has marked most checklist items complete and uploaded photos, but one required Form is missing and the Diary says 'return with replacement part'. Explain the status, Queue/task, customer update, and invoicing decision."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use checklists and Forms as evidence.",
      "Read the Diary before changing status.",
      "Keep return work visible.",
      "Separate physical completion from administrative closure."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'job-completion-forms-photos-and-follow-up'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'Invoices, Payments, Live Statements, and Accounting Handoff',
  summary = 'Move genuinely completed work into invoicing, monitor payment evidence, use statements and payment reminders correctly, and keep accounting-integration exceptions visible for finance review.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare and send invoices only after the job is ready",
      "Use payment status, Live Statements, and payment-follow-up automation without chasing already-paid customers",
      "Keep ServiceM8 and accounting-system exceptions visible rather than forcing them to match"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ServiceM8 can generate and send invoices, accept payments, provide Live Statements for outstanding invoices, and connect with accounting systems. Current ServiceM8 guidance recommends updating a job to Completed before generating the invoice. Payment Follow Up automation can send email or SMS reminders before or after the due date, and scheduled reminders are cancelled when full payment is received before send time."},
    {"type":"heading","text":"A practical billing workflow"},
    {"type":"steps","items":[
      "Verify the job is genuinely ready for Completed status and invoicing.",
      "Check approved labour, materials, Bundles, variations, customer details, purchase references, and other billing inputs.",
      "Route GST, account coding, write-off, credit, or reconciliation judgment to the authorised finance owner.",
      "Generate and send the invoice if the VA has authority.",
      "Monitor ServiceM8 payment status and the job Diary.",
      "Before manual chasing, check whether payment follow-up automation or a Live Statement already covers the next contact.",
      "If ServiceM8 and the accounting system disagree, preserve both records and create a finance exception instead of forcing one side to match."
    ]},
    {"type":"callout","title":"Payment evidence beats assumption","text":"Do not mark an invoice paid because a customer says they transferred funds or because a similar bank amount appears elsewhere. Use the client's approved payment/reconciliation evidence and escalate mismatches."},
    {"type":"heading","text":"Payment automation behaviour worth knowing"},
    {"type":"list","items":[
      "Payment follow-ups can be scheduled before or after the invoice due date.",
      "The due-date calculation can depend on the Completed date or the first PDF invoice date under current ServiceM8 behaviour.",
      "Scheduled payment follow-ups stop when full payment is received before the send time.",
      "Customer replies can pause or change automation flow and should be reviewed rather than ignored."
    ]},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Generating the invoice while field work or a return visit is unresolved",
      "Manually sending a payment reminder while an automated reminder is about to send",
      "Chasing an invoice already paid through another channel",
      "Changing GST or finance coding to make the sync pass",
      "Creating an unauthorised credit or write-off",
      "Closing a ServiceM8/accounting mismatch without finance review"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"ServiceM8 shows an invoice outstanding. The customer says they paid yesterday, the accounting system shows a similar unmatched bank receipt, and an automated payment reminder is due this afternoon. Explain the checks, automation action, customer communication, and finance handoff."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Complete before invoicing.",
      "Check automation before manual chasing.",
      "Use evidence for payment status.",
      "Escalate accounting mismatches."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'invoices-payments-statements-and-accounting-handoff'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'Automation, Booking Reminders, Quote Follow-Up, Payment Follow-Up, and QA',
  summary = 'Configure and monitor ServiceM8 customer communications as controlled workflows with explicit triggers, contact requirements, pause/cancellation conditions, and human exception handling.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Map the trigger, audience, timing, template, and stop condition for each automation",
      "Understand current booking reminder, quote follow-up, and payment follow-up behaviour",
      "Audit scheduled messages in the job Diary before they become customer-service mistakes"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ServiceM8's Automation add-on supports routine client and staff communications. Current official help material documents multiple automations, including booking reminders, quote follow-up, and payment follow-up. These workflows depend on job contacts, job status, badges or configuration, replies, acceptance, payment state, and scheduled messages recorded in the job Diary."},
    {"type":"heading","text":"A practical automation QA workflow"},
    {"type":"steps","items":[
      "Document the automation purpose and exact trigger.",
      "Confirm which contact receives the message and whether the required email or mobile number is stored on the job.",
      "Review the message template, variables, timing, and channel.",
      "Document stop or pause conditions such as customer reply, quote acceptance, status change, full payment, manual cancellation, or missing contact data.",
      "Test the automation using the client's approved test method.",
      "Review scheduled messages in the job Diary during launch and after material workflow changes.",
      "Create an exception process for complaints, reschedules, disputes, payment mismatches, unusual quotes, or other cases where automation should not blindly continue."
    ]},
    {"type":"callout","title":"Automation follows data and rules, not common sense","text":"If status, contact, payment, booking, or quote data is wrong, automation can send a perfectly configured message at exactly the wrong time. Fix the source condition and review the customer impact instead of blaming the template."},
    {"type":"heading","text":"Current examples"},
    {"type":"list","items":[
      "Booking reminders can be configured before scheduled bookings and depend on the job contact and the relevant reminder setup.",
      "Quote follow-up can send scheduled email or SMS and stops or changes under conditions such as online acceptance, status changes, replies, or manual cancellation.",
      "Payment follow-up can send reminders before or after due date and cancels scheduled messages when full payment is received before send time.",
      "Scheduled automation activity can be reviewed from the job Diary."
    ]},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Turning automation on without defining the exception path",
      "Sending duplicate manual and automated reminders",
      "Ignoring a customer reply that should pause the sequence",
      "Leaving an accepted quote in a follow-up workflow",
      "Letting payment reminders continue through a reconciliation dispute",
      "Never sampling real customer-facing outputs after launch"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"One accepted quote still has a manual follow-up task, one customer has replied to a quote automation with a question, and one paid-by-bank-transfer customer still has a payment reminder scheduled because reconciliation is delayed. Build the QA and exception actions for all three."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Know the trigger and stop condition.",
      "Check the actual job contact.",
      "Use the Diary to inspect scheduled activity.",
      "Keep humans in the exception path."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'automation-reminders-and-servicem8-workflow-qa'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'ServiceM8 Composite VA Simulation',
  summary = 'Run a realistic trade-service operations queue across job statuses, Queues, scheduling, quote acceptance, completion evidence, invoicing, accounting exceptions, and automation QA.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You support a fictional Australian electrical and plumbing business in ServiceM8. The morning queue contains a duplicate client, an unscheduled urgent job, a quote with a customer reply, an accepted quote, a technician return visit, a missing Form, an invoice/payment mismatch, and an automation message that should not send. Your job is to keep the system aligned with real operational state."},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A corrected job-status and Queue table using Quote, Work Order, Completed, and Unsuccessful correctly",
      "A client/job-card cleanup note for the duplicate record",
      "A dispatch decision with staff, travel, duration, access, and customer communication",
      "A quote follow-up decision distinguishing question, acceptance, and next action",
      "A completion-evidence checklist using Diary notes, photos, checklist/Form status, and return-work requirements",
      "An invoice/payment exception handoff",
      "An automation audit showing trigger, scheduled message, stop condition, and exception owner",
      "A concise end-of-day handoff with unresolved technical, pricing, finance, safety, or customer decisions"
    ]},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Core job status must reflect actual lifecycle state.",
      "Queues must represent genuine waiting conditions, not permanent custom stages.",
      "Scheduling decisions must account for capability, duration, travel, access, and customer confirmation.",
      "Quote and payment automation must respond to replies, acceptance, status, and payment evidence.",
      "Completed status and invoicing require real completion evidence rather than elapsed calendar time.",
      "The learner must not invent technical conclusions, pricing approvals, tax treatment, payment write-offs, or safety decisions."
    ]},
    {"type":"scenario","title":"Final challenge","text":"At 8:00 AM you find: Job A is a Quote with a customer question and an automated follow-up scheduled; Job B was accepted online but is still in an old waiting Queue; Job C is scheduled with a technician who cannot realistically travel from the prior booking; Job D has photos but a missing Form and a return-part note; Job E has an unpaid ServiceM8 invoice, a matching-looking bank receipt in accounting, and a reminder due later today. Work the queue and produce the exact system changes, messages, holds, and handoffs."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'servicem8-composite-va-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'servicem8-for-virtual-assistants'
    )
  );

update public.training_assessments assessment
set
  instructions = 'Complete the ServiceM8 operations simulation using the supplied fictional evidence. Produce a corrected core-status and Queue table, client/job-card cleanup note, dispatch plan, quote follow-up decision, completion-evidence checklist, invoice/payment exception handoff, automation audit, and end-of-day owner handoff. Use Quote, Work Order, Completed, and Unsuccessful according to the actual job lifecycle, and use Queues only for genuine waiting conditions. Do not invent technical conclusions, pricing approvals, tax treatment, payment write-offs, safety decisions, or customer acceptance.',
  rubric = $$[
    {"id":"status","label":"Job status and Queue accuracy","weight":20,"description":"Uses the four fixed ServiceM8 statuses correctly, distinguishes Queues from core status, and keeps system state aligned with actual work."},
    {"id":"dispatch","label":"Scheduling and dispatch judgment","weight":15,"description":"Accounts for staff capability, travel, duration, access, existing bookings, and customer communication before confirming work."},
    {"id":"execution","label":"Quote-to-invoice workflow execution","weight":20,"description":"Produces usable job-card, quote, completion, invoice, payment, and follow-up outputs rather than generic descriptions."},
    {"id":"evidence","label":"Completion and payment evidence","weight":15,"description":"Uses Diary notes, checklist/Form state, photos, return-work notes, invoice status, and payment evidence before closing or chasing."},
    {"id":"boundaries","label":"Technical, commercial, finance, and safety boundaries","weight":20,"description":"Does not invent technical findings, pricing changes, tax treatment, write-offs, safety decisions, or acceptance, and routes judgment to the correct owner.","hard_fail":true},
    {"id":"automation","label":"Automation QA and handoff","weight":10,"description":"Identifies trigger, contact, scheduled message, stop condition, exception owner, and duplicate/manual follow-up risk."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"jobs","title":"ServiceM8 morning queue","kind":"csv","content":"job,current_status,queue_or_state,issue\nA,Quote,Quote follow-up,Customer replied with pricing question; automation scheduled\nB,Quote,Waiting for customer,Quote accepted online last night\nC,Work Order,Scheduled 14:00,Assigned technician finishes prior job 35 minutes away at 13:45\nD,Work Order,On site completed visit,Photos present; required Form missing; diary says return with part\nE,Completed,Invoice outstanding,Accounting shows similar unmatched bank receipt; payment reminder scheduled"},
    {"id":"client","title":"Client and dispatch notes","kind":"document","content":"Client record for Job A appears duplicated under two spellings.\nJob C normally requires a two-hour booking and restricted-site access.\nJob D customer has not been told a return visit is required.\nJob E customer says they paid yesterday by bank transfer."},
    {"id":"automation","title":"Automation rules extract","kind":"policy","content":"Quote follow-up is enabled by email and SMS. Staff must inspect customer replies before further contact. Payment reminders are enabled. Manual follow-up should not duplicate a scheduled automation. Full payment evidence or an active payment/reconciliation exception must be checked before further chasing."},
    {"id":"authority","title":"ServiceM8 VA authority matrix","kind":"policy","content":"VA may maintain client/job records, schedule within approved rules, send approved communications, prepare approved quotes/invoices, manage Queues, check completion evidence, and audit automation. Technical diagnosis, scope changes, pricing/margin changes, trade compliance, safety decisions, GST/accounting judgment, credits/write-offs, and disputed payment decisions stay with authorised field, commercial, or finance owners."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'servicem8-for-virtual-assistants';

update public.training_courses
set
  summary = 'Practical ServiceM8 workflow training for VAs supporting Australian trade and service businesses, covering fixed job statuses, Queues, client/job records, scheduling and dispatch, quote acceptance, completion evidence, invoicing, payments, automation QA, and accounting handoff.',
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'servicem8-for-virtual-assistants';
