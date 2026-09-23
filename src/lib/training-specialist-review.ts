export type SpecialistReviewItem = {
  id: string;
  label: string;
  detail: string;
};

export type SpecialistReviewDefinition = {
  title: string;
  reviewerHint: string;
  items: SpecialistReviewItem[];
};

const definitions: Record<string, SpecialistReviewDefinition> = {
  "real-estate-virtual-assistant": {
    title: "Real Estate specialist review",
    reviewerHint: "Practising real estate VA, licensed real estate professional, property-management operator, or reviewer with direct workflow responsibility in the market covered.",
    items: [
      { id: "scope", label: "VA scope is accurate", detail: "Administrative support is clearly separated from licensed representation, legal advice, valuation, negotiation authority, and decisions reserved for agents, brokers, property managers, or owners." },
      { id: "fair_housing", label: "Fair-housing and discrimination boundaries are safe", detail: "Lead handling, screening support, messaging, and property workflows do not instruct learners to make discriminatory decisions or infer protected characteristics." },
      { id: "listing_data", label: "Listing and property data workflows are realistic", detail: "CRM, listing, viewing, vendor, maintenance, and transaction support steps match real operational practice and do not invent access or authority." },
      { id: "privacy", label: "Client and prospect data handling is appropriate", detail: "Contact data, identity documents, contracts, financial information, access codes, and property records are handled through approved systems and minimum-necessary access." },
      { id: "jurisdiction", label: "Jurisdiction-sensitive content is framed correctly", detail: "Local licensing, tenancy, disclosure, contract, trust-account, or regulatory questions are escalated rather than presented as universal rules." },
      { id: "assessment", label: "Final simulation tests real work", detail: "The assessment requires prioritization, handoff, documentation, QA, and escalation instead of trivia or unsupported legal conclusions." },
    ],
  },
  "medical-healthcare-virtual-assistant": {
    title: "Medical / Healthcare specialist review",
    reviewerHint: "Healthcare operations lead, medical VA with current workflow experience, privacy/compliance reviewer, or qualified clinical-administration specialist.",
    items: [
      { id: "nonclinical", label: "Non-clinical role boundaries are explicit", detail: "The learner is never asked to diagnose, prescribe, triage clinically, interpret test results, determine medical necessity, or make treatment decisions." },
      { id: "privacy", label: "Patient privacy controls are appropriate", detail: "Identity, records, messages, referrals, appointments, and billing information use minimum-necessary access, approved channels, and immediate incident escalation." },
      { id: "scheduling", label: "Scheduling and intake workflows are realistic", detail: "Appointment, intake, referral, follow-up, cancellation, and escalation steps reflect real administrative practice without fabricating clinical urgency." },
      { id: "billing", label: "Billing and claims boundaries are safe", detail: "Administrative claim support is distinguished from coding judgment, medical necessity, payer interpretation, or professional billing advice." },
      { id: "escalation", label: "Clinical and safety escalation is unambiguous", detail: "Urgent symptoms, privacy incidents, medication questions, clinical complaints, and uncertain medical requests are routed to authorized staff." },
      { id: "assessment", label: "Final simulation tests real healthcare admin judgment", detail: "The learner must prioritize, document, communicate, protect privacy, and escalate rather than answer clinical questions." },
    ],
  },
  "bookkeeping-administration": {
    title: "Bookkeeping Administration specialist review",
    reviewerHint: "Bookkeeper, accountant, finance operations lead, or experienced bookkeeping VA familiar with the client market and software workflows.",
    items: [
      { id: "scope", label: "Bookkeeping scope is correctly limited", detail: "Administrative bookkeeping support is separated from tax advice, accounting judgments, BAS/tax-agent work, statutory filings, and decisions requiring a qualified professional." },
      { id: "source_docs", label: "Source-document and coding workflows are realistic", detail: "Invoice, receipt, bill, expense, supplier, customer, and coding-support steps use approved documentation and do not guess classifications." },
      { id: "payments", label: "Payment controls are safe", detail: "Preparation is separated from approval, bank-detail changes are independently verified, and the VA does not release funds outside delegated authority." },
      { id: "reconciliation", label: "Reconciliation support is framed correctly", detail: "The learner can identify differences and prepare evidence but does not silently force balances or make unsupported accounting adjustments." },
      { id: "handoff", label: "Month-end and reviewer handoffs are complete", detail: "Exceptions, unresolved coding, missing documents, approvals, and unusual transactions are visible to the authorized finance owner." },
      { id: "assessment", label: "Final simulation tests real bookkeeping admin work", detail: "The assessment requires evidence-based processing, exception handling, payment controls, reconciliation support, and a reviewer-ready handoff." },
    ],
  },
  "payroll-administration": {
    title: "Payroll Administration specialist review",
    reviewerHint: "Payroll practitioner, payroll manager, accountant, HR/payroll operations lead, or experienced payroll VA with current process responsibility.",
    items: [
      { id: "scope", label: "Payroll scope and authority are accurate", detail: "The VA prepares and checks inputs but does not decide tax treatment, employment-law questions, statutory interpretation, disputed pay, or unauthorized off-cycle payments." },
      { id: "privacy", label: "Payroll-data privacy controls are strong", detail: "Salary, bank, tax, identity, leave, deduction, and benefit data are limited to approved systems and minimum-necessary access." },
      { id: "bank_changes", label: "Bank-detail change controls are safe", detail: "Any bank-detail update requires independent verification and cannot be approved from the same unverified message that requested the change." },
      { id: "approvals", label: "Separation of duties is preserved", detail: "Preparation, payroll review, final approval, and payment authorization remain distinct according to the client's control model." },
      { id: "statutory", label: "Statutory and jurisdictional content is appropriately limited", detail: "Rates, thresholds, tax, contributions, leave, termination, filing, and legal questions use current approved sources and are escalated to the authorized specialist." },
      { id: "corrections", label: "Corrections and employee queries are realistic", detail: "Underpayments, missing hours, deductions, and disputes are investigated with evidence and approval rather than silently edited or promised." },
      { id: "assessment", label: "Final simulation tests payroll operations judgment", detail: "The learner must manage inputs, exceptions, privacy, approvals, employee queries, and handoff without crossing into tax or legal advice." },
    ],
  },
  "property-management-administration-australia": {
    title: "Property Management Australia specialist review",
    reviewerHint: "Licensed property manager, agency operations lead, senior property-management administrator, or compliance reviewer with current state or territory workflow responsibility.",
    items: [
      { id: "authority", label: "VA authority is separated from licensed work", detail: "The course clearly separates administration from legal advice, tenancy decisions, trust-account authority, formal notices, negotiations, representations, and actions requiring a licence." },
      { id: "jurisdiction", label: "State and territory differences are handled correctly", detail: "Entry, notices, bonds, rent increases, repairs, applications, privacy, and disclosure are not presented as one national rule set." },
      { id: "applications", label: "Application and tenant data workflows are fair and privacy-safe", detail: "Screening support uses approved criteria and records without discriminatory shortcuts, protected-characteristic inference, or unnecessary collection of personal data." },
      { id: "maintenance", label: "Maintenance and emergency workflows are realistic", detail: "The VA can log, triage administratively, coordinate approved trades, track evidence, and escalate urgent or safety-sensitive issues without making technical or legal decisions." },
      { id: "money", label: "Bond, rent, invoice, and trust-account boundaries are safe", detail: "Payment records and reconciliations are support tasks only; the course does not give the VA unapproved authority over trust money, bond decisions, refunds, or deductions." },
      { id: "communication", label: "Owner and tenant communications stay within approved authority", detail: "Templates, updates, inspection coordination, and arrears follow-up are factual and do not overstate legal rights, approval, or agency authority." },
      { id: "assessment", label: "Final simulation tests real property admin judgment", detail: "The learner must prioritize a mixed portfolio queue, document evidence, use the correct escalation path, and avoid legal or licensed decisions." },
    ],
  },
  "mortgage-broking-administration-australia": {
    title: "Mortgage Broking Australia specialist review",
    reviewerHint: "Licensed mortgage broker, credit representative, brokerage compliance lead, loan-processing manager, or experienced mortgage administration specialist under an Australian credit licence framework.",
    items: [
      { id: "credit_assistance", label: "Credit-assistance boundaries are explicit", detail: "The VA does not suggest or recommend lenders, products, loan structures, borrowing amounts, suitability, or best-interest conclusions." },
      { id: "privacy", label: "Sensitive financial data controls are appropriate", detail: "Identity, income, expense, liability, banking, credit, property, and application documents use approved secure systems and minimum-necessary access." },
      { id: "fact_find", label: "Fact-find and document workflows preserve source evidence", detail: "The learner records client-provided facts and documents accurately, flags inconsistencies, and does not alter information to improve serviceability or policy fit." },
      { id: "research", label: "Lender and product research remains factual", detail: "Rates, features, policy, turnaround times, and eligibility facts are source-dated and handed to the broker without a recommendation or winner." },
      { id: "status", label: "Application and approval status language is precise", detail: "Conditional approval, formal approval, valuation, outstanding conditions, loan documents, and settlement are not overstated or guaranteed." },
      { id: "legal", label: "Legal and settlement boundaries are safe", detail: "The VA does not interpret contracts or loan documents, advise on deposits or exchange, guarantee settlement, or replace the broker, conveyancer, solicitor, lender, or accountant." },
      { id: "assessment", label: "Final simulation tests real mortgage admin judgment", detail: "The learner must package evidence, track conditions, protect privacy, prepare factual research, and escalate advice questions without providing credit assistance." },
    ],
  }
};

export function getSpecialistReviewDefinition(slug: string) {
  return definitions[slug] || null;
}

export function getSpecialistReviewDefinitions() {
  return definitions;
}
