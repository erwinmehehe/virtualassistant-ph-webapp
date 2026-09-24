-- Final cleanup of Australian VA Fundamentals.
-- Keep the course at roughly 3.5 hours, remove repeated specialist content,
-- and make it the operating foundation for the Australian learning paths.

update public.training_lessons
set
  title = 'How Australian Small Businesses Work With VAs',
  summary = 'Learn how Australian SMEs delegate work, define authority, use source-of-truth systems and expect VAs to own routine execution without taking over specialist decisions.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: understand the business before touching the workflow"},
    {"type":"list","items":[
      "Map the client’s business model, customers, team and decision owners",
      "Separate routine VA ownership from approvals and specialist judgment",
      "Identify the source-of-truth system for each type of work"
    ]},
    {"type":"heading","text":"What good Australian VA support looks like"},
    {"type":"paragraph","text":"Australian clients can be solo operators, tradies, clinics, agencies, property businesses, e-commerce teams or professional services firms. The industry changes, but the operating standard is consistent: know who owns decisions, work from the correct system, complete routine tasks without unnecessary back-and-forth, and escalate exceptions with enough context for a fast decision."},
    {"type":"heading","text":"Build the client operating map"},
    {"type":"steps","items":[
      "List the business’s services, customers and recurring workflows.",
      "Identify who can approve pricing, refunds, payments, contracts, payroll, tax, clinical, legal, tenancy, credit or other specialist decisions.",
      "Identify the source of truth for contacts, inboxes, jobs/tasks, calendars, documents, billing and reporting.",
      "Write down what the VA can complete independently, what needs approval and what must go to a specialist.",
      "Define response-time expectations and the escalation channel for urgent exceptions.",
      "Define the handoff format so work does not live only in one person’s inbox or memory."
    ]},
    {"type":"heading","text":"Decision-rights exercise"},
    {"type":"list","items":[
      "Routine: perform under an existing SOP or approved rule.",
      "Approval: prepare the facts and wait for an authorised owner.",
      "Specialist: route to the qualified or regulated role.",
      "Emergency: use the client’s documented immediate escalation path."
    ]},
    {"type":"callout","title":"Own the workflow, not every decision","text":"A strong VA does not ask permission for every routine step, but also does not fill an authority gap with guesswork. Keep normal work moving and escalate the decisions that genuinely require someone else."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Assuming all Australian clients use the same process",
      "Waiting for approval on routine work already covered by an SOP",
      "Making a high-impact decision because the owner is offline",
      "Keeping important context in private notes",
      "Using software access as proof of decision authority"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A six-person Australian service business says, 'Please take care of admin while I’m on jobs.' Build the questions you need answered before taking ownership of inbox triage, bookings, quote follow-up, invoice reminders and supplier coordination."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Know the business model.",
      "Know the decision owners.",
      "Know the source systems.",
      "Know your routine, approval and specialist boundaries."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'how-australian-small-businesses-work-with-vas'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Australian Business Communication, Dates, and Everyday Admin Language',
  summary = 'Use clear Australian business conventions for dates, spelling, state abbreviations, customer messages and operational terminology without fake slang or unnecessary verbosity.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: communication that is easy to act on"},
    {"type":"list","items":[
      "Use Australian business conventions accurately",
      "Make dates, locations and requested actions unambiguous",
      "Write concise messages that sound natural without forced slang"
    ]},
    {"type":"heading","text":"Core conventions"},
    {"type":"list","items":[
      "Australian business dates commonly use day/month/year. When ambiguity matters, write the month in words, for example 4 October 2026.",
      "Use the client’s Australian English spelling and templates rather than automatically applying US wording.",
      "Know standard state and territory abbreviations: NSW, VIC, QLD, SA, WA, TAS, NT and ACT.",
      "Use formal business terms exactly when they matter. Do not casually rewrite tax, legal, healthcare, tenancy or contractual wording.",
      "Put the confirmed status, required action or decision near the top of the message."
    ]},
    {"type":"heading","text":"Useful admin vocabulary"},
    {"type":"list","items":[
      "ABN: Australian Business Number",
      "GST: Goods and Services Tax",
      "BAS: Business Activity Statement",
      "PAYG: Pay As You Go",
      "STP: Single Touch Payroll",
      "quote: proposed price/scope before accepted work",
      "tax invoice: GST invoice used by a GST-registered business",
      "receipt: evidence that payment occurred"
    ]},
    {"type":"heading","text":"Message workflow"},
    {"type":"steps","items":[
      "Read the complete history before replying.",
      "Lead with the confirmed status.",
      "State the next action, owner and timing.",
      "Ask only for information needed to progress the task.",
      "Use exact dates when relative wording such as 'tomorrow' could cross time zones.",
      "Keep formal wording unchanged unless the owner has authorised edits.",
      "Log the interaction and create the next task immediately."
    ]},
    {"type":"callout","title":"Do not perform Australianness","text":"Clear Australian business communication does not require 'mate', exaggerated local slang or copied phrases. Accuracy, brevity and context matter more."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Writing 03/04/2026 in a context where the reader may use another date convention",
      "Copying US templates without checking terminology",
      "Burying the requested action below a long greeting",
      "Changing approved policy or contract language because it sounds awkward",
      "Using vague phrases such as 'tomorrow morning' across locations"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A client asks you to confirm a meeting for 4/10/2026 and send a quote follow-up using an old US template. Show what you verify and how you make both messages unambiguous without rewriting the formal commercial terms."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Use client-approved terminology.",
      "Make dates explicit.",
      "Keep messages short and actionable.",
      "Preserve formal wording when meaning matters."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-business-language-dates-and-communication'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Australian Time Zones, Daylight Saving, and Calendar Reliability',
  summary = 'Coordinate Philippine and Australian schedules by city and date, not by memorised offsets, and build recurring calendars that survive daylight-saving changes.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: calendar work that stays correct when clocks change"},
    {"type":"list","items":[
      "Schedule across Australian cities and the Philippines safely",
      "Understand why 'Australia time' is not a valid operating assumption",
      "Protect recurring meetings and deadlines from daylight-saving mistakes"
    ]},
    {"type":"heading","text":"The operating rule"},
    {"type":"paragraph","text":"Australia uses multiple time zones and daylight saving is not uniform. For 2026, daylight saving begins in participating eastern/southern jurisdictions on Sunday 4 October 2026 and ends on Sunday 4 April 2027. Queensland does not currently observe daylight saving. South Australia observes daylight saving with its own central time zone. The reliable VA habit is to schedule from the city and actual date, not from a memorised Manila-to-Australia offset."},
    {"type":"heading","text":"Calendar workflow"},
    {"type":"steps","items":[
      "Store the client city and named time zone, not just 'Australia'.",
      "Check the attendee location for external meetings.",
      "Create the event in the correct time zone and let the calendar convert it.",
      "Use the actual meeting date when checking offsets.",
      "Recheck recurring meetings that cross the first Sunday in October or first Sunday in April.",
      "Apply client rules for buffers, lunch, travel and protected focus time.",
      "Write critical deadlines with date, time and time zone when ambiguity could affect the outcome."
    ]},
    {"type":"heading","text":"Practical location examples"},
    {"type":"list","items":[
      "Sydney and Melbourne observe daylight saving.",
      "Brisbane does not currently observe daylight saving.",
      "Perth operates on western time and does not use eastern-time assumptions.",
      "Adelaide uses central time and a half-hour offset relative to some eastern/western comparisons."
    ]},
    {"type":"callout","title":"Never hard-code a recurring offset","text":"A Manila-to-Sydney offset that is correct in September can be wrong in October. Use the calendar’s named time zones and verify the actual date."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Using Sydney time for Brisbane during daylight saving",
      "Creating the event in Manila time after manually converting it",
      "Ignoring daylight-saving transitions on recurring meetings",
      "Assuming all eastern Australian cities use the same clock year-round",
      "Using relative deadlines in cross-border handoffs"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A Sydney client, Brisbane supplier and Philippines VA need a recurring 10:00 AM Sydney meeting from September through December 2026. Show how you create the recurrence so the Sydney time stays correct and the Brisbane/Philippines participants receive the correct local time after 4 October."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Use city plus time zone.",
      "Check the actual date.",
      "Let calendar software do named-zone conversion.",
      "Recheck recurring meetings around DST changes."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-time-zones-daylight-saving-and-scheduling'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Australian Privacy, Data Minimisation, and Offshore VA Access',
  summary = 'Apply current Australian privacy-safe admin habits, including minimum-necessary collection, least-privilege access, approved systems, safe AI use and immediate incident escalation.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: handle Australian client data without unnecessary exposure"},
    {"type":"list","items":[
      "Recognise personal and sensitive information",
      "Apply minimum-necessary collection and least-privilege access",
      "Respond correctly to wrong-recipient, exposed-link or suspicious-access incidents"
    ]},
    {"type":"heading","text":"Current privacy context"},
    {"type":"paragraph","text":"The OAIC updated its APP 3 guidance on 13 May 2026 and reinforced proportionality and data minimisation. The practical admin principle is to collect and use only the personal information reasonably necessary for the task and the client’s approved workflow. A VA should not decide whether a particular organisation is legally covered by a specific Privacy Act provision; that interpretation belongs to the client’s privacy or legal owner."},
    {"type":"heading","text":"Privacy-safe admin workflow"},
    {"type":"steps","items":[
      "Identify the minimum information the task actually requires.",
      "Use the client’s named account and least-privilege access.",
      "Keep customer, patient, employee, financial and identity data inside approved systems.",
      "Do not move client data into personal email, personal cloud storage, screenshots or unapproved AI tools.",
      "Check recipient, attachment, sharing permission and link access before sending.",
      "Use only the minimum fields needed in exports and working files.",
      "If data is sent to the wrong person or exposed, stop further sharing, preserve the facts and escalate immediately.",
      "Do not silently delete evidence or independently decide whether formal notification is legally required."
    ]},
    {"type":"callout","title":"Minimum necessary is a workflow habit","text":"Do not export an entire customer list when the task needs five records. Do not copy full medical, financial or identity details into a note when the task needs only a status or reference number."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Using a personal email because it is faster",
      "Pasting sensitive client data into an AI tool without approval",
      "Creating public share links for convenience",
      "Downloading more data than the task requires",
      "Trying to quietly correct a privacy incident without reporting it"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"You need to summarise 40 customer complaints. The source file includes addresses, mobile numbers, payment references and medical details that are unrelated to the complaints. Show how you minimise the working data and where you perform the task."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Use only necessary data.",
      "Use approved systems.",
      "Use least-privilege access.",
      "Escalate incidents immediately."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-privacy-personal-information-and-offshore-va-access'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'ABN, GST, BAS, Invoices, Payroll, and Finance Terms for VAs',
  summary = 'Learn enough Australian finance vocabulary to recognise, route and organise finance-admin work without duplicating the Australian Bookkeeping, Xero or MYOB courses.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: understand the terms without pretending to be the reviewer"},
    {"type":"list","items":[
      "Recognise common Australian business and finance terms",
      "Understand what evidence commonly belongs with finance-admin work",
      "Know when the task should move into the Australian Bookkeeping, Xero or MYOB learning path"
    ]},
    {"type":"heading","text":"Core terminology"},
    {"type":"list","items":[
      "ABN identifies an Australian business for many business dealings.",
      "GST is a 10% tax on most goods and services sold in Australia, but whether a particular transaction has GST is not something this foundation course asks the VA to decide.",
      "A GST-registered business generally uses tax invoices for taxable sales; regular invoices are used differently by businesses not registered for GST.",
      "BAS is used to report taxes such as GST and PAYG withholding. BAS frequency and fields depend on the business.",
      "PAYG withholding relates to tax withheld from certain payments including employee wages.",
      "STP is the payroll reporting process used to report payroll information to the ATO.",
      "Super refers to employer superannuation obligations and payroll administration."
    ]},
    {"type":"heading","text":"Finance-admin workflow"},
    {"type":"steps","items":[
      "Identify the document or transaction type.",
      "Confirm the correct business/entity and source evidence.",
      "Check obvious completeness and duplicate risk.",
      "Attach the source evidence in the approved system.",
      "Use only coding or process rules the client has already approved for your role.",
      "Route GST, BAS, payroll, tax or accounting interpretation to the designated reviewer.",
      "Track the item until approval, payment, correction or handoff is confirmed."
    ]},
    {"type":"heading","text":"Where deeper learning belongs"},
    {"type":"list","items":[
      "Australian Bookkeeping Administration: Australian finance controls, GST/BAS-sensitive evidence, payroll/super handoffs and month-end review packs.",
      "Xero Workflows for Virtual Assistants: product-specific execution inside Xero.",
      "MYOB Workflows for Virtual Assistants: product-specific execution inside MYOB Business."
    ]},
    {"type":"callout","title":"Terminology is not authority","text":"Understanding ABN, GST, BAS, PAYG, STP and super helps you route work correctly. It does not authorise tax, BAS, accounting or payroll judgment."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Assuming every invoice includes GST",
      "Changing a tax code because another transaction looks similar",
      "Treating BAS as just another internal report",
      "Submitting tax or payroll declarations because the button is available",
      "Deleting source evidence after data entry"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A supplier invoice has an ABN and total amount but the GST treatment does not match prior invoices. Explain what the VA can check and organise, what should go to the finance reviewer, and which specialist course would teach the next level of workflow."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Recognise the vocabulary.",
      "Preserve evidence.",
      "Use only approved rules.",
      "Route interpretation."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'abn-gst-bas-invoices-and-finance-terminology-for-vas'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Australian Customer Service, Follow-Up, and Exception Escalation',
  summary = 'Run routine customer follow-up with clear facts, visible next actions and clean escalation for complaints, refunds, payment disputes, safety issues and decisions outside VA authority.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: customer communication that moves work forward"},
    {"type":"list","items":[
      "Give customers a confirmed status and next step",
      "Create follow-up tasks that do not depend on memory",
      "Recognise when a routine conversation has become an exception"
    ]},
    {"type":"heading","text":"Routine follow-up workflow"},
    {"type":"steps","items":[
      "Read the full customer history before responding.",
      "State the confirmed status first.",
      "Ask only for information needed to progress the task.",
      "Use the approved tone and template as a starting point, not as a substitute for reading the case.",
      "Create the next task, owner and follow-up time before closing the message.",
      "Record phone, SMS, email or chat interactions in the source system.",
      "Escalate complaints, refunds, payment plans, contract changes, safety concerns, legal threats or other exceptions with a clear decision request."
    ]},
    {"type":"heading","text":"Useful escalation format"},
    {"type":"list","items":[
      "What happened",
      "What the customer is asking for",
      "What the system/evidence currently shows",
      "What has already been communicated",
      "What decision is needed",
      "When the customer expects a response"
    ]},
    {"type":"callout","title":"Do not overpromise to sound helpful","text":"Do not promise a refund, discount, approval, arrival time, legal outcome, payment plan or technical result that the business has not authorised."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Sending a follow-up after the customer already replied",
      "Using generic empathy instead of solving the next step",
      "Promising 'today' with no confirmed capacity",
      "Leaving the next action only in your inbox",
      "Arguing with the customer about a disputed outcome"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A customer says, 'I’ve already called twice and nobody came.' The system shows one cancelled booking and no replacement appointment. Draft the structure of a useful reply and the internal escalation without promising a booking time that is not confirmed."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Read history first.",
      "Lead with facts.",
      "Create a visible next action.",
      "Escalate decisions, not routine admin."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-customer-service-and-administrative-follow-up'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Philippines-to-Australia Handoffs and End-of-Day Control',
  summary = 'Turn the Philippines/Australia time difference into reliable operational coverage using decision-focused handoffs, explicit deadlines, owners and first actions for the next shift.',
  estimated_minutes = 25,
  content = $$[
    {"type":"heading","text":"Outcome: the next person can continue without reconstructing your day"},
    {"type":"list","items":[
      "Write concise cross-border handoffs",
      "Separate routine completion from exceptions and decisions",
      "Make ownership and Australian-local deadlines obvious"
    ]},
    {"type":"heading","text":"Handoff structure"},
    {"type":"steps","items":[
      "Completed: list only material outcomes that the next person needs to know.",
      "Waiting: name the exact item, blocking person/system and expected next checkpoint.",
      "Decisions needed: give the facts and the specific question.",
      "Risk/deadline: state the date, time and relevant Australian time zone.",
      "Customer impact: flag anyone waiting for a response or promised update.",
      "Next owner: assign who acts next.",
      "Tomorrow first: queue the first actions before signing off."
    ]},
    {"type":"heading","text":"Good handoff example"},
    {"type":"paragraph","text":"Waiting: Quote Q-204, customer accepted scope but owner approval is still required for the requested discount. Owner: Sarah. Decision needed by 3:00 PM AEDT, 24 September 2026. Customer was told we would confirm today. Next action: Sarah approves or rejects discount, then VA sends approved response."},
    {"type":"callout","title":"A handoff is not a diary","text":"Do not list every email you sent. Prioritise unfinished work, decisions, deadlines and customer impact."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Writing 'waiting on client' with no item or date",
      "Listing 15 completed routine tasks before the urgent exception",
      "Using Manila time with no label",
      "Leaving a customer-facing deadline unowned",
      "Continuing outside agreed hours simply because the Australian client is still online"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"At 4:30 PM Philippines time you have one customer waiting on an Australian manager’s approval, one supplier who promised a callback, two routine completed tasks and a booking due to be confirmed by 3:00 PM Sydney time. Build the handoff order and next-owner fields."},
    {"type":"heading","text":"Ready check"},
    {"type":"list","items":[
      "Exceptions first.",
      "Absolute dates and named time zones.",
      "One owner per next action.",
      "Tomorrow’s first actions queued."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'daily-handoffs-between-the-philippines-and-australia'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_lessons
set
  title = 'Australian VA Fundamentals Mixed-Work Simulation',
  summary = 'Run a realistic Australian SME admin queue covering time zones, privacy, customer follow-up, finance terminology, evidence, decision rights and end-of-day handoff, then identify the correct specialist learning path for deeper work.',
  estimated_minutes = 35,
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You support a fictional Melbourne-based small-business group called Harbour Business Co. The queue includes customer, calendar, privacy, finance and handoff work. This is a foundation assessment: prove that you can move routine administration forward, recognise Australian context and route specialist work instead of trying to complete specialist workflows yourself."},
    {"type":"heading","text":"Morning queue"},
    {"type":"list","items":[
      "A Perth customer asks to move a meeting to '10 tomorrow' with no time zone stated.",
      "A Sydney recurring meeting crosses the 4 October 2026 daylight-saving change.",
      "A spreadsheet for complaint follow-up contains unnecessary identity and health information.",
      "A supplier invoice shows an ABN but has unclear GST treatment.",
      "A customer asks for a refund after a missed booking.",
      "A client asks you to submit a payroll-related declaration while they are offline.",
      "An overdue document request is blocking a routine task.",
      "The Melbourne manager needs a concise end-of-day handoff."
    ]},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A prioritised work queue with routine, approval and specialist labels",
      "A corrected time-zone/calendar action for the Perth and Sydney items",
      "A privacy-safe working-data plan",
      "A finance-admin evidence and escalation note",
      "A customer refund/complaint handoff",
      "A response to the payroll-declaration request",
      "A routine overdue-document follow-up",
      "An end-of-day Melbourne handoff",
      "A recommended next-course map for each specialist item"
    ]},
    {"type":"heading","text":"Specialist path map"},
    {"type":"list","items":[
      "Trades and field service: Australian Trades Administration, then ServiceM8 where relevant.",
      "Allied health: Australian Allied Health Administration, then Cliniko where relevant.",
      "Finance admin: Australian Bookkeeping Administration, then Xero or MYOB.",
      "NDIS provider administration: NDIS Administration Fundamentals.",
      "Property: Property Management Administration Australia.",
      "Mortgage: Mortgage Broking Administration Australia."
    ]},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Routine admin moves forward without unnecessary permission-seeking.",
      "Approval and specialist decisions are not guessed.",
      "Dates and time zones are explicit.",
      "Working data is minimised.",
      "Finance terms are used correctly without tax/accounting conclusions.",
      "Customer promises remain within confirmed authority.",
      "The handoff is decision-focused and usable."
    ]},
    {"type":"scenario","title":"Final challenge","text":"Produce Harbour Business Co’s 8:00 AM priority plan and 4:30 PM Philippines-time handoff. For every item, state what you completed, what you did not decide, who owns the next step, and which specialist path should handle deeper work."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-va-composite-work-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-va-fundamentals')
  );

update public.training_assessments assessment
set
  title = 'Australian VA Fundamentals Final Mixed-Work Simulation',
  instructions = 'Complete the Harbour Business Co mixed-work simulation. Submit a prioritised queue with routine/approval/specialist labels, time-zone/calendar corrections, privacy-safe working-data plan, finance-admin escalation note, customer refund/complaint handoff, payroll-declaration response, overdue-document follow-up, end-of-day Melbourne handoff and next-course map. Use only supplied evidence and approved rules. Do not make tax, BAS, payroll, privacy-law, legal, clinical, tenancy, credit, NDIS funding, trade-safety or other specialist decisions.',
  rubric = $$[
    {"id":"ownership","label":"Decision rights and workflow ownership","weight":20,"description":"Moves routine work forward, labels approval/specialist decisions correctly and keeps every open item assigned to an owner."},
    {"id":"time","label":"Australian time-zone and date accuracy","weight":15,"description":"Uses city/date-based scheduling, handles the daylight-saving transition correctly and makes deadlines unambiguous."},
    {"id":"privacy","label":"Privacy and data minimisation","weight":20,"description":"Uses only necessary information, keeps work in approved systems and escalates exposure or sensitive-data issues appropriately.","hard_fail":true},
    {"id":"communication","label":"Customer and business communication","weight":15,"description":"Writes concise factual updates, avoids unapproved promises and creates visible next actions."},
    {"id":"finance","label":"Australian finance terminology and escalation","weight":15,"description":"Recognises ABN/GST/BAS/payroll context, preserves evidence and routes interpretation instead of making tax/accounting conclusions."},
    {"id":"handoff","label":"Cross-border handoff and specialist routing","weight":15,"description":"Produces a decision-focused handoff and routes deeper work to the correct Australian specialist course."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"queue","title":"Harbour Business Co mixed-work queue","kind":"csv","content":"item,location,issue\nMeeting A,Perth,Customer asks for '10 tomorrow' with no time zone\nMeeting B,Sydney,Weekly 10:00 recurring meeting crosses 4 Oct 2026 DST start\nComplaints,VIC,Spreadsheet contains unnecessary identity and health data\nSupplier invoice,VIC,ABN present; GST treatment unclear\nCustomer refund,VIC,Missed booking; refund requested\nPayroll,VIC,Client asks VA to submit payroll-related declaration while owner offline\nDocument request,VIC,Required file overdue and blocking routine work\nHandoff,Melbourne,Manager wants end-of-day status"},
    {"id":"authority","title":"Foundation decision-rights matrix","kind":"policy","content":"VA may complete routine admin under approved SOPs, prepare evidence and draft communications. Refunds, tax/BAS/payroll declarations, legal/privacy interpretation, clinical decisions, tenancy decisions, credit advice, NDIS funding/compliance decisions and trade-safety judgments stay with the authorised owner or specialist."},
    {"id":"calendar","title":"2026 Australia scheduling reference","kind":"policy","content":"Use named city time zones and the actual date. In participating eastern/southern jurisdictions, daylight saving starts Sunday 4 October 2026 and ends Sunday 4 April 2027. Queensland does not currently observe daylight saving. Do not hard-code a Philippines-to-Australia offset."},
    {"id":"paths","title":"Australian specialist learning paths","kind":"policy","content":"Trades -> Australian Trades Administration -> ServiceM8 where relevant. Allied health -> Australian Allied Health Administration -> Cliniko. Finance -> Australian Bookkeeping Administration -> Xero or MYOB. NDIS -> NDIS Administration Fundamentals. Property -> Property Management Administration Australia. Mortgage -> Mortgage Broking Administration Australia."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'australian-va-fundamentals';

update public.training_courses
set
  summary = 'A 3.5-hour Australian VA foundation for Filipino virtual assistants covering Australian SME workflows, communication, time zones, privacy, finance terminology, customer follow-up, cross-border handoffs and routing into specialist training.',
  estimated_minutes = 210,
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-va-fundamentals';
