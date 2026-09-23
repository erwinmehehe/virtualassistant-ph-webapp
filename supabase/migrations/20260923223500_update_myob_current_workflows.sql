-- Refresh the published MYOB training for current Australian workflows.
-- Focus: AI-assisted bank transaction matching and Payday Super from 1 July 2026.
-- This remains administrative training and does not expand a VA's tax, BAS,
-- payroll, super, payment, or statutory authority.

update public.training_lessons
set
  summary = 'MYOB bank feeds can automatically match or suggest matches, and current MYOB Business workflows can also use AI-driven category suggestions. A VA should verify the underlying transaction and keep uncertain items visible instead of treating automation as accounting authority.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Understand MYOB bank-feed matching, suggestions, and rules",
        "Recognize where current MYOB Business can use AI-driven category suggestions",
        "Prepare reconciliation exceptions without forcing transactions to clear"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"MYOB can match bank-feed transactions to existing records automatically, suggest possible matches, and apply approved bank rules. Current MYOB Business also supports AI-driven category suggestions in parts of the bank-transaction workflow. These features can reduce manual work, but they do not replace the business context or finance judgment needed to confirm what a transaction actually represents."
    },
    {
      "type":"heading",
      "text":"Core ideas"
    },
    {
      "type":"list",
      "items":[
        "An automatic match is a software workflow result, not evidence that the accounting treatment has been professionally reviewed.",
        "Exact amount and date can still hide duplicates, transfers, refunds, merchant settlements, grouped payments, payroll payments, bank fees, or the wrong entity.",
        "Rules can create or match transactions automatically, so incorrect rules can repeat the same error across future bank-feed items.",
        "AI-driven category suggestions can be useful for routine items, but a suggested category should be checked against source evidence and the client's approved coding workflow.",
        "Bank-feed matching and formal account reconciliation are related but separate steps."
      ]
    },
    {
      "type":"heading",
      "text":"A practical workflow"
    },
    {
      "type":"steps",
      "items":[
        "Confirm the correct MYOB product, business file, bank account, and reporting period.",
        "Review the bank-feed amount, date, description, reference, counterparty, and available source evidence.",
        "Check whether MYOB has automatically matched the item, suggested a match, applied a rule, or suggested a category.",
        "For an automatic or suggested match, confirm the related invoice, bill, payroll payment, transfer, receive-money, spend-money, or other source record actually represents the bank movement.",
        "For an AI-driven category suggestion, use it only when it agrees with approved business rules and the evidence. Do not invent a category to clear the queue.",
        "Check for duplicate records, grouped or split payments, timing differences, refunds, internal transfers, merchant deposits, and unfamiliar high-value transactions.",
        "Leave unclear, tax-sensitive, payroll-related, owner-related, or unusual transactions unresolved for the authorised finance reviewer.",
        "After the bank-feed work is correct, support the separate reconciliation process using the client's approved workflow and statement information."
      ]
    },
    {
      "type":"callout",
      "title":"Automation is not authority",
      "text":"Do not accept an automatic match, rule result, or AI category suggestion solely because MYOB is confident. If the business purpose, source record, tax treatment, transfer status, or counterparty is unclear, stop and route the item to the authorised finance reviewer."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Approving every automatic match without checking the source record",
        "Using a rule to hide a recurring exception",
        "Categorising an internal transfer as income or an expense",
        "Creating a new transaction when the matching invoice or bill already exists",
        "Treating a suggested category as tax or accounting advice",
        "Assuming a cleared bank-feed screen means the account has been fully reconciled"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"An Australian service business has four new bank-feed items in MYOB. One automatically matches a customer invoice, one is assigned an AI category based on prior history, one looks like an internal transfer, and one deposit may combine several customer payments. Explain the evidence you check, what can be handled administratively, what should remain unresolved, and what you hand to the finance reviewer."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Verify from evidence, not confidence scores.",
        "Use only approved bank rules and coding conventions.",
        "Keep uncertainty visible.",
        "Remember that matching and reconciliation are not the same thing."
      ]
    }
  ]$$::jsonb,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'banking-matching-and-reconciliation-preparation-in-myob'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'myob-workflows-for-virtual-assistants'
    )
  );

