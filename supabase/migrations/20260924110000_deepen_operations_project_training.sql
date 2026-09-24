-- Deep instructional-design pass for Operations and Project Management.
-- Replaces generic catalog practice blocks with connected, role-specific artifacts.
-- Preserves course/module/lesson IDs and learner progress.

with practice_specs (
  course_slug,
  lesson_slug,
  scenario_title,
  scenario_text,
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
    'operations-virtual-assistant',
    'processes-inputs-outputs-owners-and-controls',
    'Summit booking workflow: find the control gaps',
    'Summit Service Group receives residential service bookings through a web form. A lead should move through: web form → CRM → follow-up task → booking → dispatch → technician visit → completion evidence → invoice-ready status.

This week, three jobs reached dispatch without a confirmed service address, two bookings had no mobile number, and one completed job had no technician evidence attached. The team currently fixes these problems downstream.

Map where each required input should be checked, who owns the step, what output proves the step succeeded, and which control should stop incomplete work from moving forward.',
    'Build the booking process control map',
    'Build the current-state process from trigger to invoice-ready status. Mark the three control points where missing address, contact, or completion evidence should stop the workflow. Then define the owner and completion evidence for every step.',
    'A process-control map with trigger, required inputs, ordered steps, owner, output, control, exception path, and completion evidence. Include the three stop conditions that prevent downstream rework.',
    'Process control map',
    'Process:
Trigger:
Desired final output:

STEP
Step:
Owner:
Required input:
Source of input:
Action:
Output:
Control / validation:
Stop condition:
Exception owner:
Completion evidence:
Next step:

Process-level definition of done:
Known recurring failure:
Control improvement to test:',
    'Process-map QA',
    array['The workflow starts from a clear trigger and ends at a verifiable output.','Each step has one accountable owner and the required input is named.','Missing address, contact, or completion evidence cannot silently move downstream.','Controls are placed before the cost of failure increases.','Exception routing is separate from the normal path.','Another operator could run the process without relying on tribal knowledge.']::text[]
  ),
(
    'operations-virtual-assistant',
    'operational-risk-exceptions-and-escalation',
    'Summit morning exception queue',
    'At 08:30 Summit''s operations queue contains:
• 14 Friday jobs still open, oldest 3 days, customer delay risk.
• Materials for 6 Tuesday jobs are delayed, supplier ETA not confirmed.
• 5 CRM records appear duplicated, but two may be separate household contacts.
• On-time completion fell from 88% to 79% this week.
• Booking automation stopped creating follow-up tasks at 00:40.
• A technician reported a vehicle breakdown before the first appointment.

The operations manager is in a client meeting for 45 minutes. Decide what must be contained now, what can wait, what needs management approval, and what evidence belongs in the escalation.',
    'Run the exception control board',
    'Rank the six exceptions by consequence, time sensitivity, dependency, and reversibility. Define the immediate containment step you can take without approval and the exact escalation trigger for each item.',
    'A six-row exception control board with severity rationale, verified facts, operational impact, containment, owner, escalation trigger, decision needed, evidence link placeholder, and next checkpoint.',
    'Operational exception control board',
    'Exception:
Detected at:
Verified facts:
Unknown / unverified:
Customer / operational impact:
Deadline / time sensitivity:
Dependencies affected:
Reversible?:
Immediate containment:
Owner:
Escalation trigger:
Decision / approval needed:
Evidence / source:
Next checkpoint:
Status:',
    'Exception-board QA',
    array['Priority is based on impact and timing, not who complained first.','Verified facts are separated from assumptions.','Safe containment continues while management is unavailable.','Duplicate or conflicting records are not force-resolved without evidence.','Every escalation states the exact decision needed.','Every open exception has an owner and checkpoint.']::text[]
  ),
(
    'operations-virtual-assistant',
    'writing-and-maintaining-useful-sops',
    'Turn Summit''s vague close-out routine into an SOP',
    'Summit''s current close-out instruction is five lines:
1. Check finished jobs.
2. Make sure photos are there.
3. Update CRM.
4. Tell accounts if ready.
5. Let someone know if there''s a problem.

In practice, staff disagree about what counts as "finished," which photos are required, what CRM status to use, when accounts should be notified, and what to do if technician notes conflict with the job card.',
    'Write a usable job close-out SOP',
    'Rewrite the five-line instruction into an SOP that a trained replacement could use. Include purpose, trigger, required inputs, ordered steps, decision rules, exception path, quality checks, output, owner, and version/review information.',
    'A complete job close-out SOP plus a short list of unresolved business rules that must be confirmed before the SOP can be treated as final.',
    'Operational SOP',
    'SOP title:
Purpose:
Scope:
Trigger:
Owner:
Systems:
Required inputs:
Prerequisites:

NORMAL PROCEDURE
1.
2.
3.
4.

DECISION RULES
If:
Then:

EXCEPTIONS / ESCALATION
Exception:
Action allowed:
Decision owner:

QUALITY CHECKS
-
-

Output / handoff:
Completion evidence:
Version:
Process owner:
Last reviewed:
Next review trigger:
Open rule requiring confirmation:',
    'SOP quality check',
    array['The SOP tells the operator when the process starts and what must already exist.','Vague phrases such as ''as needed'' or ''normally'' are replaced with usable rules.','Normal steps are separated from exceptions and approvals.','Completion evidence is explicit.','The SOP does not invent pricing, safety, accounting, or management rules.','Version owner and review trigger are recorded.']::text[]
  ),
(
    'operations-virtual-assistant',
    'checklists-templates-and-recurring-task-systems',
    'Design Summit''s daily, weekly, and monthly control rhythm',
    'Summit currently relies on memory for recurring operations. Jobs are checked "when someone has time," supplier expiries are in a private spreadsheet, weekly KPI reporting is often late, and month-end invoice exceptions are reviewed only after Accounts asks.

The manager wants one visible operating rhythm without duplicating reminders across the CRM, task tool, calendar, and Slack.',
    'Build the recurring operations control board',
    'Design a control board covering daily queue checks, weekly reconciliation, vendor expiry review, weekly KPI reporting, and month-end exception review. Choose one source of truth and define what happens when a control is missed.',
    'A recurring control board with frequency, exact trigger or due rule, owner, source system, required inputs, checklist, completion evidence, missed-run escalation, and backup owner.',
    'Recurring operations control board',
    'Control:
Purpose:
Frequency:
Due rule + time zone:
Primary owner:
Backup owner:
Source of truth:
Required inputs:
Checklist:
1.
2.
3.
Completion evidence:
Where evidence is stored:
Missed-run trigger:
Escalation owner:
Next occurrence:
Status:',
    'Recurring-system QA',
    array['Each recurring control has one source of truth.','Frequency and due rule are explicit, including time zone where needed.','The control produces visible completion evidence.','Missed or blocked runs create an exception instead of disappearing.','The design avoids duplicate reminders in multiple systems.','The board distinguishes daily, weekly, and monthly work clearly.']::text[]
  ),
