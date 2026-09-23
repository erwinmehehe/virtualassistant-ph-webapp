-- Refresh Mortgage Broking Administration Australia against current 2026
-- ASIC, Moneysmart, and OAIC guidance. The course teaches operational support
-- without treating a "VA" job title as an exemption from credit regulation.

update public.training_lessons
set
  title = 'Australian Mortgage Broking Model, Licensing, and VA Boundaries',
  summary = 'Map the Australian mortgage-broking workflow, identify the licence or representative structure, and separate routine administration from conduct that may amount to credit assistance or advice.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Understand the mortgage-broking workflow from enquiry through settlement",
      "Identify the broker's Australian credit licence or representative structure",
      "Recognise when a task moves from administration into regulated credit assistance or advice"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Australian mortgage brokers must be licensed to give credit advice or operate as representatives of a licensee, and mortgage brokers must act in the consumer's best interests when providing credit assistance. A VA job title does not by itself make regulated conduct unregulated. The practical question is what the person actually does, under whose authority, and within which approved process."},
    {"type":"heading","text":"Core workflow"},
    {"type":"steps","items":[
      "Identify the broker, licensee, aggregator or representative structure used by the business.",
      "Confirm the VA's documented scope, system permissions, supervision, approved scripts, and escalation owner.",
      "Map enquiry, intake, fact find, evidence collection, broker assessment, lender research, application, conditions, approval, settlement, and post-settlement administration.",
      "Mark the points where a consumer may ask for a recommendation, borrowing-capacity opinion, suitability view, product comparison conclusion, or other credit assistance.",
      "Route those judgment points to the authorised broker rather than answering from a script, lender portal, or personal experience.",
      "Use individual system accounts and preserve who performed each material action."
    ]},
    {"type":"callout","title":"Job title is not the boundary","text":"Do not assume that being called an assistant, processor, VA, or administrator automatically makes every task non-regulated. Follow the licensee's approved role design and supervision. Do not independently suggest a lender or product, tell a consumer what they can afford, assess suitability, or hold yourself out as a mortgage broker or credit representative."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Answering 'Which lender should I choose?' because the comparison table looks obvious",
      "Using the broker's login to complete actions that should be attributable to the broker",
      "Calling a lender option suitable or best before broker review",
      "Treating compliance documents as optional paperwork",
      "Assuming offshore or contractor status changes the underlying conduct"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A client asks you which of two lender options is best and whether they can afford the higher loan amount. The broker is in another meeting. Show the response you give, the facts you can record, and the handoff you create without giving credit assistance yourself."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Know the licence and representative structure.",
      "Use named accounts and approved permissions.",
      "Keep recommendation and suitability judgments with the authorised broker.",
      "Document handoffs."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-mortgage-broking-model-licensing-and-va-boundaries'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Client Enquiry, Identity, Privacy, and Document Intake',
  summary = 'Collect and track only the financial and identity information required by the approved brokerage process, use secure channels, preserve source evidence, and keep document completeness separate from credit judgment.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Run a secure mortgage document-intake checklist",
      "Apply data-minimisation thinking to financial and identity information",
      "Flag document inconsistencies without deciding what they prove"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Mortgage files can contain identity documents, payslips, bank statements, tax records, employment details, living expenses, liabilities, assets, property documents, dependants, and other highly sensitive information. The OAIC's May 2026 APP 3 guidance reinforces data minimisation: covered organisations should collect only personal information reasonably necessary for their functions and collect it by lawful and fair means."},
    {"type":"heading","text":"A practical intake workflow"},
    {"type":"steps","items":[
      "Confirm the client and the approved matter or opportunity before requesting documents.",
      "Use the brokerage's current checklist rather than asking for documents from memory.",
      "Collect documents through the approved secure portal or storage workflow where available.",
      "Record the document type, source, received date, relevant period, and whether all pages are present and readable.",
      "Check simple administrative consistency such as client name, date range, obvious missing pages, and whether the document matches the requested category.",
      "Flag inconsistent employer names, unexplained gaps, missing liabilities, outdated documents, or conflicting figures to the broker.",
      "Do not decide that income is acceptable, an expense can be ignored, a liability does not matter, or a document proves serviceability."
    ]},
    {"type":"callout","title":"Collect what the process needs","text":"Do not request extra financial or identity information simply because it might be useful later. Follow the approved brokerage process, collect only what is required for the legitimate workflow, and keep sensitive documents out of personal storage and open team chat."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Downloading client files to a personal device or personal cloud drive",
      "Forwarding identity documents through broad internal channels",
      "Requesting an entire financial history when only a defined period is required",
      "Editing a client figure because another document shows a different amount",
      "Telling the client which expense or liability to omit",
      "Marking an inconsistent file complete just to move the application forward"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A payslip shows one employer name, the bank credit description shows another, and the client says it is the same employer after a restructure. Explain what you record, which source files you preserve, and what goes to broker review instead of being silently corrected."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use secure approved channels.",
      "Collect the minimum required information.",
      "Check completeness, not creditworthiness.",
      "Preserve inconsistencies for broker review."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'client-enquiry-identity-privacy-and-document-intake'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Fact-Find Data Entry, Requirements, Objectives, and Financial Position Support',
  summary = 'Turn client-supplied facts and evidence into a traceable broker-review file without changing income, expenses, liabilities, objectives, or other facts to improve serviceability.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Support accurate fact-find data entry with source references",
      "Separate client statements from broker assessment and verification",
      "Build a contradiction and missing-information queue rather than fixing judgment issues yourself"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ASIC's responsible-lending framework requires reasonable inquiries into the consumer's requirements and objectives and financial situation, reasonable steps to verify the financial situation, and a preliminary assessment when credit assistance is provided. A VA can organise the evidence and data, but the broker or responsible licensee process owns the assessment and credit judgment."},
    {"type":"heading","text":"A practical fact-find workflow"},
    {"type":"steps","items":[
      "Enter client information from the approved source and retain the source reference.",
      "Preserve the client's own stated requirements and objectives where the process requires their wording.",
      "Record income, expenses, assets, liabilities, dependants, commitments, property details, and other fields without smoothing or normalising inconvenient facts.",
      "Create a contradiction queue when documents and client statements differ.",
      "Create a missing-evidence queue where a fact needs support under the approved process.",
      "Send the broker a concise review note showing the field, source, conflict, and action required.",
      "Record the broker-approved correction or clarification without erasing the original audit trail."
    ]},
    {"type":"callout","title":"Data entry is not a serviceability edit","text":"Do not reduce expenses, omit liabilities, change dependants, relabel debts, increase income, or rewrite objectives to make the client fit a lender policy. Do not decide that the proposed loan is not unsuitable."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Copying a previous fact find without reconfirming changed circumstances",
      "Turning a broker note into a client statement",
      "Rounding down expenses to improve a result",
      "Deleting a liability because the client says it will be paid later",
      "Replacing conflicting evidence with whichever number is more favourable",
      "Marking a fact verified when only a client statement exists"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The new fact find says monthly living expenses are lower than last year's file, one liability is missing from the new form, and a bank statement shows a recurring payment not yet categorised. Build the exception note you would give the broker without deciding the client's true expense level or suitability."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Keep source and date for important facts.",
      "Preserve contradictions.",
      "Do not coach the file toward a lender.",
      "Keep the assessment with the authorised broker."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'fact-find-data-entry-requirements-objectives-and-financial-position-support'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Product and Lender Research Support Without Recommendation',
  summary = 'Build dated, source-linked lender and product research for broker review without turning factual comparison into a recommendation, best-interests conclusion, or suitability decision.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Research lender policies, products, rates, features, fees, and turnaround information from approved current sources",
      "Separate facts from recommendation and broker best-interests analysis",
      "Preserve checked dates, sources, assumptions, and unresolved policy questions"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Mortgage brokers must act in the consumer's best interests when providing credit assistance and prioritise the consumer's interests where a conflict exists. Moneysmart's September 2026 guidance also tells consumers that brokers work with them to understand needs and goals, consider affordability, explain options, and manage the process to settlement. A VA may prepare factual research, but the broker must decide how the consumer's circumstances affect the recommendation."},
    {"type":"heading","text":"A practical research workflow"},
    {"type":"steps","items":[
      "Start with the broker's research question and the facts the broker has approved for research use.",
      "Use approved lender, aggregator, product, pricing, and policy sources.",
      "Record lender, product, rate or feature, policy fact, fees where relevant, eligibility fact, source, and checked date.",
      "Keep a separate notes column for assumptions and unresolved policy interpretation.",
      "Do not rank options as best, most suitable, safest, cheapest overall, or recommended unless that conclusion is supplied by the authorised broker.",
      "Flag conflicts such as a lower rate with materially different fees, features, restrictions, service levels, or policy conditions.",
      "Hand the comparison to the broker for best-interests and suitability analysis."
    ]},
    {"type":"callout","title":"Facts can be compared; recommendations belong to the broker","text":"You may say 'Lender A's published rate is X as checked on this date' or 'Policy B states this requirement'. Do not tell the consumer which lender, rate, fixed or variable structure, offset, term, package, or feature they should choose."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Ranking lenders by rate alone",
      "Using an old lender-policy screenshot with no checked date",
      "Treating aggregator search results as the broker's recommendation",
      "Calling a product best value without broker analysis",
      "Ignoring fees or restrictions because the headline rate is lower",
      "Copying another client's recommended lender into a new file"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Your comparison shows Lender A has a lower headline rate, Lender B has a different fee structure and feature set, and Lender C has the fastest stated turnaround. The client asks which one they should use. Show the factual comparison you can prepare and the recommendation question you hand to the broker."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use current approved sources.",
      "Date-stamp research.",
      "Do not rank for the consumer.",
      "Preserve the broker decision separately from the research table."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'product-and-lender-research-support-without-recommendation'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Application Packaging, Submission, Disclosures, and Lender Conditions',
  summary = 'Prepare an auditable application pack, track required credit disclosures and approvals, submit only through the brokerage’s authorised process, and manage lender conditions without inventing or altering client facts.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Prepare a complete application package with traceable source documents",
      "Track credit guide, quote, proposal, and assessment administration where the brokerage process requires them",
      "Manage lender conditions as an exception queue without making credit decisions"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"ASIC's disclosure guidance distinguishes the credit guide, quote, proposal document, and written preliminary assessment. Which documents apply depends on the entity and circumstances. The VA should follow the licensee's approved workflow and record when required documents were generated, issued, accepted, or requested rather than guessing the legal requirement."},
    {"type":"heading","text":"Application pack workflow"},
    {"type":"steps","items":[
      "Confirm the broker has approved the lender and product selection before packaging the application.",
      "Check the application fields against the latest fact find and approved source documents.",
      "Verify the required attachments are present, readable, current under the lender workflow, and stored in the approved location.",
      "Track required brokerage disclosures and evidence of issue or acceptance according to the approved compliance checklist.",
      "Submit only through the authorised brokerage, aggregator, or lender workflow and under the correct user identity.",
      "Record submission date, reference number, lender status, next follow-up, and owner.",
      "Turn every lender condition into a discrete task with source, due date, client request if needed, broker owner, and completion evidence."
    ]},
    {"type":"callout","title":"Packaging is not permission to change the story","text":"Do not alter income, employment, expenses, liabilities, loan purpose, deposit source, occupancy, property details, or supporting documents to make an application satisfy a lender condition. Do not sign, accept, or attest for the client or broker unless the approved process and authority explicitly allow that action."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Submitting before the broker has approved the lender and product",
      "Uploading an older document because it is easier than requesting the current one",
      "Copying a compliance date from another file",
      "Treating a quote or disclosure record as complete without evidence it was handled correctly",
      "Changing a client answer to match lender policy",
      "Marking a condition satisfied before the lender or broker process confirms it"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The application is ready except the latest payslip is missing, the client changed an employment detail after the broker's review, and one disclosure record has no evidence of issue. Build the submission hold and broker handoff. Do not solve the gaps by using an older document or editing the approved application."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Submit the broker-approved file.",
      "Track disclosure evidence.",
      "Make conditions discrete tasks.",
      "Never manufacture a clean file."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'application-packaging-submission-and-lender-conditions'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Valuations, Conditional Approval, Documents, and Pre-Settlement Tracking',
  summary = 'Run a clean approval-to-settlement conditions register covering valuations, outstanding evidence, lender documents, client signatures, property milestones, expiry dates, and unresolved exceptions.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Track conditional approval and outstanding lender requirements precisely",
      "Coordinate valuations and document requests without promising lender outcomes",
      "Build a pre-settlement readiness view that separates complete, pending, expired, and blocked items"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Conditional approval is not the same as unconditional approval or settlement. A file can still depend on valuation outcomes, evidence, updated documents, lender checks, executed loan documents, property or conveyancing milestones, insurance, funds to complete, or other lender conditions. Good administration makes those dependencies visible."},
    {"type":"heading","text":"A practical conditions workflow"},
    {"type":"steps","items":[
      "Record the lender status exactly as received rather than translating it into 'approved'.",
      "Create a conditions register with requirement, source, owner, due date, status, evidence, and lender confirmation.",
      "Coordinate valuation access and appointments without interpreting the valuation result.",
      "Request updated documents using the approved client checklist.",
      "Track document issue, return, signatures, witness or verification status where applicable, and any expiry date.",
      "Keep broker, lender, conveyancer or solicitor, client, and property milestones separated by owner.",
      "Escalate adverse valuation outcomes, changed circumstances, new liabilities, expired approvals, policy questions, or conditions that require a broker judgment."
    ]},
    {"type":"callout","title":"Conditional is conditional","text":"Do not tell the client the loan is fully approved, safe to go unconditional, or guaranteed to settle unless the authorised broker has confirmed the correct status and communication."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Calling conditional approval final approval",
      "Ignoring an approval or document expiry date",
      "Telling the client what a valuation means for borrowing capacity",
      "Combining lender and conveyancer conditions into one unclear status",
      "Closing a condition because the client sent a file rather than because the required process accepted it",
      "Promising a settlement date before dependencies are confirmed"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"The lender has issued conditional approval. The valuation is lower than expected, one bank statement has expired under the lender workflow, and the client asks whether they should still exchange contracts. Build the conditions register and escalation without giving legal, credit, or borrowing advice."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use exact lender status.",
      "Track each condition separately.",
      "Watch expiry dates and changed circumstances.",
      "Do not promise approval or settlement."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'valuations-conditional-approval-documents-and-pre-settlement-tracking'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Settlement, Post-Settlement, CRM, and Referral Administration',
  summary = 'Coordinate settlement dependencies, confirm outcomes from authoritative sources, close the file cleanly, protect client data, and run approved post-settlement follow-up without making new credit recommendations.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Track settlement readiness and outstanding dependencies",
      "Record settlement from authoritative confirmation rather than assumption",
      "Complete CRM, document, commission/referral, review, and follow-up administration cleanly"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"The mortgage broker process continues through settlement and often beyond it. Moneysmart's September 2026 guidance describes brokers as helping consumers manage the home-loan process through settlement. Good post-settlement administration keeps records accurate without turning routine follow-up into a fresh product recommendation."},
    {"type":"heading","text":"A practical settlement workflow"},
    {"type":"steps","items":[
      "Maintain the settlement checklist with lender, client, conveyancer or solicitor, property, insurance, funds, and document dependencies where relevant to the file.",
      "Confirm the scheduled settlement date only from the authorised process.",
      "Record successful settlement only when the authoritative confirmation arrives.",
      "If settlement is delayed, capture the reason, owner, next action, revised timing, and client communication owner.",
      "Update CRM stage, lender and loan reference data, final settled amount if supplied by the authorised source, and required document locations.",
      "Track commission or referral administration as records only; do not alter the consumer-facing recommendation because of remuneration.",
      "Send approved post-settlement messages, review requests, anniversary tasks, or referral follow-up without implying new credit advice."
    ]},
    {"type":"callout","title":"Settlement admin does not reopen the recommendation","text":"A client asking whether they should refinance, fix their rate, switch lender, increase the loan, or change features is a new advice or credit-assistance conversation for the broker, not a routine CRM response for the VA."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Marking a loan settled because the scheduled time passed",
      "Telling the client settlement is guaranteed",
      "Using commission information to steer future recommendations",
      "Leaving identity and financial files in ad hoc shared folders after the file is closed",
      "Giving a refinancing opinion during an anniversary call",
      "Sending a generic review request while an unresolved complaint or settlement issue is open"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Settlement was scheduled for 14:00 but no final confirmation has arrived and the conveyancer has raised a last-minute funds issue. The client asks whether everything is done and then asks if they should refinance another property with the same lender. Show the two separate handoffs."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Confirm, do not assume, settlement.",
      "Close records cleanly.",
      "Keep remuneration records separate from consumer recommendation.",
      "Route new credit questions back to the broker."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'settlement-post-settlement-crm-and-referral-administration'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_lessons
set
  title = 'Mortgage Broking Administration Australia Composite Simulation',
  summary = 'Run an evidence-based mortgage administration file from intake through settlement while preserving source facts, current lender research, disclosure records, conditions, privacy, and broker-only credit judgments.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You support a fictional Australian mortgage-broking business. A client file contains identity and income documents, a fact find with inconsistencies, a lender comparison prepared on different checked dates, a missing disclosure record, lender conditions, a valuation issue, and a settlement deadline. Your job is to move routine administration forward without changing facts or making the broker's recommendation."},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A prioritised file action plan with owner, due date, dependency, and escalation status",
      "A document-intake and privacy checklist",
      "A fact-find contradiction and missing-evidence log",
      "A dated lender research table that separates facts from recommendation",
      "An application submission readiness checklist",
      "A disclosure and evidence tracker for the brokerage's approved credit process",
      "A lender-conditions register with valuation and expiry exceptions",
      "A pre-settlement checklist",
      "A final broker handoff listing every unresolved credit, suitability, best-interests, privacy, disclosure, or changed-circumstance decision"
    ]},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Every material field or conclusion must point to supplied evidence, an approved workflow, or the authorised broker decision.",
      "The learner must preserve contradictions instead of editing the file to fit lender policy.",
      "Research must include source and checked date.",
      "The learner must distinguish conditional approval, unconditional approval, and settlement.",
      "No lender or product recommendation, borrowing-capacity conclusion, suitability judgment, or best-interests conclusion may be invented by the learner."
    ]},
    {"type":"scenario","title":"Final challenge","text":"The latest payslip is missing, a liability appears in one source but not the fact find, the lowest-rate research row is the oldest, the client asks which lender is best, a valuation condition remains open, and settlement is due soon. Show the order you work the file, what you can complete, what you place on hold, and what only the broker can decide."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'mortgage-broking-administration-australia-composite-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (
      select id from public.training_courses
      where slug = 'mortgage-broking-administration-australia'
    )
  );

