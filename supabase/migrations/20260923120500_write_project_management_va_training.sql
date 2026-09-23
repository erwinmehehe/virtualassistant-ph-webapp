-- Write the existing Project Management for Virtual Assistants course.
-- Course remains draft-only until reviewer metadata and explicit publication are recorded.

update public.training_courses
set
  summary = 'A practical project-management course for Virtual Assistants covering scope, deliverables, ownership, planning, dependencies, timelines, project boards, meetings, risk, stakeholder reporting, change control, QA, handover, and closeout.',
  estimated_minutes = 300,
  status = 'draft',
  published_at = null,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '20000000-0000-4000-8000-000000000013';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A project has a defined outcome and an end"},{"type":"paragraph","text":"Project work is different from routine operations because it aims to produce a specific result within a defined period. A Project Management Virtual Assistant helps turn that result into visible scope, deliverables, tasks, owners, decisions, and checkpoints so the team can coordinate without relying on memory."},{"type":"heading","text":"Define the project before building the task list"},{"type":"list","items":["Purpose: why the project exists","Outcome: what should be true when the project is complete","Deliverables: the tangible outputs the team must produce","In scope: work included in the project","Out of scope: work explicitly excluded","Constraints: deadline, budget, systems, approvals, resources, or dependencies","Success criteria: how the team will know the project worked"]},{"type":"heading","text":"Deliverables should be verifiable"},{"type":"paragraph","text":"A deliverable such as ''improve onboarding'' is too vague. A verifiable deliverable might be ''new onboarding checklist approved, implemented in the CRM, tested on three new clients, and handed over to the operations owner.''"},{"type":"callout","title":"A project board cannot fix unclear scope","text":"If the team disagrees on what the project is meant to deliver, adding more tasks creates activity, not clarity."},{"type":"scenario","title":"Website relaunch brief","text":"A client says, ''We need the new website live by November.'' Identify the questions needed to define scope, deliverables, exclusions, dependencies, approvals, and success criteria before building the project plan."},{"type":"heading","text":"Useful project brief fields"},{"type":"list","items":["Project name","Sponsor or decision-maker","Project coordinator","Business goal","Deliverables","Deadline","Known dependencies","Approval points","Risks already known","Source files and systems","Definition of done"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000011';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Projects fail when ownership is implied instead of explicit"},{"type":"paragraph","text":"A Project Management VA may coordinate the project without owning every decision. The team should know who performs work, who approves it, who decides when priorities conflict, and who needs to be informed."},{"type":"heading","text":"Separate coordination from authority"},{"type":"list","items":["Coordinator: keeps the plan, tasks, dependencies, meetings, and follow-ups current.","Task owner: performs or directly owns a specific piece of work.","Approver: confirms a deliverable meets the required standard.","Sponsor or decision-maker: resolves scope, budget, priority, or major trade-off decisions.","Stakeholder: needs visibility or input but may not own execution."]},{"type":"heading","text":"Make decision rights visible"},{"type":"paragraph","text":"A project can stall when everyone is waiting for someone else to decide. Record which decisions the coordinator can make, which require approval, and which must go to the sponsor."},{"type":"steps","items":["List the recurring decision types.","Assign the correct decision owner.","Set a response expectation when timing matters.","Record important decisions in one searchable place.","Update the project plan when a decision changes scope, timing, or ownership."]},{"type":"callout","title":"Do not become the accidental approver","text":"Chasing a decision does not give you authority to make it. Keep the project moving by presenting the facts, options, impact, and deadline to the right decision-maker."},{"type":"scenario","title":"Design approval delay","text":"The designer says the homepage is ready. Marketing wants changes, the founder is travelling, and development is waiting. Build the decision note showing what needs approval, who owns the decision, the impact of delay, and the next checkpoint."},{"type":"heading","text":"Governance can be lightweight"},{"type":"paragraph","text":"Small projects do not need enterprise bureaucracy. They still need clear ownership, a decision log, a source of truth, and agreed escalation rules."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000012';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Planning turns deliverables into executable work"},{"type":"paragraph","text":"A good project plan breaks a deliverable into tasks that can be owned, sequenced, and completed. The plan should show dependencies and milestones rather than becoming a long flat checklist."},{"type":"heading","text":"Break down work by outcome"},{"type":"steps","items":["Start from each deliverable.","Identify the work required to produce it.","Split work until each task has a clear owner and observable completion point.","Identify dependencies between tasks.","Group related work into phases or milestones.","Add estimates only after the task is understood."]},{"type":"heading","text":"Know the planning terms"},{"type":"list","items":["Task: a unit of work with an owner and completion condition.","Dependency: work that must happen before or alongside another task.","Milestone: a meaningful checkpoint, decision, or completed phase.","Estimate: expected effort or duration based on current information.","Buffer: deliberate time reserved for uncertainty, review, or transition.","Critical dependency: a dependency whose delay threatens the project outcome or deadline."]},{"type":"callout","title":"Do not make every task a milestone","text":"Milestones should show meaningful progress or decisions. If every small task is marked as a milestone, the project loses its useful checkpoints."},{"type":"scenario","title":"Launch plan","text":"A campaign launch needs landing-page copy, design, development, QA, tracking setup, client approval, and scheduled promotion. Map the dependencies and identify two milestones that are more useful than simply listing all seven tasks."},{"type":"heading","text":"Estimate with uncertainty visible"},{"type":"paragraph","text":"If a task depends on an external vendor or approval, do not present the date as guaranteed. Record the assumption and show which later tasks move if the dependency slips."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000021';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A timeline must reflect capacity, not wishful thinking"},{"type":"paragraph","text":"Project schedules often fail because dates are assigned before checking whether the people doing the work actually have time. A Project Management VA should distinguish task duration from available capacity and make conflicts visible early."},{"type":"heading","text":"Schedule in the right order"},{"type":"steps","items":["Identify fixed external dates.","Place critical dependencies first.","Check the owner’s realistic working capacity.","Add review and approval time.","Account for weekends, time zones, leave, and known closures.","Add buffers where uncertainty is meaningful.","Recheck the full chain after any major date changes."]},{"type":"heading","text":"Capacity questions"},{"type":"list","items":["Who is doing the work?","How much project time do they actually have this week?","What other deadlines compete for that time?","Does the task require focused work or can it run in parallel?","Is review time separate from production time?","Does an external party control part of the schedule?"]},{"type":"callout","title":"A deadline is not a capacity plan","text":"Assigning five tasks to the same person for the same day does not create five times more capacity."},{"type":"scenario","title":"Compressed timeline","text":"The client wants a two-week launch. Design needs three days, development four, QA two, and client approval usually takes two business days. The same developer is also supporting another launch. Explain how you would build a realistic schedule and what trade-offs need a client decision."},{"type":"heading","text":"When the timeline slips"},{"type":"paragraph","text":"Update the downstream impact, not only the delayed task. A good schedule makes the consequences of delay visible before the final deadline is missed."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000022';

update public.training_lessons
set
  content = '[{"type":"heading","text":"The project board should show reality"},{"type":"paragraph","text":"Whether the team uses ClickUp, Asana, Trello, Monday, Notion, Jira, or another tool, the board is useful only when its statuses and owners reflect what is actually happening."},{"type":"heading","text":"Every active task should answer"},{"type":"list","items":["What is the outcome?","Who owns it?","What is the due date?","What is blocking it?","What status is it really in?","What evidence will show completion?","What happens next?"]},{"type":"heading","text":"Avoid vague statuses"},{"type":"paragraph","text":"A status such as ''in progress'' can hide work that has not moved for a week. If the tool allows it, distinguish active work from waiting on client, blocked, in review, or ready for approval."},{"type":"heading","text":"Work-in-progress limits improve focus"},{"type":"paragraph","text":"Starting more tasks can make the project slower when the team already has too much unfinished work. Surface overloaded owners and encourage completion of priority work before adding unnecessary new starts."},{"type":"callout","title":"Do not update the board to make it look healthy","text":"A task should not move to done because the deadline passed or because reporting is due. The board must remain an honest operating record."},{"type":"scenario","title":"Green board, late project","text":"Every task on the board is marked ''in progress'', but three owners are waiting for approvals and two tasks have had no update for five days. Redesign the status logic and identify what information the project manager needs to surface."},{"type":"heading","text":"Useful board hygiene"},{"type":"list","items":["No ownerless active tasks","No completed tasks missing evidence","No blocked task without blocker details","No overdue task without a next action","No duplicate task representing the same work","No important decision hidden only in chat"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000031';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Meetings should produce decisions and actions"},{"type":"paragraph","text":"Project meetings are expensive when they repeat updates already visible on the board. The best meetings focus on decisions, blockers, risk, coordination, and issues that need synchronous discussion."},{"type":"heading","text":"Before the meeting"},{"type":"steps","items":["Clarify the purpose.","Review the current project status.","Collect blockers and decisions needed.","Send the agenda and pre-read when useful.","Invite only the people needed for the discussion or decision."]},{"type":"heading","text":"Capture more than a transcript"},{"type":"list","items":["Decisions made","Actions","Owner for each action","Due date","New risks or issues","Changes to scope or timeline","Questions still open","Items explicitly deferred"]},{"type":"callout","title":"Meeting notes are not action tracking","text":"If the action remains inside a paragraph of notes, it is easy to miss. Put actionable commitments into the project system with an owner and due date."},{"type":"scenario","title":"Weekly project meeting","text":"The team discusses a delayed vendor file, a requested feature change, two overdue QA tasks, and a launch-date concern. Write the meeting outputs as decisions, actions, owners, due dates, risks, and follow-ups rather than as a chronological transcript."},{"type":"heading","text":"After the meeting"},{"type":"steps","items":["Update the board.","Update the decision log.","Update risks and timeline if needed.","Send a concise summary.","Follow up owners whose actions are time-sensitive.","Remove superseded information so the project has one current source of truth."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000032';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Risk, issue, and dependency are not the same thing"},{"type":"list","items":["Risk: something that may happen and could affect the project.","Issue: a problem that is already happening.","Dependency: work, input, approval, or event that another part of the project relies on.","Assumption: something the plan currently treats as true but may need confirmation."]},{"type":"heading","text":"A simple risk record"},{"type":"list","items":["Risk description","Likelihood","Impact","Owner","Preventive action","Contingency","Trigger or warning sign","Review date"]},{"type":"heading","text":"Escalate before the consequence arrives"},{"type":"paragraph","text":"A risk should not wait until it becomes an issue. If the project depends on an approval that is already three days late, report the likely downstream impact while there is still time to make a decision."},{"type":"steps","items":["State what changed.","Show the impact on scope, timing, quality, or cost.","Explain what has already been attempted.","Present the available options.","Name the decision owner.","Set the decision deadline."]},{"type":"callout","title":"Do not inflate every inconvenience into a critical risk","text":"Risk reporting is useful when severity and urgency are meaningful. If everything is red, the team cannot distinguish what actually threatens the project."},{"type":"scenario","title":"Vendor dependency at risk","text":"A video vendor has not delivered the files needed for final editing. The launch is six business days away, editing needs three days, and QA needs one. Build the risk/issue escalation and show the latest safe decision point."},{"type":"heading","text":"Keep a visible RAID-style log when useful"},{"type":"paragraph","text":"Projects with many moving parts often benefit from one register for risks, assumptions, issues, and dependencies. The exact format can be simple as long as ownership and next actions are clear."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000041';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A status report should reduce uncertainty"},{"type":"paragraph","text":"Stakeholders do not need every task copied from the board. They need to know whether the project is on track, what changed, where decisions are needed, and what happens next."},{"type":"heading","text":"A useful weekly status"},{"type":"list","items":["Overall status with a factual reason","Completed this period","Next priorities","Milestones and dates","Risks and issues","Decisions needed","Scope or timeline changes","Dependencies requiring attention"]},{"type":"heading","text":"Use status labels carefully"},{"type":"paragraph","text":"If the client uses green, amber, and red, define what they mean. Green should not mean ''we are optimistic''. It should mean the project is within the agreed thresholds. Amber should identify a real risk that needs attention."},{"type":"callout","title":"Do not bury the decision","text":"If the project will miss a deadline unless the client chooses between two options today, that decision belongs near the top of the update, not at the bottom of a long report."},{"type":"scenario","title":"Executive update","text":"A project is 70% complete. Design is done, development is two days late, QA has not started, and the launch date is still achievable only if the client approves a reduced optional feature. Write the stakeholder update."},{"type":"heading","text":"Good status writing"},{"type":"list","items":["Separate facts from forecast.","Use exact dates.","Name owners where action is required.","Show impact, not drama.","Link detailed evidence instead of pasting everything.","Carry unresolved decisions forward until they are closed."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000042';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Change is normal; unmanaged change is the problem"},{"type":"paragraph","text":"Projects evolve. A stakeholder may request a new feature, extra deliverable, different audience, earlier date, or revised design. The coordinator should make the impact visible before the change silently becomes part of the plan."},{"type":"heading","text":"Change-control workflow"},{"type":"steps","items":["Record the requested change.","Clarify the desired outcome.","Estimate impact on tasks, dependencies, timeline, effort, quality, and cost where relevant.","Identify options and trade-offs.","Send the change to the authorised decision-maker.","Record the decision.","Update the plan, scope, timeline, and communication after approval."]},{"type":"heading","text":"Common scope-creep signals"},{"type":"list","items":["''While you are there, can you also…''","A deliverable now needs additional audiences or formats.","New approval rounds appear without timeline changes.","A stakeholder reopens something already accepted.","The team starts work on requests before impact is reviewed.","The definition of done keeps moving."]},{"type":"callout","title":"Do not treat every small clarification as a formal change request","text":"Change control should protect the project, not create bureaucracy. Use judgment and the client’s agreed threshold for what materially changes scope, cost, quality, or timeline."},{"type":"scenario","title":"Late feature request","text":"Five days before launch, the client requests a new calculator on the site. Development estimates three extra days plus QA. Prepare the change summary with options: delay launch, remove another item, launch without the calculator, or increase capacity if available."},{"type":"heading","text":"After approval"},{"type":"paragraph","text":"Do not leave the old plan active. Update tasks, milestone dates, owners, dependencies, and status reporting so everyone is working from the approved change."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000051';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Quality is defined before the final review"},{"type":"paragraph","text":"A project should not reach the end and discover that nobody agreed what ''good enough'' means. Acceptance criteria turn vague quality expectations into checks that can be reviewed before work is approved."},{"type":"heading","text":"Acceptance criteria should be observable"},{"type":"list","items":["Required content is present","Required functionality works","Specified devices, browsers, formats, or workflows were checked","Links and tracking are correct","Approvals are recorded","Required documentation exists","Known issues are documented and accepted","Final files are stored in the agreed location"]},{"type":"heading","text":"Quality workflow"},{"type":"steps","items":["Review against agreed criteria.","Record defects or gaps clearly.","Assign each issue an owner and priority.","Re-test corrected work.","Separate must-fix issues from optional improvements.","Get acceptance from the authorised approver.","Record any accepted known limitations."]},{"type":"callout","title":"Rework is data","text":"If the same quality problem appears repeatedly, the project should examine the upstream process rather than only fixing the final output again."},{"type":"scenario","title":"Launch QA","text":"The site is ready for client review. Two mobile layouts are broken, one tracking event is missing, and three cosmetic spacing issues remain. Classify the issues by launch impact, assign next actions, and state what should block acceptance."},{"type":"heading","text":"Avoid false completion"},{"type":"paragraph","text":"A task is not complete because the creator finished working on it. It is complete when the agreed review, acceptance, and handoff conditions are satisfied."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000052';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Closeout transfers the project from temporary work into normal ownership"},{"type":"paragraph","text":"Projects often lose value when the team finishes the deliverable but fails to hand over documentation, access, known issues, recurring responsibilities, and decisions. Closeout makes the result usable after the project team moves on."},{"type":"heading","text":"Handover checklist"},{"type":"list","items":["Final approved deliverables","Source files","Credentials or access transferred through approved methods","Owner after launch","Outstanding issues","Recurring maintenance tasks","Key decisions and assumptions","Vendor or supplier contacts","Relevant SOPs","Reporting or monitoring expectations"]},{"type":"heading","text":"Close the administration too"},{"type":"steps","items":["Confirm acceptance.","Archive obsolete drafts.","Update the final project status.","Close or transfer open tasks.","Record unresolved items.","Store the final documentation.","Remove temporary access where required.","Schedule any post-launch review or monitoring."]},{"type":"heading","text":"Run a useful retrospective"},{"type":"list","items":["What worked well?","What created delay or rework?","Which assumptions were wrong?","Which process should change next time?","What should become an SOP, template, or checklist?","Which improvement has a clear owner?"]},{"type":"callout","title":"A retrospective is not a blame meeting","text":"Focus on the system, decisions, assumptions, communication, and workflow. The goal is to make the next project easier to run."},{"type":"scenario","title":"Handover after launch","text":"A client portal has launched successfully, but one minor bug remains, analytics monitoring must continue for two weeks, and the operations team will now own user support. Build the project handover and closeout record."},{"type":"heading","text":"Definition of closed"},{"type":"paragraph","text":"The project is closed when deliverables are accepted, ownership is transferred, unresolved items are explicitly assigned, documentation is stored, and the business no longer depends on the temporary project team to understand what happens next."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000061';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Final composite project-coordination simulation"},{"type":"paragraph","text":"This simulation combines scope, planning, dependencies, scheduling, meetings, risk, stakeholder communication, change control, QA, and closeout. The fictional project is built from common coordination patterns rather than any single real client."},{"type":"scenario","title":"BrightPath Client Portal Launch","text":"BrightPath is launching a new client portal in three weeks. Design is approved. Development is 60% complete. The data migration depends on a client spreadsheet that is four days late. Marketing has requested an additional onboarding video that was not in the original scope. QA requires three business days. The founder wants the original launch date kept. One developer will be unavailable for two days next week."},{"type":"heading","text":"Part 1: Rebuild the plan"},{"type":"steps","items":["List the project deliverables and current status.","Map the major dependencies.","Identify the critical risks and issues.","Update the realistic timeline using the new capacity information.","Identify the decisions needed from the founder or client.","Show which tasks can continue while waiting for the spreadsheet."]},{"type":"heading","text":"Part 2: Coordinate the team"},{"type":"list","items":["Write the weekly status update.","Prepare the agenda for the next project meeting.","Write the decision note for the requested onboarding video.","Create the action list with owners and deadlines.","Record the delayed spreadsheet as an issue or dependency and explain why."]},{"type":"heading","text":"Part 3: Quality and closeout"},{"type":"steps","items":["Define launch acceptance criteria.","Plan the QA window.","List the handover items needed after launch.","Write the closeout checklist.","Propose one retrospective question that would reveal a process improvement."]},{"type":"callout","title":"Assessment standard","text":"A strong answer makes scope, ownership, dependencies, decisions, risks, and acceptance visible. It does not preserve the appearance of an on-time project by hiding trade-offs or compressing work unrealistically."},{"type":"heading","text":"Self-review"},{"type":"list","items":["Did I distinguish scope from tasks?","Did I make decision owners explicit?","Did I update downstream dates after dependency changes?","Did I surface change impact before accepting new work?","Did I protect QA and acceptance rather than treating them as optional?","Could another coordinator take over from my project record?"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000013-0000-4000-8000-000000000062';

update public.training_assessments
set
  instructions = 'Complete the BrightPath Client Portal Launch composite project-coordination simulation. Define scope and deliverables, rebuild the plan around dependencies and capacity, identify risks and decisions, prepare the stakeholder update and meeting actions, assess the requested scope change, define QA and acceptance, and produce the handover and closeout plan. The assessment tests project coordination judgment and work output rather than project-management trivia.',
  is_published = false,
  updated_at = now()
where id = '23000000-0000-4000-8000-000000000013';