(
    'operations-virtual-assistant',
    'vendor-supplier-and-contractor-administration',
    'Three Summit suppliers, three different risks',
    'Summit relies on three suppliers:
• MetroParts: 95% on-time, contract expires 18 Oct, insurance certificate expires 30 Sep, current open order ₱86,000 equivalent.
• QuickStock: 82% on-time, no current SLA document in the shared folder, cheaper by 7%, one unresolved damaged-delivery claim.
• ProTrade: backup supplier, 98% on-time, higher unit cost, approved only for emergency orders below the manager''s delegated limit.

Six Tuesday jobs depend on materials that MetroParts has not confirmed. The manager wants a vendor view that supports action without the VA choosing commercial terms.',
    'Build the vendor risk and follow-up register',
    'Create a vendor register for the three suppliers. Surface the Tuesday material risk, document expiry, unresolved claim, SLA gap, backup option, and the decisions that still belong to management.',
    'A three-vendor register with service, performance evidence, open commitments, document expiries, approval limits, risk, backup option, next follow-up, and management decision required.',
    'Vendor and supplier register',
    'Vendor:
Service / material:
Primary contact:
Contract / SLA source:
On-time performance:
Open order / commitment:
Due date:
Document expiry:
Open issue:
Operational risk:
Backup vendor / fallback:
Action I can take:
Approval / commercial decision needed:
Next follow-up:
Evidence:
Owner:
Status:',
    'Vendor-register QA',
    array['Performance and risk claims trace back to supplied evidence.','Expiry dates and open commitments are visible.','Commercial choices and approval limits remain with authorised staff.','Backup options are documented without silently switching suppliers.','Open claims and SLA gaps have owners and checkpoints.','The Tuesday-job dependency is visible to downstream operations.']::text[]
  ),
(
    'operations-virtual-assistant',
    'cross-team-handoffs-and-dependency-tracking',
    'A recurring service chain is starting to stall',
    'Summit''s recurring service chain is:
Booking coordinator → Dispatch → Technician → Operations QA → Accounts.

Today:
• Job S-1042 is booked but dispatch is waiting on access instructions.
• Job S-1047 is complete in the field, but technician photos are missing.
• Job S-1051 passed QA, but Accounts has not received the invoice-ready handoff.
• Job S-1055 is waiting on a customer confirmation due by 15:00.
• Job S-1060 is scheduled tomorrow but materials are still unconfirmed.
• Job S-1062 was cancelled, but the recurring follow-up task is still open.

No single team owns every step, so the handoff board must make stalled dependencies obvious.',
    'Build the recurring dependency board',
    'Create a dependency board for all six jobs. Show predecessor, current owner, blocked reason, downstream effect, due time, next action, and escalation threshold.',
    'A six-row dependency board that makes waiting work, downstream impact, next owner, and overdue escalation visible without turning BAU work into a project plan.',
    'Recurring dependency board',
    'Work item:
Current stage:
Predecessor / required input:
Current owner:
Waiting on:
Due date / time:
Blocked reason:
Downstream team / work affected:
Next action:
Next owner:
Escalate when:
Source record:
Status:
Last updated:',
    'Dependency-board QA',
    array['Every waiting item names the missing predecessor or input.','Current and next ownership are unambiguous.','Downstream impact is visible before deadlines are missed.','Cancelled or completed work cannot remain falsely active.','Escalation is threshold-based rather than ad hoc.','The board describes recurring BAU flow, not finite project milestones.']::text[]
  ),
(
    'operations-virtual-assistant',
    'operational-data-quality-and-reconciliation',
    'Three systems disagree about the same Summit jobs',
    'At 16:00, Operations compares CRM, dispatch, and invoice-ready records:
• S-1047: CRM = Complete; Dispatch = Complete; Invoice-ready = No.
• S-1051: CRM = Booked; Dispatch = Complete; Invoice-ready = Yes.
• S-1055: CRM appears twice with the same phone but different email addresses.
• S-1058: Dispatch = Cancelled; CRM = Active; invoice draft exists.
• S-1060: CRM = Booked; Dispatch = Scheduled; material flag = Missing.
• S-1064: invoice-ready record exists, but no matching CRM job ID.

The VA must reconcile evidence, not make the systems agree by force.',
    'Produce the reconciliation exception log',
    'Compare the six records and classify each as match, missing record, stale status, duplicate candidate, conflicting record, or control failure. State what can be corrected from evidence and what must be investigated.',
    'A reconciliation sheet with source values, discrepancy type, evidence, safe correction, records held for review, owner, and next checkpoint. Include before/after exception counts.',
    'Operational reconciliation log',
    'Record ID:
System A value:
System B value:
System C value:
Discrepancy type:
Verified evidence:
Safe correction:
Do not change yet because:
Review / approval owner:
Before exception count:
After exception count:
Source links:
Next checkpoint:
Final status:',
    'Reconciliation QA',
    array['Source values are recorded before correction.','Duplicate candidates are not merged solely because names or phone numbers look similar.','Stale, missing, duplicate, and conflicting records are classified separately.','Corrections are made only when evidence supports them.','Before/after counts prove records were not silently lost.','Unresolved mismatches stay visible with an owner.']::text[]
  ),
(
    'operations-virtual-assistant',
    'kpi-reporting-and-exception-summaries',
    'Summit''s weekly numbers are deteriorating',
    'Summit weekly KPI extract:
W35: on-time completion 93%, rework 4%, open backlog 18
W36: on-time completion 91%, rework 5%, open backlog 21
W37: on-time completion 88%, rework 5%, open backlog 25
W38: on-time completion 79%, rework 9%, open backlog 34

Other evidence:
• Materials were late on 6 jobs in W38.
• Booking automation failed for part of W38.
• Two technicians were absent for one day each.
• No validated root-cause analysis has been completed.

Management needs a useful variance brief, not a confident story based on correlation.',
    'Write the KPI variance brief',
    'Calculate or state the key week-over-week and four-week changes, identify which movements require investigation, separate evidence from hypotheses, and propose the next data cuts or checks.',
    'A one-page KPI variance brief covering change, magnitude, operational significance, known evidence, hypotheses not yet proven, questions to investigate, owner, and next review date.',
    'KPI variance brief',
    'Reporting period:
Metric:
Current:
Previous:
Change:
Baseline / earlier period:
Direction:
Operational significance:

KNOWN EVIDENCE
-

HYPOTHESES TO TEST
-

DATA / CHECKS NEEDED
-

Decision / action now:
Owner:
Next review:
Source:
Limitations:',
    'KPI-brief QA',
    array['The brief quantifies change instead of saying a metric ''got worse.''','Correlation is not presented as proven cause.','Known operational events are separated from hypotheses.','Data definitions and reporting periods are consistent.','Next investigations are specific and actionable.','Management receives a concise decision-ready summary.']::text[]
  ),
