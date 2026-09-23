-- Write the existing Bookkeeping Administration for Virtual Assistants course.
-- Course teaches administrative workflow support only and remains draft until review.

update public.training_courses
set
  summary = 'A practical bookkeeping-administration course for Virtual Assistants covering source documents, coding support, AP, payment preparation, AR, debtor follow-up, reconciliation preparation, month-end support, exception logs, and professional boundaries.',
  estimated_minutes = 300,
  status = 'draft',
  published_at = null,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '20000000-0000-4000-8000-000000000006';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Bookkeeping administration supports the process; it does not replace professional judgment"},{"type":"paragraph","text":"A Bookkeeping Administration Virtual Assistant may collect source documents, enter approved information, prepare payment queues, follow up invoices, support reconciliations, maintain records, and hand exceptions to the client, bookkeeper, accountant, payroll specialist, or other authorised professional. The exact boundary depends on the client’s system, country, and professional requirements."},{"type":"heading","text":"Administrative tasks may include"},{"type":"list","items":["Collecting invoices, bills, receipts, and statements","Entering or preparing transactions using approved rules","Matching source documents to records","Maintaining supplier and customer details","Preparing payment or collection lists for approval","Following up missing documents","Preparing reconciliation evidence","Producing exception lists and handoffs"]},{"type":"heading","text":"Do not cross into unsupported advice"},{"type":"list","items":["Do not decide tax treatment when the approved rule does not clearly cover the transaction.","Do not advise a client what they should claim, deduct, register, report, or file.","Do not change payroll, tax, statutory, or accounting settings without authorised instruction.","Do not create or alter financial evidence to make records appear complete.","Do not represent yourself as an accountant, bookkeeper, tax adviser, payroll specialist, or other regulated professional unless you actually hold the required role and credentials."]},{"type":"callout","title":"When uncertain, preserve the evidence","text":"A clean exception with the source document attached is better than a confident but unsupported coding decision."},{"type":"scenario","title":"Unclear expense","text":"A receipt could reasonably belong to two different expense categories and the client’s coding guide does not cover it. Describe what you can record, what evidence you should preserve, and who should make the coding decision."},{"type":"heading","text":"The standard"},{"type":"paragraph","text":"Good bookkeeping administration makes financial records easier to review, trace, and trust. It does not hide uncertainty or expand the VA’s authority simply to clear a queue."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000011';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Financial access requires stronger controls"},{"type":"paragraph","text":"Bookkeeping systems may contain bank details, payroll information, supplier records, customer balances, identity information, and commercially sensitive data. Use the minimum access required and follow the client’s approved security process."},{"type":"heading","text":"Access habits"},{"type":"list","items":["Use named user accounts rather than shared credentials where the client’s system supports them.","Use multi-factor authentication when required.","Do not store banking credentials in personal notes or messages.","Do not download complete financial datasets unless the work requires it.","Keep exported reports and source documents only in approved locations.","Remove access or local copies when the client’s process requires it."]},{"type":"heading","text":"Protect the audit trail"},{"type":"steps","items":["Enter or attach the original source document.","Do not overwrite notes that explain a correction.","Use the system’s reversal, void, credit, or correction workflow when instructed rather than deleting history.","Record approval references for sensitive changes.","Keep the reason for an exception or adjustment visible.","Escalate unexplained edits or missing evidence."]},{"type":"callout","title":"Never alter evidence to make a transaction fit","text":"Changing invoice dates, amounts, supplier details, bank records, or supporting documents to make reconciliation easier destroys trust and may create serious risk."},{"type":"scenario","title":"Changed bank details","text":"A supplier emails new bank details shortly before a payment run. The email looks genuine, but the client’s process requires independent verification. Explain what you should do and why you should not update the payment details immediately."},{"type":"heading","text":"Segregation matters"},{"type":"paragraph","text":"Where possible, the person preparing a payment should not be the only person who can approve and release it. Follow the client’s approval controls rather than asking for broader access to make the process faster."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000012';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Source documents are the evidence behind the record"},{"type":"paragraph","text":"Invoices, bills, receipts, credit notes, statements, purchase orders, payment confirmations, and contracts can support bookkeeping entries. A VA’s job is often to make sure the correct evidence is collected, attached, readable, and linked to the correct transaction or period."},{"type":"heading","text":"Basic checks"},{"type":"list","items":["Correct supplier or customer","Document date","Invoice or reference number","Amount and currency","Description","Payment terms when relevant","Tax or registration information required by the client’s workflow","Duplicate indicators","Matching purchase order or approval when required"]},{"type":"heading","text":"Document workflow"},{"type":"steps","items":["Receive or locate the source document.","Check it belongs to the correct entity.","Check for an existing copy or duplicate entry.","Save or attach it in the approved system.","Link it to the relevant record.","Flag missing, inconsistent, or unreadable information.","Record the exception instead of guessing."]},{"type":"callout","title":"A scan is not automatically valid evidence","text":"If the document is incomplete, altered, unreadable, or does not match the transaction, preserve it but flag the problem rather than treating it as resolved."},{"type":"scenario","title":"Duplicate-looking supplier bill","text":"Two supplier bills have the same amount and date but different invoice numbers. Explain the checks you would make before marking one as a duplicate or entering both."},{"type":"heading","text":"Organise for review"},{"type":"paragraph","text":"The reviewer should be able to move from the bookkeeping record to the supporting document without searching through email threads or personal folders."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000021';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Coding is a controlled classification process"},{"type":"paragraph","text":"Businesses use accounts or categories to group transactions for reporting. A VA can apply a documented coding rule, but should not invent tax or accounting treatment when the source, account, or policy is unclear."},{"type":"heading","text":"Use the client’s approved coding source"},{"type":"list","items":["Chart of accounts","Written coding guide","Prior reviewed transaction","Bookkeeper or accountant instruction","Approved supplier default","System rule already documented and reviewed"]},{"type":"heading","text":"Do not rely blindly on history"},{"type":"paragraph","text":"A previous transaction can be useful evidence, but history may contain mistakes or the nature of the transaction may have changed. Compare the source document and approved rule before copying a category."},{"type":"heading","text":"When to ask"},{"type":"list","items":["A new supplier has no approved category.","The purchase contains several different types of expense.","The transaction could be personal or business-related.","Tax treatment is unclear.","The source document conflicts with the system default.","A recurring transaction suddenly changes amount or description materially."]},{"type":"callout","title":"Coding questions should be reviewable","text":"Instead of asking ''What category?'', provide the supplier, amount, date, description, source document, likely existing pattern, and the exact point of uncertainty."},{"type":"scenario","title":"Mixed supplier purchase","text":"A supplier invoice includes office supplies, a subscription, and equipment on one invoice. The client’s prior records classify this supplier differently depending on the purchase. Prepare the coding question for the reviewer without deciding the treatment yourself."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000022';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Accounts payable starts before payment"},{"type":"paragraph","text":"A supplier bill should normally move through capture, verification, approval, scheduling, payment, and record completion. An AP VA helps make each stage visible so the business does not pay duplicates, unauthorised charges, or incorrect bank details."},{"type":"heading","text":"Bill checks"},{"type":"list","items":["Supplier identity","Invoice number","Invoice date","Amount and currency","Purchase order or approved request when required","Receipt of goods or services when the process requires it","Correct entity","Due date","Duplicate check","Bank details handled under the client’s verification policy"]},{"type":"heading","text":"Approval workflow"},{"type":"steps","items":["Enter or capture the bill.","Attach the supporting document.","Route to the correct approver.","Track approval status.","Resolve exceptions before payment preparation.","Schedule according to approved due-date and cash-flow rules.","Keep the approval evidence attached or referenced."]},{"type":"callout","title":"An invoice email is not approval","text":"The fact that a supplier sent a bill does not prove the client authorised the purchase or the payment."},{"type":"scenario","title":"Urgent supplier invoice","text":"A supplier says payment must be made today to avoid service suspension. The invoice is legitimate, but the normal approver is unavailable and the bill has not been approved. Explain what you should prepare, who must decide, and what you should not do."},{"type":"heading","text":"Exception examples"},{"type":"list","items":["Duplicate invoice","Wrong entity","Missing approval","Amount exceeds purchase order","Bank-detail change","Credit note expected","Supplier account disputed","Goods or service not received"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000031';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Preparing a payment is not the same as authorising it"},{"type":"paragraph","text":"A VA may prepare a payment batch, payment schedule, or approval list when the client allows it. The release of funds should follow the client’s approval controls. Do not bypass approval because the payment is urgent or the supplier is pressuring you."},{"type":"heading","text":"Payment preparation checklist"},{"type":"steps","items":["Confirm bill approval.","Confirm amount and due date.","Check for duplicates or credits.","Confirm bank details under the client’s verification process.","Prepare the payment in the approved system.","Attach or link the supporting evidence.","Send the batch to the authorised approver.","Record the payment reference after release."]},{"type":"heading","text":"High-risk signals"},{"type":"list","items":["Bank details changed by email","New overseas account","Urgent request outside the normal process","Supplier asks to split payment unexpectedly","Invoice amount differs from approved work","Approver asks you to use their credentials","Payment request arrives from an unusual email domain"]},{"type":"callout","title":"Never verify a bank change using the same message that requested it","text":"Follow the client’s independent verification process, such as a known phone number or established vendor contact. Do not use contact details supplied only in the suspicious change request unless the process explicitly permits it."},{"type":"scenario","title":"Payment batch","text":"You prepare 22 supplier payments. One invoice has new bank details, one has a matching credit note, and one has no approval record. Explain which items should remain out of the final approval batch and what evidence the approver needs."},{"type":"heading","text":"Supplier follow-up"},{"type":"paragraph","text":"If payment is delayed, communicate only what is accurate and authorised. Do not promise a payment date if approval or cash release has not happened."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000032';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Accounts receivable keeps customer balances visible"},{"type":"paragraph","text":"AR administration may include preparing approved invoices, sending them, recording credits, matching payments, monitoring balances, and following up overdue accounts. The work should preserve the commercial terms already agreed by the business."},{"type":"heading","text":"Invoice preparation checks"},{"type":"list","items":["Correct customer and legal entity","Approved product, service, quantity, or milestone","Price and currency","Purchase order or reference when required","Invoice date and payment terms","Delivery details required by the client","Correct contact","Supporting timesheet, acceptance, or milestone evidence when needed"]},{"type":"heading","text":"Credits and adjustments"},{"type":"paragraph","text":"A credit note or write-off changes the customer balance. Follow the client’s approval rule. Do not create a credit just because a customer disputes an invoice."},{"type":"heading","text":"Payment status"},{"type":"steps","items":["Check the bank or payment source under the approved process.","Match the payment to the customer and invoice.","Record partial payments accurately.","Leave unmatched amounts visible for review.","Update the customer balance.","Preserve the payment reference."]},{"type":"callout","title":"Do not force-match money","text":"If the payment amount does not match the invoice and there is no clear approved reason, leave an exception rather than making the books balance artificially."},{"type":"scenario","title":"Partial customer payment","text":"A customer pays 80% of an invoice with no note. Explain how you would record the payment, what remains outstanding, and what you would ask before creating any discount or credit."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000041';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Debtor follow-up should be accurate and professional"},{"type":"paragraph","text":"Overdue-account follow-up reminds customers of agreed obligations and helps the business identify disputes or payment problems early. A VA should follow the client’s approved cadence, tone, escalation path, and commercial authority."},{"type":"heading","text":"Before contacting the customer"},{"type":"list","items":["Confirm the invoice is actually overdue.","Check whether payment was received but not matched.","Check for a dispute, credit note, cancellation, or prior agreement.","Confirm the correct customer contact.","Review the last communication.","Know what you are authorised to say about extensions, fees, payment plans, or service suspension."]},{"type":"heading","text":"Useful reminder structure"},{"type":"steps","items":["State the invoice and due date.","State the current amount showing as outstanding.","Attach or link the invoice if appropriate.","Ask whether payment has been made or there is an issue to resolve.","Give the correct contact or next step.","Record the response and follow-up date."]},{"type":"callout","title":"Do not threaten consequences you cannot enforce","text":"Do not mention legal action, collections, penalties, service suspension, or account closure unless the client’s approved process and authority clearly allow that communication."},{"type":"scenario","title":"Long-overdue invoice with dispute","text":"A customer is 30 days overdue but replies that the work was incomplete. The CRM contains an unresolved service ticket. Explain how you would pause or route the collection workflow without deciding the commercial dispute yourself."},{"type":"heading","text":"Escalation"},{"type":"paragraph","text":"Disputes, hardship requests, payment plans, legal language, or material account decisions should move to the client’s designated owner rather than being improvised by the VA."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000042';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Reconciliation preparation compares records to external evidence"},{"type":"paragraph","text":"Bank reconciliation checks whether transactions in the bookkeeping system correspond to transactions on the bank or payment account. A VA may support the preparation and exception review using approved rules, while unclear accounting treatment remains with the authorised reviewer."},{"type":"heading","text":"Preparation workflow"},{"type":"steps","items":["Confirm the correct account and period.","Import or obtain the approved bank data.","Check opening and closing dates.","Match clear transactions to existing records.","Identify duplicates, missing entries, timing differences, fees, transfers, or unknown transactions.","Attach source documents where available.","Create an exception list for unresolved items.","Do not force the reconciliation by creating unsupported entries."]},{"type":"heading","text":"Common exceptions"},{"type":"list","items":["Payment exists in bank but not books","Book entry exists but has not cleared bank","Duplicate entry","Bank fee","Transfer between accounts","Customer payment with unclear invoice","Supplier payment amount differs from bill","Unknown transaction","Refund or reversal"]},{"type":"callout","title":"Zero difference does not prove correct accounting","text":"A reconciliation can mathematically balance while transactions are coded incorrectly. Matching the bank is one control, not the entire review."},{"type":"scenario","title":"Three unreconciled items","text":"The bank shows a subscription charge with no bill, a customer payment with no reference, and a transfer between two company accounts. Prepare the exception notes and explain what evidence or review each item needs."},{"type":"heading","text":"Reviewer handoff"},{"type":"paragraph","text":"A strong reconciliation handoff shows the period, accounts reviewed, matched items, unresolved exceptions, supporting evidence, and any decision that requires the bookkeeper or accountant."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000051';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Month-end is a controlled handoff, not a last-minute cleanup"},{"type":"paragraph","text":"Month-end support helps the reviewer receive complete, organised records for the period. The exact close process varies by client, but the VA can prepare source documents, exception lists, outstanding invoices, reconciliation status, and operational evidence."},{"type":"heading","text":"Possible month-end checklist"},{"type":"list","items":["All bank and payment feeds imported through the period end","Source documents collected","Supplier bills entered or exceptions listed","Customer invoices and credits updated","Reconciliation preparation complete","Unmatched or unusual transactions listed","Payroll documents stored and handed to the authorised payroll process","Outstanding approvals identified","Reviewer questions consolidated"]},{"type":"heading","text":"Payroll boundary"},{"type":"paragraph","text":"Payroll data is highly sensitive and statutory treatment can be complex. Follow the approved payroll workflow. Do not alter pay rates, deductions, statutory settings, tax treatment, entitlements, or payroll classifications without authorised instruction."},{"type":"heading","text":"Prepare the accountant or bookkeeper handoff"},{"type":"steps","items":["State the period.","Summarise what is complete.","List unresolved transactions.","Link source evidence.","Identify missing documents.","List approvals still outstanding.","Separate accounting or tax questions from routine admin follow-up.","Record who owns each open item."]},{"type":"callout","title":"Do not hide month-end exceptions to make the close look finished","text":"The reviewer needs to know what is incomplete. A clear exception list is part of a good close."},{"type":"scenario","title":"Month-end with missing data","text":"Three supplier receipts are missing, two customer payments are unmatched, and payroll has been processed by an external provider but the final reports are not uploaded. Build the handoff to the reviewer."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000052';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Financial reporting support begins with reliable inputs"},{"type":"paragraph","text":"A VA may prepare report packs, export standard reports, update cash or AR trackers, and summarise exceptions. The role is to present accurate information from approved sources, not to give accounting conclusions or business advice that requires professional judgment."},{"type":"heading","text":"Useful support outputs"},{"type":"list","items":["Accounts receivable ageing","Accounts payable due list","Cash or bank balance snapshot from approved accounts","Unreconciled transaction list","Missing document report","Overdue approval list","Month-end exception log","Standard system reports requested by the reviewer"]},{"type":"heading","text":"An exception log should include"},{"type":"list","items":["Date","Account or record","Amount","Issue","Source evidence","Action taken","Owner","Reviewer question","Next follow-up","Status"]},{"type":"heading","text":"Do not interpret beyond your role"},{"type":"paragraph","text":"You can report that overdue receivables increased or that a supplier balance does not match the statement. Do not automatically conclude why profitability, tax liability, cash flow, or financial performance changed unless the authorised reviewer has asked you to report a verified explanation."},{"type":"callout","title":"Reporting is not advice","text":"A dashboard or exported report can support a decision, but the VA should not present unsupported financial interpretation as professional analysis."},{"type":"scenario","title":"Weekly finance admin pack","text":"The owner asks for a weekly summary of unpaid customer invoices, supplier payments due, missing receipts, and reconciliation exceptions. Design the report structure and separate factual totals from questions that need the bookkeeper."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000061';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Final composite bookkeeping-administration simulation"},{"type":"paragraph","text":"This simulation combines AP, AR, source documents, coding questions, payment controls, reconciliation preparation, month-end support, and exception handoff. The company is fictional and built from common bookkeeping-administration patterns rather than any single client."},{"type":"scenario","title":"Cedar Lane Services","text":"Cedar Lane Services is closing the month. There are 18 supplier bills awaiting review, including one with new bank details and one duplicate-looking invoice. Four customer invoices are overdue; one customer disputes the work. The bank feed has three unmatched transactions. Two receipts are missing. Payroll was processed externally but the payroll report has not been uploaded. The owner wants all supplier payments prepared today."},{"type":"heading","text":"Part 1: Accounts payable"},{"type":"steps","items":["Identify which supplier bills can proceed to approval.","Explain how to handle the bank-detail change.","Investigate the duplicate-looking invoice.","Build the payment-preparation exception list.","State what the VA must not release or decide alone."]},{"type":"heading","text":"Part 2: Accounts receivable and reconciliation"},{"type":"list","items":["Prepare the overdue-customer follow-up priorities.","Explain how the disputed invoice should be routed.","Describe how to handle the three unmatched bank transactions.","List the evidence needed before forcing any match or adjustment."]},{"type":"heading","text":"Part 3: Month-end handoff"},{"type":"steps","items":["List the missing documents.","Record the missing payroll report.","Prepare the reviewer exception log.","Summarise what is complete and incomplete.","Identify every item that requires bookkeeping, accounting, payroll, tax, or owner judgment."]},{"type":"callout","title":"Assessment standard","text":"A strong answer protects the audit trail and approval controls while making the records easier to review. It does not guess tax treatment, bypass payment approval, hide missing evidence, or force a reconciliation to zero."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000006-0000-4000-8000-000000000062';

update public.training_assessments
set
  instructions = 'Complete the Cedar Lane Services composite bookkeeping-administration simulation. Review source documents, prepare AP and payment exceptions, handle AR follow-up, prepare reconciliation evidence, identify missing month-end records, and produce a reviewer handoff. Do not provide tax, accounting, payroll, statutory, or other professional advice. The assessment tests administrative control and work output rather than bookkeeping trivia.',
  is_published = false,
  updated_at = now()
where id = '23000000-0000-4000-8000-000000000006';
