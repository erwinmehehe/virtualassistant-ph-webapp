-- Add first-class practical work, reusable templates, and QA checklists
-- to every published Virtual Assistant Foundations lesson.
-- Existing lesson IDs and progress remain unchanged.

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
    'what-a-virtual-assistant-actually-does',
    'Build an authority and ownership map',
    'A client asks you to manage supplier coordination, update the CRM, prepare invoices, and handle customer follow-ups. For each responsibility, decide what you can complete independently, what needs approval, and what evidence should remain after the work is done.',
    'A four-row authority map with: responsibility, desired outcome, actions you can take, approval/escalation boundary, and completion evidence.',
    'Authority and ownership map',
    $txt$Responsibility:
Desired outcome:
I can do independently:
I need approval before:
Escalate when:
Completion evidence:
Open question:$txt$,
    'Check your authority map',
    array[
      'The desired outcome is clearer than the task wording.',
      'Independent actions stay inside the VA role.',
      'Approval boundaries are explicit for money, access, customer commitments, or regulated decisions.',
      'Completion evidence is specific enough for another person to verify.',
      'Any missing rule is written as a focused client question.'
    ]::text[]
  ),
  (
    'clear-written-client-communication',
    'Turn a messy update into a decision-ready message',
    'You are waiting on a supplier, a draft is ready for approval, and a meeting time is still ambiguous. Write one client update that can be understood in under a minute without hiding the blocker inside a long introduction.',
    'One concise client update with completed work, blocker, evidence/link placeholder, decision needed, owner, and timing.',
    'Client status update',
    $txt$Status:
Completed:
- 

Blocked / at risk:
- 

Decision needed:
- 

My next action:
- 

Deadline / checkpoint:
- 

Reference:
- [task, thread, file, or link]$txt$,
    'Before you send',
    array[
      'The main point appears in the first two lines.',
      'Facts are separated from assumptions.',
      'Each question is specific enough to answer quickly.',
      'The next owner and timing are visible.',
      'Relevant task, file, or thread references are included.',
      'There is no unnecessary greeting or filler.'
    ]::text[]
  ),
  (
    'inbox-management',
    'Triage a six-message morning inbox',
    'Rank these messages: an unrequested password-reset alert, a customer moving tomorrow''s appointment, an overdue supplier invoice notice, a meeting transcript, a request for an old receipt, and a newsletter. Explain the consequence behind your first three choices and define the next action for every message.',
    'A six-row inbox triage log with priority, reason, next action, owner, and follow-up time.',
    'Inbox triage log',
    $txt$Message:
Priority: Critical / High / Normal / Reference
Why it matters:
Next action:
Owner:
Reply or draft needed:
Follow-up time:
Task / thread reference:$txt$,
    'Inbox handoff QA',
    array[
      'Priority is based on consequence, not simply recency.',
      'Security or access alerts are investigated before routine admin.',
      'Messages needing client decisions are clearly separated from work you can complete.',
      'Every deferred item has a follow-up mechanism.',
      'No reply promises money, timing, refunds, or outcomes outside your authority.'
    ]::text[]
  ),
  (
    'calendar-and-meeting-coordination',
    'Prepare a meeting that cannot fail quietly',
    'Your Sydney client writes: "Supplier call 10 AM Thursday." The supplier contact may be in another time zone and no agenda or meeting link is included. Prepare the clarification, then build the final event specification you would use after the client replies.',
    'The exact clarification message plus a complete event spec covering date, time zone, attendees, purpose, link/location, preparation, buffers, and follow-up.',
    'Meeting booking spec',
    $txt$Meeting:
Purpose:
Date:
Start time:
Time zone:
Duration:
Attendees:
Location / meeting link:
Agenda:
Preparation / attachments:
Buffer / travel rule:
Reminder rule:
Follow-up owner:
Source confirming time:$txt$,
    'Calendar QA before sending',
    array[
      'The time zone is explicit and was not guessed.',
      'Date, duration, attendees, and link/location are correct.',
      'The event explains the purpose or agenda.',
      'Required preparation or attachments are present.',
      'Buffers, travel, and protected time were checked.',
      'The event matches the source message or approved clarification.'
    ]::text[]
  ),
  (
    'drive-docs-and-file-organization',
    'Clean a folder without destroying the source of truth',
    'You inherit four files named Client List.xlsx, Client List NEW.xlsx, Client List FINAL.xlsx, and Client List use this one.xlsx. Plan the cleanup without deleting anything until you know which file is authoritative and who still needs access.',
    'A cleanup plan naming the checks you will run, the proposed source of truth, the naming convention, archive approach, and permission changes that still need approval.',
    'File cleanup log',
    $txt$Folder / project:
Files found:
Likely source of truth:
Evidence checked:
Duplicate / archive candidates:
Proposed naming convention:
Permission changes:
Owner approval needed:
Final source-of-truth link:
Archive location:$txt$,
    'File-system QA',
    array[
      'The source of truth is verified before files are renamed, moved, or deleted.',
      'The naming convention is simple and repeatable.',
      'Active work and archive material are separated.',
      'Sharing uses the least access required.',
      'Important links or ownership are not broken during cleanup.',
      'Another person could find the final file without asking you.'
    ]::text[]
  ),
  (
    'spreadsheets-for-va-admin-work',
    'Clean a lead sheet safely',
    'A lead sheet contains duplicate companies, mixed phone formats, blank owner fields, and statuses such as Followup, follow up, and FU. Define the cleanup order, identify assumptions that require confirmation, and describe how you would prove no records were accidentally lost.',
    'A cleanup plan plus a short exception log showing duplicates, unknown owners, status normalisation, and records that must be reviewed instead of auto-fixed.',
    'Spreadsheet cleanup and QA log',
    $txt$Sheet / tab:
Backup or version-history check:
Rows before cleanup:
Cleanup rules confirmed:
- Duplicate definition:
- Status values:
- Phone format:
- Required fields:

Exceptions:
- Row / record:
- Issue:
- Action:
- Needs approval:

Rows after cleanup:
QA checks run:
Handoff note:$txt$,
    'Spreadsheet QA',
    array[
      'A recoverable version exists before destructive cleanup.',
      'Rows remain intact when sorting or filtering.',
      'Duplicate rules are defined before records are removed.',
      'Formulas, validation, hidden tabs, and protected ranges were checked before editing.',
      'Row counts and key totals are compared before and after.',
      'Unknown values are flagged rather than invented.'
    ]::text[]
  ),
  (
    'task-management-and-prioritization',
    'Build a shift plan and handoff',
    'At 1 PM you have four tasks: send tomorrow''s meeting confirmation, update 60 CRM records by end of day, fix a typo on a public page, and prepare an invoice promised to a customer by 2 PM. Rank them, name the fact that could change your order, then write the handoff you would leave if one task remains open at shift end.',
    'A ranked task plan with consequence, deadline/time zone, owner, blocker, completion evidence, plus one end-of-shift handoff.',
    'Priority and handoff sheet',
    $txt$Task:
Deadline + time zone:
Consequence if late:
Dependency / who is blocked:
Authority / approval needed:
Priority:
Next action:
Completion evidence:

HANDOFF
Complete:
Still open:
Next owner:
Exact checkpoint:
Reference:
Risk / decision needed:$txt$,
    'Priority and handoff QA',
    array[
      'Priority reflects deadline, consequence, dependency, and reversibility.',
      'Important deadlines include date, time, and time zone.',
      'Tasks have a visible owner and completion definition.',
      'Blocked work shows the smallest decision needed to continue.',
      'The handoff links to the source task, file, thread, or ticket.',
      'The next person can act without reconstructing your shift.'
    ]::text[]
  ),
  (
    'research-and-source-verification',
    'Build a supplier comparison someone can audit',
    'A client wants three suppliers that can deliver a specific office product to Sydney. Design the comparison, then use three fictional supplier rows to demonstrate how you would record price, shipping, stock, delivery estimate, evidence, and uncertainty.',
    'A three-row supplier comparison with source URL placeholders, checked date, verified facts, unresolved assumptions, and a recommendation note that does not invent missing information.',
    'Research comparison table',
    $txt$Research question:
Location / market:
Checked date:

Supplier:
Item / specification match:
Item price:
Shipping:
Stock status:
Delivery estimate:
Source URL:
Source type:
Verified facts:
Unresolved question:
Notes:

Recommendation / shortlist rationale:
What still needs verification:$txt$,
    'Research QA',
    array[
      'The research question and market are specific.',
      'Primary or authoritative sources are preferred for factual claims.',
      'Every material fact has a source the client can open.',
      'Prices, stock, policies, and other time-sensitive facts have a checked date.',
      'Verified facts are separated from interpretation.',
      'Missing information is visible instead of guessed.'
    ]::text[]
  ),
  (
    'responsible-ai-for-va-work',
    'Create an AI use and verification plan',
    'A customer requests a refund outside policy. You have the approved policy document but cannot approve exceptions. Show exactly how AI could help draft the response without receiving sensitive customer data or being treated as the source of policy truth.',
    'A three-part plan covering what data may be used, what AI may draft, what must be verified against source documents, and which decision must remain with the authorised client.',
    'AI work verification log',
    $txt$Task:
Approved AI tool:
Data allowed in prompt:
Data removed / replaced:
Draft requested from AI:
Claims to verify:
Verification sources:
Human decision / approval required:
Changes made after verification:
Final owner:$txt$,
    'AI-assisted work QA',
    array[
      'No credentials, private customer data, confidential files, or unnecessary personal information are pasted into the tool.',
      'AI output is treated as an untrusted draft.',
      'Policy, price, software, legal, tax, medical, and other factual claims are verified from the right source.',
      'The AI does not make an approval decision that belongs to the client.',
      'Generic or inaccurate wording is rewritten before handoff.',
      'The final work has a clear human owner.'
    ]::text[]
  ),
  (
    'reading-briefs-sops-and-working-independently',
    'Turn a vague brief into an executable work plan',
    'A service business asks you to monitor enquiries, create jobs, schedule appointments, and send confirmations. The brief does not explain what to do when a customer requests same-day service after the schedule is full. Separate what you can execute now from the missing decision rule and prepare the exact client question.',
    'A six-part execution plan covering outcome, inputs, process, constraints, handoff, uncertainty, plus one proposed SOP rule after the client decides the exception.',
    'Brief-to-execution worksheet',
    $txt$Outcome:
Required inputs:
Current SOP / example:
Constraints:
Normal steps:
Completion evidence:
Handoff:
Known exceptions:
Missing decision rule:
Focused client question:
Proposed SOP update after approval:$txt$,
    'Independent-work QA',
    array[
      'The outcome is explicit before the steps begin.',
      'Required files, access, data, and approvals are identified.',
      'The current SOP or source example is referenced.',
      'Normal work continues without unnecessary approval requests.',
      'A genuine exception is separated from routine work.',
      'The missing rule is asked as one focused question.',
      'Completion evidence and handoff location are defined.'
    ]::text[]
  )
),
targets as (
  select
    l.id,
    p.*
  from practice p
  join public.training_courses c
    on c.slug = 'virtual-assistant-foundations'
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
where slug = 'virtual-assistant-foundations';