(
    'operations-virtual-assistant',
    'finding-bottlenecks-and-repeated-failure-points',
    'Summit onboarding is slow, but the slow step is not obvious',
    'Summit''s last 20 client onboardings show median stage times:
• Signed agreement → complete intake: 0.8 day
• Intake → shared-folder setup: 0.3 day
• Folder setup → billing approval: 2.6 days
• Billing approval → kickoff booking: 0.4 day

Additional evidence:
• 7 of 20 intake forms were missing billing contacts.
• 5 of those 7 required two follow-ups.
• Billing approval cannot begin without a valid contact.
• Staff believe "the folder setup team is slow," but its median time is 0.3 day.',
    'Find the bottleneck and design the smallest safe experiment',
    'Identify the most likely queue or control causing cycle-time delay, show the evidence, reject at least one weak explanation, and propose a small reversible experiment with a success measure.',
    'A bottleneck analysis with stage timing, queue/rework evidence, hypothesis, counter-evidence, proposed experiment, guardrails, success metric, review period, and rollback condition.',
    'Bottleneck analysis',
    'Process:
Observed symptom:
Stage timings:
Queue / backlog evidence:
Rework evidence:
Likely bottleneck:
Evidence supporting:
Alternative explanation:
Evidence against alternative:
Smallest safe experiment:
Owner:
Start date:
Success metric:
Guardrail:
Review period:
Rollback condition:
Decision needed:',
    'Bottleneck-analysis QA',
    array['The bottleneck claim uses cycle-time or queue evidence.','A popular but unsupported explanation is not accepted automatically.','The experiment changes one meaningful variable where possible.','Success is defined before the test begins.','The experiment is reversible and has guardrails.','Results will be reviewed before standardising the change.']::text[]
  ),
(
    'operations-virtual-assistant',
    'automation-awareness-and-safe-change-management',
    'Summit''s booking automation failed overnight',
    'At 00:40 Summit''s CRM continued receiving web leads, but the automation that creates coordinator follow-up tasks stopped. By 08:30 there are 11 leads with no task. No approved automation change is documented.

Systems confirms the CRM itself is receiving leads normally. A coordinator can manually create tasks. The last known-good automated task was created at 00:38. The VA does not have authority to edit the production automation without approval.',
    'Prepare a controlled automation-change brief',
    'Document the failure, contain the operational risk, define the evidence to collect, propose a safe change path, and write rollback and validation checks. Keep the production change decision with the authorised owner.',
    'An automation change brief with incident window, scope, affected records, containment, suspected failure point, evidence, proposed change, approval owner, test plan, rollback, post-change validation, and monitoring checkpoint.',
    'Controlled automation change brief',
    'Automation / workflow:
Expected trigger:
Expected action:
Last known good:
First known failure:
Affected records:
Business impact:
Containment now:
Evidence collected:
Suspected failure point:
Proposed change:
Authorised approver:
Test environment / method:
Validation checks:
Rollback plan:
Post-change monitoring:
Next checkpoint:
Final decision:',
    'Automation-change QA',
    array['Affected records and failure window are quantified.','Manual containment prevents lead loss while diagnosis continues.','A suspected cause is not presented as confirmed without evidence.','Production changes require the authorised owner.','Rollback and validation are defined before change.','Post-change monitoring checks both successful actions and missed records.']::text[]
  ),
(
    'operations-virtual-assistant',
    'incident-coordination-and-business-continuity-handoffs',
    'Summit incident: booking workflow unavailable during peak intake',
    'At 09:10 the booking workflow becomes unavailable. Web enquiries still arrive by email, but staff cannot create bookings in the normal system. There are 8 new enquiries, 3 customers waiting on same-day confirmation, and 5 technicians already in the field.

The manager is unavailable until 09:55. The approved continuity method is to capture minimum booking details in the outage sheet and avoid promising an appointment until the system returns. At 09:32 Systems reports service is partially restored but asks staff not to backfill records yet.',
    'Run the first 45 minutes of the incident',
    'Build the incident timeline from 09:10 to 09:55. Track containment, customer impact, temporary process, owners, deferred decisions, restoration evidence, and the manager handoff.',
    'An incident record with timeline, impact, continuity controls, affected queue, customer communication rule, owner actions, deferred decisions, restoration criteria, backfill plan, and next checkpoint.',
    'Operations incident record',
    'Incident:
Start time:
Detected by:
Systems affected:
Confirmed impact:
Customers / work affected:
Temporary continuity process:
Do not do:
Owner:

TIMELINE
Time:
Event / evidence:
Action:
Owner:
Decision:

Restoration criteria:
Backfill rule:
Unresolved risk:
Manager decision needed:
Next checkpoint:
Handoff summary:',
    'Incident-record QA',
    array['The incident record is factual and time-stamped.','Continuity steps preserve work without creating duplicate records.','Customer promises stay inside the approved outage rule.','Partial restoration is not treated as full recovery.','Deferred decisions remain visible for the manager.','Backfill and recovery have explicit criteria and owners.']::text[]
  ),
