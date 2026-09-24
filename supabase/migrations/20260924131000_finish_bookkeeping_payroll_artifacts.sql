-- Finish Bookkeeping and Payroll practical artifacts.
-- Replaces course-generic templates/checklists with lesson-specific finance controls
-- and adds expert modelling to additional high-judgment lessons.
-- Preserves all lesson IDs and learner progress.

with artifact_specs(course_slug,lesson_slug,template_title,template_text,checklist_items) as (
values
('bookkeeping-administration','bookkeeping-workflow-and-role-boundaries','Bookkeeping authority and responsibility matrix','Task / decision:
Routine admin action:
Source evidence:
VA may prepare?:
Reviewer / decision owner:
Approval point:
Prohibited action:
Exception trigger:
Next checkpoint:
Evidence link:','["Routine preparation is separated from accounting, tax, approval, and payment authority.","Every decision boundary has a named owner.","Source evidence is identified before an action is classified as routine.","Ambiguous requests are routed instead of guessed.","Payment release and professional advice remain outside the VA role.","The matrix gives another operator a clear escalation path."]'::jsonb),
('bookkeeping-administration','financial-data-privacy-access-and-audit-trail','Financial access and change-control log','User / role:
System / file:
Access level:
Business need:
Sensitive fields exposed:
Approved channel:
Change requested:
Change source:
Independent verification:
Approval:
Audit evidence:
Risk / incident:
Remediation owner:
Review date:','["Access is limited to the minimum needed for the task.","Credentials, bank data, and financial exports stay in approved systems/channels.","Bank-detail changes use independent verification.","Change source and approval evidence are recorded.","Incidents or excessive access are not silently corrected without an audit note.","Review/remediation ownership is explicit."]'::jsonb),
('bookkeeping-administration','invoices-bills-receipts-and-supporting-documents','Source-document and duplicate-exception register','Supplier / customer:
Document type:
Reference:
Document date:
Amount:
Source file / link:
Required fields complete?:
Duplicate signal:
Related record:
Approval evidence:
Status:
Exception:
Reviewer:
Next action:','["Document reference, date, amount, and source are visible.","Missing evidence is kept separate from approved records.","Duplicate indicators are investigated before posting/preparation continues.","A similar amount or supplier name is not enough to declare a duplicate.","Approval evidence is not inferred from file location.","Every held item has a reviewer and next action."]'::jsonb),
('bookkeeping-administration','categories-accounts-and-coding-questions','Coding and accounting reviewer query sheet','Transaction:
Date / amount:
Source document:
Current description:
Historical treatment:
Approved chart / rule:
What is known:
What is uncertain:
Reviewer question:
Why the decision matters:
VA action while waiting:
Reviewer:
Decision recorded:
Evidence link:','["The query includes enough evidence for a reviewer to decide without reconstructing the case.","Historical treatment is evidence, not automatic authority.","The VA does not state an uncertain accounting/tax treatment as fact.","One precise question is asked for each unresolved issue.","Work that can safely continue is separated from work that must wait.","The reviewer decision is recorded when received."]'::jsonb),
('bookkeeping-administration','supplier-bills-and-approval-workflows','Accounts payable control queue','Supplier:
Invoice:
Amount:
Invoice date:
Due date:
Source document:
Duplicate check:
PO / supporting evidence:
Approval:
Bank details status:
Exception / hold reason:
Payment readiness:
Owner:
Next checkpoint:','["The correct invoice/source document is identified.","Duplicate risk and missing evidence are checked before readiness.","Approval and bank-detail verification are separate controls.","Due date does not override an unresolved fraud/control issue.","Payment readiness never equals payment authorisation.","Held items have owners and checkpoints."]'::jsonb),
('bookkeeping-administration','payment-preparation-and-supplier-follow-up','Payment batch preflight and release-boundary sheet','Batch date:
Payee:
Invoice:
Amount:
Due date:
Bank details source:
Independent bank verification:
Bill approval:
Duplicate check:
Fraud / change flag:
Ready for approver?:
Reviewer:
Release authority:
Supplier follow-up:
Final status:
Evidence:','["Every payee traces to an approved source bill.","Changed bank details are independently verified before readiness.","Duplicate and approval checks are complete.","Preparation is explicitly separated from payment release.","The VA does not bypass a control to meet a requested payment date.","Final status and evidence are reviewer-ready."]'::jsonb),
('bookkeeping-administration','customer-invoices-credits-and-payment-status','Accounts receivable status and exception tracker','Customer:
Invoice:
Issue date:
Original amount:
Receipt / payment evidence:
Credit evidence:
Current outstanding:
Status:
Dispute / mismatch:
Administrative action:
Approval needed:
Owner:
Next checkpoint:
Evidence link:','["Invoice, receipt, credit, and outstanding amounts are evidence-backed.","Part-paid, disputed, credited, and unmatched states are not collapsed into one status.","Receipts are not force-matched to a convenient invoice.","Credits/adjustments requiring approval remain pending.","The customer record and finance record agree on verified facts.","Every exception has an owner and next checkpoint."]'::jsonb),
('bookkeeping-administration','overdue-accounts-and-debtor-follow-up','Debtor follow-up and dispute queue','Customer:
Invoice:
Outstanding:
Due date:
Days overdue:
Dispute status:
Last contact:
Approved message:
Next contact date:
Escalation condition:
Owner:
Customer response:
Finance note:
Evidence:','["The amount and due date are verified before contact.","Disputed invoices use a different path from routine overdue reminders.","Approved wording does not invent fees, threats, or commitments.","Customer responses are recorded in the finance/CRM note.","Follow-up cadence respects client rules.","Escalation conditions and ownership are visible."]'::jsonb),
('bookkeeping-administration','bank-reconciliation-preparation','Bank reconciliation discrepancy sheet','Bank line:
Date:
Description:
Amount:
Book candidate:
Evidence checked:
Match status:
Exception type:
Timing difference?:
Duplicate / missing record?:
Unsupported correction:
Reviewer question:
Owner:
Resolution evidence:','["The bank line and candidate book record are shown separately.","Matched, timing, duplicate, missing, and unknown exceptions are distinguished.","No amount is forced to balance without evidence.","Reviewer questions are precise and evidence-backed.","Possible internal transfers are verified across both sides.","Unresolved items stay open until reviewer evidence resolves them."]'::jsonb),
('bookkeeping-administration','month-end-payroll-and-accountant-handoffs','Month-end readiness control checklist','Period:
Source documents complete?:
AP exceptions:
AR exceptions:
Bank reconciliation status:
Payroll summary status:
Missing statements:
Unusual transactions:
Pending approvals:
Reviewer questions:
Owner:
Due date:
Readiness state:
Handoff note:','["Readiness reflects actual evidence, not deadline pressure.","Open AP, AR, bank, payroll, and source-document items remain visible.","Missing approvals are not treated as complete.","Accounting/tax decisions stay with the reviewer.","Every incomplete item has an owner and due date.","The period is not marked complete while material exceptions remain unresolved."]'::jsonb),
('bookkeeping-administration','financial-reporting-support-and-exception-logs','Finance administration exception and reporting pack','Reporting period:
Exception:
Area (AP / AR / bank / month-end):
Amount / impact:
Source evidence:
Verified status:
What changed:
Decision needed:
Urgency:
Owner:
Due date:
Reviewer:
Resolution / next action:
Evidence link:','["Only verified finance-administration facts are reported.","Material changes are separated from explanations/hypotheses.","Amounts and statuses match source records.","Reviewer decisions are not presented as VA conclusions.","Urgency reflects due date/control/business impact.","The pack lets the reviewer act without rereading every raw file."]'::jsonb),
('bookkeeping-administration','composite-bookkeeping-administration-simulation','Cedar Lane bookkeeping control-desk portfolio','PERIOD:
Control owner:

SOURCE DOCUMENTS
Open exceptions:
Duplicates:
Missing evidence:

AP / PAYMENTS
Ready items:
Held items:
Bank-detail checks:
Approvals:

AR
Overdue:
Disputed:
Unmatched receipts:

RECONCILIATION
Matched:
Open discrepancies:
Reviewer questions:

MONTH-END
Readiness:
Missing evidence:
Open decisions:

HANDOFF
Owners:
Due dates:
Next checkpoints:
Evidence links:','["All sections use the same source facts and period.","AP/payment preparation does not cross into payment authority.","AR and reconciliation exceptions stay evidence-backed.","Reviewer/accounting/tax decisions remain explicit boundaries.","Month-end readiness reflects unresolved work honestly.","The final handoff is internally consistent and actionable."]'::jsonb),
('payroll-administration','payroll-workflow-roles-and-country-specific-rules','Payroll authority and control matrix','Payroll step:
Input owner:
VA preparation:
Manager approval:
Payroll specialist decision:
Finance approval:
Payment release:
Country-specific rule source:
Exception trigger:
Escalation owner:
Evidence:
Next checkpoint:','["Preparation, review, approval, statutory judgment, and payment release are separate.","Country-specific rules require an approved source.","No authority is inferred from system access alone.","Exception triggers name the correct escalation owner.","Payment release never sits with the preparer unless explicitly authorised by policy.","The matrix is usable across the payroll cycle."]'::jsonb),
('payroll-administration','employee-data-confidentiality-and-access-control','Payroll sensitive-data and bank-change control log','Employee:
Data / change requested:
Pay period:
Source channel:
Minimum data required:
Approved system:
Bank change?:
Independent verification:
Approval:
Access / sharing check:
Incident flag:
Owner:
Evidence:
Final status:','["Only minimum necessary employee/payroll data is used.","Bank changes are independently verified.","Sensitive data stays in approved systems and channels.","Email identity alone is not treated as sufficient bank-change proof.","Approvals and access events leave an audit trail.","Any privacy/security incident has an owner and escalation."]'::jsonb),
('payroll-administration','timesheets-hours-overtime-and-cut-offs','Timesheet exception and cutoff queue','Employee:
Pay period:
Submitted hours:
Overtime:
Submission time:
Manager approval:
Duplicate / conflict:
Cutoff:
Cutoff impact:
Manager action:
Payroll owner:
Status:
Next checkpoint:
Evidence:','["Hours and period are checked against the source timesheet.","Manager approval is explicit.","Historical overtime patterns do not substitute for current approval.","Late/duplicate/conflicting entries remain visible.","Cutoff impact is stated without inventing payroll treatment.","Every exception has an owner and deadline."]'::jsonb),
('payroll-administration','leave-new-starters-leavers-and-employee-changes','Employee payroll change register','Employee:
Change type:
Requested change:
Effective date:
Source evidence:
Manager / HR approval:
Payroll-period impact:
Bank / pay sensitivity:
Missing item:
Reviewer:
Status:
Next action:
Evidence link:','["Effective date and source evidence are present.","Starters/leavers/leave/pay/bank changes use the correct approval route.","Late changes show payroll-period impact.","Sensitive bank/pay changes receive stronger verification.","Missing evidence is not guessed or backfilled silently.","Status and next action are reviewer-ready."]'::jsonb),
('payroll-administration','earnings-allowances-deductions-and-reimbursements','Pay-input classification and exception sheet','Employee:
Pay period:
Pay component:
Amount / hours:
Source:
Approved recurring rule:
Current classification:
Exception / ambiguity:
Reviewer question:
Approval:
VA action:
Specialist owner:
Status:
Evidence:','["Every component traces to source evidence.","Recurring treatment is not assumed when the current input differs.","Ambiguous classification is routed instead of guessed.","Amounts/hours and period are explicit.","The VA does not decide tax/statutory treatment.","Reviewer outcome can be recorded without losing the original input."]'::jsonb),
('payroll-administration','benefits-contributions-and-statutory-items-awareness','Statutory and tax query routing log','Employee / group:
Question:
Pay period:
Verified payroll record:
Relevant approved rule/source:
Administrative fact:
Unresolved statutory/tax issue:
Question for specialist:
Specialist owner:
Response checkpoint:
Employee message:
Audit note:
Final status:','["The employee question is captured accurately.","Administrative facts are separated from statutory/tax interpretation.","No rate, entitlement, or legal conclusion is invented.","The approved source/effective date is identified where available.","The specialist question is specific.","Employee communication states a realistic checkpoint, not an unsupported answer."]'::jsonb),
('payroll-administration','pre-payroll-checks-and-exception-reports','Pre-payroll variance and go/no-go review','Pay period:
Prior total:
Current draft total:
Variance:
Material categories:
Employee-level exceptions:
Evidence confirmed:
Missing approvals:
Bank-change checks:
Unresolved cause:
Reviewer:
Go / hold status:
Required action:
Recheck:','["Totals and comparison periods are correct.","Material variance is decomposed rather than waved through.","Employee-level blockers remain visible.","Bank and approval controls are complete before go status.","A plausible explanation is not treated as verified evidence.","Hold/recheck conditions are explicit."]'::jsonb),
('payroll-administration','approval-payment-and-payslip-administration','Payroll late-change and reapproval control log','Pay period:
Approved version:
Approval timestamp:
Late change request:
Employee:
Source:
Effective date:
Impact on totals:
Payslip impact:
Reapproval required:
Payment file state:
Approver:
Final authorised state:
Evidence:
Handoff:','["The approved baseline/version is identified.","Late changes are never silently applied after approval.","Impact on payroll total/payment/payslip is assessed.","Reapproval occurs before the payment file is treated as final.","Preparation and release authority remain separate.","Final state is traceable to approval evidence."]'::jsonb),
('payroll-administration','payroll-queries-corrections-and-escalation','Employee payroll query and correction case record','Employee:
Pay period:
Query:
Employee wording:
Source records checked:
Verified discrepancy:
Unknown / specialist question:
Allowed admin action:
Correction approval:
Off-cycle / payment decision owner:
Employee response:
Next checkpoint:
Resolution evidence:','["The original employee query is preserved accurately.","Source records are checked before acknowledging an error.","Verified discrepancy is separated from unresolved treatment.","The VA does not promise off-cycle payment or statutory outcomes.","Correction approval and payment decisions name authorised owners.","The employee receives a factual next checkpoint."]'::jsonb),
('payroll-administration','reports-reconciliations-and-finance-handoffs','Post-payroll reconciliation and finance handoff','Pay period:
Payroll report total:
Payment / bank total:
Difference:
Variance explanation:
Employee exceptions:
Late changes:
Statutory/reporting handoff:
Evidence:
Reviewer:
Unresolved items:
Completion state:
Next owner:
Next checkpoint:','["Payroll and payment totals are compared from source evidence.","Differences are not written off without explanation/approval.","Late changes are included in the reconciliation trail.","Statutory/reporting decisions stay with authorised owners.","Completion state reflects unresolved items honestly.","The next owner can continue without reconstructing the payroll."]'::jsonb),
('payroll-administration','payroll-calendar-and-recurring-controls','Payroll calendar and recurring control board','Cycle / pay date:
Input cutoff:
Manager approval:
Draft review:
Correction window:
Final approval:
Payment release:
Payslip / employee comms:
Reporting:
Archive:
Holiday / dependency:
Exception trigger:
Owner:
Next-cycle prep:','["Every critical cutoff and approval is time-bound.","Dependencies and holidays are visible.","Preparation, approval, and payment release remain separate.","Exception triggers define what happens when a deadline is missed.","Owners are explicit for each control.","Next-cycle preparation begins from the final handoff."]'::jsonb),
('payroll-administration','composite-payroll-administration-simulation','Harbor & Field payroll control-desk portfolio','PAY PERIOD:
Pay date:
Payroll owner:

INPUTS
Timesheet exceptions:
Employee changes:
Pay-input questions:
Bank-change checks:

PRE-PAYROLL
Variance:
Missing approvals:
Go / hold:

APPROVAL / PAYMENT
Approved version:
Late changes:
Reapproval:
Payment release owner:

POST-PAYROLL
Reconciliation:
Employee queries:
Reporting handoff:

NEXT CYCLE
Dates:
Risks:
Owners:
Evidence links:','["All sections use the same pay period and employee evidence.","Sensitive changes and bank data follow verification controls.","Tax/statutory/pay classification decisions stay with specialists.","Late changes preserve approval/change-control history.","Reconciliation and employee queries remain evidence-backed.","The final portfolio is internally consistent and audit-ready."]'::jsonb)
),
targets as (
  select l.id,s.template_title,s.template_text,s.checklist_items
  from artifact_specs s
  join public.training_courses c on c.slug=s.course_slug
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.slug=s.lesson_slug
  where l.is_published=true
),
rebuilt as (
  select t.id,
    jsonb_agg(
      case
        when b.block->>'type'='template' then jsonb_build_object(
          'type','template','title',t.template_title,'text',t.template_text
        )
        when b.block->>'type'='checklist' then jsonb_build_object(
          'type','checklist','title','Before you submit','items',t.checklist_items
        )
        else b.block
      end
      order by b.ord
    ) as content
  from targets t
  cross join lateral jsonb_array_elements(
    (select l2.content from public.training_lessons l2 where l2.id=t.id)
  ) with ordinality b(block,ord)
  group by t.id,t.template_title,t.template_text,t.checklist_items
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

with worked_examples(course_slug,lesson_slug,example_title,example_text) as (
values
('bookkeeping-administration','invoices-bills-receipts-and-supporting-documents','Worked example: duplicate risk needs more than one matching field','Two supplier invoices have the same amount and date, but different invoice numbers. Do not delete one simply because they look similar. Compare supplier, invoice reference, purchase/order evidence, line items, and import history. Mark duplicate risk while evidence is incomplete and route the final posting/void decision to the authorised finance owner.'),
('bookkeeping-administration','categories-accounts-and-coding-questions','Worked example: historical coding is evidence, not permission','A subscription was coded to Software last month, but the current invoice includes equipment and setup services. The previous account may help frame a reviewer question, but it does not prove the whole new invoice belongs there. Preserve the source detail and ask the reviewer how the mixed invoice should be treated.'),
('bookkeeping-administration','customer-invoices-credits-and-payment-status','Worked example: a customer claim does not create a credit','A customer says they already paid and asks you to remove the balance. The bank shows a similar amount with no reliable reference. Do not mark the invoice paid or create a credit to close the account. Record the claim, investigate the receipt evidence, keep the balance status honest, and route any adjustment to the authorised owner.'),
('bookkeeping-administration','overdue-accounts-and-debtor-follow-up','Worked example: disputed debt follows a different path','An invoice is 18 days overdue, but the customer replied that the service was cancelled and attached an email thread. Do not continue the standard overdue sequence as if nothing changed. Mark the dispute, preserve the evidence, stop any unsupported collection wording, and route the commercial/accounting decision to the owner.'),
('payroll-administration','leave-new-starters-leavers-and-employee-changes','Worked example: effective date controls which cycle is affected','A manager approves a pay increase today but the letter says it becomes effective next month. Do not apply it to the current payroll merely because approval exists now. Record the approved effective date, map it to the correct pay cycle, and flag any conflict between the request and the document.'),
('payroll-administration','earnings-allowances-deductions-and-reimbursements','Worked example: a familiar label can still need review','An input file contains a new “travel allowance” that looks similar to a recurring item used by other employees, but this employee has no approved recurring rule. Do not copy another employee''s treatment. Record the source, amount and period, identify the ambiguity, and route the classification/treatment question to payroll.'),
('payroll-administration','benefits-contributions-and-statutory-items-awareness','Worked example: explain the handoff, not the law','An employee asks why a statutory deduction changed. The VA can confirm the current payroll line and compare it with the prior period, but should not invent the legal/tax reason. Gather the verified records, route the interpretation to the authorised payroll specialist, and tell the employee when an answer will be provided.'),
('payroll-administration','payroll-queries-corrections-and-escalation','Worked example: finding an error does not authorise the payment fix','A review confirms four approved hours were omitted from payroll. That verifies the discrepancy, but it does not automatically authorise an off-cycle payment. Record the evidence, correction required, approval/payment owner, and employee update without promising the timing or payment method before approval.')
),
targets as (
  select l.id,w.example_title,w.example_text
  from worked_examples w
  join public.training_courses c on c.slug=w.course_slug
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.slug=w.lesson_slug
  where l.is_published=true
),
rebuilt as (
  select t.id,
    coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord<ex.exercise_ord),'[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('type','callout','title',t.example_title,'text',t.example_text))
    || coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord>=ex.exercise_ord),'[]'::jsonb) as content
  from targets t
  join lateral (
    select min(b2.ord) as exercise_ord
    from jsonb_array_elements((select l2.content from public.training_lessons l2 where l2.id=t.id))
      with ordinality b2(block,ord)
    where b2.block->>'type'='exercise'
  ) ex on ex.exercise_ord is not null
  cross join lateral jsonb_array_elements((select l3.content from public.training_lessons l3 where l3.id=t.id))
    with ordinality b(block,ord)
  where not exists (
    select 1
    from jsonb_array_elements((select l4.content from public.training_lessons l4 where l4.id=t.id)) e
    where e->>'type'='callout' and e->>'title'=t.example_title
  )
  group by t.id,t.example_title,t.example_text,ex.exercise_ord
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('bookkeeping-administration','payroll-administration');