update public.training_lessons
set
  title = 'MYOB Payroll, STP, Payday Super, and Employee Admin Handoff',
  summary = 'MYOB supports payroll, STP, leave, and Pay Super workflows for Australian employers. Since 1 July 2026, Payday Super changes the timing of super payments, making approval, payment status, and exception handling even more important for VAs.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Understand the MYOB payroll and STP administration flow",
        "Recognize current Payday Super timing and Pay Super role boundaries",
        "Prepare employee and pay-run inputs without taking statutory authority"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"Payroll combines sensitive employee data, wages, tax withholding, super, leave, and statutory reporting. Since 1 July 2026, Australian employers generally need to make super guarantee contributions on payday, with contributions reaching employees' super funds within the required timeframe. MYOB's current Pay Super guidance separates users who can create a super payment from administrators or authorisers who can authorise it. A VA should support the workflow without self-authorising payroll, STP, super, or statutory decisions."
    },
    {
      "type":"heading",
      "text":"Core ideas"
    },
    {
      "type":"list",
      "items":[
        "STP sends payroll information to the ATO, and the person sending it must have the appropriate declarer authority.",
        "Payday Super changes when super payments are due, but it does not give a VA authority to decide qualifying earnings, employee eligibility, super treatment, or corrections.",
        "Current MYOB Pay Super roles distinguish payment creation from payment authorisation.",
        "Employee changes, pay items, super fund details, leave, termination data, and payroll categories can affect statutory output.",
        "Payroll and super exceptions should remain visible until an authorised payroll, finance, HR, accountant, BAS-agent, or client owner resolves them."
      ]
    },
    {
      "type":"heading",
      "text":"A practical workflow"
    },
    {
      "type":"steps",
      "items":[
        "Collect approved timesheets, leave, starter, leaver, allowance, deduction, reimbursement, and employee-change inputs.",
        "Check for missing approvals, unusual variances, duplicate inputs, or changes to bank or super details.",
        "Use only existing approved payroll categories and employee settings.",
        "Prepare the draft pay-run and an exception list for the authorised payroll reviewer.",
        "Confirm who is permitted to declare STP for the business. Do not add yourself as a declarer simply to complete the process.",
        "For super, prepare the administrative payment workflow only within the client's approved process and current MYOB role permissions.",
        "Do not authorise a Pay Super payment unless you are explicitly the authorised person under the business's approved controls and have the required authority outside the software.",
        "Track rejected, returned, delayed, or unmatched super payments as exceptions and escalate them promptly because Payday Super timing matters.",
        "Keep payroll and super evidence, reviewer decisions, and status updates inside approved systems."
      ]
    },
    {
      "type":"callout",
      "title":"Payday Super does not expand the VA role",
      "text":"Do not determine qualifying earnings, super eligibility, contribution amounts, tax treatment, award interpretation, termination treatment, or statutory corrections unless you are separately qualified and authorised. The VA role is to prepare accurate inputs, surface exceptions, preserve evidence, and hand decisions to the appropriate owner."
    },
    {
      "type":"callout",
      "title":"Creation is not authorisation",
      "text":"MYOB can allow a Pay Super user to create a super payment while reserving authorisation for configured administrators or authorisers. Software access does not override the client's internal approval controls."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Adding yourself as an STP declarer for convenience",
        "Changing payroll or super categories to make an error disappear",
        "Treating a successful pay run as proof that the super workflow is complete",
        "Ignoring rejected or returned super contributions",
        "Assuming the software has decided whether a payment is qualifying earnings",
        "Sharing payroll reports or employee data too broadly",
        "Authorising a super payment because the button is available"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"A fortnightly Australian payroll is ready in MYOB. One employee changed super-fund details, another has an unusual allowance, a third has a rejected super contribution from the prior payday, and MYOB prompts you to add yourself as an STP declarer. Prepare the administrative checks, exception list, approval handoff, and follow-up plan without making tax, payroll, super, or statutory decisions."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Treat payroll and super as sensitive, controlled workflows.",
        "Payday Super makes timing and error follow-up more important.",
        "Keep STP declaration and payment authorisation with the correct authorised people.",
        "Escalate uncertain statutory treatment instead of guessing."
      ]
    }
  ]$$::jsonb,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'myob-payroll-stp-super-and-employee-admin-handoff'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'myob-workflows-for-virtual-assistants'
    )
  );

update public.training_assessments
set
  instructions = 'Complete a MYOB administration simulation covering the correct business file and product, sales and purchase records, bank-feed matching and AI-driven suggestions, approved rules, reconciliation exceptions, GST/BAS-sensitive reports, payroll/STP handoff, Payday Super timing and payment exceptions, and finance reporting. Use source evidence and the client''s approved workflow. Clearly identify what a VA can prepare administratively and what must be escalated to the authorised client, payroll owner, bookkeeper, accountant, BAS agent, HR owner, or other qualified reviewer. Do not treat MYOB automation, suggested categories, STP access, Pay Super access, or report output as authority to make accounting, tax, BAS, payroll, super, payment, or statutory decisions.',
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id
  from public.training_courses
  where slug = 'myob-workflows-for-virtual-assistants'
);

update public.training_courses
set
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'myob-workflows-for-virtual-assistants'
  and status = 'published';