(
    'operations-virtual-assistant',
    'composite-operations-va-simulation',
    'Summit Service Group: operations control desk',
    'It is 08:30 Monday at Summit Service Group. The booking automation failed overnight, 14 old jobs remain open, six Tuesday jobs face material delays, three systems disagree on job status, on-time completion fell to 79%, and the manager is unavailable for the first 45 minutes.

By midday, Systems proposes a production automation fix, MetroParts still has not confirmed delivery, and Accounts reports two invoice-ready records with no matching completion evidence.

Run the day as an Operations VA. Improve the operating system while keeping BAU moving. Do not turn the work into a finite project plan.',
    'Run the full operations control desk',
    'Use the supplied final assessment resource pack to build the working control desk for the day. Connect the process map, exception queue, dependency board, reconciliation, KPI analysis, controlled change, and incident handoff so every open item has an owner and checkpoint.',
    'A complete operations portfolio: daily control board, process/control map, exception register, vendor/dependency tracker, reconciliation log, KPI variance brief, controlled automation change brief, incident record, manager summary, and end-of-shift handoff.',
    'Operations control-desk index',
    'DATE:
Manager:
Operations VA:

TOP RISKS TODAY
1.
2.
3.

CONTROL BOARD
Item:
Owner:
Status:
Deadline:
Exception:
Decision needed:
Next checkpoint:

ARTIFACTS
Process map:
Exception register:
Vendor/dependency tracker:
Reconciliation log:
KPI brief:
Automation change brief:
Incident record:

MANAGER SUMMARY
What changed:
What is contained:
What needs decision:
What could worsen next:
Next checkpoint:

END-OF-SHIFT
Completed:
Still open:
Next owner:
Evidence / links:
Tomorrow first:',
    'Operations simulation QA',
    array['BAU work continues while genuine exceptions are escalated.','Every metric, mismatch, or incident claim traces to supplied evidence.','Process, data, vendor, automation, and incident artifacts agree with each other.','The response does not create project scope, milestones, or change-control bureaucracy for BAU.','Management decisions are concise and explicit.','Every open item ends with owner, evidence, and next checkpoint.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'projects-scope-deliverables-and-success-criteria',
    'BrightPath portal launch: turn the brief into a charter',
    'BrightPath Accounting wants a secure client portal launched in three weeks. The founder says the portal should let clients upload documents, view request status, and receive onboarding guidance.

Known constraints:
• Design is already approved.
• One developer and one QA specialist are available.
• Existing website login must remain unchanged.
• Marketing wants an onboarding video, but it was not in the approved brief.
• Budget changes require founder approval.
• Launch acceptance must include functional, permissions, analytics, and data-migration checks.

The project coordinator must make scope and success visible before building the plan.',
    'Write the mini project charter',
    'Convert the brief into a one-page charter. Define outcome, in-scope deliverables, explicit exclusions, acceptance criteria, sponsor, target date, assumptions, constraints, and unresolved decisions.',
    'A project charter with business outcome, deliverables, exclusions, measurable acceptance conditions, sponsor/owner, target date, constraints, assumptions, and unresolved scope questions.',
    'Project charter',
    'Project:
Business outcome:
Sponsor:
Project coordinator:
Target launch:

IN SCOPE
-
-

OUT OF SCOPE
-
-

DELIVERABLES
Deliverable:
Owner:
Acceptance condition:

Constraints:
Assumptions:
Known dependencies:
Unresolved decisions:
Scope baseline approved by:
Approval date:
Source brief:',
    'Charter QA',
    array['The charter defines an outcome rather than just a list of tasks.','In-scope and out-of-scope work are explicit.','Acceptance criteria are observable.','Assumptions and unresolved decisions are visible.','The onboarding video is not silently added to baseline scope.','Sponsor and scope approval are recorded.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'roles-ownership-decisions-and-governance',
    'BrightPath approval delay: who owns the decision?',
    'The portal team includes:
• Founder/sponsor: owns scope, budget, and launch-date trade-offs.
• Client representative: supplies migration spreadsheet and signs off migrated data.
• Developer: builds portal functionality.
• QA specialist: tests against acceptance criteria.
• Marketing: owns onboarding content and requested a video.
• Project coordinator/VA: maintains plan, decisions, risks, follow-ups, and stakeholder updates.

A design clarification is waiting because Marketing, Developer, and the client representative all commented, but nobody knows who may approve the final change.',
    'Build the decision-rights map',
    'Create a RACI-lite table for six recurring project decisions: scope, launch date, design clarification, data acceptance, QA defect severity, and onboarding-video request. Separate doing the work from approving the decision.',
    'A decision-rights matrix showing responsible owner, decision approver, consulted roles, informed roles, escalation route, and evidence of the final decision.',
    'Decision-rights matrix',
    'Decision / work item:
Responsible:
Decision approver:
Consulted:
Informed:
Input required:
Decision deadline:
Escalate to:
Evidence of decision:
Plan / board update required:
Status:',
    'Governance QA',
    array['Task ownership is separated from decision authority.','Scope, budget, and launch-date trade-offs remain with the sponsor.','Data acceptance has an authorised client owner.','The coordinator records decisions but does not invent them.','Every decision has a deadline and evidence location.','The matrix reduces approval ambiguity instead of adding unnecessary roles.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'tasks-dependencies-milestones-and-estimates',
    'BrightPath dependency chain: the late spreadsheet',
    'Current work:
• Design: approved.
• Portal build: 60% complete.
• Data mapping: waiting on the client''s spreadsheet, now 4 days late.
• Data migration: depends on mapping.
• QA: requires completed build + migrated data and needs 3 business days.
• Analytics validation: occurs during QA.
• Launch: depends on accepted QA.
• Onboarding video: requested but not in baseline scope.

One developer will be unavailable for two days next week.',
    'Build the dependency and milestone map',
    'Break the remaining portal work into a dependency-based task list. Identify which items can continue without the spreadsheet, which path threatens launch, and where a milestone decision is needed.',
    'A dependency map with tasks, estimates, predecessors, owners, milestone, earliest start, blocked reason, downstream impact, and critical launch dependencies.',
    'Dependency and milestone map',
    'Task:
Deliverable / milestone:
Owner:
Estimate:
Predecessor:
Input required:
Earliest start:
Due date:
Can proceed without blocked input?:
Blocked reason:
Downstream tasks affected:
Critical to launch?:
Next action:
Evidence / source:',
    'Dependency-map QA',
    array['Dependencies describe real predecessor work, not just task order.','Tasks that can proceed in parallel are visible.','The late spreadsheet''s downstream impact is explicit.','QA remains dependent on completed build and migrated data.','Out-of-scope work is not included as an assumed dependency.','Milestones have observable completion evidence.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'timelines-capacity-and-realistic-scheduling',
    'BrightPath schedule pressure: three weeks is no longer a promise',
    'The founder wants to keep the original launch date.

Remaining facts:
• Development: estimated 5 working days.
• Developer unavailable for 2 days next week.
• Data mapping: 1 day after spreadsheet arrives.
• Migration: 1.5 days after mapping.
• QA: 3 business days after build + migration.
• Fix/retest buffer: 2 business days recommended.
• Client spreadsheet is already 4 days late and still has no confirmed delivery time.

The coordinator must show what is possible, not compress work invisibly.',
    'Build the capacity-aware schedule',
    'Create a revised schedule with earliest realistic dates, capacity constraints, QA/retest protection, and two sponsor options if the spreadsheet remains late. State what is known versus dependent on an unknown date.',
    'A capacity-aware schedule plus a decision note showing earliest feasible launch, assumptions, resource constraints, protected QA/retest time, options, and sponsor decision required.',
    'Capacity-aware project schedule',
    'Planning date:
Target launch:
Known constraint:
Unknown / dependency:

WORK
Task:
Owner:
Effort:
Available capacity:
Predecessor:
Earliest start:
Earliest finish:
Buffer:
Committed? Yes / No

LAUNCH OPTIONS
Option:
Trade-off:
Risk:
Decision owner:

Earliest feasible launch:
Assumptions:
Decision deadline:',
    'Schedule QA',
    array['The plan accounts for actual resource availability.','Unknown spreadsheet timing is not converted into a fake committed date.','QA and re-test time are protected.','Parallel work is used where valid without breaking dependencies.','Launch options show trade-offs rather than hiding them.','The sponsor owns launch-date trade-offs.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'project-boards-statuses-and-work-in-progress',
    'BrightPath board looks green, but the project is not',
    'The current board says:
• Development: In progress.
• Data migration: In progress.
• QA: To do.
• Onboarding video: In progress.
• Analytics: To do.

Evidence shows:
• Data migration cannot start because the client spreadsheet is missing.
• Marketing started the onboarding video without scope approval.
• Development is active at 60%.
• QA cannot start until build and migration complete.
• Analytics validation belongs inside QA.

The board is visually active but operationally misleading.',
    'Repair the project board',
    'Move the five items into accurate statuses using evidence, define the status rules, and add the missing blocked/approval fields so the board reflects reality.',
    'A corrected board snapshot with status definitions, owner, dependency, blocker, approval state, due date, next action, and WIP note for each work item.',
    'Project board snapshot',
    'STATUS DEFINITIONS
Not started:
Ready:
In progress:
Blocked:
Waiting approval:
Done:

WORK ITEM
Task:
Owner:
Status:
Evidence for status:
Dependency:
Blocker:
Approval state:
Due date:
Next action:
WIP concern:
Last updated:',
    'Board-quality QA',
    array['Blocked work is not labelled in progress.','Unapproved scope is not treated as active baseline work.','Status definitions are evidence-based.','Every blocked item names the blocker and next action.','WIP reflects actual team capacity.','The board can be trusted by someone who was not in the latest meeting.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'meetings-notes-decisions-and-action-tracking',
    'BrightPath weekly meeting: separate talk from decisions',
    'Messy meeting notes:
• Founder: "I still want the 30th if we can make it."
• Developer: build needs roughly five working days; unavailable Thursday-Friday next week.
• Client: "I''ll chase the spreadsheet today."
• Marketing: "We already started the onboarding video."
• QA: needs three full business days and cannot shorten the permissions test.
• Founder: "Don''t delay for the video. Put that through change control."
• Client: "If the spreadsheet isn''t here tomorrow, call me at noon."
• Developer: "I can finish document-upload work while data is blocked."

Turn the meeting into operational project records.',
    'Produce the decision and action log',
    'Extract only actual decisions, actions, owners, deadlines, risks/issues, and unanswered questions. Do not record preferences as decisions unless authority was exercised.',
    'Meeting record with confirmed decisions, action items, owners, deadlines, decision evidence, open questions, risk/issue updates, and board changes required.',
    'Project decision and action log',
    'Meeting:
Date:
Attendees:

DECISION
Decision:
Decision owner:
Evidence / exact source:
Date:
Plan / scope impact:

ACTION
Action:
Owner:
Deadline:
Dependency:
Status:

OPEN QUESTION
Question:
Decision owner:
Needed by:

RISK / ISSUE UPDATE:
Board changes:
Next meeting checkpoint:',
    'Meeting-record QA',
    array['Preferences and suggestions are not mislabelled as decisions.','Every action has one owner and deadline.','The video decision reflects the founder''s actual instruction.','The spreadsheet follow-up and escalation time are captured.','Board/RAID changes are identified.','The record is concise enough to use after the meeting.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'risks-issues-dependencies-and-escalation',
    'BrightPath RAID review before the launch window',
    'Current project facts:
• Client spreadsheet is 4 days late and blocks migration.
• Developer absence next week is confirmed.
• QA needs 3 business days and will not shorten permissions testing.
• Onboarding video is an unapproved scope request.
• Founder wants original launch date, but no new capacity is approved.
• A defect has been found in file-upload permissions during development testing.
• Client contact is available tomorrow at noon for escalation.

Classify what is a risk, issue, assumption, dependency, or decision.',
    'Build the RAID and decision register',
    'Create the project RAID log and decision queue. For every entry, assign category, probability/impact where relevant, trigger, owner, response, decision needed, and next review.',
    'A RAID + decision register covering the six facts, with risk/issue distinction, dependencies, assumptions, owners, triggers, mitigation/response, decisions, and review dates.',
    'RAID and decision register',
    'ID:
Type: Risk / Issue / Assumption / Dependency / Decision
Description:
Evidence:
Probability:
Impact:
Trigger:
Owner:
Response / mitigation:
Decision needed:
Decision owner:
Due date:
Next review:
Status:
Related task / milestone:',
    'RAID QA',
    array['Potential future events are separated from problems already happening.','Dependencies name the external input or predecessor.','Assumptions are testable and visible.','Every high-impact item has an owner and response.','Decision items state the exact choice required.','The register connects to tasks and milestones instead of becoming a dead log.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'stakeholder-updates-and-status-reporting',
    'BrightPath weekly status: no greenwashing',
    'This week''s facts:
• Design complete.
• Development 60%.
• Spreadsheet 4 days late; data migration blocked.
• Developer unavailable 2 days next week.
• QA duration fixed at 3 business days.
• Onboarding video requested, not approved, and should not block baseline launch.
• Permissions defect found during development test.
• Original launch date is at risk unless the spreadsheet arrives and no further material defects appear.

The founder wants an update they can read in under two minutes.',
    'Write the weekly project status report',
    'Create a status report with overall health, progress, milestone forecast, blockers, RAID changes, decisions needed, change requests, next-week plan, and evidence. Do not say "on track" if the evidence does not support it.',
    'A one-page stakeholder update that clearly states date risk, what changed, what is blocked, decisions needed, next milestones, and what remains uncertain.',
    'Weekly project status report',
    'Project:
Reporting date:
Overall health:
Target launch:
Forecast / confidence:

COMPLETED
-

IN PROGRESS
-

BLOCKED
-

RISKS / ISSUES
-

DECISIONS NEEDED
Decision:
Owner:
Needed by:

CHANGE REQUESTS
-

NEXT MILESTONES
-

NEXT 7 DAYS
-

Evidence / links:
Uncertainty / assumptions:',
    'Status-report QA',
    array['Overall health matches the underlying evidence.','Forecast and target date are not confused.','Blockers and decisions are visible without reading task-level detail.','Unapproved scope is shown separately.','Uncertainty is explicit.','The update can be read and acted on in under two minutes.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'scope-changes-requests-and-change-control',
    'BrightPath change request: onboarding video',
    'Marketing requests an onboarding video five days before the planned launch window.

New evidence:
• Script + recording + edit estimated at 3 working days across Marketing and a contractor.
• Portal embed requires 0.5 developer day.
• QA needs an additional 0.5 day for responsive/embed checks.
• Contractor cost is not in the baseline budget.
• Founder already said the video should not delay baseline launch and must go through change control.

Prepare the decision, not the production work.',
    'Prepare the formal change request',
    'Document the requested outcome, baseline scope reference, effort, cost/approval implication, dependency impact, schedule impact, risks, options, recommendation framing, approver, and decision status.',
    'A formal change request with baseline comparison, impact analysis, options, decision deadline, authorised approver, and exact plan updates required if approved.',
    'Project change request',
    'Change ID:
Requested by:
Requested date:
Requested outcome:
Baseline scope reference:
Reason / value:
New deliverables:
Effort impact:
Resource impact:
Budget impact:
Dependency impact:
Schedule impact:
QA / acceptance impact:
Risks:
Option A:
Option B:
Option C:
Coordinator recommendation / framing:
Approver:
Decision needed by:
Decision:
Decision date:
Plan updates after decision:',
    'Change-request QA',
    array['The request is compared against approved baseline scope.','Effort, budget, dependency, schedule, and QA impacts are visible.','Options are provided without the coordinator making the sponsor''s decision.','The founder''s instruction not to delay baseline launch is preserved.','No work is treated as approved before the decision.','The approved outcome updates scope, plan, board, and communications.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'quality-checks-acceptance-and-rework',
    'BrightPath launch QA: decide what blocks acceptance',
    'Pre-launch QA findings:
• Mobile upload button overlaps the consent text on two common screen widths.
• Analytics upload-success event is missing.
• One migrated client record has incorrect document visibility permissions.
• Three spacing issues are cosmetic.
• Password-reset flow passes.
• Upload works on desktop and one mobile browser.
• Client representative has not yet signed off migrated-data sample.
• Known issue list is empty, even though the defects above are open.

Decide what blocks acceptance and how re-test should work.',
    'Build the acceptance and defect log',
    'Classify each finding by launch impact, assign owner, define acceptance/re-test evidence, and identify which defects or missing approvals block launch.',
    'An acceptance checklist + defect log with severity rationale, owner, status, re-test evidence, acceptance owner, known limitations, and launch-blocking determination.',
    'Acceptance and rework log',
    'Acceptance area:
Criterion:
Evidence required:
Current result:
Pass / Fail / Pending:
Defect ID:
Defect:
Launch impact:
Owner:
Fix due:
Re-test step:
Re-test evidence:
Acceptance owner:
Known limitation accepted?:
Decision / sign-off:
Final status:',
    'Acceptance QA',
    array['Acceptance criteria are observable and tied to evidence.','Permissions and migrated-data approval are treated as material.','Cosmetic defects are separated from launch blockers.','Fixed work is re-tested before closure.','Known limitations are documented rather than hidden.','Only the authorised approver records final acceptance.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'project-handover-documentation-and-retrospective',
    'BrightPath after launch: transfer ownership cleanly',
    'The portal launches. Current closeout state:
• One low-impact cosmetic defect remains open.
• Analytics monitoring must continue for two weeks.
• Operations will own user-support triage.
• Marketing owns future onboarding content.
• Temporary contractor access must be removed.
• Final source files are split between project Drive and a contractor folder.
• Client accepted the launch, but the decision log has not been archived.
• The team wants a retrospective while details are fresh.',
    'Build the handover and closeout pack',
    'Create the closeout pack covering acceptance, final deliverables, operational owners, outstanding items, access removal, monitoring, archive locations, recurring BAU work, and a short retrospective with owned improvement actions.',
    'A handover pack with final acceptance evidence, asset locations, access handoff/removal, outstanding issues, operations ownership, monitoring, archive, lessons learned, and improvement actions.',
    'Project handover and closeout pack',
    'Project:
Launch / completion date:
Acceptance owner:
Acceptance evidence:

FINAL DELIVERABLES
Item:
Location:
Owner after closeout:

ACCESS
Access:
Transfer / remove:
Owner:
Due:

OPEN ITEMS
Issue:
Owner:
Due:
Operational impact:

ONGOING BAU
Activity:
Owner:
Frequency:
SOP / reference:

ARCHIVE
Decision log:
Final plan:
Source files:
Known issues:

RETROSPECTIVE
Worked well:
Created delay / rework:
Wrong assumption:
Improvement:
Improvement owner:
Review date:',
    'Closeout QA',
    array['Acceptance evidence is stored before closeout.','Operations ownership begins where project ownership ends.','Temporary access is explicitly removed or transferred.','Open issues and monitoring have owners and due dates.','Final files and decision records have authoritative locations.','Retrospective actions have owners instead of being generic lessons.']::text[]
  ),
(
    'project-management-for-virtual-assistants',
    'composite-project-coordination-simulation',
    'BrightPath client portal: full project control pack',
    'You are the project coordinator for BrightPath''s client portal. The project is three weeks from its original target when the assessment begins.

You must reconcile the baseline scope, late client spreadsheet, developer absence, fixed QA duration, permissions defect, onboarding-video change request, founder launch pressure, and final handover requirements.

Run the project from current-state recovery through launch decision and closeout. Do not hide trade-offs to make the plan look green.',
    'Run the full project-coordination simulation',
    'Use the supplied assessment resources to produce one coherent project control pack. Every artifact must agree on scope, dates, dependencies, decisions, risks, QA, and ownership.',
    'A complete project portfolio: charter, decision-rights matrix, dependency/capacity plan, board snapshot, decision/action log, RAID register, weekly status report, onboarding-video change request, acceptance/defect log, and handover/retrospective pack.',
    'Project control-pack index',
    'PROJECT:
Sponsor:
Coordinator:
Baseline target:
Current forecast:

CORE ARTIFACTS
Charter:
Decision-rights matrix:
Dependency plan:
Capacity schedule:
Board snapshot:
Decision/action log:
RAID register:
Weekly status:
Change request:
Acceptance log:
Handover pack:

TOP 3 DECISIONS
1.
2.
3.

TOP 3 RISKS / ISSUES
1.
2.
3.

LAUNCH READINESS
Scope:
Build:
Data:
QA:
Approval:
Operations handover:

FINAL HANDOFF
Accepted by:
Open items:
Next owner:
Archive:
Post-launch review:',
    'Project simulation QA',
    array['All artifacts use the same approved scope and decision rights.','Dates and forecasts reflect dependencies and capacity.','The RAID log, board, status report, and change request do not contradict each other.','QA and acceptance are protected rather than compressed to preserve appearances.','The onboarding video remains outside baseline until authorised.','Closeout transfers ownership cleanly into BAU operations.']::text[]
  )
),
targets as (
  select l.id, ps.*
  from practice_specs ps
  join public.training_courses c on c.slug = ps.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id and l.slug = ps.lesson_slug
  where l.is_published = true
),
rebuilt as (
  select
    t.id,
    jsonb_agg(
      case
        when b.block->>'type' = 'scenario' then
          jsonb_build_object(
            'type','scenario',
            'title',t.scenario_title,
            'text',t.scenario_text
          )
        when b.block->>'type' = 'heading'
             and coalesce(b.block->>'text','') ilike 'Work product:%' then
          jsonb_build_object(
            'type','heading',
            'text','Applied work: ' || t.template_title
          )
        when b.block->>'type' = 'exercise' then
          jsonb_build_object(
            'type','exercise',
            'title',t.exercise_title,
            'text',t.exercise_text,
            'deliverable',t.deliverable
          )
        when b.block->>'type' = 'template' then
          jsonb_build_object(
            'type','template',
            'title',t.template_title,
            'text',t.template_text
          )
        when b.block->>'type' = 'checklist' then
          jsonb_build_object(
            'type','checklist',
            'title',t.checklist_title,
            'items',to_jsonb(t.checklist_items)
          )
        else b.block
      end
      order by b.ord
    ) as content
  from targets t
  join public.training_lessons l on l.id=t.id
  cross join lateral jsonb_array_elements(l.content) with ordinality b(block,ord)
  group by t.id
)
update public.training_lessons l
set
  content = r.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id
  and l.content <> r.content;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in ('operations-virtual-assistant','project-management-for-virtual-assistants');

update public.training_assessments a
set
  instructions = 'Complete the Summit Service Group recurring-operations simulation as one coherent operating control pack.

You are running the operations control desk from 08:30 through end of shift. Use only the supplied evidence. Keep BAU moving while you surface exceptions, preserve data mismatches, and route decisions that exceed delegated authority.

Submit:
1. Daily operations control board with priority, owner, deadline, exception, decision, and checkpoint.
2. Booking process/control map showing required inputs, stop conditions, outputs, and completion evidence.
3. Exception register covering backlog, supplier delay, automation failure, vehicle breakdown, and billing-control failures.
4. Vendor + recurring dependency tracker for Tuesday materials and job handoffs.
5. Reconciliation log for the supplied CRM/dispatch/invoice-ready records.
6. KPI variance brief for W35-W38, separating known evidence from hypotheses.
7. Controlled automation-change brief with containment, approval, test, rollback, and validation.
8. Incident timeline / continuity handoff for the booking outage.
9. Decision-ready manager summary.
10. End-of-shift handoff with every open item assigned to an owner and next checkpoint.

Do not create project scope, milestones, a project change request, or project closeout artifacts. This is recurring operations. Do not approve commercial supplier changes, production automation edits, finance exceptions, or policy thresholds outside delegated authority.',
  rubric = '[{"id":"operating_control","label":"Operating control and prioritisation","weight":20,"description":"Keeps recurring work moving, prioritises by consequence and dependency, and uses controls rather than memory or raw urgency."},{"id":"evidence","label":"Evidence and reconciliation accuracy","weight":20,"description":"Uses supplied records accurately, preserves mismatches, and separates verified facts from hypotheses."},{"id":"exceptions","label":"Exception and incident handling","weight":20,"description":"Contains risk safely, escalates decision-ready exceptions, and maintains usable incident and continuity records."},{"id":"improvement","label":"SOP, KPI, and process improvement judgment","weight":15,"description":"Improves repeatable workflows using clear SOPs, meaningful KPI analysis, and small controlled experiments."},{"id":"boundaries","label":"Authority and change boundaries","weight":15,"hard_fail":true,"description":"Does not make commercial, production-system, finance, or policy decisions outside delegated authority."},{"id":"handoff","label":"Manager communication and handoff","weight":10,"description":"Produces concise summaries with owners, evidence, decisions, and checkpoints that another operator can continue."}]'::jsonb,
  resource_pack = '[{"id":"control-board","kind":"csv","title":"08:30 operations control board","content":"item,age,status,impact,current_owner,due\n14 Friday jobs still open,3d,Exception,Customer delay,Dispatch,Today 10:00\nMaterials for 6 Tuesday jobs,1d,Waiting supplier,Schedule risk,Procurement,Today 11:00\n5 possible CRM duplicates,2d,Review,Reporting risk,Operations,Today 15:00\nBooking automation follow-up failure,8h,Incident,Lead follow-up risk,Systems,Immediate\n2 invoice-ready records lack completion evidence,1d,Blocked,Billing risk,Operations,Today 13:00\nTechnician vehicle breakdown,30m,Exception,First-appointment risk,Dispatch,Immediate"},{"id":"booking-process","kind":"document","title":"Booking workflow and controls","content":"Normal workflow: web form → CRM lead → follow-up task → booking → dispatch → technician visit → completion evidence → invoice-ready.\nRequired before dispatch: confirmed service address, mobile number, job scope, scheduled time.\nRequired before invoice-ready: technician completion status, required photos/forms, exception note if work incomplete.\nSince 00:40 today, CRM leads still arrive but the follow-up-task automation does not create tasks."},{"id":"vendor-register","kind":"csv","title":"Supplier evidence","content":"vendor,on_time,open_commitment,document_status,open_issue\nMetroParts,95%,Materials for 6 Tuesday jobs,Insurance expires 30 Sep,ETA unconfirmed\nQuickStock,82%,None,No current SLA in shared folder,Damaged-delivery claim open\nProTrade,98%,Backup only,Current,Approved only for emergency orders within delegated limit"},{"id":"reconciliation","kind":"csv","title":"Job reconciliation extract","content":"job,crm,dispatch,invoice_ready,extra\nS-1047,Complete,Complete,No,Completion evidence missing\nS-1051,Booked,Complete,Yes,Status conflict\nS-1055,Duplicate candidate,Booked,No,Same phone different email\nS-1058,Active,Cancelled,Draft invoice exists,Potential stale/incorrect records\nS-1060,Booked,Scheduled,No,Materials missing\nS-1064,Missing,Complete,Yes,No matching CRM job ID"},{"id":"kpi","kind":"csv","title":"Four-week KPI extract","content":"week,on_time_completion,rework,open_backlog\nW35,93%,4%,18\nW36,91%,5%,21\nW37,88%,5%,25\nW38,79%,9%,34"},{"id":"incident-timeline","kind":"document","title":"Booking incident evidence","content":"00:38 last known-good automated follow-up task.\n00:40 first known lead without task.\n08:30 11 leads have no follow-up task.\n09:10 booking workflow unavailable; web enquiries still arrive by email.\n09:32 Systems says service is partially restored and asks staff not to backfill yet.\n09:55 manager returns.\nApproved continuity: capture minimum booking details in outage sheet; do not promise appointment until normal system is confirmed."},{"id":"authority","kind":"policy","title":"Operations authority rules","content":"Operations VA may maintain queues, records, controls, reconciliations, SOP drafts, vendor follow-ups, reports, incident logs, and manual containment already approved by process.\nManager approval is required for commercial supplier choices, approval-limit overrides, production automation edits, policy thresholds, write-offs, refunds, and changes that materially alter customer commitments."}]'::jsonb,
  updated_at = now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='operations-virtual-assistant'
  and a.is_published=true;

update public.training_assessments a
set
  instructions = 'Complete the BrightPath Client Portal finite project-coordination simulation as one coherent project control pack.

Use the approved baseline and supplied evidence. Do not hide schedule, scope, dependency, or quality trade-offs to make the project look green.

Submit:
1. One-page project charter with in-scope, out-of-scope, deliverables, acceptance conditions, assumptions, and sponsor.
2. Decision-rights matrix for scope, launch, data acceptance, QA, design clarification, and the onboarding-video request.
3. Dependency map plus capacity-aware schedule showing the late spreadsheet, developer absence, QA duration, and launch options.
4. Corrected project-board snapshot with evidence-based status and blockers.
5. Decision/action log from the supplied messy meeting notes.
6. RAID + decision register.
7. Weekly stakeholder status report with health, forecast, blockers, decisions, next milestones, and uncertainty.
8. Formal onboarding-video change request.
9. Acceptance + defect log using the supplied QA findings.
10. Project handover and retrospective pack.

All artifacts must agree on scope, dates, owners, decisions, and status. The project coordinator may prepare options and maintain records but may not approve scope, budget, launch-date trade-offs, additional capacity, migrated-data acceptance, or final sponsor decisions.',
  rubric = '[{"id":"scope_governance","label":"Scope and governance control","weight":20,"description":"Maintains a clear baseline, decision rights, exclusions, and authorised change control."},{"id":"planning","label":"Dependencies, capacity, and schedule realism","weight":20,"description":"Builds a feasible plan from real dependencies and capacity instead of protecting an artificial date."},{"id":"execution","label":"Project execution records","weight":15,"description":"Maintains trustworthy board, decision/action, and milestone records that reflect current evidence."},{"id":"raid_status","label":"RAID and stakeholder communication","weight":15,"description":"Distinguishes risks, issues, assumptions, dependencies, and decisions, then reports them clearly."},{"id":"quality","label":"Quality, acceptance, and closeout","weight":15,"description":"Protects QA and acceptance criteria, tracks rework, and transfers ownership with complete handover evidence."},{"id":"authority","label":"Sponsor and client decision boundaries","weight":15,"hard_fail":true,"description":"Does not approve scope, budget, launch trade-offs, resource commitments, or acceptance on behalf of authorised decision-makers."}]'::jsonb,
  resource_pack = '[{"id":"baseline","kind":"document","title":"Approved project baseline","content":"Project: BrightPath Client Portal\nOutcome: clients securely upload documents, view request status, and receive onboarding guidance.\nTarget: original launch in 3 weeks from assessment start.\nApproved baseline: portal functionality, data migration, analytics validation, functional/permissions QA, client acceptance, operational handover.\nNot in baseline: onboarding video.\nSponsor: founder. Coordinator may maintain plan, logs, follow-ups, and reporting. Sponsor approves scope, budget, launch-date trade-offs, and additional capacity."},{"id":"work-plan","kind":"csv","title":"Current project work","content":"workstream,status,owner,effort_or_constraint,dependency\nDesign,Done,Design,Approved,None\nDevelopment,60%,Developer,5 working days remaining,Approved design\nData mapping,Blocked,Operations,1 day,Client spreadsheet\nData migration,Not started,Operations,1.5 days,Data mapping\nQA,Not started,QA,3 business days,Development + migration\nAnalytics validation,Not started,QA,Inside QA,Working portal\nOnboarding video,Requested,Marketing,3 days + contractor,Not in baseline scope"},{"id":"capacity","kind":"document","title":"Capacity and timing constraints","content":"One developer is unavailable Thursday-Friday next week.\nQA requires 3 full business days and will not shorten permissions testing.\nRecommended fix/retest buffer: 2 business days.\nClient spreadsheet is 4 days late and still has no confirmed delivery time.\nClient contact is available tomorrow at noon for escalation."},{"id":"meeting-notes","kind":"document","title":"Messy weekly meeting notes","content":"Founder: \"I still want the 30th if we can make it.\"\nDeveloper: build needs roughly five working days; unavailable Thursday-Friday next week.\nClient: \"I''ll chase the spreadsheet today.\"\nMarketing: \"We already started the onboarding video.\"\nQA: needs three full business days and cannot shorten the permissions test.\nFounder: \"Don''t delay for the video. Put that through change control.\"\nClient: \"If the spreadsheet isn''t here tomorrow, call me at noon.\"\nDeveloper: \"I can finish document-upload work while data is blocked.\""},{"id":"qa","kind":"csv","title":"Pre-launch QA findings","content":"finding,status,owner,evidence\nMobile upload overlaps consent text,Open,Developer,2 common mobile widths\nUpload-success analytics event missing,Open,Developer,Event not observed\nOne migrated client record has wrong visibility permissions,Open,Operations,QA sample\nThree spacing issues,Open,Developer,Cosmetic\nPassword-reset flow,Pass,QA,Test evidence stored\nClient migrated-data sign-off,Pending,Client,No approval yet"},{"id":"change","kind":"document","title":"Onboarding-video request","content":"Marketing requests onboarding video.\nEstimated: 3 working days across Marketing + contractor.\nPortal embed: 0.5 developer day.\nAdditional QA: 0.5 day.\nContractor cost not in baseline budget.\nFounder has said the video must not delay baseline launch and must go through change control."},{"id":"governance","kind":"policy","title":"Project governance rules","content":"Project coordinator may maintain charter, schedule, board, RAID log, meeting records, status reports, change requests, QA logs, and handover documentation.\nSponsor approves scope, budget, launch-date trade-offs, and new resource commitments.\nClient representative signs off migrated-data acceptance.\nQA validates acceptance criteria; coordinator does not override failed evidence."}]'::jsonb,
  updated_at = now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='project-management-for-virtual-assistants'
  and a.is_published=true;
