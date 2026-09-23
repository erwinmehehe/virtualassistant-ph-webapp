-- Release-quality pass for Virtual Assistant Foundations.
-- Tightens the course from 375 to 240 lesson minutes, replaces repetitive
-- template-style sections with concrete work outputs, records editorial review,
-- publishes the practical assessment, and finally publishes the course.
--
-- Apply only after the assessment-submission/review code is deployed.

update public.training_courses
set
  summary = 'A practical four-hour foundation for Filipino Virtual Assistants covering client communication, inbox and calendar work, files and spreadsheets, task management, research, responsible AI use, and reliable handoffs.',
  estimated_minutes = 240,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'draft',
  published_at = null,
  updated_at = now()
where slug = 'virtual-assistant-foundations';

update public.training_lessons
set
  summary = 'Understand what clients mean by ownership, where your authority stops, and what reliable remote support looks like.',
  estimated_minutes = 15,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Your job is to make work easier to trust"},
    {"type":"paragraph","text":"A Virtual Assistant supports a business remotely, but the job is not defined by one fixed task list. What matters is the work you are trusted to move forward: scheduling, customer follow-up, research, admin, CRM updates, documents, reporting, or another repeatable process."},
    {"type":"heading","text":"Task, responsibility, outcome"},
    {"type":"list","items":["Task: send the meeting reminder.","Responsibility: keep the meeting confirmed, accurate, and visible to the people who need it.","Outcome: the right people attend at the right time with the right context."]},
    {"type":"callout","title":"Ownership is not unlimited authority","text":"Own the process you were assigned. Do not invent permission to change prices, approve refunds, commit money, or make another high-impact decision just to look proactive."},
    {"type":"heading","text":"What reliable ownership looks like"},
    {"type":"list","items":["You understand the intended result before starting.","You identify missing information early.","You leave a visible record of what changed.","You raise exceptions before they become surprises.","You know which decisions still belong to the client."]},
    {"type":"scenario","title":"Work output: clarify a vague request","text":"Your client writes: 'Can you handle tomorrow's supplier meeting?' Draft the shortest useful reply that confirms the time zone, attendees, meeting link, agenda, reminders, and whether you are expected to take notes. Do not ask questions whose answers are already available in the calendar or thread."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'what-a-virtual-assistant-actually-does';

update public.training_lessons
set
  summary = 'Protect client access, private information, commitments, and professional boundaries without becoming rigid or slow.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Professional means predictable"},
    {"type":"paragraph","text":"Clients do not need corporate-sounding messages. They need predictable behaviour: you show up when agreed, communicate changes, protect access, check your work, and do not make promises you are not authorised to make."},
    {"type":"heading","text":"Five boundaries to protect"},
    {"type":"list","items":["Access: use only the accounts, folders, systems, and permissions required for your work.","Confidentiality: keep customer data, internal pricing, screenshots, conversations, credentials, and private documents inside approved workflows.","Accuracy: do not mark work complete until you have checked the important details.","Availability: state your working hours clearly instead of creating a 24/7 expectation.","Authority: escalate refunds, payments, contracts, pricing changes, regulated advice, and other high-impact decisions unless the client explicitly delegated them."]},
    {"type":"heading","text":"Handle access safely"},
    {"type":"steps","items":["Use the client's approved password manager or access-sharing method.","Keep work and personal accounts separate where practical.","Use multi-factor authentication when required.","Never paste passwords, API keys, recovery codes, or sensitive customer data into an unapproved tool or AI service.","Ask before using access that appears broader than your task requires."]},
    {"type":"callout","title":"Anonymised does not always mean safe","text":"Removing a company name from a screenshot may still leave customer details, pricing, unique workflows, or other information that identifies the business."},
    {"type":"scenario","title":"Work output: portfolio decision","text":"You improved a client's messy spreadsheet and want a portfolio sample. The client never gave permission. Write a two-sentence decision: what you will not publish, and how you will create a fictional sample that demonstrates the same skill without exposing the client's data."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'professional-standards-boundaries-and-confidentiality';

update public.training_lessons
set
  summary = 'Write short client messages that make status, decisions, ownership, and next steps obvious.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"A useful message reduces uncertainty"},
    {"type":"paragraph","text":"Remote work produces more written communication than an office. A good message lets the client understand the point quickly without asking what happened, what you need, or who acts next."},
    {"type":"heading","text":"Use four parts when the message matters"},
    {"type":"steps","items":["Point: lead with what changed, what is complete, or what you need.","Context: add only the facts needed to understand the issue.","Next action: say who owns the next step.","Timing: include the deadline or checkpoint when it matters."]},
    {"type":"paragraph","text":"Weak: 'Hi, just checking on this. Let me know.' Better: 'The supplier has not confirmed Friday's delivery. I followed up at 10:15 AM Manila time. If there is no reply by 2 PM, should I call the account number or move delivery to Monday?'"},
    {"type":"callout","title":"Do not restart an active conversation","text":"Inside an active thread you usually do not need another 'Hi [Name]' on every reply. Continue naturally unless the context or audience has changed."},
    {"type":"heading","text":"Before sending"},
    {"type":"list","items":["The point is clear in the first two lines.","Facts and assumptions are separated.","Questions are specific enough to answer quickly.","The relevant task, file, ticket, or source is linked.","Names, dates, promises, recipients, and attachments are checked."]},
    {"type":"scenario","title":"Work output: one message, three decisions","text":"You need approval on a draft, confirmation of a meeting time, and access to a folder. Write one client message using numbered questions. Put the most time-sensitive decision first and avoid filler greetings or repeated context."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'clear-written-client-communication';

update public.training_lessons
set
  summary = 'Give useful updates, ask focused questions, report mistakes early, and escalate the decisions that need the client.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Do not make the client chase the work"},
    {"type":"paragraph","text":"You do not need to report every click. Update the client when something changes timing, quality, cost, customer experience, access, or a decision they need to make."},
    {"type":"heading","text":"Ask after doing reasonable homework"},
    {"type":"steps","items":["Read the full brief, thread, SOP, and linked documents.","Check whether the answer already exists in the task history or knowledge base.","State what you found and exactly where you are blocked.","Ask the smallest question that unlocks the work.","When safe options exist, present them instead of sending an open-ended 'What should I do?'"]},
    {"type":"heading","text":"Report mistakes with facts, not theatre"},
    {"type":"steps","items":["State what happened.","State the impact you can actually confirm.","Take any safe, reversible action already inside your authority.","Identify the decision or approval still needed.","Record the prevention step for next time."]},
    {"type":"callout","title":"Unknown is an acceptable answer","text":"If you are still checking the impact, say so. 'I am confirming whether the message reached the full list' is better than guessing that everything is fine."},
    {"type":"list","items":["Escalate privacy or security concerns.","Escalate changes to price, contracts, payroll, refunds, or other material commitments.","Escalate legal threats, chargebacks, serious complaints, or safety issues.","Escalate conflicting instructions you cannot resolve from the source material.","Escalate irreversible actions when your authority is unclear."]},
    {"type":"scenario","title":"Work output: mistake update","text":"You invited a customer to 10:00 AM instead of 11:00 AM for a meeting tomorrow. Draft the client update in five lines or fewer, then list the safe corrective actions you can take before the client replies."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'updates-questions-mistakes-and-escalation';

update public.training_lessons
set
  summary = 'Triage messages by consequence, prepare safe replies, and leave a visible follow-up trail.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Inbox zero is not the objective"},
    {"type":"paragraph","text":"A quiet inbox can still be badly managed if the important message is buried or nobody owns the follow-up. The objective is correct action at the correct time."},
    {"type":"heading","text":"Triage by consequence"},
    {"type":"steps","items":["Identify messages with a real deadline, customer impact, money, access, or security consequence.","Separate messages you can handle from messages that need a client decision.","Turn follow-up into a task or reminder instead of relying on memory.","File notifications, receipts, newsletters, and reference material using the client's agreed system.","Leave sensitive or unusual items visible in the daily handoff."]},
    {"type":"heading","text":"Draft replies without overstepping"},
    {"type":"list","items":["Keep context in the existing thread.","Do not promise dates, prices, refunds, or outcomes outside your authority.","Check recipients, links, attachments, dates, names, and time zones.","If you are drafting in the client's voice, flag anything you are unsure about.","A password-reset alert the client did not request is a security signal, not routine inbox cleanup."]},
    {"type":"callout","title":"New is not the same as urgent","text":"Urgency comes from the consequence of waiting, not from how recently the message arrived."},
    {"type":"scenario","title":"Work output: Monday triage","text":"Rank these six items in the order you would investigate them and give one-line reasoning for each: an unrequested password reset, a customer cancelling tomorrow's appointment, an overdue supplier invoice notice, a request for an old receipt, a meeting transcript, and a newsletter."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'inbox-management';

update public.training_lessons
set
  summary = 'Schedule accurately across time zones and create meeting records that prevent avoidable follow-up.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Calendar work is small-detail risk management"},
    {"type":"paragraph","text":"A calendar event can waste several people's time if one detail is wrong. Check the date, time zone, duration, attendees, meeting location or link, preparation, and approval rules before sending."},
    {"type":"heading","text":"Before you schedule"},
    {"type":"list","items":["Know the client's working hours and protected time.","Know which calendar is the source of truth.","Confirm the time zone for external attendees when it is not explicit.","Check buffers, travel time, holds, and conflicting commitments.","Know which meetings you may schedule directly and which need approval."]},
    {"type":"heading","text":"A complete event should answer"},
    {"type":"list","items":["What is this meeting for?","Who needs to attend?","When is it, in the correct time zone?","Where is the location or meeting link?","What should attendees read or prepare?","What follow-up system needs updating after the meeting?"]},
    {"type":"callout","title":"Never guess a time zone","text":"If someone writes '3 PM' and people are in different regions, confirm the zone. Daylight-saving changes make familiar offsets unreliable."},
    {"type":"scenario","title":"Work output: Sydney and Manila","text":"Your Sydney client asks you to book '10 AM Thursday' with a candidate in Manila. Write the exact clarification you would send before booking, then list the fields that must appear in the final calendar event."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'calendar-and-meeting-coordination';

update public.training_lessons
set
  summary = 'Build a file system another person can search, permission safely, and continue using without asking you for directions.',
  estimated_minutes = 15,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"A good file system survives your absence"},
    {"type":"paragraph","text":"If another person cannot find the correct document without asking where you saved it, the system depends too much on memory."},
    {"type":"heading","text":"Keep the structure boring and obvious"},
    {"type":"list","items":["Organise around stable business functions or projects instead of vague folders such as 'important'.","Use consistent file names with the subject plus a useful date or version when needed.","Avoid chains such as FINAL, FINAL2, and FINAL-REAL.","Link to the source document instead of creating unnecessary copies.","Separate active work from archive material."]},
    {"type":"heading","text":"Permissions are part of the work"},
    {"type":"steps","items":["Check current access before changing sharing.","Use the least access required: viewer, commenter, or editor.","Do not make a private folder public just to avoid a permission problem.","Confirm the destination account before transferring ownership.","Remove access according to the client's offboarding process."]},
    {"type":"callout","title":"Version history beats duplicate chaos","text":"When several versions already exist, identify the source of truth before renaming, moving, deleting, or creating another copy."},
    {"type":"scenario","title":"Work output: the messy folder","text":"You inherit Client List.xlsx, Client List NEW.xlsx, Client List FINAL.xlsx, and Client List use this one.xlsx. Write the four checks you would perform before changing any file, then propose one durable naming convention."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'drive-docs-and-file-organization';

update public.training_lessons
set
  summary = 'Keep everyday spreadsheet data consistent, recoverable, and easy to filter, review, and hand off.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Treat a working spreadsheet like structured data"},
    {"type":"paragraph","text":"Businesses often use Sheets or Excel for leads, invoices, contacts, inventories, content, and schedules. The first responsibility is keeping the structure consistent enough that sorting, filtering, formulas, and review still work."},
    {"type":"heading","text":"Protect the table"},
    {"type":"list","items":["One row should usually represent one record.","Each column should have one clear meaning.","Keep dates, numbers, statuses, and free-form notes in appropriate columns.","Avoid merged cells inside working data tables.","Do not change formulas, validation rules, hidden tabs, or protected ranges until you understand why they exist."]},
    {"type":"heading","text":"Useful everyday skills"},
    {"type":"list","items":["Sort and filter without separating related columns.","Freeze headers.","Use SUM, COUNT, COUNTA, IF, and basic date functions when needed.","Use data validation for controlled choices such as status.","Define what counts as a duplicate before removing records.","Keep imported raw data separate from cleaned or reporting views when possible."]},
    {"type":"callout","title":"Make destructive cleanup recoverable","text":"Before bulk deletion, replacements, duplicate removal, or column splitting, confirm that version history or a recoverable copy exists."},
    {"type":"scenario","title":"Work output: clean a lead list safely","text":"A lead sheet contains duplicate companies, mixed phone formats, blank owner fields, and statuses such as 'Followup', 'follow up', and 'FU'. Write the cleanup order, the assumptions you must confirm first, and the QA checks you would run before handoff."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'spreadsheets-for-va-admin-work';

update public.training_lessons
set
  summary = 'Turn requests into visible tasks, prioritise by consequence, and close work with evidence instead of vague status updates.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"A task list does not decide priority for you"},
    {"type":"paragraph","text":"The newest message is not automatically the most important. Compare deadline, business impact, dependency, reversibility, effort, and authority."},
    {"type":"heading","text":"Six questions before changing priority"},
    {"type":"list","items":["When does it actually become late?","What happens if it is delayed or wrong?","Who is blocked until it is complete?","Can a mistake be reversed?","Can a short action remove a larger blocker?","Do I have authority to finish it or does it require approval?"]},
    {"type":"heading","text":"Write tasks that can be completed"},
    {"type":"steps","items":["State the desired outcome.","Add the due date and time zone when timing matters.","Link the source material.","Name the owner and approver.","Break large work into checkpoints.","Define the evidence that proves the task is done."]},
    {"type":"callout","title":"Done should be verifiable","text":"'Updated CRM' is not enough. Say which records changed, which source you used, and which exceptions still need review."},
    {"type":"scenario","title":"Work output: competing priorities","text":"At 1 PM you have four tasks: send tomorrow's meeting confirmation, update 60 CRM records by end of day, fix a typo on a public page, and prepare an invoice promised to a customer by 2 PM. Rank them, explain your reasoning, and name the one missing fact that could change your order."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'task-management-and-prioritization';

update public.training_lessons
set
  summary = 'Make deadlines explicit across time zones and hand work over so another person can continue without reconstructing your day.',
  estimated_minutes = 15,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Remote work needs explicit time"},
    {"type":"paragraph","text":"Words such as today, tomorrow morning, and end of day become risky when people work in different countries. Important deadlines should include a date, time, and time zone."},
    {"type":"heading","text":"Time-zone habits"},
    {"type":"list","items":["Keep the client's primary business time zone in your working notes.","Confirm an external attendee's zone instead of guessing from a phone number or address.","Watch daylight-saving transitions.","Repeat the zone whenever a deadline could be ambiguous.","Use calendar conversion tools, then review the result before sending."]},
    {"type":"heading","text":"A handoff needs six things"},
    {"type":"list","items":["What is complete.","What is still open.","Who owns the next action.","The exact deadline or checkpoint.","The link to the task, thread, file, or ticket.","Anything risky, unusual, or waiting on approval."]},
    {"type":"scenario","title":"Work output: end-of-shift handoff","text":"You are ending your Manila shift while your Australian client is still working. A customer is waiting for a quote; the draft is complete, but final price approval belongs to the client. Write the handoff note so the client can act in under one minute."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'time-zones-deadlines-and-handoffs';

update public.training_lessons
set
  summary = 'Find current information, judge source quality, show evidence, and separate verified facts from your interpretation.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Research is an answer someone can verify"},
    {"type":"paragraph","text":"A client usually needs information they can act on. Search results are only the starting point. Check whether the information is current, credible, relevant to the requested location or date, and supported by a source the client can open."},
    {"type":"heading","text":"Start by defining the question"},
    {"type":"steps","items":["Rewrite the request as one specific research question.","Decide what counts as a useful answer: price, policy, contact, comparison, requirement, evidence, or shortlist.","Decide how fresh the information needs to be.","Look for primary or authoritative sources first.","Cross-check claims where the cost of error is meaningful.","Record the source and date."]},
    {"type":"heading","text":"Know what each source can prove"},
    {"type":"list","items":["Primary source: official documentation, government information, original data, policies, contracts, or direct statements.","Strong secondary source: reputable analysis that clearly cites evidence.","Community source: useful for experiences and patterns, but not automatically reliable for factual claims.","Search snippet or AI answer: a lead to investigate, not evidence by itself."]},
    {"type":"callout","title":"Freshness can change the answer","text":"A correct 2023 answer may be wrong for a 2026 software price, government threshold, product feature, opening hour, or policy."},
    {"type":"scenario","title":"Work output: supplier shortlist","text":"A client wants three suppliers that can deliver a specific office product to Sydney. Design the research table headings you would use. Your table must separate item price, shipping, delivery estimate, stock status, source URL, and date checked."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'research-and-source-verification';

update public.training_lessons
set
  summary = 'Use AI to reduce repetitive work without exposing client data, inventing facts, or outsourcing your judgment.',
  estimated_minutes = 20,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"AI can assist the work; it does not own the result"},
    {"type":"paragraph","text":"AI can speed up drafting, summarising, brainstorming, classification, and text transformation. It can also invent facts, miss context, produce generic copy, or create a privacy problem when sensitive data is pasted into the wrong system."},
    {"type":"heading","text":"Useful low-risk jobs"},
    {"type":"list","items":["Draft a first version from approved facts.","Turn non-sensitive meeting notes into a proposed action list.","Brainstorm search terms for research.","Reformat non-sensitive information into a checklist or table.","Explain a spreadsheet formula or help diagnose a non-sensitive error.","Create an outline that you verify and rewrite."]},
    {"type":"heading","text":"Stop and ask first"},
    {"type":"list","items":["The prompt would contain confidential documents, credentials, customer data, or private conversations.","The output would be the only source for a legal, tax, medical, financial, compliance, pricing, or policy claim.","The model is being asked to make a decision the client expects a person to approve.","The output would create customer promises, fabricated citations, testimonials, credentials, or work history."]},
    {"type":"heading","text":"A safe working loop"},
    {"type":"steps","items":["Use only approved data and tools.","Give enough non-sensitive context for a useful draft.","Treat the output as untrusted.","Verify factual claims against the correct sources.","Rewrite generic or inaccurate sections.","Take responsibility for the final work you submit."]},
    {"type":"callout","title":"AI is not a source","text":"If an AI tool says a software feature exists, a government rule applies, or a price is current, verify it from the relevant source before presenting it as fact."},
    {"type":"scenario","title":"Work output: refund request","text":"A customer asks for a refund outside policy. You have the policy document but cannot approve exceptions. Write a three-step AI-assisted workflow showing what you may draft, what must be verified, and what must be escalated before a response is sent."}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'responsible-ai-for-va-work';

update public.training_lessons
set
  summary = 'Turn briefs and SOPs into dependable execution, identify missing decision rules, and escalate exceptions instead of routine work.',
  estimated_minutes = 15,
  content_version = 2,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content = $json$[
    {"type":"heading","text":"Independent work starts with clear operating rules"},
    {"type":"paragraph","text":"Independence is not unsupervised guessing. It comes from understanding the outcome, following the current process, checking context, documenting exceptions, and knowing which decision rules are missing."},
    {"type":"heading","text":"Parse every brief into six parts"},
    {"type":"list","items":["Outcome: what should be true when the work is finished?","Inputs: what files, access, data, or approvals are required?","Process: which SOP, checklist, example, or previous task applies?","Constraints: what deadline, tone, budget, market, software, permission, or quality rule matters?","Handoff: where does the result go and who needs to know?","Uncertainty: which assumption could materially change the result?"]},
    {"type":"heading","text":"Use SOPs without becoming mechanical"},
    {"type":"list","items":["Follow the current approved version.","Document reality when it differs from the SOP.","Suggest process improvements separately from the live task.","Propose an SOP update when the same missing step keeps recurring.","Do not use an SOP as permission to ignore obvious privacy, safety, or authority concerns."]},
    {"type":"callout","title":"Escalate exceptions, not routine work","text":"The goal is not to ask the client to approve every small action. Learn the normal rules well enough that only genuine exceptions need attention."},
    {"type":"scenario","title":"Work output: missing decision rule","text":"A fictional service business asks you to monitor enquiries, create jobs, schedule appointments, and send confirmations. The brief does not explain what to do when a customer requests same-day service after the schedule is full. List what you can proceed with, identify the missing rule, and write the exact question you would send the client."},
    {"type":"heading","text":"Before you call the work complete"},
    {"type":"list","items":["The requested outcome is achieved.","Important details are checked.","The result is saved in the agreed place.","The next person can understand what happened.","Exceptions and unresolved decisions are visible.","You did not exceed your authority just to make the task look finished."]}
  ]$json$::jsonb,
  updated_at = now()
where slug = 'reading-briefs-sops-and-working-independently';

update public.training_assessments
set
  title = 'Virtual Assistant Foundations Final Work Simulation',
  instructions = $assessment$Complete this fictional client simulation as one structured submission. Do not use real client data.

Scenario:
You support a small Australian services company from the Philippines. At the start of your shift you find an unrequested password-reset email, a customer asking to move tomorrow's appointment, an overdue supplier notice, a supplier meeting that the client described only as "10 AM Thursday", a 60-row CRM cleanup due by end of day, and a request to find three replacement suppliers that can deliver to Sydney. The client also asks whether you can use AI to draft the customer reply.

Submit these six deliverables:
1. Inbox triage: rank the urgent messages and explain the consequence behind your order.
2. Calendar coordination: write the clarification needed before booking the supplier meeting and list the final event fields.
3. Task plan: prioritise the work for the shift with deadlines, owners, and completion evidence.
4. Research table: provide the fields you would use for the three-supplier comparison, including source URL and date checked. You may use fictional supplier rows if you are not browsing live sources.
5. Client update: write one concise status message covering what is complete, what is blocked, and what decision you need.
6. Boundaries and AI: explain what you would not paste into an AI tool, what facts you would verify, and which decisions require client approval.

Scoring (100 points):
- Accuracy, risk recognition, and safe escalation: 30
- Prioritisation and operational judgment: 20
- Clear client communication: 20
- Evidence, research structure, and source handling: 15
- Confidentiality, authority boundaries, and responsible AI use: 15

Pass score: 80%. A reviewer may request one revision when the work is useful but misses an important risk, decision boundary, or requested deliverable.$assessment$,
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (select id from public.training_courses where slug = 'virtual-assistant-foundations');

-- Publish only after all lesson and assessment updates above have succeeded.
update public.training_courses
set
  status = 'published',
  published_at = coalesce(published_at, now()),
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = 2,
  updated_at = now()
where slug = 'virtual-assistant-foundations';
