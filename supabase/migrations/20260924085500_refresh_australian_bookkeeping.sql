-- Refresh Australian Bookkeeping Administration for current 2026
-- ATO, TPB and Fair Work workflows. This course owns the Australia-specific
-- finance administration layer; Xero and MYOB courses own product execution.

update public.training_lessons
set
  title = 'Australian Bookkeeping Workflow, BAS-Service Boundaries, and Finance Controls',
  summary = 'Understand where routine bookkeeping administration ends and BAS, tax, payroll or statutory interpretation begins, using current TPB guidance and clear reviewer ownership.',
  content = $$[
    {"type":"heading","text":"Outcome: a controlled Australian bookkeeping workflow"},
    {"type":"list","items":[
      "Map source documents, AP, AR, bank activity, payroll, GST/BAS and month-end into one operating cycle",
      "Distinguish routine administrative bookkeeping from work that can become a BAS service",
      "Assign tax, BAS, payroll and statutory judgment to the authorised reviewer"
    ]},
    {"type":"heading","text":"Current 2026 role boundary"},
    {"type":"paragraph","text":"Current Tax Practitioners Board guidance says that entering data, coding transactions from instructions already provided, processing payments and preparing bank reconciliations are not BAS services when they do not require interpretation or application of a BAS provision. By contrast, working out or advising on BAS-related liabilities or obligations, dealing with the ATO for a client on BAS matters, and payroll work that interprets taxation law can be BAS services. The practical rule for a VA is to prepare accurate records and exceptions under the client's approved rules, then route interpretation and declarations to the registered or otherwise authorised owner."},
    {"type":"heading","text":"Workflow: finance administration from evidence to review"},
    {"type":"steps","items":[
      "Map the accounting system, source-document channels, bank feeds, payroll system and document archive.",
      "Identify who approves bills, payments, supplier changes, credits, write-offs, payroll inputs, GST coding, BAS review and lodgment.",
      "Document which coding rules are explicit and already approved for routine use.",
      "Create exception categories for missing evidence, duplicate risk, GST uncertainty, payroll uncertainty, supplier changes, reconciliation mismatches and prior-period corrections.",
      "Prepare transactions and reconciliations from source evidence without inventing treatment.",
      "Keep reviewer questions separate from routine completed work.",
      "Do not submit declarations, contact the ATO as the client's BAS representative, or make a tax/BAS conclusion merely because the software permits it.",
      "Finish each cycle with a reviewer-ready handoff showing unresolved items, owners and deadlines."
    ]},
    {"type":"callout","title":"Software access is not professional authority","text":"A login can let you click a BAS, STP or payroll action. That does not determine whether you are authorised or registered to interpret the underlying obligation. Follow the client's role design and reviewer process."},
    {"type":"heading","text":"QA risks: bookkeeping role boundaries"},
    {"type":"list","items":[
      "Copying GST treatment from a similar transaction with no approved rule",
      "Treating a software suggestion as tax or accounting authority",
      "Submitting a BAS or STP declaration under another person's credentials",
      "Giving the client advice on withholding, super or GST obligations from your own judgment",
      "Hiding exceptions to make the month-end screen look clean"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A client says, 'You have full accounting access now, please handle the books and lodge whatever is due.' Build the authority map and identify which tasks you can prepare administratively, which require an approved rule, and which must go to the BAS/tax/payroll owner."},
    {"type":"heading","text":"Ready check: Australian bookkeeping controls"},
    {"type":"list","items":[
      "Know who owns each judgment.",
      "Work from evidence and approved rules.",
      "Keep exceptions visible.",
      "Do not confuse system permission with professional authority."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-bookkeeping-workflow-gst-bas-and-role-boundaries'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian Source Documents, Tax Invoices, and GST-Sensitive Evidence',
  summary = 'Build reliable transaction evidence from invoices, bills, receipts, statements and payment records, using current Australian tax-invoice and record-retention rules without inventing missing GST treatment.',
  content = $$[
    {"type":"heading","text":"Outcome: evidence that survives review"},
    {"type":"list","items":[
      "Identify the source document and entity behind each transaction",
      "Detect duplicates, incomplete tax invoices and conflicting evidence",
      "Preserve records long enough for the client's tax and business obligations"
    ]},
    {"type":"heading","text":"Australian evidence context"},
    {"type":"paragraph","text":"ATO guidance requires GST records to support the income, expenses and GST amounts reported or claimed, and generally requires GST records to be kept for five years. Tax invoices have specific information requirements. For larger invoices, buyer identity requirements become more important. The VA's job is to recognise missing evidence and route it for correction or reviewer decision, not manufacture a compliant document."},
    {"type":"heading","text":"Workflow: source-document QA"},
    {"type":"steps","items":[
      "Identify whether the source is a supplier bill, sales invoice, receipt, bank record, credit note, statement or other evidence.",
      "Confirm the correct business entity and counterparty.",
      "Search invoice number, amount, supplier/customer and date for duplicate or reissued-document risk.",
      "Check the document includes the fields required by the client's approved Australian tax-invoice checklist.",
      "For higher-value tax invoices, confirm the required recipient identification is present under the client's checklist.",
      "Preserve the original document or approved digital record and link it to the transaction.",
      "Do not infer GST merely from the total or from a previous supplier transaction.",
      "Create an exception for missing ABN/business identity, unclear GST, unreadable pages, mismatched entity, foreign-currency treatment, missing approval evidence or other material gaps."
    ]},
    {"type":"callout","title":"Fix the evidence, not the document","text":"Do not alter a supplier invoice, add an ABN yourself, change the GST amount or create a replacement source document. Request corrected evidence or hand the issue to the reviewer."},
    {"type":"heading","text":"QA risks: source documents"},
    {"type":"list","items":[
      "Entering the same supplier bill from both email and upload",
      "Using the payment date as the invoice date without an approved rule",
      "Claiming GST from an incomplete document because the amount looks familiar",
      "Replacing originals with screenshots that lose context",
      "Attaching a document to the wrong entity",
      "Deleting the audit trail after a correction"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"You receive two PDFs with the same supplier, invoice number and amount but different filenames. A separate invoice over $1,000 shows the supplier correctly but does not identify the buying entity. Show the duplicate check and evidence exception you create before any GST-sensitive processing."},
    {"type":"heading","text":"Ready check: source evidence"},
    {"type":"list","items":[
      "Evidence first.",
      "Search before creating.",
      "Preserve originals.",
      "Escalate incomplete tax evidence."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'source-documents-invoices-bills-receipts-and-data-quality'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian AP Controls, Supplier Verification, and Payment Preparation',
  summary = 'Run supplier bills from receipt to approved payment while separating preparation from authorisation, protecting bank-detail changes and keeping credits, disputes and cash-flow decisions visible.',
  content = $$[
    {"type":"heading","text":"Outcome: a controlled accounts-payable queue"},
    {"type":"list","items":[
      "Track every bill from evidence through approval and payment",
      "Use independent verification for supplier bank-detail changes",
      "Keep payment preparation separate from payment authorisation"
    ]},
    {"type":"heading","text":"Workflow: accounts payable"},
    {"type":"steps","items":[
      "Capture the bill from approved source evidence and check for duplicates.",
      "Confirm supplier identity, invoice details, due date, purchase/order reference and approval owner.",
      "Route coding or GST questions that are outside explicit approved rules.",
      "Track credits, disputes and duplicate-looking charges before preparing payment.",
      "For new or changed bank details, use the client's independent verification process rather than trusting the change request itself.",
      "Build the payment batch/list from approved bills only.",
      "Keep the person preparing the batch separate from the authoriser where the client's control design requires it.",
      "Do not choose which suppliers to delay or prioritise unless the business owner has delegated that cash-flow decision.",
      "Record authoritative payment evidence after release and keep failed/rejected payments in the exception queue."
    ]},
    {"type":"callout","title":"A changed bank account is a control event","text":"An emailed bank-detail change is not enough by itself. Use an independently sourced verification method defined by the client before the new details enter a payment workflow."},
    {"type":"heading","text":"QA risks: AP and payments"},
    {"type":"list","items":[
      "Paying a duplicate invoice",
      "Accepting new bank details from the same email that requested the change",
      "Marking a bill paid before evidence exists",
      "Ignoring a supplier credit",
      "Using another person's login to bypass approval",
      "Making personal cash-flow priority decisions"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A long-term supplier sends new bank details one day before a $14,800 payment. The invoice is approved and due. Build the verification hold, payment-batch status and owner handoff without delaying unrelated approved bills."},
    {"type":"heading","text":"Ready check: AP controls"},
    {"type":"list","items":[
      "Verify supplier changes independently.",
      "Separate preparation and approval.",
      "Use evidence for paid status.",
      "Keep disputes and failed payments visible."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'accounts-payable-approvals-and-payment-preparation'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian AR, Credits, Disputes, and Debtor Follow-Up',
  summary = 'Keep approved customer invoicing and collections moving while checking payment evidence, separating disputes from ordinary overdue debt, and routing credits, write-offs and payment plans to authorised decision makers.',
  content = $$[
    {"type":"heading","text":"Outcome: an evidence-based receivables queue"},
    {"type":"list","items":[
      "Issue invoices only from approved billing data",
      "Follow current outstanding balances without chasing paid or disputed items incorrectly",
      "Separate routine reminders from concessions and accounting decisions"
    ]},
    {"type":"heading","text":"Workflow: accounts receivable"},
    {"type":"steps","items":[
      "Confirm the invoice is ready from approved goods/service, customer, price and reference data.",
      "Check invoice date, due date, recipient details and approved GST treatment before issue.",
      "Record delivery through the approved channel.",
      "Before follow-up, check current payment status, bank/reconciliation exceptions, credit notes and dispute notes.",
      "Use the client's approved reminder cadence and tone for undisputed overdue balances.",
      "For a customer dispute, record the disputed item, reason, evidence, owner and promised response time instead of sending the normal reminder sequence.",
      "Route credits, refunds, write-offs, payment plans, collection escalation and changed terms to authorised staff.",
      "Record customer promises and next follow-up dates."
    ]},
    {"type":"callout","title":"Collections admin is not debt-policy authority","text":"Do not grant an instalment plan, waive fees, create a credit or write off a balance merely to clear aged receivables. Prepare the facts and get the authorised decision."},
    {"type":"heading","text":"QA risks: AR and debtor follow-up"},
    {"type":"list","items":[
      "Chasing an invoice already paid but not reconciled",
      "Sending an ordinary reminder on a documented dispute",
      "Changing due dates after issue without authority",
      "Creating a credit to make an aged account disappear",
      "Failing to record a promise to pay",
      "Giving a customer tax or accounting explanations you are not authorised to provide"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Customer A says they paid yesterday and gives a bank reference. Customer B disputes one line. Customer C asks for three instalments. Build three different AR next actions and identify which decisions require approval."},
    {"type":"heading","text":"Ready check: receivables"},
    {"type":"list","items":[
      "Check payment before chasing.",
      "Separate disputes from ordinary overdue debt.",
      "Record promises.",
      "Keep concessions authorised."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'accounts-receivable-invoicing-credits-and-debtor-follow-up'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian Bank Reconciliation Exceptions and GST Review Handoff',
  summary = 'Prepare bank and ledger matches from evidence, distinguish transfers and duplicates, and create reviewer-ready GST-sensitive exceptions instead of accepting software suggestions just to reach zero.',
  content = $$[
    {"type":"heading","text":"Outcome: a reconciliation that explains every exception"},
    {"type":"list","items":[
      "Match bank activity to the correct accounting evidence",
      "Recognise transfers, duplicates, unknown transactions and amount mismatches",
      "Create GST/accounting questions without inventing treatment"
    ]},
    {"type":"heading","text":"Workflow: reconciliation preparation"},
    {"type":"steps","items":[
      "Read the bank line amount, date, payee/reference and available bank evidence.",
      "Search the ledger for an exact or plausible approved match.",
      "Compare amount, counterparty, invoice/bill reference and prior transaction history.",
      "Check whether the bank line could be a transfer, split payment, batch, refund, duplicate import or payroll/super item.",
      "Apply a documented routine bank rule only when its conditions are clearly met.",
      "Do not create an expense, transfer or GST code simply to clear the feed when the purpose is uncertain.",
      "Create an exception note with the bank line, possible evidence, mismatch and reviewer question.",
      "After the reviewer resolves it, preserve the decision trail."
    ]},
    {"type":"callout","title":"Zero unreconciled is not the goal if the evidence is wrong","text":"A clean dashboard is not evidence of a correct reconciliation. Leave uncertain items open with a useful note rather than forcing a match."},
    {"type":"heading","text":"QA risks: bank reconciliation"},
    {"type":"list","items":[
      "Accepting every automated match",
      "Treating a similar amount as proof",
      "Reconciling both sides of a duplicate import",
      "Calling an unknown payment personal without review",
      "Misclassifying an internal transfer as income or expense",
      "Changing GST treatment to make reports balance"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A $2,450 bank payment resembles a supplier bill for $2,405, a $5,000 line may be an internal transfer, and a $95 recurring software charge has no source document. Build the reconciliation exception list and state what you refuse to create from assumption."},
    {"type":"heading","text":"Ready check: reconciliation exceptions"},
    {"type":"list","items":[
      "Match from evidence.",
      "Treat software suggestions as suggestions.",
      "Leave unclear items open.",
      "Give the reviewer a specific question."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'bank-reconciliation-preparation-and-exception-management'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Payroll, STP, Payday Super, Leave, and Record-Keeping Handoffs',
  summary = 'Prepare payroll inputs and exception evidence for the post-1 July 2026 environment, including Payday Super, STP and Fair Work record obligations, while keeping statutory interpretation and declarations with authorised payroll/BAS owners.',
  content = $$[
    {"type":"heading","text":"Outcome: a 2026-ready payroll administration handoff"},
    {"type":"list","items":[
      "Prepare accurate employee, timesheet, leave and pay-change inputs",
      "Recognise current Payday Super and STP operational checkpoints",
      "Preserve Fair Work payroll records and corrections without rewriting history"
    ]},
    {"type":"heading","text":"Current 2026 payroll context"},
    {"type":"paragraph","text":"Payday Super started on 1 July 2026. Current ATO guidance requires super guarantee to be paid each payday and generally received by the employee's fund within seven business days, with the current SG rate at 12% of qualifying earnings. The new environment also affects STP reporting of qualifying earnings and super liability. Fair Work requires employers to provide pay slips within one working day of pay day and to keep required employee time and wage records for seven years."},
    {"type":"heading","text":"Workflow: payroll input and exception control"},
    {"type":"steps","items":[
      "Collect approved timesheets, leave, allowances, commissions, deductions, starters/leavers and employee changes by the payroll cut-off.",
      "Check employee identity, effective date, source approval and completeness.",
      "Separate routine data preparation from decisions about award interpretation, overtime entitlement, PAYG withholding, qualifying earnings, super treatment, leave entitlement or termination treatment.",
      "Build an exception list for conflicting hours, missing approvals, unusual deductions, disputed overtime, super-fund errors, returned super payments or changed employee details.",
      "Check that the payroll owner has the information needed for STP and Payday Super processing under the business's current system.",
      "Track failed or returned super contributions as unresolved exceptions rather than treating payment initiation as completion.",
      "Preserve pay records and pay-slip evidence under the employer's record process.",
      "If correcting a payroll record, preserve the correction reason and audit trail rather than silently overwriting the original history.",
      "Leave STP declarations, statutory interpretations, SGC matters and other BAS-service judgments with the authorised payroll/BAS owner."
    ]},
    {"type":"callout","title":"Payday Super makes failed payments time-sensitive","text":"A super payment instruction is not the same as a contribution reaching the employee's fund. Keep rejected or returned contributions visible immediately so the authorised owner can act within the current timing rules."},
    {"type":"heading","text":"QA risks: payroll and super"},
    {"type":"list","items":[
      "Changing overtime because the amount looks high",
      "Choosing a super treatment from memory",
      "Assuming a payment is complete because the batch was sent",
      "Submitting an STP declaration under another person's authority",
      "Deleting a corrected payroll record instead of preserving the audit trail",
      "Sending payroll data through insecure channels"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Payroll is due today. One employee disputes overtime, one employee's super contribution was returned, and a new employee's fund details are incomplete. Build the payroll exception handoff, identify what can proceed administratively and state which statutory decisions you do not make."},
    {"type":"heading","text":"Ready check: payroll administration"},
    {"type":"list","items":[
      "Use approved payroll inputs.",
      "Keep Payday Super exceptions visible.",
      "Preserve seven-year employee records.",
      "Route statutory judgments and declarations."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'payroll-stp-super-and-leave-administration-handoffs'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian Month-End, BAS Pack, and Qualified Reviewer Handoff',
  summary = 'Assemble a month-end and BAS review pack that shows source-evidence gaps, AP/AR exceptions, unreconciled bank items, GST-sensitive questions, payroll/STP/super issues and material report movements without making the final accounting or tax decisions.',
  content = $$[
    {"type":"heading","text":"Outcome: a reviewer-ready Australian month-end pack"},
    {"type":"list","items":[
      "Close routine bookkeeping preparation without hiding unresolved items",
      "Prepare GST/BAS-sensitive evidence and questions",
      "Give the bookkeeper, BAS agent, accountant or business owner a decision-ready handoff"
    ]},
    {"type":"heading","text":"Australian BAS context"},
    {"type":"paragraph","text":"For small businesses using Simpler BAS, the core GST labels are G1 total sales, 1A GST on sales and 1B GST on purchases. Not every business uses the same BAS profile, and the VA should not assume a label or GST treatment from the transaction description alone. TPB guidance also makes an important distinction: routine data entry and bank reconciliation preparation can be administrative, while interpreting BAS obligations or advising the client can become a BAS service."},
    {"type":"heading","text":"Workflow: month-end and BAS review preparation"},
    {"type":"steps","items":[
      "Confirm the period cut-off and reviewer deadline.",
      "Check missing source documents and duplicate-risk transactions.",
      "Review AP for unapproved bills, supplier credits, failed payments and changed bank details.",
      "Review AR for unapplied receipts, overdue items, credits, disputes and write-off requests.",
      "Prepare unreconciled bank and transfer exceptions.",
      "Prepare GST-sensitive questions with source evidence and the current coding, without changing treatment just to make the report look right.",
      "Include payroll/STP/Payday Super exceptions and unresolved employee changes.",
      "Run the approved draft reports and flag material or unusual movements for reviewer attention.",
      "Provide a clear open-items list: item, amount if known, evidence, current treatment, question, owner and deadline.",
      "After reviewer decisions, update routine records only within approved authority and preserve the review trail."
    ]},
    {"type":"callout","title":"The pack supports the BAS decision; it does not replace it","text":"A VA can make the evidence complete and the questions excellent. The authorised reviewer remains responsible for the GST/BAS interpretation, adjustments, declarations and lodgment."},
    {"type":"heading","text":"QA risks: month-end and BAS prep"},
    {"type":"list","items":[
      "Changing an unusual GST code without reviewer approval",
      "Writing off old receivables to improve the aged report",
      "Reclassifying transactions solely to make a ratio look normal",
      "Ignoring an unreconciled transfer because totals still balance",
      "Leaving payroll/super exceptions outside the month-end handoff",
      "Sending a report with no explanation of material movements"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"Month-end shows three unreconciled bank lines, an unusual GST code on imported goods, a duplicate-looking bill, a payroll overtime dispute, one returned super contribution and a material expense variance. Build the BAS/month-end review pack without deciding the GST or payroll treatment."},
    {"type":"heading","text":"Ready check: month-end review"},
    {"type":"list","items":[
      "Cut off the period clearly.",
      "Keep unresolved evidence visible.",
      "Ask specific reviewer questions.",
      "Preserve decisions and audit trail."
    ]}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'month-end-preparation-reports-and-accountant-handoff'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_lessons
set
  title = 'Australian Bookkeeping Month-End and BAS Handoff Simulation',
  summary = 'Run a realistic Australian finance-admin close across source evidence, AP, AR, bank reconciliation, GST-sensitive exceptions, Payroll/STP/Payday Super and the final qualified-review handoff without duplicating Xero or MYOB product training.',
  content = $$[
    {"type":"heading","text":"Simulation brief"},
    {"type":"paragraph","text":"You support a fictional Australian small business called Harbour Field Services. The business has a bookkeeper/BAS reviewer and uses accounting software, but this assessment is software-neutral. Your job is to make the finance records and exceptions review-ready without making the reviewer decisions."},
    {"type":"heading","text":"Month-end queue"},
    {"type":"list","items":[
      "Supplier bill A may be a duplicate.",
      "Supplier bill B is approved but the supplier emailed new bank details.",
      "A tax invoice over $1,000 does not identify the buying entity.",
      "Customer invoice C is overdue but the customer disputes one line.",
      "Bank line 1 is an unknown software charge with no source document.",
      "Bank line 2 may be an internal transfer.",
      "One transaction has an unusual GST code and missing supporting invoice.",
      "Payroll contains an overtime dispute.",
      "One super contribution was returned after payday.",
      "A material expense category is well above the prior month."
    ]},
    {"type":"heading","text":"Required outputs"},
    {"type":"list","items":[
      "A source-document and duplicate-risk exception list",
      "An AP approval/payment-control table including bank-detail verification",
      "An AR follow-up table separating ordinary overdue and disputed balances",
      "A bank-reconciliation exception list",
      "A GST/BAS review-question sheet",
      "A payroll/STP/Payday Super handoff",
      "A material-variance review note",
      "A final month-end/BAS pack listing every unresolved item, owner, deadline and evidence"
    ]},
    {"type":"heading","text":"Course boundary"},
    {"type":"paragraph","text":"Do not reproduce Xero or MYOB interface steps. This course tests Australia-specific bookkeeping administration and qualified-review handoffs. Xero and MYOB courses test product execution."},
    {"type":"heading","text":"Quality standard"},
    {"type":"list","items":[
      "Every transaction or exception points to source evidence.",
      "Supplier bank changes are independently verified before payment.",
      "Disputed AR follows a different path from ordinary collections.",
      "Bank items are not forced to zero from assumption.",
      "GST-sensitive questions are routed, not guessed.",
      "Payday Super and payroll exceptions remain visible and time-bound.",
      "BAS-service interpretation and declarations remain with the authorised reviewer.",
      "Every open item has an owner, deadline and specific question."
    ]},
    {"type":"scenario","title":"Final challenge","text":"Produce Harbour Field Services' final month-end pack for the BAS reviewer. The reviewer should be able to see what is clean, what is blocked, what evidence is missing and exactly which judgments they still need to make without reconstructing the books themselves."}
  ]$$::jsonb,
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-bookkeeping-composite-admin-simulation'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'australian-bookkeeping-administration')
  );

update public.training_assessments assessment
set
  title = 'Australian Bookkeeping Month-End and BAS Handoff Final Simulation',
  instructions = 'Complete the Harbour Field Services Australian bookkeeping simulation. Submit a source-document/duplicate-risk exception list, AP payment-control table, AR follow-up table, bank-reconciliation exception list, GST/BAS review-question sheet, payroll/STP/Payday Super handoff, material-variance note and final month-end/BAS pack. Work only from supplied evidence and approved rules. Do not invent GST treatment, decide BAS obligations, lodge BAS, provide tax advice, make payroll/award/super statutory interpretations, submit STP declarations, release unauthorised payments, change supplier bank details without independent verification, create unauthorised credits/write-offs or force bank transactions to reconcile.',
  rubric = $$[
    {"id":"evidence","label":"Source evidence and transaction integrity","weight":20,"description":"Detects duplicate and incomplete source records, preserves originals and links every transaction/exception to evidence."},
    {"id":"controls","label":"AP, AR and fraud-control execution","weight":15,"description":"Separates preparation from approval, independently verifies supplier changes, distinguishes disputes from routine collections and keeps concessions authorised."},
    {"id":"reconciliation","label":"Bank reconciliation and exception quality","weight":15,"description":"Uses evidence for matches, identifies transfers/duplicates/unknown items and refuses to force uncertain transactions to zero."},
    {"id":"gst","label":"GST/BAS review preparation and role boundary","weight":20,"description":"Builds specific GST/BAS questions and reviewer evidence without inventing treatment, advice, declarations or lodgment.","hard_fail":true},
    {"id":"payroll","label":"Payroll, STP and Payday Super handoff","weight":15,"description":"Captures payroll inputs and time-sensitive super exceptions while keeping statutory interpretation and declarations with authorised staff."},
    {"id":"handoff","label":"Month-end and reviewer handoff","weight":15,"description":"Produces a decision-ready pack with owners, deadlines, material movements, unresolved evidence and clear reviewer questions."}
  ]$$::jsonb,
  resource_pack = $$[
    {"id":"queue","title":"Harbour Field Services finance queue","kind":"csv","content":"item,status,issue\nBill A,Imported,Possible duplicate\nBill B,Approved,Supplier emailed new bank details\nBill C,Received,Tax invoice over $1,000 missing buyer identity\nInvoice C,Overdue,Customer disputes one line\nBank 1,Unmatched,Unknown software charge; no source document\nBank 2,Unmatched,Possible internal transfer\nGST item,Draft,Unusual GST code; invoice missing\nPayroll,Pending,Overtime dispute\nSuper,Exception,Contribution returned after payday\nExpense report,Draft,Material increase versus prior month"},
    {"id":"authority","title":"Australian bookkeeping authority matrix","kind":"policy","content":"VA may capture approved source records, code from explicit instructions, prepare AP/AR, payment lists, bank reconciliations, exception reports and draft reviewer packs. GST/BAS interpretation, BAS or tax advice, ATO representation, STP declarations, statutory payroll/super decisions, write-offs, credits outside delegation and final BAS lodgment remain with the appropriately authorised owner."},
    {"id":"payroll","title":"2026 payroll controls","kind":"policy","content":"Payday Super applies from 1 July 2026. Current workflow tracks super each payday and returned/failed contributions as urgent exceptions. Fair Work employee time and wage records are retained for 7 years and pay slips are issued within 1 working day of pay day. Statutory interpretation stays with authorised payroll/BAS staff."},
    {"id":"systems","title":"Course versus software boundary","kind":"policy","content":"Australian Bookkeeping Administration owns Australian controls, GST/BAS-sensitive evidence, payroll/super handoffs and reviewer packs. Xero Workflows and MYOB Workflows own product-specific transaction, bank, report and payroll execution."}
  ]$$::jsonb,
  pass_score = 80,
  is_published = true,
  updated_at = now()
from public.training_courses course
where assessment.course_id = course.id
  and course.slug = 'australian-bookkeeping-administration';

update public.training_courses
set
  summary = 'Australia-specific bookkeeping administration training for Filipino VAs covering BAS-service boundaries, source evidence, AP/AR controls, reconciliation exceptions, GST/BAS review preparation, 2026 Payroll/STP/Payday Super handoffs, month-end packs and qualified-review boundaries.',
  estimated_minutes = 240,
  review_requirement = 'editorial',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  status = 'published',
  published_at = coalesce(published_at, now()),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-bookkeeping-administration';
