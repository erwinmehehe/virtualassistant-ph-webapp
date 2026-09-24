-- Deepen Australian Bookkeeping Administration with first-class practical work.
-- Keeps the current TPB/BAS, Fair Work, STP and Payday Super teaching intact.
-- Existing lesson IDs, learner progress, enrollments, assessment state and publication state are preserved.

with specs(
  lesson_slug,
  exercise_title,
  exercise_text,
  deliverable,
  template_title,
  template_text,
  checklist_title,
  checklist_items,
  worked_title,
  worked_text
) as (
  values
  (
    'australian-bookkeeping-workflow-gst-bas-and-role-boundaries',
    'Build the Harbour Field Services bookkeeping authority map',
    $e$Harbour Field Services asks a VA to collect source documents, prepare AP and AR, review bank-feed exceptions, support payroll inputs, and assemble month-end evidence. Map each task to what the VA may prepare and what must stay with the business owner, bookkeeper, accountant, registered BAS/tax agent, or payroll specialist.$e$,
    'A bookkeeping authority map showing workflow, source system, VA action, approval point, BAS/tax/accounting/payroll judgment, authorised owner, deadline, and evidence source.',
    'Australian bookkeeping authority and handoff map',
    $tpl$Workflow:
Source system:
Source evidence:
VA may prepare:
VA may update:
Approval required:
GST / BAS / tax decision:
Accounting decision:
Payroll / STP / super decision:
Payment authority:
Authorised owner:
Deadline / cut-off:
Escalation trigger:
Evidence / link:$tpl$,
    'Bookkeeping authority QA',
    '["Each task is tied to an approved workflow and evidence source.","Routine administration is separated from BAS, tax, accounting, payroll, payment and statutory judgment.","Software access is not treated as professional authority.","Payment preparation and payment authorisation remain distinct.","Cut-offs and reviewer owners are explicit.","The next person can see exactly what the VA may do and what must be escalated."]'::jsonb,
    'Boundary judgment: "handle the books" is not a complete delegation',
    $w$The owner says, "Just handle the books." The VA does not treat that phrase as authority to decide GST treatment, lodge BAS, submit STP, approve payments, or make accounting adjustments. The VA maps the routine preparation work, asks who owns each regulated or approval decision, and records the agreed boundaries before processing exceptions.$w$
  ),
  (
    'source-documents-invoices-bills-receipts-and-data-quality',
    'Run the source-document and duplicate-risk register',
    $e$Harbour Field Services receives two PDFs with the same supplier, invoice number and amount but different filenames, plus a tax invoice over $1,000 that does not clearly identify the buying entity. Build the evidence register without editing the supplier documents or inventing missing tax information.$e$,
    'A source-document register showing document type, supplier/customer, number, date, amount, GST shown, buyer identity, duplicate signal, source location, missing information, safe admin action, reviewer, and status.',
    'Australian source-document and duplicate-risk register',
    $tpl$Document:
Document type:
Supplier / customer:
Invoice / receipt number:
Invoice date:
Amount:
GST shown:
Buyer identity shown:
Source location:
Possible duplicate:
Duplicate evidence:
Missing / conflicting information:
Administrative action:
Coding / GST question:
Reviewer:
Status:
Audit note:$tpl$,
    'Source-document QA',
    '["The original source remains retrievable.","Supplier/customer, document number, date and amount are checked before entry.","Duplicate risk is resolved from evidence rather than filename differences.","Missing buyer/tax information is flagged instead of invented.","The VA does not alter the original supplier document.","Coding and GST questions are routed to the authorised reviewer."]'::jsonb,
    'Evidence judgment: fix the workflow, not the supplier document',
    $w$Two PDFs show supplier North Tools, invoice NT-884 and the same total. The VA records both source locations, checks whether one is a resend or duplicate, and holds duplicate entry. If a required tax-invoice field is missing, the VA requests or escalates the evidence; the VA does not edit the PDF to make it compliant.$w$
  ),
  (
    'accounts-payable-approvals-and-payment-preparation',
    'Prepare the AP approval and payment-control sheet',
    $e$Harbour Field Services has three supplier bills: one ready for approval, one possible duplicate, and one whose supplier emailed new bank details the day before a large payment. Prepare the payment-control sheet, independently verify sensitive changes under the client process, and keep payment release with the authorised approver.$e$,
    'An AP control sheet with bill evidence, due date, duplicate status, approval, bank-detail change, independent verification, payment readiness, exception, approver, and final payment evidence.',
    'Australian AP approval and payment-control sheet',
    $tpl$Supplier:
Bill / invoice:
Invoice date:
Due date:
Amount:
Source evidence:
Duplicate check:
Credit / dispute:
Approval state:
Bank-detail change:
Independent verification:
Payment readiness:
Payment batch reference:
Release authority:
Exception:
Next action:
Final payment evidence:
Audit note:$tpl$,
    'AP and fraud-control QA',
    '["The bill traces to source evidence.","Possible duplicates are investigated before payment preparation.","Supplier bank-detail changes are independently verified through the approved process.","The person preparing the payment does not silently self-authorise release.","Credits and disputes remain visible.","Paid status is recorded only from reliable confirmation."]'::jsonb,
    'Fraud-control judgment: an emailed bank change is a control event',
    $w$A long-standing supplier emails new bank details one day before a large payment. The VA does not replace the stored details from the email alone. The change is held, independently verified through the client-approved channel, and only then included in payment preparation. Release still belongs to the authorised approver.$w$
  ),
  (
    'accounts-receivable-invoicing-credits-and-debtor-follow-up',
    'Run the AR dispute and debtor follow-up queue',
    $e$Harbour Field Services has one ordinary overdue invoice, one customer claiming they paid yesterday, one disputed invoice line, and one customer asking to pay in three instalments. Separate normal collections from evidence, dispute, concession, credit and payment-plan decisions.$e$,
    'An AR queue showing invoice, due date, current balance/status, payment evidence, dispute, approved reminder, concession request, decision owner, customer checkpoint, and next action.',
    'Australian AR dispute and follow-up queue',
    $tpl$Customer:
Invoice:
Invoice date / due date:
Amount / balance:
Current status:
Payment evidence:
Dispute:
Last contact:
Approved reminder:
Reminder sent / held:
Credit / refund / write-off request:
Payment-plan / concession request:
Decision owner:
Customer checkpoint:
Next action:
Audit note:$tpl$,
    'AR QA',
    '["Payment evidence is checked before another reminder is sent.","Disputed invoices follow a different path from ordinary overdue balances.","Credits, refunds, write-offs and payment plans require authorised decisions.","The VA does not promise a concession before approval.","Customer commitments and checkpoints are recorded.","The aged-receivables queue is not cleaned by hiding unresolved balances."]'::jsonb,
    'Collections judgment: a payment-plan request is not routine reminder administration',
    $w$A long-term customer asks to pay an overdue invoice in three instalments. The VA records the request and current balance, pauses any wording that would contradict the request, and routes the commercial decision to the authorised owner. The VA does not create a payment plan or change terms without approval.$w$
  ),
  (
    'bank-reconciliation-preparation-and-exception-management',
    'Build the bank-reconciliation exception worksheet',
    $e$Review four Harbour Field Services bank items: an exact-looking customer receipt, a $2,450 debit similar to a supplier bill but with a different amount, a possible internal transfer, and an unknown software charge with no source document. Separate evidence-supported matches from unresolved items.$e$,
    'A reconciliation worksheet showing bank line, candidate record, amount/date/reference checks, approved rule, mismatch, evidence missing, administrative action, accounting/GST question, reviewer, and final state.',
    'Australian bank-reconciliation exception worksheet',
    $tpl$Bank line:
Date:
Counterparty / reference:
Amount:
Candidate record:
Candidate amount:
Amount match:
Date / reference match:
Approved bank rule:
Transfer / duplicate possibility:
Source evidence:
Evidence missing:
Administrative action:
Accounting / GST question:
Reviewer:
Final reconciliation state:
Audit note:$tpl$,
    'Reconciliation QA',
    '["Suggested or likely matches are checked against evidence.","Amount differences are not ignored to achieve a clean feed.","Possible transfers are identified before duplicate income/expense is created.","Unknown items remain visible until their purpose is confirmed.","Only approved rules are used.","The final state records why an item was matched, left open or escalated."]'::jsonb,
    'Reconciliation judgment: zero unreconciled is not the goal',
    $w$A $2,450 bank debit resembles a supplier bill, but the bill amount differs. The VA compares supplier, date, reference, amount and source documents and records the mismatch. The item stays unresolved for the reviewer; the VA does not invent a fee, recode the bill or create a transaction simply to clear the feed.$w$
  ),
  (
    'payroll-stp-super-and-leave-administration-handoffs',
    'Prepare the payroll, STP and Payday Super exception handoff',
    $e$Harbour Field Services has a missing timesheet approval, a backdated pay change, an employee bank-detail update received by email, an overtime dispute, and a returned super contribution after payday. Prepare the evidence-led payroll handoff without making statutory, tax, award, leave, STP or super decisions.$e$,
    'A payroll/STP/Payday Super handoff showing employee, pay period, source input, approval, effective date, sensitive change verification, exception, super status, administrative action, specialist question, owner, and deadline.',
    'Australian payroll, STP and Payday Super exception handoff',
    $tpl$Employee / reference:
Pay period:
Source input:
Effective date:
Approval evidence:
Hours / amount / status:
Bank-detail change:
Independent verification:
Leave / overtime / pay exception:
STP question:
Super contribution state:
Returned / failed super:
Administrative action:
Statutory / tax / award question:
Payroll / BAS reviewer:
Deadline:
Payment / declaration authority:
Next checkpoint:
Audit note:$tpl$,
    'Payroll and super QA',
    '["Employee and pay-period inputs come from approved sources.","Late/backdated changes remain visible and require approval.","Sensitive bank-detail changes are independently verified.","Returned or failed super contributions remain time-bound exceptions.","The VA does not decide tax, award, leave, termination, STP or super statutory treatment.","Preparation, declaration, payroll approval and payment authority remain distinct."]'::jsonb,
    'Payday Super judgment: a returned contribution stays an exception',
    $w$A super contribution is returned after payday. The VA records the employee/pay-run reference, return evidence, date, current status and client deadline, then routes the exception to the authorised payroll/BAS owner. The VA does not change the contribution treatment or declare the statutory outcome from software access alone.$w$
  ),
  (
    'month-end-preparation-reports-and-accountant-handoff',
    'Build the month-end and BAS reviewer pack',
    $e$Harbour Field Services month-end has missing source documents, a duplicate-looking bill, an unmatched receipt, three unreconciled bank lines, an unusual GST code, an overtime dispute, a returned super contribution, and a material expense variance. Assemble the pack so the reviewer can make decisions without reconstructing the books.$e$,
    'A reviewer-ready month-end/BAS pack with period cut-off, AP/AR exceptions, bank items, GST-sensitive questions, payroll/super issues, material variances, evidence, owner, deadline, and decision status.',
    'Australian month-end and BAS reviewer pack',
    $tpl$Business:
Period:
Reviewer deadline:

SOURCE DOCUMENTS
Missing / duplicate items:
Evidence:

AP
Unapproved / disputed / changed-bank items:

AR
Unapplied receipts / disputes / write-off requests:

BANK
Unreconciled items / transfers / unknowns:

GST / BAS
Transaction:
Current treatment:
Evidence:
Specific reviewer question:

PAYROLL / STP / SUPER
Exception:
Deadline:
Reviewer:

REPORTS / VARIANCES
Report:
Material movement:
Source check:
Open question:

HANDOFF
Completed:
Held:
Decision owners:
Deadlines:
Next checkpoints:$tpl$,
    'Month-end/BAS QA',
    '["The period and reviewer deadline are explicit.","Every open item points to source evidence or states what is missing.","AP, AR, bank, GST/BAS and payroll/super exceptions remain visible.","Material report movements are traced to source-level questions.","The VA does not change GST/accounting treatment to make reports look normal.","Every held item has a specific reviewer question, owner and deadline."]'::jsonb,
    'BAS judgment: the pack supports the decision; it does not replace it',
    $w$The draft GST report looks unusual. The VA identifies the source transactions driving the variance, records the current treatment and missing evidence, and asks a specific reviewer question. The VA does not change GST codes, amend prior periods or decide the BAS treatment just to make the report resemble the prior quarter.$w$
  ),
  (
    'australian-bookkeeping-composite-admin-simulation',
    'Final simulation: run the Harbour Field Services month-end desk',
    $e$Use one connected Harbour Field Services case from start to finish. Resolve source-document/duplicate risks, AP controls, AR exceptions, bank reconciliation preparation, GST/BAS-sensitive questions, payroll/STP/Payday Super exceptions, material variances, and the qualified-review handoff.$e$,
    'A complete Harbour Field Services Australian bookkeeping control pack combining source evidence, AP, AR, reconciliation, payroll/super, GST/BAS questions, variance review, and month-end handoff.',
    'Harbour Field Services Australian bookkeeping control pack',
    $tpl$BUSINESS: Harbour Field Services
PERIOD:

1. SOURCE EVIDENCE
Missing:
Duplicate risks:
Evidence links:

2. AP
Approvals:
Bank-detail controls:
Payment readiness:
Exceptions:

3. AR
Ordinary overdue:
Payment evidence:
Disputes:
Concessions / decisions:

4. BANK RECONCILIATION
Evidence-supported matches:
Transfers:
Unknown / unresolved:
Reviewer questions:

5. GST / BAS
Sensitive items:
Current treatment:
Evidence:
Reviewer questions:

6. PAYROLL / STP / PAYDAY SUPER
Input exceptions:
Returned / failed super:
Statutory questions:
Deadlines:

7. REPORTS / VARIANCES
Material movement:
Source explanation:
Open question:

8. FINAL HANDOFF
Completed:
Held:
Decision owners:
Deadlines:
Next checkpoints:
Audit trail:$tpl$,
    'Australian bookkeeping capstone QA',
    '["All outputs use one connected Harbour Field Services evidence trail.","Source-document and duplicate controls are resolved before downstream processing.","AP preparation remains separate from payment authorisation.","AR disputes/concessions remain separate from routine collection.","Bank exceptions are not forced to zero.","GST/BAS and payroll/super judgments stay with authorised reviewers.","The final pack clearly identifies evidence, owners, deadlines and unresolved decisions."]'::jsonb,
    null,
    null
  )
),
targets as (
  select
    l.id,
    l.content,
    s.*
  from specs s
  join public.training_courses c
    on c.slug = 'australian-bookkeeping-administration'
  join public.training_modules m
    on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and l.slug = s.lesson_slug
  where l.is_published = true
),
cleaned as (
  select
    t.id,
    t.lesson_slug,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items,
    t.worked_title,
    t.worked_text,
    coalesce(
      jsonb_agg(block order by ord)
        filter (where block->>'type' not in ('exercise','template','checklist')),
      '[]'::jsonb
    ) as teaching_content
  from targets t
  cross join lateral jsonb_array_elements(t.content) with ordinality source(block, ord)
  group by
    t.id,
    t.lesson_slug,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items,
    t.worked_title,
    t.worked_text
),
rebuilt as (
  select
    c.id,
    c.teaching_content
      || case
        when c.worked_text is null then '[]'::jsonb
        else jsonb_build_array(
          jsonb_build_object('type','heading','text','Expert worked example'),
          jsonb_build_object('type','scenario','title',c.worked_title,'text',c.worked_text)
        )
      end
      || jsonb_build_array(
        jsonb_build_object(
          'type','exercise',
          'title',c.exercise_title,
          'text',c.exercise_text,
          'deliverable',c.deliverable
        ),
        jsonb_build_object(
          'type','template',
          'title',c.template_title,
          'text',c.template_text
        ),
        jsonb_build_object(
          'type','checklist',
          'title',c.checklist_title,
          'items',c.checklist_items
        )
      ) as content
  from cleaned c
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
  and l.content is distinct from r.content;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'australian-bookkeeping-administration';
