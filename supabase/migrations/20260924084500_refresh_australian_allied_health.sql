-- Refresh Australian Allied Health Administration for current 2026
-- Australian privacy, Medicare referral, NDIS funding-pathway and complaint
-- administration. This course owns practice operations; Cliniko owns software execution.

update public.training_lessons
set
  title = 'Australian Allied Health Practice Operations and VA Role',
  summary = 'Map the patient journey, practitioner roles, funding pathways, practice controls and handoff points so the VA can own routine administration without becoming the clinician, funding assessor or complaint decision maker.',
  content = $$[
    {"type":"heading","text":"Outcome: Australian allied health practice operations"},
    {"type":"list","items":[
      "Map the patient journey from enquiry to intake, referral, booking, billing, recall and follow-up",
      "Recognise the different roles of practitioners, reception/admin, billers, referrers, funders and practice leadership",
      "Separate administrative ownership from clinical, funding, privacy and regulatory judgment"
    ]},
    {"type":"heading","text":"Operating context"},
    {"type":"paragraph","text":"Australian allied health practices can include physiotherapy, occupational therapy, psychology, speech pathology, podiatry, dietetics, exercise physiology and other professions. Not every allied health profession is regulated by Ahpra, and different professions, funding pathways and jurisdictions can have different requirements. The VA should follow the practice's documented workflow and hand regulated or professional judgment to the correct owner."},
    {"type":"heading","text":"Patient journey map"},
    {"type":"steps","items":[
      "Enquiry: capture approved contact and service-request information without diagnosing symptoms.",
      "Intake: collect only the practice-approved demographic, consent, referral and funding information.",
      "Referral readiness: attach the correct documents, record source/date and flag missing administrative requirements.",
      "Scheduling: use the practice's appointment-type and practitioner matrix.",
      "Appointment support: send approved confirmations, reminders and preparation instructions.",
      "Billing: route the visit through the correct private, Medicare, NDIS or other approved funding workflow.",
      "Follow-up: maintain recalls, waitlists, outstanding documents and practitioner-requested actions.",
      "Exceptions: escalate clinical questions, worsening symptoms, privacy incidents, complaints, rejected claims and disputed charges.",
      "Handoff: leave every unresolved patient/admin item with a named owner and next action."
    ]},
    {"type":"callout","title":"A practice workflow is not a clinical protocol","text":"The VA can own the administrative queue and still avoid clinical judgment. Do not choose treatment, interpret symptoms, decide practitioner scope, alter clinical notes, assess funding eligibility or tell a patient that a service is clinically appropriate unless the practice has supplied an explicit administrative routing rule."},
    {"type":"heading","text":"QA risks: Australian allied health practice operations"},
    {"type":"list","items":[
      "Treating all allied health professions as if they have the same regulator or funding rules",
      "Booking from symptoms rather than the approved appointment matrix",
      "Using a funding label as proof of eligibility",
      "Changing clinical wording to make a referral or claim look complete",
      "Leaving exceptions in personal notes instead of the practice system"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A new patient says they have worsening shoulder pain, asks which practitioner they should see and says they have a Medicare referral but cannot find it. Show what you can collect, what you can book only from the practice matrix, and what must go to the practitioner or referral-review owner."},
    {"type":"heading","text":"Ready check: Australian allied health practice operations"},
    {"type":"list","items":[
      "Know the practice's services and practitioner matrix.",
      "Know the source systems and handoff owners.",
      "Keep clinical judgment with practitioners.",
      "Make unresolved admin work visible."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'how-australian-allied-health-practices-operate'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Australian Privacy, Health Information, and Minimum-Necessary Access',
  summary = 'Apply current 2026 OAIC data-minimisation principles to health information, identity, referrals, billing and remote access while routing consent, disclosure and breach decisions to the practice privacy owner.',
  content = $$[
    {"type":"heading","text":"Outcome: privacy-safe allied health administration"},
    {"type":"list","items":[
      "Treat health information as sensitive information",
      "Use minimum-necessary collection and access",
      "Handle wrong-recipient, exposed-link and other privacy incidents through the practice process"
    ]},
    {"type":"heading","text":"2026 privacy context"},
    {"type":"paragraph","text":"The OAIC updated APP 3 guidance in May 2026 and expressly reinforced proportionality and data minimisation. Covered organisations should collect only personal information reasonably necessary for their functions. Sensitive information generally has additional consent requirements unless an exception applies. For a VA, the practical rule is simple: use only the information and access needed for the approved task, in approved systems, and do not invent legal interpretations."},
    {"type":"heading","text":"Workflow: privacy-safe patient administration"},
    {"type":"steps","items":[
      "Identify the minimum patient information the task actually requires.",
      "Use the named practice account and least-privilege access available for the role.",
      "Verify patient identity using the practice's approved process before disclosing or changing information.",
      "Keep referrals, health details, identifiers, payment information and clinical documents inside approved systems.",
      "Check recipient, attachment, sharing permission and patient before sending sensitive information.",
      "Do not paste patient data into an AI tool, personal email, personal cloud storage or open team channel unless the practice has explicitly approved that system and use.",
      "If information is sent to the wrong person or exposed, preserve the facts and escalate immediately under the practice incident workflow.",
      "Record access/correction requests for the responsible privacy or practice owner instead of rewriting clinical records yourself."
    ]},
    {"type":"callout","title":"Minimum necessary beats maximum convenient","text":"Do not collect or expose an entire patient record when the task needs only one field, one document or one approved contact detail. Convenience is not the same as necessity."},
    {"type":"heading","text":"QA risks: privacy and health information"},
    {"type":"list","items":[
      "Downloading full charts for a scheduling task",
      "Using shared credentials when individual access is available",
      "Sending a referral to the wrong practitioner or patient",
      "Copying health information into unapproved AI or note tools",
      "Trying to quietly delete evidence after a mistaken disclosure",
      "Deciding yourself whether a privacy incident legally requires notification"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A referral PDF containing health information is accidentally attached to an email addressed to the wrong patient. Write the immediate administrative actions, evidence you preserve, systems you secure and people you notify without deciding the legal breach-notification outcome yourself."},
    {"type":"heading","text":"Ready check: privacy-safe allied health administration"},
    {"type":"list","items":[
      "Collect and access the minimum necessary information.",
      "Keep work in approved systems.",
      "Verify recipients before disclosure.",
      "Escalate incidents immediately."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-privacy-and-health-information-for-practice-admin'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Patient Intake, Consent, Identity, and Administrative Readiness',
  summary = 'Build a complete patient admin record from approved information, prevent duplicates, track consent and communication preferences, and separate intake completeness from clinical assessment.',
  content = $$[
    {"type":"heading","text":"Outcome: a practitioner-ready admin record"},
    {"type":"list","items":[
      "Collect approved intake information consistently",
      "Resolve identity and duplicate-record issues safely",
      "Track consent, communication and funding documents without interpreting clinical content"
    ]},
    {"type":"heading","text":"Workflow: patient intake and readiness"},
    {"type":"steps","items":[
      "Search for the patient before creating a new record.",
      "Use the practice-approved intake form and collect only required identity, contact, consent, referral and funding information.",
      "Record patient-provided wording accurately rather than converting it into diagnostic language.",
      "Check core contact details, preferred communication method and any authorised contact/guardian information required by the workflow.",
      "Flag conflicting names, dates of birth, phone numbers, addresses, referral details or funding information.",
      "Attach documents to the correct patient only after identity is resolved.",
      "Route symptom descriptions, clinical questions and uncertain practitioner/service selection to the clinical owner.",
      "Create the next referral, booking, consent or document-follow-up task."
    ]},
    {"type":"callout","title":"Completeness is not clinical readiness","text":"The VA can say that the administrative checklist is complete. The VA should not say that the patient is clinically suitable, urgent, eligible for treatment or appropriate for a particular practitioner unless the practice has an approved routing rule for that exact decision."},
    {"type":"heading","text":"QA risks: patient intake"},
    {"type":"list","items":[
      "Creating a duplicate patient because spelling differs",
      "Guessing gender, diagnosis, guardian status or funding type",
      "Collecting extra sensitive information just in case",
      "Rewriting patient wording into a diagnosis",
      "Leaving missing consent or referral documents without an owner",
      "Booking a clinical service from symptoms rather than the practice matrix"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"An intake form contains two mobile numbers, an abbreviated surname and no consent form. The patient also writes 'pain much worse today' in a free-text box. Show the identity check, missing-document queue and clinical escalation without diagnosing the symptom."},
    {"type":"heading","text":"Ready check: patient intake"},
    {"type":"list","items":[
      "Search before creating.",
      "Collect only approved fields.",
      "Preserve patient wording.",
      "Route clinical content."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'patient-intake-forms-and-demographic-checks'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Referrals, GP Chronic Condition Management Plans, and Practitioner Handoffs',
  summary = 'Track referrals and supporting documents against the current practice checklist, including 2026 Medicare chronic-condition referral administration, while keeping clinical need and eligibility decisions with authorised practitioners.',
  content = $$[
    {"type":"heading","text":"Outcome: referral-ready patient administration"},
    {"type":"list","items":[
      "Attach and track referrals safely",
      "Recognise the current GP Chronic Condition Management Plan administrative context",
      "Create clean practitioner handoffs for missing, expired, conflicting or unclear referral information"
    ]},
    {"type":"heading","text":"Current Medicare context"},
    {"type":"paragraph","text":"For eligible chronic-condition allied health services, current Services Australia guidance says a patient with a GP Chronic Condition Management Plan may access up to five individual allied health or eligible primary-care services per calendar year. The referring GP or prescribed medical practitioner decides whether the patient would benefit from allied health. Referrals are valid for the timeframe written on the referral; if no timeframe is stated, current guidance says they are valid for 18 months from the first service date under the referral. Legacy GP management plans or team care arrangements created before 1 July 2025 can continue under transitional rules until 30 June 2027."},
    {"type":"heading","text":"Workflow: referral administration"},
    {"type":"steps","items":[
      "Resolve patient identity before attaching the referral.",
      "Record referral source, received date, referring practitioner, intended service/practitioner and any stated timeframe.",
      "Use the practice's approved checklist for required administrative information rather than interpreting diagnosis or clinical need.",
      "Flag missing pages, unreadable information, mismatched patient details, uncertain referral pathway or dates that need practitioner review.",
      "Do not pre-fill a referral for a referrer in a way that pre-empts the referrer's decision about the allied health services required.",
      "Track the first-service date where the practice uses it for referral administration.",
      "Create the required practitioner/report follow-up tasks where the practice's Medicare workflow requires reporting back to the referrer.",
      "Route clinical relevance, treatment choice, eligibility and item-number judgment to the practitioner or billing owner."
    ]},
    {"type":"callout","title":"Referral administration is not referral interpretation","text":"The VA can track dates, documents and checklist fields. The referring practitioner decides the need for allied health, and the treating practitioner or authorised billing owner handles clinical and claiming judgments."},
    {"type":"heading","text":"QA risks: referrals and handoffs"},
    {"type":"list","items":[
      "Attaching a referral to the wrong patient",
      "Assuming a referral is valid from the diagnosis alone",
      "Using an old referral without checking the approved workflow",
      "Pre-empting the referrer's decision about service allocation",
      "Failing to create required report or document follow-up",
      "Treating Medicare administrative rules as universal across private, NDIS or insurer-funded patients"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A patient says their GP referral has 'five visits' but the PDF has no explicit expiry date. Another patient has an older pre-July-2025 care arrangement. Show what dates and evidence you record, what current transitional/referral rule you check, and what remains with the practitioner or billing owner."},
    {"type":"heading","text":"Ready check: referral administration"},
    {"type":"list","items":[
      "Identity before attachment.",
      "Track source and dates.",
      "Use current approved referral rules.",
      "Do not decide clinical need or eligibility."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'referrals-documents-and-practitioner-handoffs'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Scheduling, Appointment Types, Telehealth, Reminders, and No-Shows',
  summary = 'Use the practice appointment matrix to coordinate practitioner, service, location, room, telehealth, referral and timing requirements without turning calendar administration into clinical triage.',
  content = $$[
    {"type":"heading","text":"Outcome: a clinically neutral, operationally accurate calendar"},
    {"type":"list","items":[
      "Book the correct administrative appointment type",
      "Match practitioner, duration, location, telehealth and prerequisite rules",
      "Manage confirmations, reminders, cancellations and no-shows consistently"
    ]},
    {"type":"heading","text":"Workflow: allied health scheduling"},
    {"type":"steps","items":[
      "Identify the appointment type from the practice's written routing matrix, not from your own interpretation of symptoms.",
      "Check practitioner, service, duration, location/room, telehealth availability and any referral or form prerequisite.",
      "For telehealth or interstate patients, confirm the patient's location/time zone and practice telehealth workflow.",
      "Book the authorised appointment type and preserve any practitioner-specific buffers.",
      "Send approved confirmation and preparation instructions.",
      "Confirm reminder preferences and automation status.",
      "For reschedules or cancellations, preserve the reason when required and apply only the approved fee/cancellation workflow.",
      "For a no-show, record the event and route any fee waiver, clinical follow-up or welfare concern to the authorised owner.",
      "If a patient reports worsening or alarming symptoms, use the practice's clinical escalation or emergency pathway rather than finding a shorter calendar slot yourself."
    ]},
    {"type":"callout","title":"Calendar availability does not determine clinical urgency","text":"Do not squeeze a patient into a shorter appointment, change practitioner type or label a booking urgent because the patient sounds unwell. Follow the practice's clinical escalation and appointment-type rules."},
    {"type":"heading","text":"QA risks: scheduling and no-shows"},
    {"type":"list","items":[
      "Booking the wrong appointment duration",
      "Ignoring practitioner-specific scope or location rules",
      "Using a telehealth slot without checking location/process requirements",
      "Promising a late-cancellation fee waiver",
      "Sending reminders against communication preferences",
      "Turning symptom wording into a clinical priority decision"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A patient booked for a 45-minute initial assessment asks to switch to a 15-minute opening today because their symptoms are worse. Show the administrative response, practitioner escalation and calendar actions without changing clinical priority yourself."},
    {"type":"heading","text":"Ready check: allied health scheduling"},
    {"type":"list","items":[
      "Use the appointment matrix.",
      "Check prerequisites.",
      "Protect practitioner buffers.",
      "Escalate clinical urgency."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'scheduling-appointment-types-reminders-and-no-shows'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Recalls, Waitlists, Practitioner Tasks, and Patient Follow-Up',
  summary = 'Keep practitioner-requested recalls and waitlists moving from explicit instructions, not clinical inference, while preserving consent, contact preferences and unresolved clinical questions.',
  content = $$[
    {"type":"heading","text":"Outcome: a safe recall and waitlist queue"},
    {"type":"list","items":[
      "Create recalls only from an approved practitioner/practice instruction",
      "Use waitlist criteria supplied by the practice",
      "Turn patient replies into documented next actions and clinical handoffs"
    ]},
    {"type":"heading","text":"Workflow: recalls and waitlists"},
    {"type":"steps","items":[
      "Record the recall reason, timing and responsible practitioner exactly from the authorised instruction.",
      "Do not infer a recall interval from diagnosis, age, prior visits or your own judgment.",
      "For waitlists, use the practice's approved appointment type, practitioner, location and priority fields.",
      "Offer openings only to patients who fit the approved administrative criteria.",
      "Record contact attempts, patient response and next action.",
      "If the patient reports new or worsening symptoms, stop routine recall/waitlist processing and route the clinical question under the practice escalation workflow.",
      "Respect communication preferences and do not expose sensitive context in voicemail or SMS beyond the approved template.",
      "Close the recall or waitlist item only when the defined outcome is recorded."
    ]},
    {"type":"callout","title":"Recall timing comes from the practitioner or protocol","text":"Do not create a six-month or annual recall because it seems normal for the condition. Use the practitioner instruction or practice-approved recall protocol."},
    {"type":"heading","text":"QA risks: recalls and waitlists"},
    {"type":"list","items":[
      "Guessing a recall interval",
      "Offering the wrong appointment type from the waitlist",
      "Ignoring contact preferences",
      "Leaving failed contact attempts with no next action",
      "Continuing routine outreach after the patient reports worsening symptoms",
      "Putting clinical detail into an insecure SMS or voicemail"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A practitioner set a three-month recall, but the patient replies to the reminder saying symptoms have become much worse and asks whether to wait for the recall appointment. Show how you stop the routine workflow and create the practitioner handoff."},
    {"type":"heading","text":"Ready check: recalls and waitlists"},
    {"type":"list","items":[
      "Use explicit recall instructions.",
      "Use approved waitlist criteria.",
      "Respect communication preferences.",
      "Escalate symptom changes."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'recalls-waitlists-and-routine-patient-messages'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Private, Medicare, NDIS, Third-Party Billing, and Complaint Exceptions',
  summary = 'Route billing through the correct payer workflow, keep claim/invoice evidence visible, distinguish Medicare from NDIS administration, and preserve complaints for authorised review instead of deciding eligibility, coding or remedies.',
  content = $$[
    {"type":"heading","text":"Outcome: clean funding and complaint exception handling"},
    {"type":"list","items":[
      "Separate private, Medicare, NDIS and other third-party billing workflows",
      "Build claim and invoice exception queues from evidence",
      "Preserve patient complaints and route them to the correct practice owner"
    ]},
    {"type":"heading","text":"Funding-pathway map"},
    {"type":"list","items":[
      "Private: patient or responsible payer is invoiced under the practice's normal private-fee workflow.",
      "Medicare: use the practice's approved MBS/referral and claiming workflow; do not choose item numbers or decide eligibility from your own interpretation.",
      "NDIS self-managed: the participant generally pays providers directly and keeps the required records.",
      "NDIS plan-managed: providers generally send invoices to the participant's plan manager.",
      "NDIS NDIA-managed: registered providers submit payment requests through the relevant provider process.",
      "Insurer, employer, workers compensation or other third party: use the specific practice-approved authority, invoice and evidence workflow."
    ]},
    {"type":"heading","text":"Workflow: billing exceptions"},
    {"type":"steps","items":[
      "Confirm patient, appointment, practitioner, funding pathway and billing owner.",
      "Check the approved referral/authority/document prerequisites for that pathway.",
      "Use only the approved fee, item, service or invoice data supplied by the practitioner/billing process.",
      "For a rejected claim or invoice, preserve the rejection reason and source evidence.",
      "Create a discrete exception: missing referral, missing authority, demographic mismatch, service/date mismatch, payer dispute, duplicate claim, funding-manager query or other documented reason.",
      "Route eligibility, item selection, clinical coding, NDIS support/funding interpretation and disputed charges to the authorised practitioner/billing owner.",
      "Track resubmission or patient contact only after the owner approves the next step."
    ]},
    {"type":"heading","text":"Complaint handling"},
    {"type":"paragraph","text":"A patient complaint can concern service, fees, communication, privacy or practitioner conduct. Ahpra regulates individual registered practitioners, not every allied health profession or every clinic issue, and state/territory health complaint bodies may also be relevant. The VA should not decide the external complaint pathway. Preserve the facts, desired outcome, dates, documents and promises, then route the matter under the practice complaint procedure."},
    {"type":"steps","items":[
      "Acknowledge the complaint using the approved neutral template.",
      "Record what happened, when, who was involved, the patient's stated impact and requested outcome.",
      "Preserve supporting emails, messages, invoices or other evidence.",
      "Assign the complaint to the practice manager, practitioner or privacy/billing owner defined by policy.",
      "Record the promised response date and follow-up owner.",
      "Do not admit clinical fault, reject the complaint, promise a refund or decide whether Ahpra, an NDIS body or another complaint service applies unless authorised."
    ]},
    {"type":"callout","title":"Route funding and complaints; do not adjudicate them","text":"A rejected claim does not prove the patient is ineligible. A complaint does not prove the practitioner is at fault. Preserve evidence, maintain the queue and give the authorised owner a clean handoff."},
    {"type":"heading","text":"QA risks: billing and complaints"},
    {"type":"list","items":[
      "Using a Medicare item from memory",
      "Treating an NDIS plan-management type as interchangeable",
      "Changing a service description to force a claim through",
      "Promising a refund before review",
      "Deleting a complaint after verbally resolving it",
      "Assuming every allied health complaint belongs to Ahpra"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"One Medicare claim is rejected for a referral issue, one NDIS plan-managed invoice is returned for missing information, and a private patient says they were charged incorrectly and wants a refund. Build the three exception records and handoffs without deciding eligibility, NDIS funding, MBS coding or the complaint outcome."},
    {"type":"heading","text":"Ready check: billing and complaints"},
    {"type":"list","items":[
      "Identify the payer pathway.",
      "Preserve rejection evidence.",
      "Do not invent coding or eligibility.",
      "Keep complaints visible until authorised closure."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'billing-administration-funding-pathways-and-outstanding-accounts'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_lessons
set
  title = 'Australian Allied Health Practice Operations Simulation',
  summary = 'Run a realistic Australian allied health practice day across intake, referral readiness, practitioner calendars, recalls, privacy, Medicare/NDIS billing exceptions, complaints and clinical escalation while leaving Cliniko-specific execution to the Cliniko course.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You support a fictional multidisciplinary practice called Harbour Allied Health. The practice uses Cliniko as its patient-management system, but this assessment tests practice operations rather than software clicks. The queue contains privacy, referral, scheduling, recall, billing, complaint and clinical-escalation exceptions."},
    {"type":"heading","text":"Morning queue"},
    {"type":"list","items":[
      "P01: new patient, consent missing, referral attached, appointment tomorrow.",
      "P02: Medicare chronic-condition referral has no stated expiry; first service date is recorded.",
      "P03: older pre-July-2025 GP care arrangement is on file and needs admin review under the transition rules.",
      "P04: practitioner double-booked; patient asks for the shorter appointment type instead.",
      "P05: recall patient replies that symptoms are significantly worse.",
      "P06: NDIS plan-managed invoice returned for missing information.",
      "P07: private patient disputes a fee and requests a refund.",
      "P08: referral PDF was emailed to the wrong patient.",
      "P09: practitioner has requested a routine recall, but no next action is assigned."
    ]},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A prioritised practice queue with owner, next action and escalation status",
      "A patient-intake/readiness exception list",
      "A Medicare referral-administration check for P02 and P03",
      "A practitioner-calendar correction using the practice appointment matrix",
      "A recall/waitlist action and clinical handoff",
      "A privacy-incident administrative record",
      "A Medicare/NDIS/private billing exception table",
      "A complaint acknowledgement and practice-manager handoff",
      "An end-of-day practice summary showing resolved, waiting and escalated items"
    ]},
    {"type":"heading","text":"Course boundary"},
    {"type":"paragraph","text":"Use the practice workflow and supplied evidence. Do not reproduce Cliniko button instructions here. Cliniko-specific patient, appointment, reminder, invoice, payment and permission execution belongs in the Cliniko for Virtual Assistants course. Detailed NDIS provider administration belongs in the NDIS Administration Fundamentals course."},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Patient and health information is minimised and handled only in approved workflows.",
      "No symptom description is converted into a diagnosis or independent urgency judgment.",
      "Medicare referral dates and transition rules are tracked from evidence, not guessed.",
      "Appointment type and practitioner decisions follow the supplied practice matrix.",
      "Recall timing comes from practitioner/protocol instruction.",
      "Funding and claim exceptions are routed rather than manipulated.",
      "Complaints remain visible until authorised closure.",
      "Every unresolved item has a named owner and next action."
    ]},
    {"type":"scenario","title":"Final challenge","text":"Produce Harbour Allied Health's 8:00 AM priority queue, midday exception update and end-of-day handoff. Your work should let the practitioners and practice manager continue immediately without re-reading the entire inbox or guessing what you changed."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-allied-health-composite-admin-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-allied-health-administration')
  );

update public.training_assessments assessment
set
  title = 'Australian Allied Health Practice Operations Final Simulation',
  instructions = 'Complete the Harbour Allied Health practice-operations simulation. Submit a prioritised queue, patient-intake/readiness exception list, Medicare referral-administration check, practitioner-calendar correction, recall/waitlist action, clinical handoff, privacy-incident record, Medicare/NDIS/private billing exception table, complaint acknowledgement and end-of-day practice-manager handoff. Use the supplied evidence and current approved practice rules. Do not diagnose symptoms, decide clinical urgency, choose treatment, alter clinical notes, decide Medicare or NDIS eligibility, select MBS items from your own judgment, change claim information to force payment, decide a privacy-notification outcome or adjudicate a patient complaint.',
  rubric = $$[
    {"id":"privacy","label":"Privacy and patient-record handling","weight":20,"description":"Uses minimum-necessary information, protects health data, resolves identity safely and escalates privacy incidents with evidence.","hard_fail":true},
    {"id":"referrals","label":"Referral and Medicare administration","weight":15,"description":"Tracks source, dates, current GPCCMP referral rules and transition evidence without making clinical or eligibility decisions."},
    {"id":"scheduling","label":"Scheduling, recall and clinical handoff","weight":20,"description":"Uses the supplied appointment matrix and practitioner/recall rules, and routes worsening symptoms instead of triaging independently."},
    {"id":"billing","label":"Funding and billing exception control","weight":15,"description":"Separates private, Medicare, NDIS and third-party workflows and creates evidence-based exceptions without manipulating coding or eligibility."},
    {"id":"complaints","label":"Complaint and patient communication","weight":15,"description":"Preserves complaint facts, uses neutral communication and leaves remedy/regulatory decisions with the authorised owner."},
    {"id":"handoff","label":"Practice operations handoff","weight":15,"description":"Leaves every unresolved item with a clear owner, blocker, next action and timing while avoiding duplicate Cliniko/NDIS product training."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"queue","title":"Harbour Allied Health morning queue","kind":"csv","content":"patient,issue,status\nP01,Consent missing; referral attached; appointment tomorrow,Needs admin action\nP02,GPCCMP referral has no stated expiry; first service date recorded,Review dates\nP03,Pre-July-2025 GP care arrangement on file,Check transition workflow\nP04,Practitioner double-booked; patient requests shorter appointment,Calendar exception\nP05,Recall reply says symptoms significantly worse,Clinical handoff\nP06,NDIS plan-managed invoice returned for missing information,Billing exception\nP07,Private patient disputes fee and requests refund,Complaint\nP08,Referral PDF emailed to wrong patient,Privacy incident\nP09,Routine practitioner recall has no owner,Follow-up needed"},
    {"id":"practice","title":"Practice appointment and referral rules","kind":"policy","content":"Initial assessments are 45 minutes unless the practitioner authorises another type. Reviews are 30 minutes. Telehealth uses approved practitioner/location rules. Clinical urgency and treatment choice stay with practitioners. GPCCMP referral administration follows current Services Australia rules. Admin may track dates and documents but must not decide clinical need, eligibility or MBS item selection."},
    {"id":"funding","title":"Funding workflow reference","kind":"policy","content":"Private: use approved patient invoice workflow. Medicare: use approved referral/MBS claiming workflow and escalate eligibility/item questions. NDIS self-managed: participant generally pays provider directly and keeps records. NDIS plan-managed: provider sends invoice to plan manager. NDIA-managed: registered provider uses the approved provider payment-request process. Detailed NDIS compliance belongs in the NDIS course."},
    {"id":"systems","title":"Course and software boundary","kind":"policy","content":"Australian Allied Health Administration owns practice workflow, referrals, funding routing, patient communication, privacy exceptions, complaints and practitioner handoffs. Cliniko for Virtual Assistants owns Cliniko-specific records, appointments, reminders, invoices, payments, Forms and permissions."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'australian-allied-health-administration';

update public.training_courses
set
  summary = 'Australia-specific allied health practice-operations training for Filipino VAs covering privacy, intake, current Medicare referral administration, practitioner scheduling, recalls/waitlists, private/Medicare/NDIS billing exceptions, complaints, clinical handoffs and Cliniko integration boundaries.',
  estimated_minutes = 240,
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-allied-health-administration';
