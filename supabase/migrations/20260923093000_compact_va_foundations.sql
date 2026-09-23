-- Compact Virtual Assistant Foundations after the first production release.
-- Merge overlapping lessons so the learner sees 10 stronger lessons instead
-- of 13 similarly-shaped lessons. Preserve any completion progress before
-- removing the superseded lesson rows.

-- If a learner completed a lesson being merged away, carry that completion
-- into the surviving lesson before deletion.
insert into public.training_lesson_progress (user_id, lesson_id, completed_at)
select user_id, '12000000-0000-4000-8000-000000000001'::uuid, completed_at
from public.training_lesson_progress
where lesson_id = '12000000-0000-4000-8000-000000000002'::uuid
on conflict (user_id, lesson_id) do update
set completed_at = least(public.training_lesson_progress.completed_at, excluded.completed_at);

insert into public.training_lesson_progress (user_id, lesson_id, completed_at)
select user_id, '12000000-0000-4000-8000-000000000003'::uuid, completed_at
from public.training_lesson_progress
where lesson_id = '12000000-0000-4000-8000-000000000004'::uuid
on conflict (user_id, lesson_id) do update
set completed_at = least(public.training_lesson_progress.completed_at, excluded.completed_at);

insert into public.training_lesson_progress (user_id, lesson_id, completed_at)
select user_id, '12000000-0000-4000-8000-000000000009'::uuid, completed_at
from public.training_lesson_progress
where lesson_id = '12000000-0000-4000-8000-000000000010'::uuid
on conflict (user_id, lesson_id) do update
set completed_at = least(public.training_lesson_progress.completed_at, excluded.completed_at);

update public.training_modules
set
  title = 'VA Role, Standards, and Boundaries',
  summary = 'Understand what clients are trusting you to own, where your authority stops, and how to protect access, information, and professional boundaries.',
  updated_at = now()
where id = '11000000-0000-4000-8000-000000000001'::uuid;

update public.training_lessons
set
  title = 'The VA Role, Standards, and Boundaries',
  summary = 'Understand ownership, professional standards, confidentiality, access, and the decisions that still belong to the client.',
  estimated_minutes = 25,
  content_version = 3,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content = $json$[
    {"type":"heading","text":"What the client is actually trusting you with"},
    {"type":"paragraph","text":"A Virtual Assistant is not defined by one task list. The useful unit is responsibility: a result or process you are trusted to move forward without creating avoidable risk or extra supervision."},
    {"type":"list","items":["Task: send a meeting reminder. Responsibility: keep the meeting accurate, confirmed, and visible to the people who need it.","Task: update a spreadsheet. Responsibility: preserve the structure, source, formulas, and exceptions so another person can trust the result.","Task: answer an inbox. Responsibility: act on routine messages, protect sensitive information, and surface decisions that still belong to the client."]},
    {"type":"heading","text":"Ownership has a boundary"},
    {"type":"paragraph","text":"Being proactive does not mean inventing authority. Refunds, pricing, contracts, payments, regulated advice, access changes, public promises, and other high-impact decisions need an agreed rule or explicit approval."},
    {"type":"steps","items":["Check the brief, SOP, previous examples, and available context before asking the client.","Proceed with normal work that is inside the agreed process.","Stop when the next action would create a material commitment, expose private information, or use access beyond the task.","Escalate with the facts you already checked and the smallest decision the client needs to make.","Leave a record of what changed so the next person can continue."]},
    {"type":"heading","text":"Professional standards are practical"},
    {"type":"list","items":["Use only the accounts, folders, and permissions required for the work.","Keep customer data, credentials, internal pricing, screenshots, and private conversations inside approved systems.","Check names, dates, recipients, promises, links, and attachments before calling work complete.","State your availability clearly instead of creating a 24/7 expectation.","Do not publish client work, screenshots, or data in a portfolio without permission. Build a fictional sample instead."]},
    {"type":"scenario","title":"Work output: define the boundary","text":"Your client writes, 'Can you handle tomorrow's supplier meeting and sort out anything they need?' Write the short clarification you would send. Separate what you can own without another message from the decisions you would still escalate."}
  ]$json$::jsonb,
  updated_at = now()
where id = '12000000-0000-4000-8000-000000000001'::uuid;

update public.training_modules
set
  title = 'Client Communication and Escalation',
  summary = 'Write concise client messages, ask focused questions, report mistakes early, and escalate only the decisions that need attention.',
  updated_at = now()
where id = '11000000-0000-4000-8000-000000000002'::uuid;

