-- Refresh Property Management Administration Australia against current
-- 2026 Australian tenancy/privacy workflows while keeping jurisdiction-specific
-- legal decisions with the agency's authorised local property-management staff.

update public.training_lessons
set
  title = 'Owner, Tenant, Property, and Privacy Data Administration',
  summary = 'Property management handles identity, tenancy, contact, financial, access, application, and maintenance data. Current Australian privacy guidance reinforces collecting only what is genuinely needed and keeping unnecessary renter data out of routine workflows.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Maintain property, owner, renter, applicant, supplier, and tenancy records without creating duplicate or conflicting source data",
      "Apply data-minimisation thinking to rental applications and routine administration",
      "Protect bank details, identity documents, access information, and sensitive application data"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Property-management systems can hold identity documents, employment and income evidence, rental history, bank details, contact information, household information, keys, alarm codes, inspection photos, maintenance history, and tenancy records. Current Australian privacy guidance says covered real-estate organisations should only collect personal information reasonably necessary for their functions. In 2026, the Privacy Commissioner also found that a major rental-application platform collected excessive personal information, reinforcing that convenient data collection is not automatically justified."},
    {"type":"heading","text":"A practical data workflow"},
    {"type":"steps","items":[
      "Identify the property, person, tenancy, and jurisdiction before editing the record.",
      "Search existing records before creating a new applicant, renter, owner, or supplier.",
      "Collect or request only the information required by the agency's current approved application or tenancy process.",
      "Keep identity documents, financial evidence, access codes, keys, and bank details out of open notes or general team chat.",
      "Use independent verification for owner or supplier bank-detail changes before any payment workflow is updated.",
      "Record the source and date of material changes.",
      "Escalate requests for unusual applicant information, broad data exports, identity documents, or disclosure to third parties."
    ]},
    {"type":"callout","title":"More data is not better data","text":"Do not ask an applicant for extra personal information simply because a platform has a field for it. Follow the agency's approved jurisdiction-specific application process and collect only what the authorised workflow requires."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Merging people by name alone",
      "Keeping old identity documents in shared folders after the approved retention purpose has ended",
      "Sending keys, alarm codes, or lockbox details through an open team channel",
      "Changing owner bank details from an email request without independent verification",
      "Copying applicant information into spreadsheets that are not part of the approved system",
      "Assuming every field on a rental-application platform is appropriate to collect"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"An applicant has already supplied identity, income, and rental-reference evidence. A team member asks you to collect extra social-media information and an unredacted bank transaction history because 'it might help the owner decide'. Explain what you record, what you do not request without an approved basis, and who receives the escalation."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use stable record identifiers.",
      "Collect the minimum approved information.",
      "Protect financial, identity, and access data.",
      "Escalate unusual collection or disclosure requests."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'owner-tenant-property-and-privacy-data-administration'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Leasing Enquiries, Applications, and Anti-Discrimination Boundaries',
  summary = 'Support enquiries, application completeness, viewing coordination, and factual comparison without steering, discriminatory screening, or turning a VA into the tenant-selection decision maker.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Handle rental enquiries and application administration consistently",
      "Separate factual application completeness from tenant-selection decisions",
      "Recognise discriminatory or inappropriate screening requests and escalate them"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Rental application administration sits close to decisions about who gets housing. Federal, state, and territory discrimination rules apply to accommodation, and state tenancy rules can also limit the information that may be requested from applicants. A VA can organise facts and missing evidence, but should not invent selection criteria, steer applicants, or make a decision based on protected personal characteristics."},
    {"type":"heading","text":"A practical enquiry-to-application workflow"},
    {"type":"steps","items":[
      "Confirm the property, jurisdiction, advertised availability, approved rent, viewing process, and application channel.",
      "Answer routine factual questions from the approved listing and agency FAQ.",
      "Record the enquiry and viewing status consistently.",
      "Check an application only for the agency's approved required fields and evidence.",
      "Create a factual completeness summary without ranking applicants by personal characteristics.",
      "Flag inconsistencies, missing evidence, or unusual requests to the authorised leasing or property-management owner.",
      "Record the authorised outcome and send only the approved applicant communication."
    ]},
    {"type":"callout","title":"Do not turn admin into screening policy","text":"Do not reject, downgrade, steer, or discourage an applicant because of race, disability, sex, family status, sexuality, gender identity, or another protected attribute. Do not invent 'ideal tenant' rules that the agency has not formally approved and checked for legal compliance."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Telling a family a property is 'better suited to adults'",
      "Asking for extra personal data because an owner is curious",
      "Scoring applicants using a personal preference that is not in the approved process",
      "Making promises that an application is approved before the authorised decision",
      "Sharing one applicant's financial or personal information with another applicant",
      "Treating a platform recommendation as the final tenant-selection decision"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"An owner asks you to move an applicant to the bottom of the list because they have young children. The application is otherwise complete. Explain what you record, what you do not do, and how you escalate the request without arguing with the applicant or making the tenancy decision yourself."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use consistent enquiry and application workflows.",
      "Summarise facts, not personal preference.",
      "Protect applicant data.",
      "Escalate discriminatory or unusual screening instructions."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'leasing-enquiries-applications-and-anti-discrimination-boundaries'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Rent, Arrears, Receipts, and Financial Administration',
  summary = 'Build an evidence-based rent and arrears queue from the ledger, while keeping rent increases, formal arrears notices, payment plans, trust-account treatment, waivers, and enforcement decisions inside the correct local workflow.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare a reliable rent and arrears administration queue",
      "Separate ledger facts from legal notice or enforcement decisions",
      "Handle rent-increase and payment exceptions through jurisdiction-specific approval"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Rent administration is not one national workflow. Notice periods, rent-increase timing, bond consequences, payment methods, arrears processes, tribunal steps, and trust-account obligations differ by jurisdiction and can change. For example, Victoria and Queensland currently use different rent and bond processes. The VA's job is to keep the ledger and exception queue accurate, then apply only the agency's approved local process."},
    {"type":"heading","text":"A practical daily workflow"},
    {"type":"steps","items":[
      "Confirm the property, tenancy, jurisdiction, rent amount, frequency, and ledger source.",
      "Check recent receipts, reversals, allocation errors, credits, and pending bank transactions before marking an account overdue.",
      "Separate genuine arrears from receipt-allocation or timing issues.",
      "Create the approved arrears follow-up queue with amount, days/status, last communication, owner, and next action.",
      "Use only the approved local template and timing for routine reminders or formal notices.",
      "For rent increases, confirm the local rule, agreement terms, notice requirements, approved amount, effective date, and authorised owner before updating the system.",
      "Escalate disputed balances, payment plans, waivers, tribunal matters, trust-account issues, formal termination steps, or uncertainty about the local rule."
    ]},
    {"type":"callout","title":"A ledger is evidence, not legal authority","text":"A property-management system can show an overdue amount, but it does not decide whether a formal notice is valid, whether a payment plan should be accepted, or whether termination or tribunal action is appropriate."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Sending an arrears notice before checking a recent receipt",
      "Using one state's notice timing for a property in another jurisdiction",
      "Changing rent from an owner's email without confirming the approved local process",
      "Promising a payment plan or waiver without authority",
      "Editing trust or receipt records to make the ledger appear balanced",
      "Treating a disputed amount as settled because the software status changed"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The morning queue shows three overdue tenancies: one has an unallocated receipt, one is genuinely overdue, and one has a rent increase entered for next month without evidence of the required local notice. Explain how you separate the three cases, what you can update, and which items go to the authorised property manager."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Start with the ledger and source evidence.",
      "Identify jurisdiction before notices or rent changes.",
      "Do not negotiate or enforce from your own judgment.",
      "Keep disputed and regulated items visible until authorised closure."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'rent-arrears-receipts-and-financial-administration'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Maintenance, Emergencies, Contractors, and Owner Approvals',
  summary = 'Triage maintenance by immediate risk, tenancy impact, local urgent-repair rules, owner authority, and contractor availability without diagnosing technical faults or delaying emergencies for routine approval.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Triage maintenance reports into emergency, urgent, routine, and information-needed queues using the agency's local SOP",
      "Coordinate contractors and approvals without making technical diagnoses",
      "Preserve the evidence needed for owner, renter, insurer, contractor, or tribunal follow-up"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Australian jurisdictions define urgent repairs and renter remedies differently. The operational principle is consistent: immediate safety or serious property risk must not sit in a normal inbox, while legal classification, reimbursement rights, spending authority, and dispute outcomes stay with the authorised local process. A VA should triage quickly, preserve the renter's wording, and route the job correctly."},
    {"type":"heading","text":"A practical maintenance workflow"},
    {"type":"steps","items":[
      "Record the property, renter, time received, exact issue, photos or video supplied, access constraints, and any immediate safety concern.",
      "Check the agency's jurisdiction-specific urgent-repair and emergency matrix.",
      "For immediate danger, follow the emergency escalation path without waiting for routine owner approval.",
      "For urgent or routine work, check landlord approval limits, preferred contractor rules, warranties, strata/body-corporate responsibility, and existing work orders.",
      "Send the contractor only the access and personal information needed for the job.",
      "Track acceptance, appointment, attendance, quote, approval, completion evidence, invoice, and renter follow-up as separate statuses.",
      "Escalate technical diagnosis, disputed responsibility, high-cost approvals, insurance questions, habitability/safety disputes, repeated failures, and any uncertainty about local repair rights."
    ]},
    {"type":"callout","title":"Triage is not diagnosis","text":"The VA can identify that a report may require urgent escalation under the agency's approved matrix. The VA should not tell a renter that wiring, plumbing, mould, gas, structure, or another technical issue is safe, compliant, or the renter's fault."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Leaving a serious leak or electrical hazard in the normal maintenance queue",
      "Promising the renter that the owner must reimburse a cost before checking the local rule",
      "Sending a contractor an entire tenancy file",
      "Closing a work order because a contractor marked it complete without confirming required evidence",
      "Treating repeated repair failure as a new routine request every time",
      "Giving technical advice instead of escalating to the right professional"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"At 5:10 pm a renter reports water entering through a ceiling near a light fitting. The owner is not answering. Explain the information you capture, the emergency/urgent path you check, what you communicate to the renter, and what technical or legal conclusions you do not make."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Safety and serious property risk move first.",
      "Use the local urgent-repair matrix.",
      "Track contractor and approval states separately.",
      "Do not diagnose or decide legal responsibility."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'maintenance-emergencies-contractors-and-owner-approvals'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Inspections, Access Notices, and Calendar Coordination',
  summary = 'Coordinate inspections, repairs, valuations, viewings, and other property access only after confirming the jurisdiction, valid purpose, approved notice form, notice period, entry window, and frequency limits.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Build a compliant access-administration checklist before scheduling entry",
      "Separate calendar coordination from the legal right to enter",
      "Handle reschedules, refused access, and contractor entry without inventing notice rules"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Entry rules differ materially across Australia. Queensland, for example, currently uses a prescribed Entry notice and specific notice periods and frequency limits for routine inspections, repairs, viewings, and other entry reasons. NSW uses its own entry rules and timing. A VA should never assume that a calendar booking or contractor availability creates a right of entry."},
    {"type":"heading","text":"A practical access workflow"},
    {"type":"steps","items":[
      "Identify the property jurisdiction and the exact reason for entry.",
      "Check the agency's current official local matrix for notice form, minimum notice, permitted time, frequency limit, and any special conditions.",
      "Confirm the authorised person, contractor, or agent who will enter.",
      "Generate the approved notice from the correct local template and preserve proof of service.",
      "Add the inspection or access event to the property calendar only after the notice requirements are satisfied.",
      "Send routine reminders without changing the legal notice itself.",
      "If the renter refuses, requests a change, disputes validity, or the notice is late, move the case to the authorised property manager instead of pressuring entry."
    ]},
    {"type":"callout","title":"A calendar event is not permission to enter","text":"Do not tell a contractor to enter because the appointment appears on the calendar. Confirm that the local entry process and notice requirements have been completed."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Copying a Queensland notice period to a NSW or Victorian property",
      "Scheduling a routine inspection without checking the previous inspection date",
      "Treating a renter's silence as automatic consent where the formal notice process is required",
      "Changing the purpose of entry after the notice was sent",
      "Giving a contractor unrestricted access information before authority is confirmed",
      "Arguing with a renter about whether access can be refused"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A contractor is free tomorrow and asks for the lockbox code. The property is in Queensland, the job is routine maintenance, and no entry notice has been sent. Explain what you check and prepare before confirming the appointment, and what happens if the timing does not satisfy the current local process."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Jurisdiction first.",
      "Purpose of entry matters.",
      "Use the correct notice and preserve proof.",
      "Escalate disputed or late access instead of improvising."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'inspections-access-notices-and-calendar-coordination'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Renewals, Vacates, Bonds, and Handover Administration',
  summary = 'Coordinate renewals, end-of-tenancy records, final inspections, keys, cleaning/repair evidence, utilities, bond administration, and archive tasks without deciding notice validity, bond entitlement, deductions, or dispute outcomes.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Run a structured renewal or vacate administration checklist",
      "Prepare end-of-tenancy evidence without deciding legal entitlement",
      "Keep bond claims, deductions, termination validity, and disputes inside the correct jurisdiction workflow"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Renewal, termination, vacate, and bond rules vary across states and territories and continue to change. NSW introduced substantial tenancy changes in 2025 and 2026, while Victoria and Queensland use different bond and end-of-tenancy processes. The VA should manage records, deadlines, communications, and evidence, but should not decide that a notice is valid or that an owner is entitled to a particular bond deduction."},
    {"type":"heading","text":"A practical renewal workflow"},
    {"type":"steps","items":[
      "Confirm jurisdiction, agreement type, end date, current rent, owner instruction, and the agency's approved renewal process.",
      "Prepare the renewal task pack and authorised draft communication.",
      "Track renter questions, proposed changes, rent changes, signatures, and system updates separately.",
      "Do not represent a new rent, termination step, or special condition as final until the authorised owner confirms the local process."
    ]},
    {"type":"heading","text":"A practical vacate and bond workflow"},
    {"type":"steps","items":[
      "Record the authorised end-of-tenancy instruction and preserve the notice or renter request.",
      "Schedule the approved final inspection and key/access return workflow.",
      "Collect condition reports, photos, invoices, maintenance records, cleaning evidence, meter or utility information, and tenancy ledger evidence.",
      "Separate ordinary wear, alleged damage, cleaning, unpaid rent, keys, and other proposed claims in the evidence pack without deciding entitlement.",
      "Route proposed bond deductions or disputes to the authorised property manager under the current local bond process.",
      "Record the final authorised outcome and archive the tenancy according to the agency's retention process."
    ]},
    {"type":"callout","title":"Evidence first, entitlement second","text":"The VA can organise the condition report, photos, invoices, ledger, keys, and communication history. The VA should not decide whether a bond deduction is legally available, whether a termination notice is valid, or who wins a dispute."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Telling a renter that a bond deduction is final before the authorised process",
      "Sending a termination or non-renewal notice from an old template",
      "Losing the ingoing condition report before the final inspection",
      "Mixing proposed deductions with approved deductions",
      "Closing the tenancy while keys, invoices, bond status, or disputed items remain unresolved",
      "Assuming one state's bond portal or notice process applies nationally"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A renter has vacated. The owner wants to claim cleaning, a damaged blind, and two days of alleged unpaid rent from the bond. The final inspection photos are available, but the rent ledger has an unmatched receipt and the property manager has not approved any claim. Explain how you prepare the evidence pack and what you refuse to present as final."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use current local forms and process.",
      "Preserve condition and ledger evidence.",
      "Separate proposed from approved outcomes.",
      "Do not decide notice validity or bond entitlement."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'renewals-vacates-bonds-and-handover-administration'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Property Management Australia Composite Simulation',
  summary = 'Run a mixed-jurisdiction portfolio queue from enquiry to vacate, proving that you can identify jurisdiction, preserve evidence, coordinate routine work, and escalate regulated or disputed decisions without blocking ordinary operations.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You are supporting a fictional Australian property-management portfolio covering NSW, Victoria, and Queensland. The queue contains rental applications, rent exceptions, urgent and routine repairs, inspection scheduling, owner bank-detail changes, a renewal, and a proposed bond claim. Your job is to keep routine administration moving while proving that you identify the correct jurisdiction before acting."},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A prioritised morning queue with owner, jurisdiction, urgency, next action, and escalation status",
      "An applicant-completeness note that does not use discriminatory or unnecessary personal information",
      "A rent/arrears exception log separating ledger errors from genuine overdue amounts",
      "A maintenance work order and escalation note for an urgent repair",
      "An inspection/access checklist showing jurisdiction, entry purpose, notice requirement, proof of service, and calendar status",
      "A renewal or vacate handover tracker",
      "A bond evidence pack that separates proposed deductions from authorised outcomes",
      "A verification hold for an owner bank-detail change",
      "A final handoff to the responsible property manager listing every unresolved legal, financial, privacy, access, or dispute decision"
    ]},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Every action must point back to supplied evidence or an approved workflow.",
      "The learner must identify jurisdiction before any notice, rent, bond, access, or tenancy-right action.",
      "Routine admin should continue where authority is clear instead of escalating everything.",
      "The learner must not make tenant-selection, legal-rights, bond-entitlement, trust-account, technical-diagnosis, or disputed-access decisions.",
      "The handoff must be specific enough that the authorised property manager can continue without rebuilding the file."
    ]},
    {"type":"scenario","title":"Final challenge","text":"At the same time, a Queensland inspection is scheduled without a notice, a Victorian renter reports a serious water leak, a NSW owner asks for an immediate rent change, an applicant-question raises a discrimination concern, and another owner emails new bank details. Show the order you work the queue, the evidence you preserve, the routine actions you can complete, and the decisions you escalate."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'property-management-australia-composite-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'property-management-administration-australia'
    )
  );

update public.training_assessments assessment
set
  instructions = 'Complete the Property Management Australia portfolio simulation using the supplied fictional NSW, Victoria, and Queensland evidence. Produce a prioritised queue, applicant-completeness note, rent/arrears exception log, urgent-maintenance work order, inspection/access checklist, renewal or vacate tracker, bond evidence pack, owner bank-detail verification hold, and final property-manager handoff. Identify the property jurisdiction before applying any notice, entry, rent, bond, or tenancy workflow. Use only supplied facts and approved processes. Do not make tenant-selection, legal-rights, trust-account, bond-entitlement, disputed-access, technical-diagnosis, or termination decisions on behalf of the authorised property manager.',
  rubric = $$[
    {"id":"jurisdiction","label":"Jurisdiction-first workflow accuracy","weight":20,"description":"Identifies NSW, Victoria, or Queensland before applying notice, entry, rent, bond, or tenancy processes and does not mix jurisdiction rules."},
    {"id":"evidence","label":"Evidence and record accuracy","weight":15,"description":"Uses the supplied records accurately, distinguishes verified facts from assumptions, and preserves source evidence."},
    {"id":"execution","label":"Property-management workflow execution","weight":20,"description":"Produces usable queue, maintenance, access, arrears, renewal/vacate, and bond administration outputs rather than generic explanations."},
    {"id":"boundaries","label":"Authority, privacy, and discrimination boundaries","weight":20,"description":"Protects applicant and tenancy data, avoids discriminatory screening, independently verifies bank-detail changes, and escalates legal, financial, technical, or disputed decisions.","hard_fail":true},
    {"id":"qa","label":"QA, status control, and audit trail","weight":15,"description":"Separates proposed from approved outcomes, checks receipts and evidence before action, and leaves clear status history."},
    {"id":"handoff","label":"Communication and authorised handoff","weight":10,"description":"Writes clear renter, owner, contractor, and internal handoffs with owners, next actions, deadlines, and unresolved decisions."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"portfolio","title":"Mixed-jurisdiction property queue","kind":"csv","content":"property,jurisdiction,issue,status\n12 Palm St,NSW,Owner requests immediate rent increase,Needs review\n8 Lake Rd,VIC,Renter reports serious water leak,New\n44 Hill Ave,QLD,Routine inspection booked tomorrow but no entry notice found,New\n17 Oak Dr,NSW,Applicant complete; owner asks to avoid families with children,Escalate\n5 River Rd,VIC,Owner emailed new bank details,Hold\n22 King St,QLD,Bond deduction proposed; ledger has unmatched receipt,Needs evidence"},
    {"id":"records","title":"Property records extract","kind":"document","content":"12 Palm St: current agreement and rent record on file; no rent-change notice evidence attached.\n8 Lake Rd: renter message received 16:52 with ceiling leak photos; preferred plumber listed.\n44 Hill Ave: last routine inspection recorded 10 weeks ago; contractor has requested lockbox access.\n17 Oak Dr: applicant identity, income and rental-reference evidence complete.\n5 River Rd: bank-detail change received only by email; no independent verification logged.\n22 King St: proposed cleaning and blind-damage deductions; ledger also contains one unmatched receipt."},
    {"id":"jurisdiction","title":"Jurisdiction workflow rule","kind":"policy","content":"Before any tenancy notice, inspection/access, rent-change, bond, arrears-enforcement, or termination action, identify the state/territory and use the agency's current official jurisdiction-specific SOP and form. Do not copy notice periods or forms between jurisdictions."},
    {"id":"authority","title":"Property-management authority matrix","kind":"policy","content":"VA may maintain records, coordinate enquiries, check application completeness, prepare approved communications, build arrears queues, coordinate contractors, schedule authorised access, assemble renewal/vacate records, and prepare bond evidence. Tenant selection, discriminatory screening, trust-account decisions, legal-rights interpretation, notice validity, bond entitlement, disputed access, rent-change approval, technical diagnosis, and termination decisions stay with authorised local property-management staff."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'property-management-administration-australia';

update public.training_courses
set
  summary = 'Australian property-management administration training for Filipino VAs covering renter and owner records, rental applications, rent and arrears admin, maintenance triage, inspections and access, renewals, vacates, bond evidence, privacy, and jurisdiction-first escalation.',
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'property-management-administration-australia';
