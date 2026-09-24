-- Add first-class practical work to every published Executive Virtual Assistant
-- lesson. Preserve lesson IDs, existing lesson content, progress, and assessment.
-- The course remains published and editorial-only.

with practice (
  slug,
  exercise_title,
  exercise_text,
  deliverable,
  template_title,
  template_text,
  checklist_title,
  checklist_items
) as (
  values
  (
    'the-executive-assistant-operating-model',
    'Build an executive operating map',
    'You are onboarding a fictional founder who manages clients, hiring, finance, partnerships, investor updates, and frequent travel. Turn the vague request "help me stay organised" into a practical operating map that shows what you own, what needs approval, what must be escalated, and which system holds the source of truth.',
    'A one-page operating map covering recurring responsibilities, priority stakeholders, source systems, urgency rules, approval boundaries, and the five most common Executive VA support workflows.',
    'Executive operating map',
    $txt$Executive:
Role / business:
Primary outcomes:
Top recurring responsibilities:
Key stakeholders:
Source-of-truth systems:
- Calendar:
- Inbox:
- Tasks:
- Files:
- CRM / contacts:

I may complete independently:
I must prepare for approval:
I must escalate:
Urgent means:
Executive unavailable fallback:
Top 5 recurring support workflows:$txt$,
    'Operating-map QA',
    array[
      'The map explains outcomes, not only tasks.',
      'Each important workflow has a source-of-truth system.',
      'Routine ownership, approval work, and escalation work are clearly separated.',
      'Urgency has an explicit rule rather than relying on sender tone.',
      'The executive-unavailable fallback is documented.',
      'Another assistant could use the map without guessing.'
    ]::text[]
  ),
  (
    'confidentiality-judgment-and-authority',
    'Classify an executive-access queue',
    'Review six fictional requests: a colleague asking why a confidential interview is on the calendar, a vendor asking for the executive itinerary, an urgent bank-detail change, an employee asking for salary information, a board member requesting the latest deck, and a client asking for an approved meeting time. Decide what information can be shared, what must be withheld, and what needs verification or approval.',
    'A six-row authority matrix showing information classification, minimum necessary response, approval or verification requirement, and escalation owner.',
    'Executive authority matrix',
    $txt$Request:
Information classification: Public / Internal / Confidential / Highly restricted
What the requester actually needs:
Minimum information I may share:
Verification required:
Approval required:
Escalation owner:
Record / evidence to keep:
Final response or next action:$txt$,
    'Confidentiality and authority QA',
    array[
      'The response shares only the minimum information needed.',
      'Sensitive information is not exposed to satisfy curiosity.',
      'Banking or payment changes use independent verification.',
      'High-impact commitments are not made without authority.',
      'Personal notes do not contain unnecessary sensitive detail.',
      'Every withheld or escalated request has a clear next action.'
    ]::text[]
  ),
  (
    'executive-inbox-triage-and-drafting',
    'Run a real executive inbox pass',
    'Triage a fictional inbox containing: a board-chair request, an employee resignation, a customer escalation, a calendar invitation, an urgent vendor bank-detail change, a password-reset alert, a newsletter, a travel confirmation, a draft contract, and a routine team update. Process the queue by required outcome rather than by unread count.',
    'A ten-row triage log plus two decision-ready executive summaries and one draft reply that stays inside delegated authority.',
    'Executive inbox triage log',
    $txt$Message / thread:
Sender:
Outcome type: Decision / Action / Reply / Meeting / Reference / Waiting / Noise
Deadline:
Consequence if delayed:
Executive needs to see? Yes / No
Action I can complete:
Draft needed:
Decision needed:
Owner:
Follow-up date:
Source thread / task:$txt$,
    'Inbox-pass QA',
    array[
      'Security, money, legal, customer, employee, and same-day issues are scanned first.',
      'Priority is based on deadline and consequence, not the word urgent.',
      'Every unfinished action has an owner and follow-up.',
      'Decision summaries state the question clearly.',
      'Drafts do not invent approval, pricing, promises, or executive intent.',
      'Sensitive threads remain in approved systems.'
    ]::text[]
  ),
  (
    'complex-calendar-management',
    'Repair an impossible executive day',
    'A fictional executive calendar has eight meetings, two cross-city commitments, one investor call, one candidate interview, a 40-minute airport transfer, and no preparation time. Rebuild the day so the important commitments remain possible without silently creating travel, preparation, or stakeholder conflicts.',
    'A revised calendar plan showing each move, the reason, trade-off, approval requirement, attendee communication, buffer, preparation block, and final conflict check.',
    'Executive calendar change log',
    $txt$Event:
Current time:
Proposed time:
Time zone:
Fixed or movable:
Priority / consequence:
Preparation needed:
Travel / buffer needed:
Who is affected:
Approval needed:
Communication sent:
Related tasks updated:
Final status:$txt$,
    'Calendar-change QA',
    array[
      'The meeting before and after each change were checked.',
      'Travel, preparation, and recovery buffers are visible.',
      'Time zones are verified in the calendar system.',
      'Important stakeholder impact is considered before moving an event.',
      'No meeting is silently edited when attendees are affected.',
      'Related prep tasks, links, rooms, and reminders are updated.'
    ]::text[]
  ),
  (
    'meeting-preparation-agendas-and-briefing-notes',
    'Prepare a decision-ready executive briefing',
    'Prepare a fictional 30-minute investor meeting from a messy source pack containing last meeting notes, three emails, a revenue spreadsheet, two unresolved action items, and one conflicting metric. The executive should be able to open one page five minutes before the call and understand what matters.',
    'A one-page meeting brief containing purpose, attendees, context, verified facts, open actions, conflicting data, decisions needed, recommended admin next steps, and source references.',
    'Executive meeting brief',
    $txt$Meeting:
Date / time / time zone:
Purpose:
Attendees + roles:
Why this meeting matters:
Previous commitments:
Key verified facts:
Conflicting / unverified information:
Decisions needed:
Questions to ask:
Documents / links:
Risks / sensitivities:
My admin recommendation:
Post-meeting actions to capture:$txt$,
    'Briefing-note QA',
    array[
      'The meeting purpose is explicit.',
      'Facts are separated from assumptions and unresolved conflicts.',
      'Important numbers are verified against source material.',
      'Open commitments from the prior meeting are visible.',
      'The executive can see the decisions needed in under a minute.',
      'Every material fact has a source or link.'
    ]::text[]
  ),
  (
    'minutes-actions-and-stakeholder-follow-up',
    'Turn messy notes into accountable follow-through',
    'You have fictional meeting notes containing discussion, decisions, vague promises, and side comments. Convert them into a concise record that distinguishes decisions from actions and makes every follow-up visible without recording gossip or unnecessary commentary.',
    'A cleaned meeting record with decisions, action items, owners, deadlines, dependencies, stakeholder follow-ups, and one unresolved decision queue.',
    'Decision and action register',
    $txt$Meeting:
Date:
Decision:
Decision owner:
Reason / context needed later:
Action:
Action owner:
Deadline:
Dependency:
Follow-up recipient:
Follow-up message needed:
Status:
Source note / recording reference:$txt$,
    'Minutes and follow-up QA',
    array[
      'Decisions are separated from discussion.',
      'Every action has one owner.',
      'Deadlines are explicit where known.',
      'Vague promises are converted into a concrete next action or clarification.',
      'Sensitive or speculative comments are excluded from formal records.',
      'Stakeholder follow-up matches the approved decision.'
    ]::text[]
  ),
  (
    'travel-planning-and-itinerary-administration',
    'Build an executive travel pack',
    'Plan a fictional two-city business trip with flights, hotel, airport transfers, three meetings, a dinner, a passport expiry check, one dietary requirement, and a 07:00 meeting after a late arrival. Identify the travel risks instead of merely copying confirmation emails into a document.',
    'A complete itinerary with local times, addresses, confirmation references, travel buffers, contact details, document requirements, meeting prep, and a risk/contingency section.',
    'Executive travel itinerary',
    $txt$Traveller:
Trip purpose:
Emergency / fallback contact:

DATE
Flight / train:
Local departure time:
Local arrival time:
Airport / station:
Booking reference:
Transfer:
Hotel:
Meeting:
Address / link:
Preparation:
Local contact:
Buffer:
Documents needed:
Risk / contingency:
Source confirmation:$txt$,
    'Travel-pack QA',
    array[
      'All times are local to the relevant city and labelled clearly.',
      'Transfers and realistic buffers are included.',
      'Passport, visa, entry, or client-required documents are checked from approved sources.',
      'Hotel and meeting addresses are verified.',
      'Late arrival and early meeting risks are surfaced.',
      'Sensitive itinerary details are shared only with authorised people.'
    ]::text[]
  ),
  (
    'changes-disruptions-and-contingency-handoffs',
    'Run a disruption response',
    'A fictional flight cancellation makes the executive likely to miss tomorrow morning’s client meeting. At the same time, the hotel booking is non-refundable and the airport transfer is already confirmed. Build the response sequence without making commercial or relationship commitments the executive has not approved.',
    'A disruption plan with facts, impact, options, recommended administrative action, approvals needed, stakeholder messages, booking changes, costs at risk, and handoff owner.',
    'Executive disruption log',
    $txt$Disruption:
Confirmed facts:
Unverified information:
Immediate impact:
Affected meetings / bookings:
Option 1:
Option 2:
Option 3:
Costs / penalties:
Executive decision needed:
Actions I can take now:
Messages to send:
Bookings to hold / change:
Next checkpoint:
Owner:
Final evidence / confirmations:$txt$,
    'Disruption-response QA',
    array[
      'Confirmed facts are separated from assumptions.',
      'Affected commitments are identified before changes are made.',
      'Options show trade-offs, cost, and stakeholder impact.',
      'Refunds, cancellations, or new spend stay inside delegated authority.',
      'Customers and stakeholders receive only confirmed information.',
      'The next checkpoint and owner are explicit.'
    ]::text[]
  ),
  (
    'priority-management-and-decision-queues',
    'Build an executive decision queue',
    'At 11:00 you have six open items: investor deck approval due today, candidate interview conflict, vendor payment verification, two customer follow-ups, a contract signature request, and a low-priority internal report. Rank the work based on consequence, deadline, dependency, and reversibility rather than on who messaged most recently.',
    'A six-item priority and decision queue showing priority, consequence, deadline, blocker, decision owner, what the VA can complete now, and the exact decision still needed.',
    'Executive decision queue',
    $txt$Item:
Deadline + time zone:
Consequence if late:
Who is blocked:
Reversible? Yes / No
What I can complete now:
Decision needed:
Decision owner:
Evidence / options prepared:
Priority:
Next checkpoint:
Status:$txt$,
    'Priority-queue QA',
    array[
      'Priority reflects deadline, consequence, dependency, and reversibility.',
      'Tasks that can move without the executive continue moving.',
      'The exact decision needed is written in one sentence.',
      'Decision items include enough context for a quick answer.',
      'Low-value urgency does not displace high-consequence work.',
      'Open decisions have a next checkpoint instead of disappearing in chat.'
    ]::text[]
  ),
  (
    'research-briefs-and-executive-summaries',
    'Turn research into a decision brief',
    'The executive asks you to compare three fictional event venues for a leadership offsite. One has the lowest price, one is easiest for travel, and one has the strongest cancellation terms. Build a recommendation brief that keeps verified facts separate from your interpretation.',
    'A three-option executive brief with selection criteria, verified facts, checked date, sources, trade-offs, recommendation, uncertainty, and the exact decision requested.',
    'Executive research brief',
    $txt$Decision:
Criteria:
Checked date:

OPTION
Name:
Verified facts:
Cost:
Availability:
Key terms:
Travel / logistics:
Source:
Risk / limitation:

Recommendation:
Why:
What could change the recommendation:
Unverified / missing information:
Decision requested:
Deadline:$txt$,
    'Executive-research QA',
    array[
      'The decision question is clear before the research starts.',
      'Criteria reflect the executive’s actual priorities.',
      'Time-sensitive facts have a checked date.',
      'Every material fact has a source.',
      'Recommendation is visibly separated from verified facts.',
      'Missing information and uncertainty are not hidden.'
    ]::text[]
  ),
  (
    'daily-operating-rhythm-and-end-of-day-handoffs',
    'Run the executive operating rhythm',
    'Build a fictional working day for an executive with a morning decision queue, two protected focus blocks, four meetings, one delegated action waiting on another team, and a customer issue that remains unresolved at shift end. Show how you structure the day without creating constant interruptions.',
    'A morning briefing, midday checkpoint, and end-of-day handoff containing completed work, open decisions, waiting items, risks, customer impact, next owners, and tomorrow-first actions.',
    'Executive daily handoff',
    $txt$MORNING
Top outcomes today:
Decisions needed:
Time-sensitive commitments:
Risks / blockers:

MIDDAY
Changed since morning:
Completed:
Waiting:
New decision:

END OF DAY
Completed:
Still open:
Decision needed:
Waiting on:
Customer / stakeholder impact:
Next owner:
Tomorrow first:
Deadline + time zone:
Source task / link:$txt$,
    'Daily-rhythm QA',
    array[
      'The executive is interrupted only for genuinely time-sensitive decisions.',
      'Routine work continues without unnecessary approval requests.',
      'Open items have owners and checkpoints.',
      'Customer or stakeholder promises are visible.',
      'The handoff prioritises exceptions over a diary of completed tasks.',
      'Tomorrow-first actions are ready before sign-off.'
    ]::text[]
  ),
  (
    'composite-executive-va-work-simulation',
    'Run the Executive VA control desk',
    'Use the Executive VA final simulation as a working control desk rather than a reading exercise. Triage the board-chair request, calendar clash, urgent vendor bank-detail change, travel disruption, conflicting revenue number, and confidential candidate message. Show the sequence you would work, what you prepare, what you verify, and what only the executive or designated owner may decide.',
    'A complete control-desk pack: priority queue, inbox triage, calendar repair, bank-detail verification hold, travel contingency note, revenue-data discrepancy brief, confidential-candidate response, executive decision queue, and end-of-day handoff.',
    'Executive VA control desk',
    $txt$ITEM:
Priority:
Confirmed facts:
Risk / consequence:
Action I can take now:
Verification needed:
Decision needed:
Decision owner:
Draft communication:
Deadline:
Source / evidence:
Next checkpoint:

END-OF-DAY SUMMARY
Completed:
Decisions still open:
Waiting:
Risks:
Tomorrow first:$txt$,
    'Final simulation QA',
    array[
      'Security, payment, confidentiality, investor, and travel risks are surfaced early.',
      'Conflicting revenue data is not silently corrected or presented as verified.',
      'New bank details are independently verified before any payment workflow continues.',
      'Major schedule trade-offs stay with the authorised decision maker.',
      'Confidential personnel information is shared only on a need-to-know basis.',
      'Every open item ends with an owner, deadline, and next checkpoint.'
    ]::text[]
  )
),
targets as (
  select
    l.id,
    p.*
  from practice p
  join public.training_courses c
    on c.slug = 'executive-virtual-assistant'
  join public.training_modules m
    on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and l.slug = p.slug
  where l.is_published = true
)
update public.training_lessons l
set
  content = l.content || jsonb_build_array(
    jsonb_build_object(
      'type', 'exercise',
      'title', t.exercise_title,
      'text', t.exercise_text,
      'deliverable', t.deliverable
    ),
    jsonb_build_object(
      'type', 'template',
      'title', t.template_title,
      'text', t.template_text
    ),
    jsonb_build_object(
      'type', 'checklist',
      'title', t.checklist_title,
      'items', to_jsonb(t.checklist_items)
    )
  ),
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from targets t
where l.id = t.id
  and not exists (
    select 1
    from jsonb_array_elements(l.content) block
    where block->>'type' = 'exercise'
  );

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'executive-virtual-assistant';