update public.training_assessments assessment
set
  instructions = 'Complete the Mortgage Broking Administration Australia file simulation using the supplied fictional evidence. Produce a prioritised action plan, secure document-intake checklist, fact-find contradiction log, dated lender research table, submission readiness checklist, disclosure/evidence tracker, lender-conditions register, pre-settlement checklist, and final broker handoff. Preserve every supplied source fact and flag contradictions instead of changing the file to fit a lender. Do not recommend a lender or product, assess borrowing capacity or suitability, make a best-interests conclusion, decide that a credit contract is not unsuitable, or provide legal or financial advice.',
  rubric = $$[
    {"id":"evidence","label":"Evidence and source accuracy","weight":20,"description":"Uses the supplied client, document, lender, and status records accurately, preserves contradictions, and identifies missing or stale evidence."},
    {"id":"execution","label":"Mortgage administration workflow execution","weight":20,"description":"Produces usable intake, fact-find, research, submission, condition, settlement, and CRM outputs rather than generic explanations."},
    {"id":"research","label":"Research currency and separation from recommendation","weight":15,"description":"Records source and checked date, flags stale or conflicting lender information, and leaves the consumer recommendation to the authorised broker."},
    {"id":"boundaries","label":"Credit, privacy, and authority boundaries","weight":20,"description":"Protects sensitive information and does not invent lender/product recommendations, borrowing-capacity conclusions, suitability, best-interests conclusions, or broker attestations.","hard_fail":true},
    {"id":"qa","label":"Disclosure, condition, and status QA","weight":15,"description":"Tracks required workflow evidence, exact approval status, condition ownership, expiry dates, and settlement dependencies without marking incomplete items complete."},
    {"id":"handoff","label":"Broker and client handoff quality","weight":10,"description":"Creates clear handoffs with facts, owners, due dates, unresolved decisions, and next actions without giving credit advice."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"file","title":"Client file checklist","kind":"csv","content":"item,status,issue\nIdentity documents,Complete,None\nLatest payslip,Missing,Only prior pay period on file\nBank statements,Complete,One recurring payment uncategorised\nLiving expenses,Entered,Lower than previous fact find\nExisting liabilities,Conflict,One liability appears on statement but not current fact find\nProperty contract,Complete,None"},
    {"id":"research","title":"Lender research extract","kind":"csv","content":"lender,headline_rate,feature_or_policy,checked_date,status\nLender A,5.89%,Offset available,2026-09-12,Older research\nLender B,5.99%,Different fee structure,2026-09-23,Current\nLender C,6.05%,Fast stated turnaround,2026-09-23,Current"},
    {"id":"conditions","title":"Application and conditions register","kind":"csv","content":"item,status,owner\nBroker lender/product approval,Approved,Broker\nCredit guide evidence,Recorded,Admin\nProposal document evidence,Missing,Broker/admin review\nApplication submission,Ready pending holds,Admin\nValuation,Open,Broker/lender\nUpdated payslip,Missing,Client\nSettlement target,2026-10-02,Broker/conveyancer"},
    {"id":"scope","title":"Mortgage administration authority matrix","kind":"policy","content":"VA may collect approved documents, enter source data, preserve contradictions, prepare dated lender research, package broker-approved applications, track approved disclosure workflows, manage lender-condition tasks, coordinate settlement administration, and maintain CRM records. Lender/product recommendation, borrowing-capacity judgment, suitability or not-unsuitable assessment, best-interests conclusion, legal/financial advice, and regulated credit assistance stay with the appropriately authorised broker or licensee process."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'mortgage-broking-administration-australia';

update public.training_courses
set
  summary = 'Australian mortgage-broking administration training for Filipino VAs covering secure client intake, fact-find support, dated lender research, application packaging, credit-process evidence, lender conditions, valuations, settlement, CRM, privacy, and broker-only credit judgments.',
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'mortgage-broking-administration-australia';