update public.training_lessons
set
  title = 'Client Communication, Updates, and Escalation',
  summary = 'Write useful messages, ask better questions, report mistakes with facts, and make the next action obvious.',
  estimated_minutes = 30,
  content_version = 3,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content = $json$[
    {"type":"heading","text":"A useful message reduces uncertainty"},
    {"type":"paragraph","text":"Remote work creates more written communication than an office. The client should be able to understand what changed, what you checked, what you need, and who acts next without asking a second round of basic questions."},
    {"type":"heading","text":"Use this shape when the message matters"},
    {"type":"steps","items":["Lead with the point: what is complete, what changed, or what decision you need.","Add only the context required to understand the issue.","Separate verified facts from assumptions or unknowns.","Name the next action and owner.","Add the exact deadline or checkpoint when timing matters."]},
    {"type":"paragraph","text":"Weak: 'Hi, just checking on this. Let me know.' Better: 'The supplier has not confirmed Friday delivery. I followed up at 10:15 AM Manila time. If there is no reply by 2 PM, should I call the account contact or move delivery to Monday?'"},
    {"type":"heading","text":"Ask after reasonable homework"},
    {"type":"list","items":["Read the full thread, brief, SOP, task history, and linked files first.","Do not ask for information that is already visible in the calendar, CRM, or source document.","When there are safe options, present them instead of sending an open-ended 'What should I do?'","Escalate privacy, security, money, contracts, pricing, serious complaints, legal threats, or irreversible actions when the rule is unclear."]},
    {"type":"heading","text":"Report mistakes without drama"},
    {"type":"paragraph","text":"State what happened, the impact you can actually confirm, any safe correction already taken, and the approval still required. If the impact is unknown, say you are checking instead of guessing that everything is fine."},
    {"type":"scenario","title":"Work output: one concise update","text":"You sent a customer a meeting invite for 10:00 AM instead of 11:00 AM tomorrow. Draft a client update in six lines or fewer. Include the confirmed facts, the safe correction you can make now, and the one decision you still need if the customer has already accepted."}
  ]$json$::jsonb,
  updated_at = now()
where id = '12000000-0000-4000-8000-000000000003'::uuid;

update public.training_modules
set
  title = 'Priorities, Deadlines, and Handoffs',
  summary = 'Decide what matters first, make time-zone deadlines explicit, and leave work in a state another person can continue.',
  updated_at = now()
where id = '11000000-0000-4000-8000-000000000005'::uuid;

update public.training_lessons
set
  title = 'Priorities, Deadlines, and Handoffs',
  summary = 'Prioritise by consequence, write clear deadlines across time zones, and close the shift with a useful handoff.',
  estimated_minutes = 30,
  content_version = 3,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content = $json$[
    {"type":"heading","text":"The newest request is not automatically first"},
    {"type":"paragraph","text":"Priority comes from consequence. Compare the real deadline, customer or financial impact, dependency, reversibility, effort, and whether you have authority to finish the work."},
    {"type":"list","items":["When does the task actually become late?","What happens if it is delayed or wrong?","Who is blocked until it is complete?","Can a mistake be reversed?","Can a short action remove a larger blocker?","Does the next step need approval?"]},
    {"type":"heading","text":"Make time explicit"},
    {"type":"paragraph","text":"Words such as today, tomorrow morning, and end of day are risky across countries. Important deadlines should include a date, time, and time zone. Confirm the zone for external people rather than guessing, and remember daylight-saving changes can shift familiar offsets."},
    {"type":"heading","text":"A handoff should let someone continue in under a minute"},
    {"type":"list","items":["What is complete.","What remains open.","Who owns the next action.","The exact deadline or checkpoint.","The link to the task, thread, file, ticket, or source.","Anything risky, unusual, or waiting on approval."]},
    {"type":"scenario","title":"Work output: rank and hand off","text":"At 1 PM you have an invoice promised by 2 PM, tomorrow's meeting confirmation, 60 CRM records due by end of day, and a typo on a public page. Rank them and explain the consequence behind your order. Then write the end-of-shift handoff for any unfinished item using exact time zones."}
  ]$json$::jsonb,
  updated_at = now()
where id = '12000000-0000-4000-8000-000000000009'::uuid;

delete from public.training_lessons
where id in (
  '12000000-0000-4000-8000-000000000002'::uuid,
  '12000000-0000-4000-8000-000000000004'::uuid,
  '12000000-0000-4000-8000-000000000010'::uuid
);

update public.training_courses
set
  summary = 'A practical three-and-a-half-hour foundation for Filipino Virtual Assistants covering client communication, inbox and calendar work, files and spreadsheets, priorities and handoffs, research, responsible AI use, and dependable execution.',
  estimated_minutes = 215,
  content_version = 3,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'virtual-assistant-foundations';
