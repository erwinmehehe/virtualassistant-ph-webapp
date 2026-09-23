-- Prepare Xero Workflows for Virtual Assistants for finance-specialist review.
-- Keep the course draft. This removes repeated freshness boilerplate, updates
-- the bank-reconciliation lesson for current Xero AU behavior, and places the
-- course behind the reusable specialist-review gate.

update public.training_courses
set
  summary = 'Independent Xero workflow training for VAs supporting Australian businesses, covering contacts, invoices, bills, bank feeds and reconciliation review, GST/BAS awareness, payroll/STP handoffs, reporting, and accounting-review boundaries.',
  trademark_disclaimer = 'Xero is a trademark of its respective owner. This independent course is not affiliated with, certified by, or endorsed by Xero. Xero features, plan availability, payroll, GST/BAS, bank feeds, reconciliation, automation, and reporting can change. Verify interface-specific steps against current official Xero Australia documentation. This course teaches administrative workflows and does not provide tax, BAS, accounting, payroll, or financial advice.',
  review_requirement = 'specialist',
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  reviewed_by = null,
  last_reviewed_at = null,
  status = 'draft',
  published_at = null,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'xero-workflows-for-virtual-assistants';

-- Keep the software-currency notice once at course level instead of repeating
-- the same callout in every lesson.
update public.training_lessons lesson
set
  content = coalesce(
    (
      select jsonb_agg(block order by ordinal)
      from jsonb_array_elements(lesson.content) with ordinality as item(block, ordinal)
      where not (
        block->>'type' = 'callout'
        and block->>'title' = 'Keep this current'
      )
    ),
    '[]'::jsonb
  ),
  reviewed_by = null,
  last_reviewed_at = null,
  is_published = false,
  content_version = content_version + 1,
  updated_at = now()
where module_id in (
  select id
  from public.training_modules
  where course_id = (
    select id
    from public.training_courses
    where slug = 'xero-workflows-for-virtual-assistants'
  )
);

-- Xero's current AU product material describes JAX as capable of automatically
-- reconciling high-confidence bank transactions on supported plans/settings,
-- while uncertain items remain for review. Keep the lesson focused on evidence,
-- permissions, and exception handling rather than assuming automation is correct.
update public.training_lessons
set
  summary = 'Xero bank feeds bring bank activity into the ledger, while current Xero AU plans can use JAX to automate some high-confidence reconciliation and leave uncertain items for review. A VA still needs evidence, approved rules, and clear escalation boundaries.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Understand the bank-feed and reconciliation-review workflow",
        "Recognize what Xero or JAX may automate versus what still needs human review",
        "Prepare reconciliation exceptions without making unsupported accounting decisions"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"Bank feeds reduce manual entry, but a bank transaction is only evidence that money moved. Current Xero Australia materials describe JAX automatically reconciling some high-confidence transactions on supported plans and settings, while uncertain items can remain for review. The VA's job is to keep records aligned with evidence and route exceptions rather than treating automation as authority."
    },
    {
      "type":"heading",
      "text":"Core ideas"
    },
    {
      "type":"list",
      "items":[
        "Bank-feed transactions show bank activity, not complete accounting classification.",
        "Depending on the plan and settings, Xero automation may apply a rule, match an existing record, use prior reconciliation patterns, or make a prediction.",
        "A transaction can look familiar and still be wrong because of duplicates, transfers, split payments, bank fees, owner transactions, private-use elements, or changed supplier details.",
        "Bank rules should come from an approved accounting workflow rather than being created simply to clear the queue.",
        "A clean reconciliation queue is not more important than a correct audit trail."
      ]
    },
    {
      "type":"heading",
      "text":"A practical workflow"
    },
    {
      "type":"steps",
      "items":[
        "Confirm you are working in the correct Xero organisation and bank account.",
        "Review the bank transaction amount, date, reference, counterparty, and available source evidence.",
        "Check whether Xero has already reconciled the transaction, suggested a match, or left it unresolved.",
        "For an automated reconciliation, confirm that the underlying invoice, bill, transfer, rule, or transaction matches the real-world evidence before treating it as resolved.",
        "For a suggested match, compare the source record, amount, timing, reference, and counterparty rather than accepting it because the software is confident.",
        "Use only bank rules and coding rules already approved by the responsible finance owner.",
        "Leave uncertain, unusual, high-value, duplicate, mixed-purpose, or tax-sensitive items visible for bookkeeper, accountant, BAS-agent, payroll, or client review.",
        "Record the resolution or reviewer decision so the next person can understand why the item was handled that way."
      ]
    },
    {
      "type":"callout",
      "title":"Automation is not authority",
      "text":"Do not approve a reconciliation solely because Xero or JAX completed or suggested it. If the business purpose, counterparty, tax treatment, transfer status, or supporting evidence is unclear, stop and route the item to the authorised finance reviewer."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Assuming automatically reconciled means accounting-reviewed",
        "Accepting a near match with a different amount without investigating the difference",
        "Creating a new spend-money transaction when an invoice or bill already exists",
        "Reconciling a transfer as income or an expense",
        "Using a bank rule to hide an exception",
        "Changing GST or account coding just to make a transaction clear"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"Xero has automatically reconciled several transactions for an Australian trade business. One matches a supplier bill exactly, one appears to be an internal transfer, one is a customer deposit with no invoice reference, and one uses a familiar supplier name but a different amount from the bill on file. Explain which items you can verify administratively, which evidence you check, which items you leave unresolved, and what you hand to the finance reviewer."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Treat software automation as a workflow aid, not professional judgment.",
        "Verify against source evidence and the real business event.",
        "Use only approved rules and permissions.",
        "Keep uncertain finance and tax decisions visible for the authorised reviewer."
      ]
    }
  ]$$::jsonb,
  reviewed_by = null,
  last_reviewed_at = null,
  is_published = false,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'bank-feeds-matching-and-reconciliation-preparation'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'xero-workflows-for-virtual-assistants'
    )
  );

update public.training_assessments
set
  title = 'Xero Workflows Final Work Simulation',
  instructions = 'Complete a Xero administration simulation covering access scope, contact hygiene, approved sales invoicing, supplier bills, bank-feed and JAX reconciliation review, GST/BAS-sensitive exceptions, payroll/STP handoff, and month-end reporting. Use source evidence, preserve an audit trail, and identify what can be handled administratively versus what must be escalated to the authorised client, bookkeeper, accountant, BAS agent, payroll owner, or other qualified reviewer. Do not treat Xero automation or suggested coding as accounting, tax, BAS, payroll, or payment authority.',
  pass_score = 80,
  is_published = false,
  updated_at = now()
where course_id = (
  select id
  from public.training_courses
  where slug = 'xero-workflows-for-virtual-assistants'
);

-- This is intentionally review-ready, not released. The publishing action will
-- require real specialist evidence before this course can go live.
