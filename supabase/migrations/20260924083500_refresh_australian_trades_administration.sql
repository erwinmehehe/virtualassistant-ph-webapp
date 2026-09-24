-- Refresh Australian Trades Administration around the complete operational
-- workflow used by trade and field-service businesses. The course remains
-- software-neutral: ServiceM8 and Xero/MYOB teach product execution separately.

update public.training_lessons
set
  title = 'From Customer Enquiry to Paid Job',
  summary = 'Run the office workflow from first enquiry through triage, booking, quote, field work, completion, invoice, payment and follow-up while keeping every next action and owner visible.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Map the complete trade-service job lifecycle",
      "Keep customer, field, quote, supplier and finance stages connected",
      "Recognise which decisions stay with technicians, estimators, owners or finance staff"
    ]},
    {"type":"heading","text":"The operating model"},
    {"type":"paragraph","text":"A strong trade-business VA does not merely answer messages. The role is to prevent work from disappearing between enquiry, booking, quote approval, technician attendance, return work, invoicing and payment. The source system may be ServiceM8, simPRO, Tradify, AroFlo or another platform, but the operational logic is similar."},
    {"type":"heading","text":"The end-to-end workflow"},
    {"type":"steps","items":[
      "Enquiry: capture customer, site, contact, reported problem, photos, access details, preferred timing and referral source.",
      "Triage: apply the client's approved service-area, job-type, urgency and safety rules; escalate anything outside the matrix.",
      "Booking: match an authorised technician or crew to location, capability, duration, travel and access constraints.",
      "Quote: prepare or track the approved scope and price without changing technical assumptions or commercial terms.",
      "Quote follow-up: track sent, viewed, questioned, accepted, declined and expired states and stop stale follow-up when status changes.",
      "Field work: monitor attendance, notes, photos, Forms/checklists, variations, parts, customer questions and return visits.",
      "Completion: confirm the business's evidence threshold rather than assuming the booking ending means the job is done.",
      "Invoice: prepare billing only from approved scope, labour, materials and completion evidence.",
      "Payment: check payment evidence before reminders and route reconciliation exceptions to finance.",
      "Review and handoff: request an honest review only when the job is genuinely resolved, then finish with every open item assigned to an owner and next action."
    ]},
    {"type":"callout","title":"The VA owns flow, not every decision","text":"You can own the queue, follow-up, evidence, customer updates and handoffs without becoming the licensed trade professional, estimator, finance owner or business owner."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Capturing the enquiry but not creating a next action",
      "Booking before checking service area or technician capability",
      "Treating a customer description as a technical diagnosis",
      "Losing accepted quotes before scheduling",
      "Closing a job while parts or return work remain open",
      "Waiting days to invoice a truly completed job",
      "Sending a review request while a complaint or unresolved issue is still active"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A new leak enquiry arrives while another customer accepts yesterday's quote, a technician reports return work is needed on a third job, and a fourth completed job has not been invoiced. Build the priority order, next action and owner for each."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Every job needs a current state.",
      "Every open item needs a next action.",
      "Every exception needs an owner.",
      "Keep software state aligned with real work."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'from-customer-enquiry-to-completed-job'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Emergency, Urgent, and Routine Enquiry Triage',
  summary = 'Use a client-approved triage matrix to recognise high-consequence customer wording, route emergencies immediately and avoid turning office triage into a technical diagnosis.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Separate emergency, urgent, routine and information-needed enquiries",
      "Use exact customer wording and approved trigger phrases",
      "Escalate electrical, gas, water, fire, injury and other serious-risk reports without diagnosing them"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Trade-service enquiries can include conditions with serious safety consequences. Safe Work Australia notes that electrical risks can include shock, burns and fire and that wet surroundings can increase risk. A VA should not decide whether a reported condition is technically safe. The admin job is to identify the business's escalation triggers, preserve the customer's exact words and move the report to the right qualified person quickly."},
    {"type":"heading","text":"A practical triage workflow"},
    {"type":"steps","items":[
      "Capture the caller's exact description, location, who is present and whether there is an immediate danger report.",
      "Ask only the approved factual triage questions from the client's script.",
      "Match the report to the client's emergency, urgent, routine or information-needed matrix.",
      "For an emergency trigger, follow the immediate escalation path before routine scheduling or quoting.",
      "For urgent work, identify the approved on-call or priority dispatch process.",
      "For routine work, create the normal job and booking/quote next action.",
      "If the wording does not fit the matrix, escalate rather than improvising a technical category."
    ]},
    {"type":"callout","title":"Escalate risk, do not diagnose it","text":"Do not tell a customer that exposed wiring, a gas smell, flooding near electrical equipment, structural damage, a hot switchboard, smoke, sparking or another reported condition is safe. Follow the business's emergency instructions and qualified-person handoff."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Downgrading a serious report because the schedule is full",
      "Using your own technical judgement instead of the triage matrix",
      "Telling a customer to perform a technical test that is not in the approved script",
      "Booking the first available technician without checking the on-call process",
      "Replacing the customer's wording with a guessed diagnosis",
      "Failing to timestamp the escalation"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"One caller reports a slow tap leak. Another says water is entering the ceiling beside a light fitting. A third says their breaker has tripped twice but there is no smoke, heat or smell. Show the information you capture, the approved-path decision you make, and which items require immediate qualified review."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use the client's matrix.",
      "Preserve exact customer wording.",
      "Escalate serious-risk triggers immediately.",
      "Do not turn office triage into technical advice."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'emergency-urgent-and-routine-job-triage'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Scheduling Technicians, Travel, Service Areas, and Job Windows',
  summary = 'Build a dispatch plan that respects technician capability, service area, realistic travel, job duration, existing commitments, access constraints and customer promises.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Match jobs to the right technician or crew",
      "Avoid impossible travel and overbooking",
      "Keep customer promises aligned with the field schedule"
    ]},
    {"type":"heading","text":"A practical dispatch workflow"},
    {"type":"steps","items":[
      "Confirm the job type, approved urgency, suburb/site, access, parking or induction requirements, estimated duration and required capability.",
      "Check the technician's skills, licence/authorisation requirements defined by the business, current location and existing commitments.",
      "Apply the client's service-area and travel rules before offering a time.",
      "Add realistic travel and handover buffers instead of scheduling back-to-back by clock time alone.",
      "Check parts, equipment, permits, site contact or other prerequisites that could block attendance.",
      "Offer or confirm only a window the business can realistically meet.",
      "When the day changes, update the source schedule and affected customers together.",
      "Escalate jobs that cannot be served inside the promised window rather than hiding the conflict."
    ]},
    {"type":"callout","title":"An empty calendar slot is not capacity","text":"Capacity depends on the right person, right location, realistic travel, duration, access and prerequisites. Do not book purely because a time cell looks open."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Sending a plumbing-only technician to electrical work",
      "Ignoring cross-city travel",
      "Booking two long jobs into one short gap",
      "Promising exact arrival times when the client uses arrival windows",
      "Forgetting site induction or access requirements",
      "Rescheduling internally without telling the customer"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Tech A is plumbing-only and free until 3 PM. Tech B is electrical-only and free from 10:30 AM. A 90-minute electrical job is 35 minutes from Tech B's previous job, and the customer requests noon. Build the booking decision and customer message without overpromising."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Capability before availability.",
      "Travel is part of the schedule.",
      "Prerequisites can block attendance.",
      "Customer communication must match the real plan."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'scheduling-technicians-travel-and-job-windows'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Quote Administration, Variations, Acceptance, and Follow-Up',
  summary = 'Prepare clear quotes from approved inputs, preserve acceptance evidence, control revisions and variations, and keep negotiation or scope decisions with the authorised estimator or owner.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare a quote that clearly records approved scope and commercial terms",
      "Control quote versions, acceptance and variations",
      "Follow up without negotiating or changing the technical scope"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Australian Government business guidance recommends written quotes that clearly identify the business and customer, describe the work, itemise and total costs, include GST where applicable, record variations, payment terms, dates, expiry and customer acceptance. An accepted quote can form a binding agreement, so version control and evidence matter."},
    {"type":"heading","text":"A practical quote workflow"},
    {"type":"steps","items":[
      "Start from the authorised estimator or technician scope.",
      "Confirm customer/site details, job description, inclusions, exclusions, price inputs, GST treatment supplied by the approved finance process, payment terms, timing and quote expiry.",
      "Create a version identifier or preserve the system version history.",
      "Route technical uncertainty, discount, margin, warranty, exclusions and commercial exceptions to the authorised owner.",
      "Send the approved quote through the authorised channel and record evidence.",
      "Track customer questions separately from acceptance.",
      "When the scope changes, create a clear revision or variation path rather than silently editing the original accepted terms.",
      "After verified acceptance and any required deposit/approval rule, create the scheduling next action."
    ]},
    {"type":"callout","title":"Do not negotiate by accident","text":"A customer asking 'Can you do it cheaper if we remove this?' is not routine admin. Record the request and send it to the authorised estimator or owner. Do not invent a revised price, scope or warranty term."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Sending a quote before technical or commercial approval",
      "Editing an accepted quote without a clear variation trail",
      "Treating a customer question as acceptance",
      "Offering a discount to close the job",
      "Using an expired quote without review",
      "Scheduling before the client's acceptance or deposit rule is satisfied"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The customer accepts the plumbing portion of a combined quote but asks to remove the electrical work and wants a discount. Explain the version/variation record, the handoff to the estimator, and what must be confirmed before scheduling."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Quote from approved scope.",
      "Preserve versions.",
      "Separate questions from acceptance.",
      "Keep pricing and scope decisions authorised."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'quote-administration-and-follow-up'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Customer Updates, Delays, Complaints, Return Work, and Completion',
  summary = 'Keep customers informed using verified job evidence, route complaints and remedy decisions correctly, and distinguish completed field work from unresolved return visits or service issues.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Write useful delay, return-visit and completion updates",
      "Keep complaints and disputed outcomes visible",
      "Avoid making warranty or consumer-remedy promises that have not been authorised"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Australian Consumer Law gives consumers guarantees for many services, including due care and skill, fitness for disclosed purpose and reasonable time where no timeframe is agreed. The business may need to provide a remedy when a service fails to meet applicable guarantees. A VA should preserve the complaint, evidence and promised response time, while the authorised business owner or qualified person decides the technical cause and remedy."},
    {"type":"heading","text":"A practical customer-update workflow"},
    {"type":"steps","items":[
      "Read the technician notes, photos, Forms/checklists, quote/variation record and current job status before writing.",
      "State verified facts: attended, waiting on part, return visit required, quote variation pending, technician review required or job completed.",
      "Give only a timing or next step the business has actually approved.",
      "For complaints, preserve the customer's wording, desired outcome, photos/evidence and prior promises.",
      "Create a clear owner and response deadline for the complaint or remedy decision.",
      "Do not close the job or request a review while a return visit, complaint, safety concern or disputed scope remains open.",
      "When the authorised resolution is confirmed, record the outcome and update the customer."
    ]},
    {"type":"callout","title":"Admin can coordinate a remedy without deciding it","text":"Do not promise a refund, free rework, warranty coverage, fault admission or legal entitlement unless the authorised business process has approved that response."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Saying 'fixed' when the technician note only says 'tested'",
      "Promising tomorrow before the required part is available",
      "Deleting or softening a complaint note",
      "Sending a review request to a customer with unresolved return work",
      "Arguing with the customer about technical fault",
      "Closing the complaint because the technician attended"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A customer says the repaired leak returned the next day and asks for a refund. The technician has not yet reviewed the new report. Draft the acknowledgement, internal escalation and next-action record without admitting fault or rejecting the request."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Communicate from evidence.",
      "Keep complaints visible.",
      "Do not promise unapproved remedies.",
      "Resolve open service issues before review requests."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'customer-updates-delays-and-job-completion'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Supplier, Parts, Purchase, and Return-Visit Administration',
  summary = 'Keep blocked jobs alive by tracking approved part requirements, supplier quotes, purchase approval, lead times, pickup/delivery, job allocation and technician confirmation before rescheduling.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Track supplier and parts dependencies from request to job use",
      "Separate supplier quote, purchase approval, order placement and delivery",
      "Prevent blocked jobs from disappearing while everyone waits"
    ]},
    {"type":"heading","text":"A practical supplier workflow"},
    {"type":"steps","items":[
      "Record the requested part or material exactly from the authorised technical source.",
      "Link the requirement to the correct job and return-visit reason.",
      "Request or record approved supplier availability, price and lead time.",
      "Route purchase approval according to the client's spending threshold.",
      "Place the order only within delegated authority and record order/reference details.",
      "Track expected delivery, pickup, backorder or substitution request.",
      "Never accept a technical substitute without authorised technical approval.",
      "When the correct item is confirmed available, create the return-visit scheduling action.",
      "Attach supplier invoice or receipt to the correct job/finance workflow."
    ]},
    {"type":"callout","title":"The job is still open while the part is pending","text":"A waiting-on-parts job needs an owner, expected date and next follow-up. Do not remove it from operational visibility just because no technician can attend today."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Guessing the part from the customer description",
      "Ordering before spending approval",
      "Accepting a substitute without technician approval",
      "Losing the supplier quote or order number",
      "Promising the customer a date before supplier confirmation",
      "Receiving the part but forgetting to trigger the return visit"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A supplier cannot provide the specified component for five days but offers a cheaper alternative today. The customer is asking when the technician will return. Show the records you update, the decision you escalate and the customer timing message you can safely send."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Connect every purchase to a job.",
      "Track approval and delivery separately.",
      "Keep technical substitutions authorised.",
      "Turn part arrival into a next scheduling action."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'supplier-parts-and-purchase-administration'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Invoicing, Payment Follow-Up, Xero Handoff, and Review Requests',
  summary = 'Turn genuinely completed work into clean billing, keep ServiceM8/job-system and accounting status aligned, escalate GST/reconciliation exceptions, and request genuine reviews only after unresolved service issues are closed.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare invoices from approved job evidence",
      "Coordinate payment follow-up without duplicating or contradicting finance records",
      "Hand accounting exceptions into the Xero/MYOB workflow",
      "Request reviews without manipulating customer sentiment"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"The ATO requires invoices and records to contain the information needed for the business's GST and record-keeping obligations. A VA should use the client's approved invoice and GST process instead of deciding tax treatment. The ACCC also states that online reviews should be genuine and independent; fake or misleading reviews and manipulation of negative reviews can breach Australian Consumer Law."},
    {"type":"heading","text":"A practical closeout workflow"},
    {"type":"steps","items":[
      "Confirm the job meets the client's completion and invoicing criteria.",
      "Check customer details, approved scope, labour, materials, variations, purchase evidence and billing reference.",
      "Use only the client's approved GST and accounting coding rules; create an exception when treatment is unclear.",
      "Issue the invoice if authorised and record the system reference.",
      "Before payment follow-up, check the job system, accounting system and any known reconciliation exception.",
      "Send reminders only under the approved cadence and stop when payment or a dispute changes the workflow.",
      "For a resolved customer with no open complaint, return visit or dispute, send the approved neutral review request.",
      "Never write the review for the customer, suppress genuine negative feedback or offer an incentive that depends on a positive rating.",
      "Finish with finance/reconciliation exceptions handed to the Xero, MYOB, bookkeeper or finance-owner workflow."
    ]},
    {"type":"callout","title":"Review request is not review manipulation","text":"Ask for an honest review through the approved process. Do not pressure the customer for five stars, hide negative feedback, fabricate reviews or selectively offer incentives only for positive reviews."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Invoicing before return work or a variation is resolved",
      "Changing GST because a software suggestion looks plausible",
      "Chasing an invoice already paid but not reconciled",
      "Writing off an old balance to clean the dashboard",
      "Sending a five-star-only review request",
      "Requesting a review while a complaint is still open"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A completed job is ready to invoice, but one line has unclear GST treatment. A second customer says they paid yesterday but the bank receipt is unmatched. A third customer's job is fully resolved and they thanked the technician. Build the invoice exception, payment handoff and review action."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Invoice from evidence.",
      "Use approved finance rules.",
      "Check payment before chasing.",
      "Ask for genuine reviews only after resolution."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'invoicing-payment-follow-up-and-accounting-handoff'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_lessons
set
  title = 'Australian Tradie Operations Lead-to-Review Simulation',
  summary = 'Run Harbourline Electrical & Plumbing through a realistic day from new enquiry to safety escalation, dispatch, quote acceptance, parts delay, return work, invoicing, payment exception, customer complaint and honest review request.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You are the operations VA for Harbourline Electrical & Plumbing. The business uses ServiceM8 for jobs and Xero for accounting. You do not need to reproduce software-specific steps taught in those courses. Your job here is to manage the cross-system operational flow and hand the right exceptions to the right owner."},
    {"type":"heading","text":"Morning queue"},
    {"type":"list","items":[
      "New enquiry: active water leak, routine access available, no safety trigger reported.",
      "New enquiry: water reported near an electrical fitting; no technician has reviewed it yet.",
      "Quote A: customer asks whether removing an item will reduce the price.",
      "Quote B: customer accepted and paid the required deposit; no booking created yet.",
      "Job C: technician attended but needs a replacement part and return visit.",
      "Job D: field work complete; a material line is missing from the draft invoice.",
      "Invoice E: customer says they paid yesterday; accounting has an unmatched similar bank receipt.",
      "Complaint F: customer says yesterday's repair did not solve the issue.",
      "Job G: completed, paid, no return work or complaint, customer thanked the technician."
    ]},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A prioritised operating queue with reason, owner, next action and due time",
      "A safety escalation record for the high-consequence enquiry",
      "A realistic dispatch plan for accepted work",
      "A quote question/variation handoff",
      "A supplier and return-visit tracker",
      "A completion and invoice exception note",
      "A payment/reconciliation handoff to the Xero/finance workflow",
      "A complaint acknowledgement and owner assignment",
      "A review-request decision for every relevant customer",
      "A concise end-of-day handoff showing what is closed, waiting, blocked and escalating"
    ]},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Serious-risk wording is escalated before routine admin.",
      "No customer wording is converted into an invented diagnosis.",
      "Technician capability, travel, duration and access are checked before booking.",
      "Quote price, scope, variation and warranty decisions remain authorised.",
      "Blocked jobs keep an owner and next follow-up.",
      "No job is invoiced from calendar time alone.",
      "Payment reminders use current evidence and finance exceptions stay visible.",
      "Complaints remain open until authorised resolution.",
      "Only resolved customers receive a neutral, honest review request.",
      "Every unfinished item has a named owner and next action."
    ]},
    {"type":"scenario","title":"Final challenge","text":"Produce the 8:00 AM priority plan, the midday exception update and the end-of-day handoff for Harbourline. Your output should be usable by the owner, dispatcher, technicians and bookkeeper without them reconstructing what happened."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-trades-composite-work-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-trades-administration')
  );

