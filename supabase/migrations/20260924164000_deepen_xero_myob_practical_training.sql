-- Deepen Xero and MYOB software training with first-class practical work.
-- Preserves lesson IDs, learner progress, enrollment state, and publication state.
-- Current product/regulatory teaching from the September 2026 refresh migrations remains intact.

with specs(
  course_slug,
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

  -- XERO
  (
    'xero-workflows-for-virtual-assistants',
    'xero-organisation-contacts-and-va-access-boundaries',
    'Build the Xero access and finance-authority matrix',
    'Brightline Services gives a VA broad Xero access, but the actual role is customer invoice follow-up, supplier-document capture, and month-end evidence preparation. Map each delegated task to the minimum access and the accounting, tax, payroll, payment, and settings decisions that must remain with authorised finance owners.',
    'A Xero access and authority matrix showing task, organisation area, minimum access, source data needed, action allowed, action prohibited, decision owner, and review trigger.',
    'Xero access and authority matrix',
    $tpl$Task:
Xero area:
Organisation / entity:
Minimum access needed:
Source data needed:
Action allowed:
Action not allowed:
Finance / tax / payroll / payment owner:
Escalation trigger:
Access review trigger:
Evidence / policy reference:$tpl$,
    'Xero access QA',
    '["The correct Xero organisation is identified before work starts.","Access is tied to delegated work instead of convenience.","Accounting, GST/BAS, payroll, payment, and organisation-setting decisions have named owners.","The VA does not use broad access to make professional judgments.","Contact and finance data access follows minimum-necessary principles.","The record states when access should be reviewed or reduced."]'::jsonb,
    null,
    null
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'sales-invoices-credit-notes-and-customer-follow-up',
    'Run the Xero accounts-receivable exception queue',
    'Brightline Services has one overdue invoice, one customer claiming payment yesterday, and one disputed line item. Verify invoice status and source evidence before follow-up, then record which action is administrative and which credit, pricing, write-off, or accounting decision needs approval.',
    'An AR exception queue covering invoice, customer, status, payment evidence, dispute, approved follow-up, decision boundary, owner, and next checkpoint.',
    'Xero accounts-receivable exception queue',
    $tpl$Customer:
Invoice:
Invoice date / due date:
Xero status:
Approved source record:
Payment evidence:
Dispute / exception:
Reminder sent / held:
Administrative action:
Credit / pricing / write-off decision:
Decision owner:
Next checkpoint:
Audit note:$tpl$,
    'Xero AR QA',
    '["Invoice details trace back to approved billing evidence.","Payment status is checked before another reminder is sent.","Disputes remain visible instead of being overwritten.","Credits, write-offs, pricing concessions, and tax treatment stay controlled.","Customer communication does not promise an unapproved outcome.","The queue has a clear next owner and checkpoint."]'::jsonb,
    'Paid-but-outstanding: stop before chasing again',
    'Invoice BL-301 is still shown as outstanding in Xero, but the customer provides a bank receipt from yesterday for the exact amount. The VA records the receipt evidence, checks for an imported or unmatched bank line, holds the reminder, and routes the match or allocation question to the authorised finance reviewer. The VA does not create a credit note or mark the invoice paid merely to clear the aged receivables list.'
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'bills-receipts-and-accounts-payable-in-xero',
    'Prepare the Xero AP and supplier-document control sheet',
    'Brightline Services receives a supplier bill twice through email and document capture. A separate supplier also emails new bank details. Build the AP control sheet, preserve source evidence, identify the likely duplicate, and hold the bank-detail change for independent verification.',
    'An AP control sheet with supplier, bill reference, amount, duplicate check, source document, approval evidence, bank-detail risk, action, reviewer, and payment-readiness state.',
    'Xero AP and supplier-document control sheet',
    $tpl$Supplier:
Bill / document reference:
Invoice date:
Due date:
Amount:
Source document:
Duplicate check:
Existing Xero record:
Bank-detail change:
Independent verification status:
Approval evidence:
Administrative action:
Coding / GST question:
Payment readiness:
Reviewer / approver:
Audit note:$tpl$,
    'Xero AP QA',
    '["Supplier, invoice number, date, and amount are checked before entry.","Possible duplicates are investigated before deletion, voiding, or re-entry.","Source documents remain attached or referenced.","Changed bank details are independently verified under client policy.","Coding, GST treatment, and payment approval are not guessed.","Payment readiness is distinct from payment authorisation."]'::jsonb,
    null,
    null
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'bank-feeds-matching-and-reconciliation-preparation',
    'Prepare the Xero/JAX reconciliation exception worksheet',
    'Review four Brightline Services bank-feed items: one exact invoice receipt, one JAX-suggested bill match with an $8 difference, one possible internal transfer, and one unknown subscription. Use source evidence and approved rules to separate safe matches from items that must remain unresolved for review.',
    'A reconciliation exception worksheet showing bank line, suggestion method, source match, amount/date/reference comparison, exception, action taken, accounting/GST decision needed, reviewer, and outcome.',
    'Xero/JAX reconciliation exception worksheet',
    $tpl$Bank line:
Date:
Counterparty / reference:
Amount:
JAX / Xero suggestion:
Suggestion method:
Candidate source record:
Amount match:
Date / reference match:
Approved bank rule:
Exception:
Administrative action:
Accounting / GST decision:
Reviewer:
Final outcome:
Audit note:$tpl$,
    'Xero reconciliation QA',
    '["Every suggested match is checked against source evidence.","A small amount difference is not ignored merely because the software suggests a match.","Transfers and unknown transactions remain visible until their business purpose is confirmed.","Only approved bank rules are used.","Accounting and GST treatment stay with the authorised reviewer when uncertain.","The final outcome records why the item was matched, left open, or escalated."]'::jsonb,
    'Reconciliation judgment: confidence is not evidence',
    'JAX suggests matching an $828 bank debit to Bill-811 for $820. The VA checks supplier, date, reference, amount, and supporting documents, records the $8 mismatch, and leaves the item unresolved for the finance reviewer. High confidence or a suggested match does not justify inventing a bank fee, changing the bill, or forcing reconciliation.'
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'gst-bas-and-australian-tax-awareness-in-xero',
    'Build the Xero GST/BAS exception register',
    'Brightline Services has a software renewal carrying GST in prior months, but the current invoice is different; an imported-goods transaction has unclear treatment; and a bank fee shows an unexpected code. Prepare the exception register from source documents without changing tax treatment or prior periods.',
    'A GST/BAS exception register with transaction, period, source document, current account/tax code, historical pattern, inconsistency, evidence, administrative action, reviewer question, and owner.',
    'Xero GST/BAS exception register',
    $tpl$Transaction:
Period:
Source document:
Amount:
Current account:
Current GST / tax code:
Historical treatment:
What changed:
Evidence attached:
Administrative action:
Tax / BAS question:
Prior-period impact:
Reviewer / BAS owner:
Status:
Audit note:$tpl$,
    'Xero GST/BAS QA',
    '["Each exception is tied to a source document and period.","Historical coding is evidence, not automatic authority for the current transaction.","The learner does not change GST codes merely to match a total.","Prior-period implications are surfaced rather than silently corrected.","Draft reports are treated as review material, not tax advice.","The authorised BAS/tax owner receives a clear question and evidence pack."]'::jsonb,
    'GST judgment: a recurring pattern can still be wrong for the new invoice',
    'A software renewal was historically coded with GST, but the new supplier invoice presents the charge differently. The VA captures the invoice, current Xero code, historical pattern, and discrepancy, then asks the authorised BAS or finance reviewer to confirm the treatment. The VA does not change the code or amend prior periods based only on what was done last month.'
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'payroll-stp-and-payroll-admin-handoffs-in-xero',
    'Prepare the Xero payroll and STP exception handoff',
    'Brightline Services has a missing timesheet approval, a backdated pay change, new employee bank details received by email, and an employee asking a tax question. Prepare the payroll exception handoff using approved evidence while keeping statutory, tax, super, final-payroll, and payment authority with the correct owners.',
    'A payroll/STP handoff showing employee, pay period, source input, approval state, effective date, sensitive-data control, variance, administrative action, statutory question, reviewer, and payment boundary.',
    'Xero payroll and STP exception handoff',
    $tpl$Employee / reference:
Pay period:
Source input:
Effective date:
Approval evidence:
Hours / amount / status:
Bank-detail change:
Independent verification:
Variance / exception:
Administrative action:
Tax / super / award / STP question:
Payroll reviewer:
Final payroll approval:
Payment authority:
Next checkpoint:
Audit note:$tpl$,
    'Xero payroll QA',
    '["Employee and pay-period inputs come from approved sources.","Late or backdated changes remain visible and require review.","Bank-detail changes are independently verified.","Sensitive payroll information stays inside approved systems.","Tax, super, award, termination, STP, and statutory treatment are not decided by the VA.","Preparation, final payroll approval, STP declaration, and payment authority remain distinct."]'::jsonb,
    null,
    null
  ),
  (
    'xero-workflows-for-virtual-assistants',
    'xero-reports-month-end-support-and-composite-simulation',
    'Final simulation: run the Brightline Services Xero month-end desk',
    'Use one connected Brightline Services month-end case. Work through AR, AP, bank-feed/JAX exceptions, GST/BAS-sensitive items, payroll handoff, and finance reporting. Finish with a reviewer-ready month-end pack showing what is complete, what remains unresolved, the evidence used, the decision owner, and the next checkpoint.',
    'A complete Xero month-end control pack combining AR, AP, reconciliation, GST/BAS exceptions, payroll handoff, report checks, unresolved items, and accountant/bookkeeper handoff.',
    'Brightline Services Xero month-end control pack',
    $tpl$BUSINESS: Brightline Services

1. AR
Invoices / payment evidence:
Disputes:
Follow-up held / sent:
Decision needed:

2. AP
Bills / duplicates:
Supplier-detail risks:
Approval state:
Payment readiness:

3. BANK / JAX
Matched with evidence:
Left unresolved:
Transfer / unknown items:
Reviewer questions:

4. GST / BAS
Exceptions:
Source documents:
Prior-period concerns:
BAS owner questions:

5. PAYROLL
Missing / late inputs:
Sensitive changes:
Statutory questions:
Approval / payment boundary:

6. MONTH-END REPORTING
Reports checked:
Material variances:
Unsupported balances / anomalies:
Evidence links:

7. REVIEWER HANDOFF
Completed:
Held:
Decisions needed:
Owners:
Deadlines:
Next checkpoints:$tpl$,
    'Xero capstone QA',
    '["The work uses one connected Brightline Services evidence trail.","AR and AP exceptions remain traceable to source records.","JAX and bank-feed suggestions are verified instead of accepted blindly.","GST/BAS and payroll judgments stay with authorised reviewers.","Month-end reports are checked for anomalies and unresolved items rather than treated as automatically correct.","The final handoff separates completed work, unresolved exceptions, decision owners, evidence, and next checkpoints."]'::jsonb,
    'Month-end judgment: a clean-looking report can still hide unresolved work',
    'The Xero Profit and Loss looks plausible, but the bank feed still contains an unknown subscription, one customer receipt is not matched, a supplier bill may be duplicated, and a GST exception remains open. The VA records the report as draft-review material, lists the unresolved items and their possible impact, and hands the pack to the accountant or bookkeeper. The VA does not declare month-end complete because the report generated successfully.'
  ),

  -- MYOB
  (
    'myob-workflows-for-virtual-assistants',
    'myob-business-file-contacts-and-access-boundaries',
    'Build the MYOB business-file access and authority matrix',
    'Maple Works Australia gives a VA access to MYOB Business for sales and purchase administration, bank-feed review, payroll input preparation, and report support. Define the minimum access and identify the accounting, GST/BAS, payroll, STP, super, payment, and settings decisions that remain with authorised owners.',
    'A MYOB access matrix showing business file, delegated task, minimum access, evidence needed, action allowed, action prohibited, specialist owner, and review trigger.',
    'MYOB access and authority matrix',
    $tpl$Task:
MYOB business file / product:
Area:
Minimum access:
Evidence needed:
Action allowed:
Action not allowed:
Accounting / GST / payroll / STP / super owner:
Escalation trigger:
Access review trigger:
Audit note:$tpl$,
    'MYOB access QA',
    '["The correct MYOB business file/product is identified before work starts.","Access is tied to real duties rather than convenience.","Accounting, GST/BAS, payroll, STP, super, payment, and settings decisions have named owners.","The VA does not treat screen access as professional authority.","Sensitive employee and finance data use minimum-necessary access.","Access review triggers are documented."]'::jsonb,
    null,
    null
  ),
  (
    'myob-workflows-for-virtual-assistants',
    'sales-purchases-invoices-bills-and-source-documents',
    'Run the MYOB sales and purchases source-document queue',
    'Maple Works Australia has a possible duplicate supplier bill, an overdue customer invoice with no follow-up note, and a purchase document missing a reference. Build the transaction-control queue from evidence and identify what can be fixed administratively versus what needs accounting, pricing, credit, or payment approval.',
    'A sales/purchases queue covering record, source document, amount/status, duplicate check, missing evidence, administrative action, approval required, reviewer, and next checkpoint.',
    'MYOB sales and purchases control queue',
    $tpl$Customer / supplier:
Transaction:
Source document:
Reference:
Date / due date:
Amount:
MYOB status:
Duplicate check:
Missing evidence:
Administrative action:
Pricing / credit / coding decision:
Payment / approval state:
Reviewer / approver:
Next checkpoint:
Audit note:$tpl$,
    'MYOB transaction QA',
    '["Every transaction traces to a source document or approved source record.","Possible duplicates are investigated before deletion or re-entry.","Missing references and evidence remain visible.","Credits, pricing, coding, GST treatment, and payment authority are not guessed.","Customer/supplier status is checked before communication.","The queue leaves a clear reviewer trail."]'::jsonb,
    null,
    null
  ),
  (
    'myob-workflows-for-virtual-assistants',
    'banking-matching-and-reconciliation-preparation-in-myob',
    'Prepare the MYOB bank-feed and matching exception worksheet',
    'Review Maple Works bank-feed items including one automatically matched customer receipt, one suggested category with weak evidence, one grouped merchant settlement, and one possible internal transfer. Verify from records before confirming or creating transactions.',
    'A MYOB bank exception worksheet with feed item, automatic/suggested result, candidate record, evidence comparison, approved rule, exception, administrative action, finance decision, reviewer, and reconciliation state.',
    'MYOB bank-feed and matching exception worksheet',
    $tpl$Bank feed item:
Date:
Reference / counterparty:
Amount:
Automatic match / suggestion:
Suggested category:
Candidate MYOB record:
Evidence checked:
Approved rule:
Exception:
Administrative action:
Accounting / GST decision:
Reviewer:
Reconciliation state:
Audit note:$tpl$,
    'MYOB banking QA',
    '["Automatically matched and suggested items are still checked against evidence.","Grouped payments and merchant settlements are not forced into one guessed record.","Transfers are identified before creating duplicate income or expense.","Only approved rules are used.","Uncertain accounting or GST treatment remains unresolved for review.","Matching and reconciliation state are recorded separately."]'::jsonb,
    'Matching judgment: automation can be plausible and still incomplete',
    'MYOB automatically associates a bank deposit with a customer invoice for the same total, but the deposit may combine several customer payments. The VA checks remittance and invoice evidence, records the grouped-payment possibility, and leaves the final allocation for the authorised finance reviewer rather than accepting the automated match solely because the total agrees.'
  ),
  (
    'myob-workflows-for-virtual-assistants',
    'gst-reports-bas-preparation-and-review-boundaries-in-myob',
    'Build the MYOB GST/BAS review exception register',
    'Maple Works has a draft GST report with a large quarter-on-quarter variance, one imported-goods transaction with unclear treatment, and a prior-period adjustment question. Prepare the evidence and reviewer questions without changing GST treatment or lodging anything.',
    'A MYOB GST/BAS exception register showing transaction/report area, source evidence, current treatment, variance, prior-period question, action taken, reviewer question, authorised owner, and status.',
    'MYOB GST/BAS exception register',
    $tpl$Report / transaction:
Period:
Source document:
Amount:
Current account / GST treatment:
Expected / historical pattern:
Variance / exception:
Prior-period issue:
Evidence attached:
Administrative action:
GST / BAS question:
Authorised reviewer:
Lodgement status:
Next checkpoint:
Audit note:$tpl$,
    'MYOB GST/BAS QA',
    '["The report period and source transactions are clearly identified.","Material variance is investigated rather than dismissed as a reporting quirk.","Historical treatment is used as evidence, not automatic authority.","Prior-period adjustments are surfaced for review.","The VA does not declare, lodge, or amend BAS from software access alone.","The reviewer receives specific questions and evidence."]'::jsonb,
    'GST/BAS judgment: investigate the variance before touching codes',
    'The current MYOB GST report is materially higher than the previous quarter. The VA traces the largest contributing transactions, finds an imported-goods item with uncertain treatment, records the evidence and variance, and routes the question to the authorised accountant or BAS owner. The VA does not change the GST code simply to make the quarter resemble the prior period.'
  ),
  (
    'myob-workflows-for-virtual-assistants',
    'myob-payroll-stp-super-and-employee-admin-handoff',
    'Prepare the MYOB payroll, STP, and Payday Super exception handoff',
    'Maple Works has one employee with changed super-fund details, one unusual allowance, one rejected super contribution from the prior payday, and a prompt to add the VA as an STP declarer. Prepare the administrative checks and follow-up plan without taking payroll, STP, super, or statutory authority.',
    'A payroll/STP/Payday Super exception log showing employee, pay period, source input, approval, bank/super-detail verification, rejected contribution status, administrative action, statutory question, authorised reviewer, and next deadline.',
    'MYOB payroll, STP, and Payday Super exception log',
    $tpl$Employee:
Pay period:
Source input:
Approval evidence:
Pay / allowance / leave change:
Bank-detail change:
Super-fund detail change:
Independent verification:
Rejected / returned super item:
Payday Super deadline / status:
Administrative action:
STP / tax / super / award question:
Authorised payroll / finance owner:
Declaration / authorisation boundary:
Next checkpoint:
Audit note:$tpl$,
    'MYOB payroll and super QA',
    '["Employee changes come from approved evidence.","Bank and super-fund detail changes are independently verified.","Rejected or returned super contributions stay visible until resolved.","Payday Super timing is tracked without the VA deciding qualifying earnings or statutory treatment.","The VA does not add themselves as STP declarer for convenience.","Preparation, STP declaration, super authorisation, final payroll approval, and payment remain distinct controls."]'::jsonb,
    'Payroll judgment: software permission is not declarer or payment authority',
    'MYOB prompts the VA to add themselves as an STP declarer while a prior super contribution remains rejected. The VA records the rejected item, verifies the employee change evidence, prepares the payroll/super exception log, and routes STP declaration and Pay Super authorisation to the configured authorised people. The VA does not expand their own role to get the workflow finished.'
  ),
  (
    'myob-workflows-for-virtual-assistants',
    'myob-reports-accountant-handoff-and-composite-simulation',
    'Final simulation: run the Maple Works MYOB month-end desk',
    'Use one connected Maple Works Australia case. Work through sales/purchases, bank matching, GST/BAS exceptions, payroll/STP/Payday Super issues, and finance reporting. Finish with an accountant-ready pack that separates completed administration from unresolved accounting, tax, payroll, super, and payment decisions.',
    'A complete MYOB month-end control pack combining transaction QA, banking exceptions, GST/BAS review items, payroll/super handoff, report variance review, unresolved items, and accountant handoff.',
    'Maple Works MYOB month-end control pack',
    $tpl$BUSINESS: Maple Works Australia

1. SALES / PURCHASES
Transactions checked:
Duplicates:
Missing evidence:
Approval state:

2. BANKING
Automatic / suggested matches reviewed:
Grouped / transfer exceptions:
Items left unresolved:
Reviewer questions:

3. GST / BAS
Report variance:
Transaction exceptions:
Prior-period issues:
BAS owner questions:

4. PAYROLL / STP / SUPER
Employee changes:
Rejected / returned super:
Payday Super timing:
STP / authorisation boundary:

5. REPORTING
Reports checked:
Material variances:
Unexpected balances:
Evidence links:

6. ACCOUNTANT HANDOFF
Completed:
Held:
Decisions needed:
Owners:
Deadlines:
Next checkpoints:$tpl$,
    'MYOB capstone QA',
    '["The work uses one connected Maple Works evidence trail.","Sales and purchase records remain tied to source documents.","Automatic bank matches and category suggestions are verified before acceptance.","GST/BAS, payroll, STP, and super decisions stay with authorised owners.","Reports are reviewed for material variance and unresolved exceptions rather than treated as self-validating.","The final handoff clearly separates completed work, unresolved decisions, owners, evidence, and deadlines."]'::jsonb,
    'Month-end judgment: do not call the file clean while exceptions remain',
    'MYOB reports generate successfully, but a bank item is still unresolved, a GST variance has not been reviewed, and a rejected super contribution remains open. The VA includes those items in the month-end handoff, identifies the responsible accountant/payroll owners, and leaves the period in review status. A generated report is not proof that the underlying file is complete.'
  )
),
targets as (
  select
    l.id,
    l.content,
    s.*
  from specs s
  join public.training_courses c
    on c.slug = s.course_slug
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
    t.course_slug,
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
    t.course_slug,
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

update public.training_assessments a
set
  title = 'Brightline Services Xero Final Work Simulation',
  instructions = 'Work from one connected fictional Australian business. Use the Brightline Services evidence pack to make defensible administrative decisions across accounts receivable, accounts payable, Xero/JAX bank-feed review, GST/BAS-sensitive exceptions, payroll/STP handoff, and month-end reporting. Show what you completed, what you deliberately left unresolved, the evidence used, the authorised decision owner, and the next checkpoint. Do not force reconciliation, invent coding or GST treatment, create unsupported credits, approve payments, make payroll/statutory decisions, or treat software automation as finance authority.',
  pass_score = 80,
  rubric = '[
    {"id":"evidence","label":"Xero evidence accuracy","weight":20,"description":"Uses the supplied Brightline records accurately, distinguishes source evidence from assumptions, and keeps unresolved discrepancies visible."},
    {"id":"ar_ap","label":"AR and AP control","weight":15,"description":"Handles invoices, bills, duplicates, payment evidence, supplier details, and follow-up with clear approval boundaries."},
    {"id":"banking","label":"JAX and reconciliation judgment","weight":20,"description":"Verifies automatic or suggested matches against source evidence and keeps uncertain transfers, amount differences, and unknown items open for review."},
    {"id":"tax_payroll","label":"GST/BAS and payroll boundaries","weight":20,"description":"Prepares exception evidence without making tax, BAS, payroll, STP, super, accounting, or payment decisions.","hard_fail":true},
    {"id":"month_end","label":"Month-end QA","weight":15,"description":"Checks draft reports against unresolved transactions, variances, source records, and review status instead of treating generated reports as automatically correct."},
    {"id":"handoff","label":"Reviewer handoff","weight":10,"description":"Clearly separates completed work, held work, decision owners, evidence, deadlines, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"policy","title":"Brightline Services finance-control brief","kind":"policy","content":"Brightline Services is a fictional Australian services business using Xero. The VA may prepare customer follow-up, supplier documents, approved transaction records, bank-feed exception evidence, payroll inputs, and draft month-end reports. Credits, write-offs, pricing concessions, changed supplier bank details, accounting coding, GST/BAS treatment, prior-period changes, payroll/statutory treatment, STP declaration, payment authorisation, and final reconciliation require the named authorised owner."},
    {"id":"ar_ap","title":"AR and AP exception file","kind":"csv","content":"type,reference,counterparty,amount,status,issue\nAR,BL-301,Northstar Client,2200,Outstanding,Customer says paid yesterday\nAR,BL-305,Harbour Co,860,Overdue,Disputed line item\nAP,Bill-811,Metro IT,820,Entered,Bank line is 828\nAP,Bill-819,North Tools,2450,Possible duplicate,Imported twice\nAP,Bill-825,Green Office,680,Ready,Supplier emailed new bank details"},
    {"id":"bank","title":"Xero and JAX bank-feed exceptions","kind":"csv","content":"bank_line,amount,suggestion,issue\nBL01,2200,Match BL-301,Customer receipt needs evidence check\nBL02,828,Match Bill-811,Bill is 820\nBL03,5000,Possible transfer,Internal-transfer evidence incomplete\nBL04,95,Prediction subscription,Unknown business purpose"},
    {"id":"gst_payroll","title":"GST and payroll exception file","kind":"document","content":"GST: software renewal has different invoice presentation from historical months; imported-goods item has unclear treatment; bank fee carries an unexpected GST code. Payroll: one timesheet lacks manager approval; one backdated pay increase is awaiting approval; new bank details arrived by email; employee asks a tax question. VA prepares evidence only. Authorised finance/payroll owners decide treatment."},
    {"id":"month_end","title":"Month-end review notes","kind":"checklist","content":"Aged receivables checked; supplier duplicates checked; changed bank details independently verified; bank-feed/JAX exceptions resolved or listed; GST/BAS-sensitive items listed; payroll exceptions handed off; draft P&L and balance sheet reviewed for material anomalies; unresolved items included in reviewer handoff."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'xero-workflows-for-virtual-assistants';

update public.training_assessments a
set
  title = 'Maple Works MYOB Final Work Simulation',
  instructions = 'Work from one connected fictional Australian business. Use the Maple Works Australia evidence pack to make defensible administrative decisions across sales and purchases, bank-feed matching, GST/BAS-sensitive reporting, payroll/STP/Payday Super exceptions, and month-end reporting. Show what you completed, what you deliberately held, the evidence used, the authorised owner, and the next checkpoint. Do not force bank matches, invent accounting or GST treatment, add yourself as an STP declarer for convenience, authorise super or payments outside policy, or treat MYOB automation and reports as professional authority.',
  pass_score = 80,
  rubric = '[
    {"id":"evidence","label":"MYOB evidence accuracy","weight":20,"description":"Uses Maple Works source records accurately, preserves missing or conflicting evidence, and avoids invented finance facts."},
    {"id":"transactions","label":"Sales and purchases control","weight":15,"description":"Handles source documents, duplicates, overdue items, missing references, and approvals without taking commercial or accounting authority."},
    {"id":"banking","label":"Bank-feed matching judgment","weight":20,"description":"Verifies automatic matches, category suggestions, grouped settlements, and transfers against evidence before acceptance."},
    {"id":"tax_payroll","label":"GST/BAS, payroll, STP, and super boundaries","weight":20,"description":"Prepares exception evidence while leaving accounting, BAS, payroll, STP, Payday Super, payment, and statutory decisions with authorised owners.","hard_fail":true},
    {"id":"month_end","label":"Month-end QA","weight":15,"description":"Reviews report variances and unresolved items instead of treating generated reports as proof that the file is clean."},
    {"id":"handoff","label":"Accountant handoff","weight":10,"description":"Clearly separates completed administration, held work, decision owners, evidence, deadlines, and next checkpoints."}
  ]'::jsonb,
  resource_pack = '[
    {"id":"policy","title":"Maple Works Australia finance-control brief","kind":"policy","content":"Maple Works Australia is a fictional Australian business using MYOB Business. The VA may prepare sales and purchase records, source-document checks, bank-feed review evidence, payroll inputs, super exception tracking, and draft reports. Accounting/GST treatment, BAS declaration or lodgement, payroll/statutory decisions, STP declaration, Pay Super authorisation, payment release, and final reconciliation require authorised owners."},
    {"id":"transactions","title":"Sales and purchase exception file","kind":"csv","content":"type,reference,counterparty,amount,status,issue\nPurchase,901,North Tools,2450,Entered,Possible duplicate\nSale,440,Beacon Co,1800,Overdue,No follow-up note\nPurchase,914,Green Office,680,Draft,Reference missing\nSale,452,CoreBuild,950,Paid,Bank deposit may be grouped"},
    {"id":"bank","title":"MYOB banking exceptions","kind":"csv","content":"bank_item,amount,automation,issue\nMB01,950,Automatic match Sale-452,Deposit may combine customers\nMB02,89,Suggested software category,Weak source evidence\nMB03,3120,Suggested merchant settlement,Grouped settlement\nMB04,5000,Possible transfer,Destination account not confirmed"},
    {"id":"gst_payroll","title":"GST, payroll, STP, and super exceptions","kind":"document","content":"GST: draft report is materially above the prior quarter; imported-goods transaction has unclear treatment; prior-period adjustment question remains open. Payroll: employee changed super-fund details; another has an unusual allowance; a prior super contribution was rejected; MYOB prompts the VA to add themselves as STP declarer. VA prepares evidence and tracks deadlines only."},
    {"id":"month_end","title":"MYOB month-end review notes","kind":"checklist","content":"Sales/purchases tied to evidence; duplicates reviewed; bank-feed automatic/suggested matches checked; grouped and transfer items resolved or listed; GST/BAS variance documented; payroll/STP/Payday Super exceptions handed off; draft reports reviewed for material anomalies; unresolved items included in accountant handoff."}
  ]'::jsonb,
  is_published = true,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'myob-workflows-for-virtual-assistants';

update public.training_courses
set
  summary = case slug
    when 'xero-workflows-for-virtual-assistants' then 'Practical independent Xero workflow training for Australian VA finance administration, with hands-on AR/AP, JAX and bank-feed review, GST/BAS exception preparation, payroll/STP handoffs, month-end QA, and reviewer-ready evidence.'
    when 'myob-workflows-for-virtual-assistants' then 'Practical independent MYOB workflow training for Australian VA finance administration, with hands-on sales/purchases, bank-feed matching, GST/BAS exception preparation, payroll/STP/Payday Super handoffs, month-end QA, and accountant-ready evidence.'
  end,
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'xero-workflows-for-virtual-assistants',
  'myob-workflows-for-virtual-assistants'
);
