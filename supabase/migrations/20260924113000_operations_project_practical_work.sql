-- Add hands-on learner work to Operations + Project Management.
-- Keeps the course boundary explicit:
-- Operations = recurring BAU systems and controls.
-- Project Management = finite initiatives with scope, milestones, change control, acceptance, and closeout.

with practice(
  lesson_id,
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
    '22000012-0000-4000-8000-000000000011'::uuid,
    'Map the process before fixing it',
    'A fictional service business has client onboarding spread across email, CRM, billing, and a shared drive. Map the current flow from trigger to completed onboarding. Identify required inputs, owners, outputs, controls, and the point where missing information should stop the process.',
    'A current-state process map plus a short list of the three highest-risk failure points.',
    'Operations process map',
    $tpl$PROCESS:
Trigger:
Required inputs:
Source of truth:

STEP 1
Action:
Owner:
Input:
Output:
Control:
Exception / stop condition:

STEP 2
Action:
Owner:
Input:
Output:
Control:
Exception / stop condition:

Final output:
Definition of done:
Handoff:
Open risks:$tpl$,
    'Process-map QA',
    array[
      'The trigger and final output are explicit.',
      'Every major step has one owner.',
      'Required inputs are named before work begins.',
      'Controls are tied to specific failure risks.',
      'Missing information has a stop or escalation rule.',
      'The definition of done is observable.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000012'::uuid,
    'Run an operations exception queue',
    'At 09:00 you inherit eight exceptions: two overdue client onboardings, a duplicate supplier invoice, a failed automation, one missing approval, a delivery delay, a KPI alert, and a customer escalation. Triage them by consequence, urgency, dependency, and authority.',
    'A prioritized exception queue showing what you can resolve, what must be escalated, and the next checkpoint for every item.',
    'Operations exception queue',
    $tpl$EXCEPTION:
Detected:
Impact:
Urgency:
Who / what is blocked:
Verified facts:
Immediate containment:
Action I can take:
Decision / approval needed:
Decision owner:
Deadline:
Next checkpoint:
Status:
Source / evidence:$tpl$,
    'Exception-queue QA',
    array[
      'Priority reflects consequence and dependency, not message order.',
      'Verified facts are separated from assumptions.',
      'Immediate containment is visible where needed.',
      'Authority limits are respected.',
      'Every escalated item states the exact decision needed.',
      'Every open item has an owner and next checkpoint.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000021'::uuid,
    'Draft an SOP another VA could actually use',
    'Turn a vague recurring invoice-follow-up routine into a usable SOP. Include trigger, source data, ordered steps, decision rules, exceptions, evidence, handoff, completion criteria, version owner, and review date.',
    'A complete SOP draft that a trained backup VA could follow without asking the original owner what they meant.',
    'SOP drafting template',
    $tpl$SOP TITLE:
Purpose:
Trigger:
Owner:
Required access:
Required inputs:
Source of truth:

PROCEDURE
1.
2.
3.

Decision rules:
Exceptions:
Escalation path:
Quality checks:
Completion evidence:
Output / handoff:
Version:
Process owner:
Last reviewed:
Next review:$tpl$,
    'SOP QA',
    array[
      'The SOP starts from a clear trigger.',
      'Vague instructions are replaced with observable actions.',
      'Decision rules are separated from normal steps.',
      'Exceptions include a safe escalation path.',
      'Completion evidence is defined.',
      'Version ownership and review timing are included.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000022'::uuid,
    'Build the daily operations control board',
    'Create a control board for a fictional team that runs client onboarding, invoice follow-up, vendor checks, weekly reporting, and monthly reconciliation. Separate due work, blocked work, exceptions, recurring controls, and items awaiting decisions.',
    'A one-page daily control board with status, owner, deadline, control evidence, blocker, and next action.',
    'Daily operations control board',
    $tpl$DATE:
Shift owner:

ITEM:
Process:
Priority:
Status:
Owner:
Due:
Required control / evidence:
Blocked by:
Exception:
Decision needed:
Next action:
Next checkpoint:

END-OF-DAY
Completed:
Still open:
Escalated:
Waiting:
Tomorrow first:$tpl$,
    'Control-board QA',
    array[
      'Recurring controls are visible, not hidden inside tasks.',
      'Blocked work states the dependency.',
      'Exceptions are separated from routine work.',
      'Decision items name the decision owner.',
      'Deadlines use a clear date or time.',
      'End-of-day handoff is ready for another operator.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000031'::uuid,
    'Create a vendor control and escalation log',
    'Three vendors have open issues: one missed an SLA, one changed bank details by email, and one has an expiring insurance document. Build the tracker, show which work can continue, and route the risky items to the correct owner.',
    'A vendor control log plus concise escalation notes for the bank-detail change and expired or expiring documentation.',
    'Vendor control log',
    $tpl$VENDOR:
Service:
Internal owner:
SLA / expected service:
Approval limit:
Open issue:
Risk:
Evidence:
Action taken:
Decision needed:
Next checkpoint:
Backup option:
Document expiry:
Status:$tpl$,
    'Vendor-control QA',
    array[
      'Commercial and payment authority stays with the authorised owner.',
      'Bank-detail changes are not treated as routine updates.',
      'SLA breaches are recorded with evidence.',
      'Expiring documents have a follow-up owner and date.',
      'Backup or contingency options are visible where relevant.',
      'The log supports an auditable handoff.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000032'::uuid,
    'Build a blocker and escalation log',
    'Six recurring operational tasks cross Sales, Finance, Operations, and a supplier. Two are blocked by missing inputs and one is blocked by an approval. Build the dependency view and write the escalations that will unblock the most downstream work.',
    'A blocker log with predecessor, owner, downstream impact, escalation trigger, next action, and follow-up time.',
    'Blocker and escalation log',
    $tpl$ITEM:
Current owner:
Required predecessor / input:
Dependency owner:
Blocked since:
Downstream impact:
Can anything proceed safely?:
Action taken:
Escalation trigger:
Decision / input needed:
Next follow-up:
Status:
Source link:$tpl$,
    'Blocker-log QA',
    array[
      'The actual dependency is named.',
      'Downstream impact is visible.',
      'The learner distinguishes waiting from active work.',
      'Escalations request a specific input or decision.',
      'Safe parallel work is identified where possible.',
      'Every blocker has a follow-up time.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000041'::uuid,
    'Reconcile two operational sources',
    'The CRM shows 312 active client records while the service tracker shows 305. Reconcile a fictional sample that contains duplicates, stale statuses, missing IDs, and conflicting owners. Do not force the totals to match.',
    'A discrepancy sheet plus a short reconciliation summary naming confirmed corrections and unresolved exceptions.',
    'Reconciliation discrepancy sheet',
    $tpl$RECORD / KEY:
Source A value:
Source B value:
Difference type:
Authoritative source:
Evidence:
Correction allowed?:
Correction made:
Needs review:
Reviewer:
Status:
Notes:$tpl$,
    'Reconciliation QA',
    array[
      'A matching key is defined.',
      'Duplicates, missing records, stale records, and conflicting values are separated.',
      'The source of truth is named before corrections are made.',
      'Unresolved differences are preserved.',
      'Totals are rechecked after approved corrections.',
      'The summary states what remains uncertain.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000042'::uuid,
    'Investigate a KPI variance',
    'Weekly on-time completion fell from 94% to 82%, backlog rose from 35 to 71, and one vendor accounts for 18 delayed tasks. Review the data, calculate the material variance, separate confirmed causes from hypotheses, and decide what needs investigation next.',
    'A KPI variance review with actual versus baseline, magnitude, evidence, hypotheses, investigation actions, owner, and decision needed.',
    'KPI variance investigation',
    $tpl$KPI:
Definition:
Period:
Baseline / target:
Actual:
Variance:
Magnitude:
Affected workflow:
Confirmed evidence:
Possible causes not yet proven:
Data quality concerns:
Investigation action:
Owner:
Decision needed:
Next checkpoint:$tpl$,
    'Variance-review QA',
    array[
      'The KPI definition and comparison period are clear.',
      'The variance magnitude is stated, not described vaguely.',
      'Confirmed evidence is separated from hypotheses.',
      'Data-quality limitations are visible.',
      'The next investigation step is specific.',
      'The summary supports a management decision.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000051'::uuid,
    'Turn a bottleneck into a controlled experiment',
    'A recurring workflow has a growing queue before one approval step and frequent rework caused by missing intake data. Identify the real constraint, propose the smallest safe process experiment, and define how you will know whether it helped.',
    'A bottleneck analysis and one controlled improvement experiment with baseline, change, owner, risk, and success measure.',
    'Bottleneck experiment brief',
    $tpl$Workflow:
Observed bottleneck:
Evidence:
Queue / cycle-time signal:
Rework signal:
Likely constraint:
What is not yet proven:
Smallest safe change:
Approval needed:
Pilot scope:
Success measure:
Failure / rollback condition:
Owner:
Review date:$tpl$,
    'Improvement-experiment QA',
    array[
      'The bottleneck is supported by evidence.',
      'Symptoms are separated from likely causes.',
      'The proposed change is small enough to test safely.',
      'Success is measurable.',
      'Rollback conditions are defined.',
      'The learner does not redesign the whole process without evidence.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000052'::uuid,
    'Write a controlled automation change brief',
    'A task automation stopped creating follow-up tasks after a form update. Build the change brief from observed failure to containment, proposed fix, test, rollback, and post-change validation. Do not automate around a broken business rule.',
    'An automation change brief that an authorised owner or technical teammate can review and approve.',
    'Automation change brief',
    $tpl$Observed failure:
First detected:
Affected workflow:
Impact:
Evidence:
Immediate containment:
Current business rule:
Proposed change:
Why this change:
Approval owner:
Test case:
Expected result:
Rollback:
Post-change validation:
Monitoring checkpoint:
Open risk:$tpl$,
    'Automation-change QA',
    array[
      'The business rule is confirmed before the technical change.',
      'The learner does not automate a broken process first.',
      'Containment exists before permanent change.',
      'Test cases use observable expected results.',
      'Rollback is possible.',
      'Automation failure will remain visible after release.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000061'::uuid,
    'Run an incident log and handoff',
    'For 45 minutes the manager is unavailable while a supplier delay and automation outage affect client delivery. Coordinate the response within delegated authority, record the timeline, protect customer commitments, and prepare the manager handoff.',
    'An incident timeline, action log, deferred-decision list, customer-impact note, and recovery handoff.',
    'Operations incident log',
    $tpl$INCIDENT:
Started:
Detected by:
Confirmed impact:
Customers / workflows affected:
Immediate containment:

TIME:
Event / evidence:
Action:
Owner:
Decision:
Decision owner:
Customer communication:
Status:

Deferred decisions:
Recovery checkpoint:
Handoff summary:
Open risks:$tpl$,
    'Incident-handoff QA',
    array[
      'Containment is prioritised before process improvement.',
      'The timeline distinguishes facts, actions, and decisions.',
      'Customer impact is visible.',
      'Unauthorised decisions are deferred explicitly.',
      'Recovery has a clear checkpoint.',
      'The next operator can continue from the handoff.'
    ]::text[]
  ),
  (
    '22000012-0000-4000-8000-000000000062'::uuid,
    'Final simulation: run the operations control room',
    'Harbour & Co is launching a client portal project while normal operations continue. During your shift, backlog doubles, a supplier slips, an automation fails, one KPI drops, and the project team asks Operations to absorb a new recurring support task. Handle only the BAU operations side. Distinguish what belongs in Operations from what must be handed to the Project Management workflow.',
    'A complete operations control-room pack: daily control board, exception queue, KPI variance review, blocker/escalation log, one SOP/process improvement, incident handoff, and a boundary note listing project items you routed to the PM owner.',
    'Final operations simulation pack',
    $tpl$OPERATIONS CONTROL ROOM
Top operational outcomes:
Exception queue:
Recurring controls:
KPI variance:
Blocked BAU work:
Incident / containment:
Process or SOP change:
Decisions needed:
Project items routed out:
End-of-shift handoff:
Tomorrow first:
Evidence / source links:$tpl$,
    'Final operations simulation QA',
    array[
      'Recurring BAU work stays in the Operations control system.',
      'Finite project scope, milestone, and change decisions are routed to Project Management.',
      'High-consequence exceptions are prioritised early.',
      'KPI explanations do not invent causes.',
      'Every open operational item has an owner and checkpoint.',
      'The final handoff can be used by the next operator without rereading the whole scenario.'
    ]::text[]
  ),

  (
    '22000013-0000-4000-8000-000000000011'::uuid,
    'Write the project charter and delivery plan',
    'Harbour & Co wants a client portal launched in six weeks. Turn the brief into a one-page project charter with outcome, in-scope deliverables, exclusions, assumptions, acceptance conditions, sponsor, target date, and unresolved decisions.',
    'A one-page project charter plus the first-pass delivery plan.',
    'Project charter',
    $tpl$PROJECT:
Outcome:
Sponsor:
Project owner:
Target date:
In-scope deliverables:
Out of scope:
Success / acceptance conditions:
Assumptions:
Constraints:
Known dependencies:
Decision rights:
Unresolved decisions:
Next milestone:$tpl$,
    'Charter QA',
    array[
      'The project has a finite outcome and target date.',
      'In-scope and out-of-scope work are explicit.',
      'Acceptance is defined before execution.',
      'Assumptions are not presented as confirmed facts.',
      'Decision rights are visible.',
      'Unresolved items are captured before planning continues.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000012'::uuid,
    'Build the project decision-rights map',
    'Create a RACI-lite table for the sponsor, project owner, VA coordinator, developer, QA lead, marketing lead, and client approver. Separate who performs work from who can approve scope, schedule, budget, acceptance, and launch.',
    'A decision-rights matrix plus a short escalation path for ambiguous ownership.',
    'Project decision-rights matrix',
    $tpl$DECISION / WORK AREA:
Responsible:
Consulted:
Approver / decision owner:
Informed:
Evidence required:
Escalation path:
Deadline for decision:$tpl$,
    'Decision-rights QA',
    array[
      'Task ownership is separated from approval authority.',
      'Scope, budget, schedule, acceptance, and launch decisions have named owners.',
      'No item has multiple ambiguous final approvers.',
      'Escalation paths are explicit.',
      'The VA coordinator is not made the accidental approver.',
      'Decision deadlines are visible where delay affects the plan.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000021'::uuid,
    'Build the dependency-based project plan',
    'The portal requires requirements sign-off, data cleanup, design, development, QA, analytics, training material, client acceptance, and launch. Build the task plan based on dependencies instead of simply listing due dates.',
    'A project plan and dependency map showing predecessor, owner, duration, milestone, blocker, and downstream impact.',
    'Project plan and dependency map',
    $tpl$TASK:
Deliverable:
Owner:
Duration / estimate:
Predecessor:
Can start when:
Due:
Milestone:
Current status:
Blocked by:
Downstream tasks affected:
Evidence of completion:
Notes:$tpl$,
    'Dependency-plan QA',
    array[
      'Dependencies are explicit.',
      'Milestones represent meaningful delivery points.',
      'The plan distinguishes duration from due date.',
      'Blocked tasks show downstream impact.',
      'Completion evidence is defined.',
      'The plan reveals which late dependency threatens the target date.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000022'::uuid,
    'Replan around capacity and a missed dependency',
    'A client spreadsheet arrives four days late and the developer will be unavailable for three days during the QA window. Rebuild the schedule honestly. Show what can move, what cannot, and where a sponsor decision is required.',
    'A revised schedule with capacity constraints, affected milestones, options, trade-offs, and the exact sponsor decision needed.',
    'Project replan',
    $tpl$Original target:
Changed condition:
Affected tasks:
Affected milestone:
Capacity constraint:
Option 1:
Schedule impact:
Trade-off:
Option 2:
Schedule impact:
Trade-off:
Work that can continue:
Decision needed:
Decision owner:
Decision deadline:
Revised forecast:$tpl$,
    'Replan QA',
    array[
      'The late dependency is reflected in downstream dates.',
      'Capacity is treated as a real constraint.',
      'The learner does not pretend the original date is guaranteed.',
      'Options show trade-offs.',
      'Sponsor decisions are stated precisely.',
      'The revised forecast is evidence-based.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000031'::uuid,
    'Turn the plan into a working project board',
    'Convert the portal plan into a project board. Define statuses that reflect actual evidence, then place a fictional set of tasks into the correct status instead of using vague labels such as "in progress".',
    'A project board snapshot with clear status definitions, owner, due date, dependency, blocker, and acceptance state.',
    'Project board',
    $tpl$TASK:
Owner:
Status:
Status evidence:
Due:
Dependency:
Blocked reason:
Next action:
Acceptance / review owner:
Last update:
Next checkpoint:$tpl$,
    'Project-board QA',
    array[
      'Statuses have observable definitions.',
      'A task is not marked done before acceptance evidence exists.',
      'Blocked work names the blocker.',
      'Owners and next actions are visible.',
      'Review and acceptance ownership are distinct where needed.',
      'Stale tasks can be identified from the board.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000032'::uuid,
    'Create the decision log and meeting handoff',
    'A project meeting includes one confirmed decision, two action items, one unresolved scope question, and one opinion that sounds like a decision but was never approved. Convert the notes into a decision log and action handoff.',
    'A decision log plus accountable action list with owner, due date, dependency, source, and unresolved questions.',
    'Decision and action log',
    $tpl$MEETING:
Date:

DECISION
Decision:
Decision owner:
Date decided:
Reason / context:
Impacted work:
Source / evidence:

ACTION
Action:
Owner:
Due:
Dependency:
Status:

UNRESOLVED
Question:
Decision owner:
Needed by:
Impact if late:$tpl$,
    'Decision-log QA',
    array[
      'Discussion is not recorded as a decision unless it was actually decided.',
      'Every decision has an owner and date.',
      'Actions have one owner and a due date where known.',
      'Dependencies are visible.',
      'Unresolved decisions state their schedule impact.',
      'The handoff can be understood without replaying the meeting.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000041'::uuid,
    'Build the RAID register',
    'The portal project has a late client data file, a developer absence, a possible analytics dependency, a new onboarding-video request, and uncertainty about the final launch date. Classify each item correctly as risk, assumption, issue, or dependency.',
    'A RAID register with impact, probability where relevant, trigger, mitigation, owner, decision, due date, and status.',
    'RAID register',
    $tpl$ITEM:
Type: Risk / Assumption / Issue / Dependency
Description:
Impact:
Probability / confidence:
Trigger:
Mitigation / response:
Owner:
Decision needed:
Due:
Status:
Source:
Last reviewed:$tpl$,
    'RAID QA',
    array[
      'Risks, assumptions, issues, and dependencies are classified correctly.',
      'Issues are treated as current, not hypothetical.',
      'Risks have triggers or early warning signs.',
      'Dependencies have owners and dates.',
      'Mitigation actions are concrete.',
      'High-impact items are visible in project reporting.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000042'::uuid,
    'Write the weekly project status report',
    'Prepare the weekly status for the portal project after one milestone completes, one dependency slips, QA capacity tightens, and the launch date becomes at risk. Report facts, forecast, decisions needed, and next milestones without hiding uncertainty.',
    'A one-page weekly project status report suitable for sponsor review.',
    'Weekly project status report',
    $tpl$PROJECT:
Reporting period:
Overall status:
Completed this period:
Next milestones:
Schedule forecast:
Scope status:
Top RAID items:
Blockers:
Decisions needed:
Decision owners:
Actions before next report:
Changes approved this period:
Acceptance / QA status:
Source links:$tpl$,
    'Status-report QA',
    array[
      'The report distinguishes completed work from planned work.',
      'Date risk is stated clearly.',
      'RAID items are prioritised by project impact.',
      'Decisions needed name an owner and deadline.',
      'Scope changes are visible.',
      'Uncertainty is disclosed instead of smoothed over.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000051'::uuid,
    'Prepare a scope-change request',
    'The client requests a new onboarding video midway through the portal project. Record the request, assess effort and dependency impact, show schedule options, and send it to the authorised approver. Do not silently absorb the work.',
    'A scope-change request with impact analysis, options, recommendation, approval owner, and decision status.',
    'Scope-change request',
    $tpl$CHANGE REQUEST:
Requested by:
Date:
Requested outcome:
Reason:
Current scope reference:
New work:
Dependencies:
Estimated effort:
Schedule impact:
Budget / resource impact:
Quality / acceptance impact:
Option 1:
Option 2:
Recommendation:
Approver:
Decision needed by:
Decision status:
Approved baseline update:$tpl$,
    'Change-control QA',
    array[
      'The requested change is recorded before work begins.',
      'Impact covers dependencies and schedule, not just task effort.',
      'The VA does not approve the change.',
      'Options and trade-offs are visible.',
      'Decision status is explicit.',
      'Approved changes update the project baseline.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000052'::uuid,
    'Build the acceptance and rework plan',
    'The portal is nearly complete. Define how functional QA, permissions, migrated data, analytics, content, client acceptance, and defects will be checked before launch.',
    'An acceptance checklist plus a rework log structure that prevents incomplete work from being labelled done.',
    'Acceptance and rework checklist',
    $tpl$DELIVERABLE:
Acceptance criterion:
Test / evidence:
Reviewer:
Result:
Defect / gap:
Severity / impact:
Rework owner:
Due:
Retest required:
Final acceptance owner:
Accepted date:$tpl$,
    'Acceptance QA',
    array[
      'Acceptance criteria are observable.',
      'Review ownership is named.',
      'Failed checks create rework rather than disappearing into notes.',
      'Retest requirements are explicit.',
      'A task is not complete because the creator finished working on it.',
      'Final acceptance is recorded by the authorised owner.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000061'::uuid,
    'Prepare the stakeholder update and handoff',
    'The project is moving into launch and BAU support. Prepare the stakeholder update, final decision log, unresolved-item list, support handoff, ownership map, and closeout notes. Separate temporary project work from recurring Operations ownership after launch.',
    'A launch stakeholder update plus project-to-operations handoff pack.',
    'Project handoff and stakeholder update',
    $tpl$PROJECT:
Launch / handoff date:
What is complete:
What remains open:
Final decisions:
Accepted deliverables:
Known defects / limitations:
Recurring BAU tasks after launch:
Operations owner:
Support SOP / runbook:
Credentials / access handoff:
Monitoring period:
Escalation path:
Stakeholder message:
Archive location:
Closeout owner:$tpl$,
    'Handoff QA',
    array[
      'The update states what is complete and what is still open.',
      'Recurring BAU ownership is explicitly transferred to Operations.',
      'Temporary project tasks are not left as permanent PM work.',
      'Known defects and limitations are visible.',
      'Access, documents, and support instructions are handed over.',
      'The project has a clear closeout owner.'
    ]::text[]
  ),
  (
    '22000013-0000-4000-8000-000000000062'::uuid,
    'Final simulation: coordinate the portal project',
    'Harbour & Co is launching a client portal while BAU operations continue. During the final week, client data is late, the developer loses three days of capacity, a new onboarding-video request appears, QA finds a permissions defect, and Operations reports a separate backlog spike. Handle only the finite project side. Route BAU operational exceptions to the Operations owner instead of absorbing them into the project plan.',
    'A complete project-coordination pack: charter check, dependency map, revised schedule, RAID register, scope-change request, weekly status report, stakeholder update, decision log, acceptance plan, handoff, and a boundary note listing BAU items routed to Operations.',
    'Final project simulation pack',
    $tpl$PROJECT CONTROL PACK
Outcome / target:
Current milestone:
Dependency map:
Schedule forecast:
Top RAID items:
Scope changes:
Decisions needed:
Weekly status:
Stakeholder update:
Acceptance / QA:
Handoff / closeout:
BAU items routed to Operations:
Evidence / source links:$tpl$,
    'Final project simulation QA',
    array[
      'Finite project work stays inside the project control system.',
      'Recurring BAU exceptions are routed to Operations.',
      'Dependencies and capacity are reflected in the forecast.',
      'Scope changes are not silently absorbed.',
      'Acceptance evidence is required before completion.',
      'The final handoff cleanly transfers recurring ownership after launch.'
    ]::text[]
  )
),
targets as (
  select
    l.id,
    p.exercise_title,
    p.exercise_text,
    p.deliverable,
    p.template_title,
    p.template_text,
    p.checklist_title,
    p.checklist_items
  from practice p
  join public.training_lessons l on l.id = p.lesson_id
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
where slug in (
  'operations-virtual-assistant',
  'project-management-for-virtual-assistants'
);