update public.training_assessments assessment
set
  title = 'Australian Tradie Operations Lead-to-Review Final Simulation',
  instructions = 'Complete the Harbourline Electrical & Plumbing operations simulation. Produce a prioritised queue, safety escalation record, realistic dispatch plan, quote/variation handoff, supplier and return-visit tracker, completion and invoice exception, payment/reconciliation handoff, complaint acknowledgement, review-request decisions and end-of-day owner handoff. Use the supplied evidence only. Do not diagnose technical faults, decide whether regulated work is safe or compliant, change quote scope or price, approve an unauthorised purchase, decide GST/accounting treatment, write off debt, promise a consumer-law remedy, or manipulate customer reviews.',
  rubric = $$[
    {"id":"triage","label":"Triage and safety escalation","weight":20,"description":"Prioritises serious-risk reports correctly, preserves customer wording and uses the approved escalation path without technical diagnosis.","hard_fail":true},
    {"id":"dispatch","label":"Dispatch and job-flow control","weight":15,"description":"Uses technician capability, service area, duration, travel, access and prerequisites to create realistic next actions."},
    {"id":"commercial","label":"Quote, variation and supplier administration","weight":15,"description":"Preserves approved quote scope and versions, tracks acceptance and supplier dependencies, and escalates pricing, substitution and spend decisions."},
    {"id":"completion","label":"Completion, complaint and customer evidence","weight":15,"description":"Uses technician evidence, return-work state and complaint status before closing work, invoicing or requesting reviews."},
    {"id":"finance","label":"Invoice, payment and accounting handoff","weight":15,"description":"Builds billing from approved evidence, checks payment status and routes GST, coding, write-off and reconciliation exceptions correctly."},
    {"id":"review","label":"Review-request integrity","weight":10,"description":"Requests only genuine neutral reviews after resolution and avoids pressure, fabrication, suppression or positive-review-only incentives."},
    {"id":"handoff","label":"Operational handoff quality","weight":10,"description":"Leaves every unfinished item with a clear owner, blocker, next action and timing."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"queue","title":"Harbourline morning operations queue","kind":"csv","content":"item,type,status,issue\nJ101,Enquiry,New,Active water leak; routine access available\nJ102,Enquiry,New,Water reported beside electrical fitting\nQ201,Quote,Question,Customer asks whether removing one item reduces price\nQ202,Quote,Accepted,Deposit confirmed; not yet booked\nJ301,Field work,Return required,Replacement part needed\nJ302,Completion,Invoice prep,Material line missing from draft invoice\nI401,Payment,Exception,Customer says paid; similar unmatched bank receipt\nC501,Complaint,Open,Customer says yesterday's repair did not solve issue\nJ303,Completed,Resolved,Paid; no complaint or return work; customer thanked technician"},
    {"id":"dispatch","title":"Technician and operating constraints","kind":"document","content":"Tech A: plumbing only, 09:00-15:00. Tech B: electrical only, 10:30-17:00. Tech C: mixed maintenance, fully booked. Service area: metro only unless owner approves. Add realistic travel between jobs. Safety-sensitive reports use the client's immediate escalation path. Parts substitutions require technician approval. Purchases above delegated limit require owner approval."},
    {"id":"service","title":"Customer and commercial rules","kind":"policy","content":"VA may capture enquiries, apply the approved triage matrix, schedule within dispatch rules, prepare approved quotes, track acceptance, coordinate suppliers, send factual updates, prepare approved invoice data, follow payment policy and request neutral honest reviews after resolution. VA may not diagnose faults, determine trade compliance/safety, alter scope or price, promise a consumer-law remedy, approve spending beyond delegation, decide GST/accounting treatment or manipulate reviews."},
    {"id":"systems","title":"Cross-system handoff rule","kind":"policy","content":"ServiceM8 is the operational job source of truth. Xero is the finance workflow for approved accounting records. The Trades course tests the cross-system handoff. Software-specific button execution belongs in the ServiceM8 and Xero/MYOB courses."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'australian-trades-administration';

update public.training_courses
set
  summary = 'Operations training for Filipino VAs supporting Australian tradies and field-service businesses across enquiry triage, dispatch, quotes and variations, field completion, supplier/parts dependencies, invoicing, payment, complaints, customer reviews and ServiceM8-to-Xero handoffs.',
  estimated_minutes = 240,
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-trades-administration';
