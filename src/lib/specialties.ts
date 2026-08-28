export type TaskGroup = {
  title: string;
  intro: string;
  tasks: string[];
};

export type RoleType = {
  title: string;
  bestFor: string;
  responsibilities: string[];
};

export type BusinessUse = {
  title: string;
  description: string;
};

export type InterviewQuestion = {
  question: string;
  listenFor: string;
};

export type SpecialtyFaq = {
  question: string;
  answer: string;
};

export type Specialty = {
  slug: string;
  title: string;
  singularTitle: string;
  category: string;
  primaryKeyword: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  outcomes: string[];
  tasks: string[];
  taskGroups: TaskGroup[];
  tools: string[];
  skills: string[];
  roleTypes: RoleType[];
  businessUses: BusinessUse[];
  interviewQuestions: InterviewQuestion[];
  faqs: SpecialtyFaq[];
  costFactors: string[];
  relatedSlugs: string[];
};

export const SPECIALTIES: Specialty[] = [
  {
    slug: "administrative-support",
    title: "Administrative Virtual Assistants",
    singularTitle: "Administrative Virtual Assistant",
    category: "Administrative Support",
    primaryKeyword: "hire administrative virtual assistant philippines",
    metaTitle: "Hire Administrative Virtual Assistant Philippines",
    metaDescription: "Hire a vetted administrative virtual assistant in the Philippines for inbox, calendar, data entry, research, documents, scheduling, and recurring admin support.",
    intro: "Add reliable day-to-day support for the recurring administrative work that keeps your business organized. Find Filipino administrative VAs who can work inside your existing tools, SOPs, and communication rhythm.",
    outcomes: ["Reduce routine admin load", "Keep recurring processes organized", "Create more uninterrupted time for higher-value work"],
    tasks: ["Inbox and calendar support", "Data entry and record maintenance", "Document and spreadsheet updates", "Meeting coordination and follow-up", "Research and recurring admin tasks"],
    taskGroups: [
      { title: "Inbox, calendar, and scheduling support", intro: "Create a dependable operating rhythm around communication and appointments.", tasks: ["Inbox triage and labeling", "Calendar coordination", "Meeting scheduling and rescheduling", "Agenda preparation", "Reminder and follow-up administration", "Travel and appointment research"] },
      { title: "Documents, data, and records", intro: "Keep routine business information accurate and easy to find.", tasks: ["Spreadsheet maintenance", "CRM or database updates", "Data entry and cleanup", "Document formatting", "File organization", "Recurring report preparation"] },
      { title: "Research and recurring operations", intro: "Delegate repeatable support work without creating a new project every time.", tasks: ["Vendor and market research", "Contact-list building", "Process checklist updates", "Meeting notes and action-item tracking", "Form and document preparation", "General administrative follow-through"] }
    ],
    tools: ["Google Workspace", "Microsoft 365", "Slack", "Zoom", "Notion", "ClickUp", "Asana", "Trello", "Airtable", "HubSpot"],
    skills: ["Organization", "Written communication", "Attention to detail", "Calendar management", "Spreadsheet proficiency", "Research", "Documentation", "Prioritization", "SOP compliance", "Confidentiality awareness"],
    roleTypes: [
      { title: "General Administrative VA", bestFor: "Businesses with a mixed backlog of recurring admin tasks.", responsibilities: ["Inbox and calendar support", "Data entry", "Documents and spreadsheets", "Routine research"] },
      { title: "Operations Support VA", bestFor: "Teams with documented processes that need consistent follow-through.", responsibilities: ["Checklist ownership", "CRM updates", "Process tracking", "Recurring reporting"] },
      { title: "Senior Administrative Assistant", bestFor: "Leaders who need more independent coordination and judgment.", responsibilities: ["Complex scheduling", "Stakeholder follow-up", "Meeting preparation", "Priority tracking"] }
    ],
    businessUses: [
      { title: "Founders and small businesses", description: "Move routine coordination and administrative follow-through away from the founder." },
      { title: "Professional services firms", description: "Support calendars, documents, client records, and recurring internal administration." },
      { title: "Operations teams", description: "Add execution capacity for process tracking, data maintenance, and recurring reports." },
      { title: "Remote teams", description: "Create a consistent owner for scheduling, notes, documentation, and shared workspaces." }
    ],
    interviewQuestions: [
      { question: "How do you prioritize when several administrative requests arrive at once?", listenFor: "A clear method for urgency, importance, deadlines, and confirming priorities when requirements conflict." },
      { question: "Walk me through how you manage an executive or team calendar.", listenFor: "Attention to time zones, buffers, conflicts, meeting purpose, and proactive confirmation." },
      { question: "How do you prevent errors when entering or updating data?", listenFor: "Validation steps, source checks, naming conventions, and a habit of reviewing work before completion." },
      { question: "What information do you need before taking ownership of a recurring process?", listenFor: "SOPs, expected outputs, deadlines, escalation rules, access, and quality standards." },
      { question: "Tell me about a process you made more organized.", listenFor: "A concrete before-and-after example with documentation, reduced confusion, or better follow-through." }
    ],
    faqs: [
      { question: "What does an administrative virtual assistant do?", answer: "An administrative VA supports recurring business tasks such as inbox and calendar management, data entry, documents, spreadsheets, research, scheduling, records, and follow-up. The exact scope should be defined around your workflow." },
      { question: "Can I hire an administrative virtual assistant in the Philippines?", answer: "Yes. VirtualAssistant.com.ph lets businesses review approved Philippines-based VAs and compare relevant experience, skills, tools, availability, and working preferences." },
      { question: "Can an administrative VA work part-time?", answer: "Availability varies by candidate. You can define part-time or full-time hours, required schedule overlap, and the responsibilities that must be covered in your role brief." },
      { question: "What tools should an administrative VA know?", answer: "Common tools include Google Workspace or Microsoft 365, calendars, spreadsheets, Slack or Teams, project-management platforms, CRMs, and documentation tools. Match tool requirements to your actual stack." },
      { question: "How do I choose the best administrative VA?", answer: "Prioritize relevant workflow experience, written communication, attention to detail, availability, tool familiarity, and evidence that the candidate can follow documented processes consistently." },
      { question: "How quickly can I hire?", answer: "Hiring time depends on your requirements, candidate availability, interview process, and decision speed. A clear role brief usually makes candidate review more efficient." }
    ],
    costFactors: ["Experience and independence", "Full-time or part-time schedule", "Required live overlap", "Complexity of the processes owned", "Software and industry knowledge"],
    relatedSlugs: ["executive-assistance", "customer-service", "lead-generation-sales", "real-estate"]
  },
  {
    slug: "bookkeeping-finance",
    title: "Bookkeeping & Finance Virtual Assistants",
    singularTitle: "Bookkeeping Virtual Assistant",
    category: "Bookkeeping & Finance",
    primaryKeyword: "hire bookkeeping virtual assistant philippines",
    metaTitle: "Hire Bookkeeping Virtual Assistant Philippines",
    metaDescription: "Hire a vetted bookkeeping virtual assistant in the Philippines for transaction records, invoices, reconciliations, AR follow-up, reports, and finance admin.",
    intro: "Keep routine bookkeeping and finance administration current without pushing every transaction, invoice, or spreadsheet back to your accountant or finance lead. Find Filipino bookkeeping VAs matched to your software and process.",
    outcomes: ["Keep records current", "Reduce finance-admin backlog", "Prepare cleaner inputs for your accountant or finance lead"],
    tasks: ["Transaction categorization support", "Invoice and expense tracking", "Reconciliation preparation", "Accounts receivable follow-up", "Recurring finance reports and spreadsheets"],
    taskGroups: [
      { title: "Transaction and bookkeeping support", intro: "Keep recurring financial records organized for review.", tasks: ["Transaction categorization", "Receipt and expense organization", "Bank-feed review support", "Chart-of-accounts administration", "Bookkeeping data cleanup", "Month-end checklist support"] },
      { title: "Invoices, payables, and receivables", intro: "Add consistent follow-up around routine money movement.", tasks: ["Invoice preparation", "Accounts-receivable follow-up", "Bill and payable tracking", "Payment-status updates", "Vendor record maintenance", "Aging-report administration"] },
      { title: "Reconciliation and reporting preparation", intro: "Prepare organized inputs so the responsible finance professional can review efficiently.", tasks: ["Reconciliation preparation", "Supporting-document collection", "Spreadsheet schedules", "Recurring management reports", "Variance-list preparation", "Finance dashboard updates"] }
    ],
    tools: ["QuickBooks Online", "Xero", "Excel", "Google Sheets", "Dext", "Bill.com", "Stripe", "PayPal", "HubSpot", "Google Workspace"],
    skills: ["Bookkeeping fundamentals", "Spreadsheet accuracy", "Reconciliation support", "Invoice administration", "Accounts receivable", "Expense tracking", "Documentation", "Attention to detail", "Confidentiality", "Deadline discipline"],
    roleTypes: [
      { title: "Bookkeeping Support VA", bestFor: "Businesses with established bookkeeping rules and a reviewer or accountant.", responsibilities: ["Categorization", "Receipt organization", "Invoice tracking", "Reconciliation preparation"] },
      { title: "Accounts Receivable / Payable VA", bestFor: "Teams that need consistent invoice, collection, and payable administration.", responsibilities: ["Invoice creation", "AR follow-up", "Aging reports", "Vendor and bill tracking"] },
      { title: "Senior Bookkeeping VA", bestFor: "Businesses needing more independent month-end support within clearly defined controls.", responsibilities: ["Reconciliations", "Month-end checklists", "Management reports", "Issue escalation"] }
    ],
    businessUses: [
      { title: "Small businesses", description: "Keep records and invoices organized between accountant reviews." },
      { title: "Agencies and professional services", description: "Support recurring billing, collections, expenses, and financial spreadsheets." },
      { title: "Ecommerce operators", description: "Organize marketplace, payment, refund, and expense records for review." },
      { title: "Finance teams", description: "Delegate repeatable data preparation while retaining approval and accounting responsibility internally." }
    ],
    interviewQuestions: [
      { question: "Walk me through how you prepare a bank reconciliation.", listenFor: "A structured process, attention to unmatched items, supporting records, and escalation instead of guessing." },
      { question: "How do you handle a transaction you cannot confidently categorize?", listenFor: "Documentation, asking the right person, leaving an audit trail, and avoiding unsupported assumptions." },
      { question: "Which bookkeeping platforms have you used?", listenFor: "Hands-on examples in the tools you use, plus understanding of the underlying workflow rather than tool names alone." },
      { question: "How do you organize accounts-receivable follow-up?", listenFor: "Aging views, documented contact history, respectful cadence, and clear escalation rules." },
      { question: "How do you protect sensitive financial information?", listenFor: "Least-privilege access, secure systems, no credential sharing, and awareness of confidentiality requirements." }
    ],
    faqs: [
      { question: "What does a bookkeeping virtual assistant do?", answer: "A bookkeeping VA can support transaction categorization, invoice administration, expense records, reconciliation preparation, receivables follow-up, financial spreadsheets, and recurring reporting under your defined controls." },
      { question: "Is a bookkeeping VA the same as an accountant?", answer: "No. A VA may support bookkeeping workflows, but tax advice, statutory filings, attest work, and other regulated or professional-accounting responsibilities should remain with appropriately qualified professionals." },
      { question: "Can I hire a QuickBooks or Xero VA in the Philippines?", answer: "Yes. Include the exact accounting software you use in the role brief and review candidate tool experience before hiring." },
      { question: "Can a bookkeeping VA handle reconciliations?", answer: "Some candidates have reconciliation experience. Define whether the VA prepares reconciliations for review or is expected to complete them independently, and keep appropriate approval controls in place." },
      { question: "How should I give a finance VA access?", answer: "Use least-privilege permissions, individual user accounts, documented approval limits, and secure credential practices. Avoid giving broader banking or payment authority than the role requires." },
      { question: "What should I evaluate when hiring?", answer: "Look for bookkeeping fundamentals, software experience, accuracy, documentation habits, confidentiality, communication, and evidence that the candidate escalates exceptions instead of improvising financial treatment." }
    ],
    costFactors: ["Bookkeeping experience", "Accounting-platform proficiency", "Volume of transactions and invoices", "Month-end responsibilities", "Schedule and reporting requirements"],
    relatedSlugs: ["administrative-support", "ecommerce", "real-estate", "executive-assistance"]
  },
  {
    slug: "customer-service",
    title: "Customer Service Virtual Assistants",
    singularTitle: "Customer Service Virtual Assistant",
    category: "Customer Service",
    primaryKeyword: "hire customer service virtual assistant philippines",
    metaTitle: "Hire Customer Service Virtual Assistant Philippines",
    metaDescription: "Hire a vetted customer service virtual assistant in the Philippines for email, chat, tickets, order support, follow-up, and documented escalation workflows.",
    intro: "Build more consistent customer support coverage with Filipino VAs who can work inside your help desk, knowledge base, escalation rules, and brand voice.",
    outcomes: ["Respond to customers more consistently", "Keep ticket queues organized", "Escalate exceptions with better context"],
    tasks: ["Email and chat support", "Ticket triage and follow-up", "Order and account questions", "FAQ and knowledge-base use", "Escalation documentation"],
    taskGroups: [
      { title: "Email, chat, and ticket support", intro: "Create reliable first-line support across the channels your customers use.", tasks: ["Email responses", "Live-chat support", "Ticket categorization", "Saved-reply use and personalization", "Follow-up messages", "Queue monitoring"] },
      { title: "Orders, accounts, and routine requests", intro: "Resolve documented requests quickly and route exceptions correctly.", tasks: ["Order-status questions", "Returns and refund workflow support", "Account-update requests", "Subscription questions", "Appointment or booking support", "Basic troubleshooting from approved scripts"] },
      { title: "Escalation and support operations", intro: "Keep the customer context intact when an issue needs another team.", tasks: ["Escalation notes", "Bug or issue documentation", "Knowledge-base gap tracking", "CSAT follow-up", "Tagging and queue cleanup", "Weekly support summaries"] }
    ],
    tools: ["Zendesk", "Gorgias", "Intercom", "Freshdesk", "Help Scout", "Shopify", "HubSpot", "Slack", "Google Workspace", "Microsoft Teams"],
    skills: ["Written communication", "Customer empathy", "De-escalation", "Ticket management", "Attention to detail", "Documentation", "Problem solving", "Brand voice", "Escalation judgment", "Schedule reliability"],
    roleTypes: [
      { title: "Email & Ticket Support VA", bestFor: "Businesses with structured support queues and documented policies.", responsibilities: ["Email tickets", "Queue triage", "Routine account questions", "Escalations"] },
      { title: "Chat & Ecommerce Support VA", bestFor: "Online stores needing faster order and pre-purchase support.", responsibilities: ["Live chat", "Order questions", "Returns workflow", "Product information"] },
      { title: "Senior Customer Support VA", bestFor: "Teams needing more independent issue ownership and QA support.", responsibilities: ["Complex cases", "Escalation coordination", "Knowledge-base updates", "Support reporting"] }
    ],
    businessUses: [
      { title: "Ecommerce brands", description: "Cover product, order, delivery, return, and refund questions." },
      { title: "SaaS companies", description: "Support onboarding questions, account issues, basic troubleshooting, and ticket triage." },
      { title: "Professional services", description: "Provide responsive first-line client communication and scheduling support." },
      { title: "Growing support teams", description: "Add queue capacity while keeping policies, QA, and escalations centralized." }
    ],
    interviewQuestions: [
      { question: "How would you respond to an angry customer when the issue is not immediately fixable?", listenFor: "Acknowledgement, clear next steps, realistic expectations, documentation, and escalation without making unsupported promises." },
      { question: "How do you balance response speed and accuracy?", listenFor: "Use of knowledge bases, verification, templates as a starting point, and prioritization by urgency." },
      { question: "Tell me about a time you de-escalated a difficult support interaction.", listenFor: "Specific actions, professional tone, ownership, and a measurable or clear resolution." },
      { question: "When should a ticket be escalated?", listenFor: "Defined authority limits, risk, account sensitivity, technical complexity, and documented escalation criteria." },
      { question: "How do you learn a new product or support process?", listenFor: "Documentation review, shadowing, sandbox practice, note-taking, and a deliberate feedback loop." }
    ],
    faqs: [
      { question: "What does a customer service virtual assistant do?", answer: "A customer service VA can answer routine email, chat, or ticket requests, help with orders and accounts, follow documented policies, maintain customer context, and escalate exceptions to the right person." },
      { question: "Can I hire a customer service VA in the Philippines?", answer: "Yes. You can define channel, schedule, tool, product, and live-overlap requirements and compare approved Philippines-based candidates against those needs." },
      { question: "Can a VA provide live chat support?", answer: "Yes, when the role and schedule require it and the candidate has appropriate communication skills and availability." },
      { question: "Can a customer support VA work in Zendesk, Gorgias, or Intercom?", answer: "Tool experience varies. Include your help-desk platform in the role brief and verify hands-on experience during candidate review." },
      { question: "Should a VA handle refunds?", answer: "Only within documented rules and permissions. High-value, unusual, or policy-exception refunds should follow your approval and escalation controls." },
      { question: "What should I test before hiring?", answer: "Evaluate written communication, judgment, empathy, comprehension of your policies, ticket organization, escalation decisions, and the candidate's ability to stay accurate under volume." }
    ],
    costFactors: ["Channel coverage", "Required live hours or shifts", "Product complexity", "Support-tool experience", "Level of independent issue ownership"],
    relatedSlugs: ["phone-reception", "ecommerce", "administrative-support", "dental-healthcare"]
  },
  {
    slug: "dental-healthcare",
    title: "Dental & Healthcare Virtual Assistants",
    singularTitle: "Dental & Healthcare Virtual Assistant",
    category: "Dental & Healthcare",
    primaryKeyword: "hire healthcare virtual assistant philippines",
    metaTitle: "Hire Healthcare Virtual Assistant Philippines",
    metaDescription: "Hire a vetted dental or healthcare virtual assistant in the Philippines for scheduling, reminders, records coordination, referrals, and non-clinical admin support.",
    intro: "Support non-clinical front-office and administrative workflows with a Philippines-based healthcare VA matched to your schedule, systems, communication requirements, and access controls.",
    outcomes: ["Reduce front-desk admin load", "Improve scheduling follow-through", "Keep non-clinical coordination organized"],
    tasks: ["Appointment scheduling support", "Reminder and follow-up workflows", "Administrative records coordination", "Referral and document follow-up", "Non-clinical patient communication"],
    taskGroups: [
      { title: "Scheduling and patient coordination", intro: "Reduce repetitive front-desk work while keeping scheduling rules under your control.", tasks: ["Appointment booking and rescheduling", "Reminder calls or messages", "Wait-list administration", "Basic intake coordination", "Follow-up scheduling", "Calendar and provider-template updates"] },
      { title: "Records, referrals, and documents", intro: "Keep administrative handoffs moving without assigning clinical judgment to the VA.", tasks: ["Referral-status follow-up", "Document-request tracking", "Administrative records organization", "Form completion follow-up", "Insurance-information collection support", "Fax and secure-message administration"] },
      { title: "Front-office support", intro: "Create a consistent first line for documented non-clinical requests.", tasks: ["Inbound message capture", "Routine FAQ responses", "Recall and reminder lists", "Patient balance reminder administration", "Task routing", "Daily front-desk reporting"] }
    ],
    tools: ["Google Workspace", "Microsoft 365", "Zoom", "RingCentral", "Dialpad", "Slack", "Microsoft Teams", "Dental or practice-management software", "Secure messaging tools", "Online scheduling platforms"],
    skills: ["Professional communication", "Scheduling", "Confidentiality awareness", "Documentation", "Attention to detail", "Patient-service etiquette", "Escalation judgment", "Data accuracy", "Process compliance", "Time-zone reliability"],
    roleTypes: [
      { title: "Dental Front Desk VA", bestFor: "Dental practices with repeatable scheduling, reminder, and records workflows.", responsibilities: ["Scheduling", "Recall reminders", "Message handling", "Referral follow-up"] },
      { title: "Healthcare Administrative VA", bestFor: "Clinics that need non-clinical coordination and records administration.", responsibilities: ["Appointments", "Forms", "Document tracking", "Administrative follow-up"] },
      { title: "Patient Coordination VA", bestFor: "Practices that need more proactive follow-through across approved patient-service workflows.", responsibilities: ["Follow-up lists", "Scheduling coordination", "Task routing", "Communication records"] }
    ],
    businessUses: [
      { title: "Dental practices", description: "Support scheduling, recall, referrals, document follow-up, and front-desk administration." },
      { title: "Medical clinics", description: "Add non-clinical administrative capacity around appointments and records coordination." },
      { title: "Allied health practices", description: "Support intake follow-up, scheduling, reminders, and recurring administrative tasks." },
      { title: "Multi-location practices", description: "Centralize repeatable administrative workflows across locations where appropriate." }
    ],
    interviewQuestions: [
      { question: "How would you handle a patient asking a clinical question you are not qualified to answer?", listenFor: "A clear refusal to provide clinical advice, accurate message capture, and escalation to the appropriate clinical team member." },
      { question: "How do you protect sensitive patient information?", listenFor: "Use of approved systems, least-privilege access, private work environments, identity verification, and adherence to the practice's security rules." },
      { question: "How do you manage a busy appointment schedule with cancellations and urgent requests?", listenFor: "Use of scheduling rules, wait lists, documentation, prioritization, and escalation rather than independent clinical triage." },
      { question: "What would you document after a patient call?", listenFor: "Concise factual notes, the request, action taken, next step, and escalation status without unnecessary sensitive detail." },
      { question: "Which practice-management or communication systems have you used?", listenFor: "Relevant hands-on experience plus an ability to learn controlled workflows in new systems." }
    ],
    faqs: [
      { question: "What does a healthcare virtual assistant do?", answer: "A healthcare VA can support non-clinical tasks such as scheduling, reminders, administrative records coordination, referral follow-up, document requests, routine communications, and front-office administration." },
      { question: "Can a healthcare VA provide medical advice?", answer: "No. Clinical advice, diagnosis, treatment decisions, and other professional clinical responsibilities should remain with licensed or otherwise authorized healthcare professionals." },
      { question: "Can I hire a dental virtual assistant in the Philippines?", answer: "Yes. Define the practice type, software, hours, communication channels, privacy requirements, and specific non-clinical workflows the VA will support." },
      { question: "How should I handle patient-data access?", answer: "Use your organization's legal, privacy, security, and vendor-management requirements. Provide only the access required for the role, use approved systems, and maintain appropriate agreements and controls." },
      { question: "Can a VA make appointment reminder calls?", answer: "Yes, if that fits your practice workflow, patient-consent requirements, and applicable policies. Provide scripts, escalation rules, and approved communication tools." },
      { question: "What should I look for when hiring?", answer: "Prioritize communication, confidentiality awareness, scheduling accuracy, documentation, composure, process compliance, and experience in the type of practice or systems relevant to your role." }
    ],
    costFactors: ["Healthcare or dental experience", "Practice-management software familiarity", "Required live phone coverage", "Privacy and access requirements", "Complexity of scheduling and coordination"],
    relatedSlugs: ["phone-reception", "customer-service", "administrative-support", "executive-assistance"]
  },
  {
    slug: "ecommerce",
    title: "Ecommerce Virtual Assistants",
    singularTitle: "Ecommerce Virtual Assistant",
    category: "Ecommerce",
    primaryKeyword: "hire ecommerce virtual assistant philippines",
    metaTitle: "Hire Ecommerce Virtual Assistant Philippines",
    metaDescription: "Hire a vetted ecommerce virtual assistant in the Philippines for Shopify, product listings, orders, returns, customer support, inventory, and store operations.",
    intro: "Add dependable execution capacity across product, order, customer, catalog, and marketplace operations. Find Filipino ecommerce VAs matched to your store platform and day-to-day workflow.",
    outcomes: ["Keep product and order admin moving", "Reduce repetitive store operations", "Improve follow-up across customers and suppliers"],
    tasks: ["Product listing updates", "Order and returns support", "Customer service coordination", "Inventory spreadsheet maintenance", "Marketplace and catalog admin"],
    taskGroups: [
      { title: "Product and catalog management", intro: "Keep product information accurate across your store and marketplaces.", tasks: ["Product uploads", "Variant and option updates", "Pricing and description updates", "Image and alt-text administration", "Collection or category organization", "Marketplace listing maintenance"] },
      { title: "Orders, returns, and customer operations", intro: "Create consistent follow-through after a customer clicks buy.", tasks: ["Order-status checks", "Returns workflow", "Refund-request preparation", "Customer email support", "Shipping issue follow-up", "Subscription or account administration"] },
      { title: "Inventory and store administration", intro: "Keep the operational details behind the storefront organized.", tasks: ["Inventory spreadsheets", "Supplier follow-up", "Low-stock monitoring", "Promotion setup support", "Store QA", "Recurring ecommerce reports"] }
    ],
    tools: ["Shopify", "WooCommerce", "Amazon Seller Central", "Gorgias", "Klaviyo", "ShipStation", "Google Sheets", "Canva", "Slack", "Notion"],
    skills: ["Product listing", "Order administration", "Customer support", "Catalog accuracy", "Spreadsheet skills", "Store QA", "Written communication", "Inventory administration", "Attention to detail", "Process documentation"],
    roleTypes: [
      { title: "Shopify / Store Operations VA", bestFor: "Direct-to-consumer stores with recurring catalog and order tasks.", responsibilities: ["Product updates", "Order support", "Store QA", "Basic reporting"] },
      { title: "Ecommerce Customer Support VA", bestFor: "Stores needing faster customer communication around orders and returns.", responsibilities: ["Tickets", "Order questions", "Returns", "Shipping follow-up"] },
      { title: "Marketplace Operations VA", bestFor: "Sellers managing Amazon or multiple marketplace listings.", responsibilities: ["Listing updates", "Inventory admin", "Case follow-up", "Marketplace reporting"] }
    ],
    businessUses: [
      { title: "Shopify brands", description: "Delegate product, order, customer, and recurring store administration." },
      { title: "Amazon sellers", description: "Support listing maintenance, case administration, inventory records, and operational reporting." },
      { title: "Multi-channel retailers", description: "Keep product data and recurring admin coordinated across multiple sales channels." },
      { title: "Growing DTC teams", description: "Add execution capacity without forcing marketing or operations leaders to own every store task." }
    ],
    interviewQuestions: [
      { question: "Walk me through how you would upload a new product to Shopify.", listenFor: "A complete workflow covering product data, variants, images, collections, metadata, QA, and verification after publishing." },
      { question: "How do you handle an order that appears delayed?", listenFor: "Verification, clear customer communication, carrier or supplier follow-up, documentation, and escalation according to policy." },
      { question: "How do you avoid catalog errors when updating many products?", listenFor: "Templates, bulk-edit controls, validation, sampling, version tracking, and final QA." },
      { question: "Which ecommerce platforms and support tools have you used?", listenFor: "Relevant hands-on experience and an ability to explain actual workflows, not just tool names." },
      { question: "How would you report recurring ecommerce operations each week?", listenFor: "Clear metrics or work summaries covering orders, support, inventory issues, catalog changes, and open exceptions." }
    ],
    faqs: [
      { question: "What does an ecommerce virtual assistant do?", answer: "An ecommerce VA supports recurring online-store operations such as product listings, order administration, customer support, returns, inventory records, supplier follow-up, marketplace tasks, and reporting." },
      { question: "Can I hire a Shopify virtual assistant in the Philippines?", answer: "Yes. Include Shopify and any connected apps you rely on in the role brief so you can compare relevant candidate experience." },
      { question: "Can an ecommerce VA manage Amazon listings?", answer: "Some candidates have Amazon or other marketplace experience. Verify the specific marketplace workflows you need, because product listing, account health, advertising, and inventory roles require different experience." },
      { question: "Can a VA handle customer support and store admin together?", answer: "Yes, if the workload and candidate experience fit. For higher-volume businesses, separating customer support from catalog or operations work can create clearer ownership." },
      { question: "Can an ecommerce VA issue refunds?", answer: "Only within the permissions and approval limits you define. Use documented rules and retain internal approval for exceptions or high-risk transactions." },
      { question: "What should I look for in an ecommerce VA?", answer: "Prioritize platform experience, catalog accuracy, customer communication, attention to detail, spreadsheet skills, and evidence that the candidate can follow repeatable store processes." }
    ],
    costFactors: ["Store and marketplace experience", "Order or ticket volume", "Number of platforms managed", "Required customer-service coverage", "Level of independent operational ownership"],
    relatedSlugs: ["customer-service", "marketing-social-media", "seo", "web-wordpress"]
  },
  {
    slug: "executive-assistance",
    title: "Executive Virtual Assistants",
    singularTitle: "Executive Virtual Assistant",
    category: "Executive Assistance",
    primaryKeyword: "hire executive virtual assistant philippines",
    metaTitle: "Hire Executive Virtual Assistant Philippines",
    metaDescription: "Hire a vetted executive virtual assistant in the Philippines for calendars, inboxes, meeting prep, priorities, travel, research, and executive follow-through.",
    intro: "Give founders and leaders a dependable operating partner for calendars, priorities, meeting preparation, follow-up, research, and recurring coordination.",
    outcomes: ["Protect executive focus time", "Create stronger follow-through", "Keep priorities and meetings organized"],
    tasks: ["Calendar and meeting management", "Inbox triage and follow-up", "Meeting briefs and notes", "Travel and logistics research", "Priority and action-item tracking"],
    taskGroups: [
      { title: "Calendar and meeting management", intro: "Reduce scheduling friction and protect focused time.", tasks: ["Calendar ownership", "Meeting scheduling", "Conflict resolution", "Time-zone coordination", "Agenda and pre-read collection", "Meeting reminders and follow-up"] },
      { title: "Inbox and communication support", intro: "Create a clear system for what the executive needs to read, answer, delegate, or ignore.", tasks: ["Inbox triage", "Draft responses", "Follow-up tracking", "Contact coordination", "Priority flagging", "Routine correspondence"] },
      { title: "Executive operations", intro: "Keep decisions, logistics, and commitments from disappearing after the meeting.", tasks: ["Meeting briefs", "Action-item tracking", "Travel research", "Expense and document coordination", "Research summaries", "Priority dashboards"] }
    ],
    tools: ["Google Workspace", "Microsoft 365", "Slack", "Zoom", "Notion", "ClickUp", "Asana", "Calendly", "Travel platforms", "CRM systems"],
    skills: ["Executive communication", "Calendar management", "Prioritization", "Discretion", "Research", "Meeting preparation", "Follow-through", "Time-zone coordination", "Documentation", "Independent judgment"],
    roleTypes: [
      { title: "Executive Assistant VA", bestFor: "Founders and leaders who need consistent calendar, inbox, and follow-up support.", responsibilities: ["Calendar", "Inbox", "Meetings", "Travel and coordination"] },
      { title: "Founder Support VA", bestFor: "Early-stage leaders balancing executive and operational work.", responsibilities: ["Priorities", "Research", "Admin", "Cross-team follow-up"] },
      { title: "Senior Executive VA", bestFor: "Executives who need higher judgment, stakeholder coordination, and independent ownership.", responsibilities: ["Complex scheduling", "Briefing", "Stakeholder management", "Priority systems"] }
    ],
    businessUses: [
      { title: "Founders", description: "Move scheduling, follow-up, research, and routine coordination away from the founder." },
      { title: "Agency owners", description: "Protect sales, strategy, and client time by delegating executive administration." },
      { title: "Senior leaders", description: "Create a dependable system around meetings, priorities, travel, and communications." },
      { title: "Remote executives", description: "Coordinate distributed calendars, time zones, documents, and action items." }
    ],
    interviewQuestions: [
      { question: "How would you protect an executive's calendar when many people request meetings?", listenFor: "Clear prioritization criteria, buffers, meeting purpose, alternative options, and confidence escalating conflicts." },
      { question: "What does good inbox management look like to you?", listenFor: "A system for triage, drafting, delegation, follow-up, urgency, and preserving the executive's voice." },
      { question: "Tell me about a time you anticipated something before being asked.", listenFor: "A specific example showing context awareness and useful initiative without overstepping authority." },
      { question: "How do you prepare an executive for a meeting?", listenFor: "Objective, attendees, background, open decisions, documents, recent communications, and desired outcome." },
      { question: "How do you handle confidential information?", listenFor: "Discretion, least-privilege access, secure tools, private work practices, and careful judgment about what can be shared." }
    ],
    faqs: [
      { question: "What does an executive virtual assistant do?", answer: "An executive VA supports a leader's calendar, inbox, meetings, research, travel, follow-up, priorities, and recurring coordination. More experienced EAs may take greater ownership of stakeholder and workflow management." },
      { question: "Can I hire an executive virtual assistant in the Philippines?", answer: "Yes. Define the level of judgment, time-zone overlap, communication style, systems, and responsibilities you expect, then compare approved candidates against those requirements." },
      { question: "What's the difference between an executive VA and an administrative VA?", answer: "Executive-assistant roles usually involve closer support to a leader, more complex scheduling, higher discretion, stakeholder communication, and greater prioritization judgment. Administrative roles may focus more broadly on repeatable team support." },
      { question: "Can an executive VA manage my inbox?", answer: "Yes, when you define clear triage rules, drafting authority, escalation criteria, and access controls. Start with a documented system and expand responsibility as trust and context develop." },
      { question: "Can an executive VA work US, UK, or Australian hours?", answer: "Some candidates can provide live overlap or shifted schedules. Specify the exact hours and time zone in your role brief rather than assuming availability." },
      { question: "What should I look for in an executive VA?", answer: "Prioritize communication, judgment, discretion, calendar skill, follow-through, anticipation, relevant executive-support experience, and a working style that matches the leader." }
    ],
    costFactors: ["Level of executive-support experience", "Required time-zone overlap", "Complexity of calendar and stakeholders", "Expected independent judgment", "Travel and communication responsibilities"],
    relatedSlugs: ["administrative-support", "lead-generation-sales", "bookkeeping-finance", "marketing-social-media"]
  },
  {
    slug: "lead-generation-sales",
    title: "Lead Generation & Sales Virtual Assistants",
    singularTitle: "Lead Generation Virtual Assistant",
    category: "Lead Generation & Sales",
    primaryKeyword: "hire lead generation virtual assistant philippines",
    metaTitle: "Hire Lead Generation Virtual Assistant Philippines",
    metaDescription: "Hire a vetted lead generation virtual assistant in the Philippines for prospect research, CRM updates, list building, outreach support, follow-up, and sales admin.",
    intro: "Give salespeople more time to sell by delegating repeatable prospect research, CRM hygiene, list building, outreach preparation, follow-up, and pipeline administration.",
    outcomes: ["Keep prospecting workflows consistent", "Reduce CRM and follow-up backlog", "Give salespeople more selling time"],
    tasks: ["Prospect and account research", "CRM updates and data cleanup", "Lead list preparation", "Outreach support and follow-up", "Pipeline reporting administration"],
    taskGroups: [
      { title: "Prospect research and list building", intro: "Turn your ICP and targeting rules into organized prospect data.", tasks: ["Company research", "Contact research", "Lead-list building", "Data enrichment", "ICP tagging", "Duplicate cleanup"] },
      { title: "CRM and pipeline administration", intro: "Keep sales data useful enough for reps and managers to trust it.", tasks: ["CRM updates", "Stage and activity cleanup", "Lead routing support", "Follow-up task creation", "Pipeline notes", "Recurring pipeline reports"] },
      { title: "Outreach support", intro: "Support documented outbound workflows while your sales team owns strategy and conversations.", tasks: ["Sequence preparation", "Personalization research", "Email-draft support", "LinkedIn research", "Follow-up administration", "Response categorization"] }
    ],
    tools: ["HubSpot", "Salesforce", "Pipedrive", "Apollo", "LinkedIn Sales Navigator", "Clay", "Google Sheets", "Outreach", "Salesloft", "Slack"],
    skills: ["Prospect research", "CRM hygiene", "Data accuracy", "ICP understanding", "Written communication", "List building", "Follow-up discipline", "Sales administration", "Research", "Documentation"],
    roleTypes: [
      { title: "Lead Research VA", bestFor: "Teams with a clear ICP that need higher prospecting volume and cleaner data.", responsibilities: ["Account research", "Contact finding", "List building", "Enrichment"] },
      { title: "Sales Operations VA", bestFor: "Sales teams with CRM and pipeline administration backlog.", responsibilities: ["CRM updates", "Lead routing", "Reports", "Follow-up tasks"] },
      { title: "Outbound Support VA", bestFor: "Teams with established sequences and clear messaging that need execution support.", responsibilities: ["Personalization research", "Sequence administration", "Follow-up", "Response tagging"] }
    ],
    businessUses: [
      { title: "B2B sales teams", description: "Increase prospect-research and CRM capacity around account executives or SDRs." },
      { title: "Agencies", description: "Maintain target lists, pipeline data, and outbound administration across campaigns." },
      { title: "Recruiting firms", description: "Support company and contact research, database hygiene, and follow-up workflows." },
      { title: "Founder-led sales", description: "Delegate list building and CRM work while the founder keeps discovery and closing conversations." }
    ],
    interviewQuestions: [
      { question: "How do you build a prospect list from an ICP?", listenFor: "Clear filters, source verification, relevance checks, data standards, and documentation of why an account fits." },
      { question: "How do you maintain CRM data quality?", listenFor: "Required fields, duplicate checks, consistent naming, activity logging, and periodic cleanup." },
      { question: "What would you research before personalizing an outbound message?", listenFor: "Relevant business context such as role, company, trigger events, problems, and a reason for outreach, not superficial facts." },
      { question: "How do you handle uncertain or conflicting lead data?", listenFor: "Verification across sources, confidence notes, and avoiding invented contact details." },
      { question: "Which prospecting and CRM tools have you used?", listenFor: "Hands-on examples and understanding of where each tool fits in the sales workflow." }
    ],
    faqs: [
      { question: "What does a lead generation virtual assistant do?", answer: "A lead generation VA can research target accounts, find and organize contacts, maintain CRM data, prepare lead lists, support outreach workflows, track follow-ups, and prepare pipeline reports." },
      { question: "Can I hire a lead generation VA in the Philippines?", answer: "Yes. Define your target market, ICP, data standards, CRM, outreach tools, working hours, and whether the role is research-only or includes communication." },
      { question: "Can a VA use LinkedIn Sales Navigator or Apollo?", answer: "Many candidates have experience with common prospecting platforms, but verify the exact tools and workflows you use before hiring." },
      { question: "Can a lead generation VA send cold email?", answer: "A VA can support outreach if it fits your strategy and applicable laws, platform rules, and internal policies. Your business remains responsible for compliant targeting, messaging, consent, and sending practices." },
      { question: "Is a lead generation VA the same as an SDR?", answer: "Not necessarily. Many VA roles focus on research, data, and sales administration. SDR roles may include live prospect conversations, qualification, objection handling, and meeting targets." },
      { question: "What should I evaluate when hiring?", answer: "Look for research accuracy, ICP comprehension, CRM discipline, written communication, data verification, tool experience, and evidence that the candidate follows repeatable targeting rules." }
    ],
    costFactors: ["Research complexity", "CRM and prospecting-tool experience", "Whether outreach is included", "Volume and data-quality expectations", "Required live overlap with sales teams"],
    relatedSlugs: ["marketing-social-media", "administrative-support", "executive-assistance", "real-estate"]
  },
  {
    slug: "marketing-social-media",
    title: "Marketing & Social Media Virtual Assistants",
    singularTitle: "Marketing Virtual Assistant",
    category: "Marketing & Social Media",
    primaryKeyword: "hire marketing virtual assistant philippines",
    metaTitle: "Hire Marketing Virtual Assistant Philippines",
    metaDescription: "Hire a vetted marketing virtual assistant in the Philippines for content scheduling, social media, campaign admin, research, reporting, and creative coordination.",
    intro: "Keep recurring marketing work moving with a Filipino marketing VA who can support content, social media, campaign administration, research, reporting, and asset coordination inside your existing strategy.",
    outcomes: ["Keep publishing cadence consistent", "Reduce campaign admin", "Organize marketing assets and reporting"],
    tasks: ["Content scheduling", "Social media coordination", "Campaign and asset organization", "Basic reporting preparation", "Research and content repurposing support"],
    taskGroups: [
      { title: "Content and social publishing", intro: "Turn approved content into a consistent publishing workflow.", tasks: ["Social scheduling", "Caption adaptation", "Content-calendar updates", "Basic community-response routing", "Hashtag or topic research", "Content repurposing"] },
      { title: "Campaign and asset administration", intro: "Keep campaigns organized so strategists and creators can stay focused on higher-value work.", tasks: ["Asset organization", "Campaign checklists", "UTM and link administration", "Landing-page QA", "Email-build support", "Creative request tracking"] },
      { title: "Research and reporting", intro: "Create reliable inputs for weekly and monthly marketing decisions.", tasks: ["Competitor research", "Content research", "Performance-data collection", "Dashboard updates", "Weekly reporting", "Campaign documentation"] }
    ],
    tools: ["Canva", "Meta Business Suite", "Buffer", "Hootsuite", "Later", "HubSpot", "Mailchimp", "Klaviyo", "Google Analytics 4", "Looker Studio"],
    skills: ["Content operations", "Social media", "Written communication", "Campaign administration", "Basic analytics", "Research", "Asset organization", "Canva", "Reporting", "Brand-guideline compliance"],
    roleTypes: [
      { title: "Social Media VA", bestFor: "Brands with approved strategy and recurring posting/community workflows.", responsibilities: ["Scheduling", "Caption adaptation", "Content calendars", "Basic engagement routing"] },
      { title: "Marketing Operations VA", bestFor: "Teams with campaign, asset, CRM, and reporting administration backlog.", responsibilities: ["Campaign setup support", "Asset tracking", "CRM updates", "Reports"] },
      { title: "Content Marketing VA", bestFor: "Teams that need research, repurposing, publishing, and content administration.", responsibilities: ["Research", "CMS publishing", "Repurposing", "Content tracking"] }
    ],
    businessUses: [
      { title: "Marketing agencies", description: "Add delivery capacity for content, social, campaign, and reporting workflows." },
      { title: "Ecommerce brands", description: "Support social publishing, email operations, product campaigns, and performance reporting." },
      { title: "Professional services", description: "Maintain consistent thought-leadership and campaign administration around subject-matter experts." },
      { title: "Small marketing teams", description: "Move repetitive execution away from the marketing lead while preserving strategy internally." }
    ],
    interviewQuestions: [
      { question: "How do you turn a marketing strategy into a weekly execution plan?", listenFor: "Clear tasks, owners, deadlines, assets, approvals, channel requirements, and reporting checkpoints." },
      { question: "How do you maintain brand consistency when repurposing content?", listenFor: "Reference to brand guidelines, source material, voice, design rules, review, and avoiding unsupported claims." },
      { question: "Which marketing metrics do you usually report?", listenFor: "Metrics tied to the channel and objective, plus an understanding that data collection is different from strategic interpretation." },
      { question: "Tell me about a campaign you helped organize.", listenFor: "A specific workflow showing coordination, deadlines, assets, QA, and reporting." },
      { question: "How do you handle content that is waiting for approval?", listenFor: "Status tracking, proactive reminders, clear deadlines, version control, and no unauthorized publishing." }
    ],
    faqs: [
      { question: "What does a marketing virtual assistant do?", answer: "A marketing VA supports recurring execution such as content scheduling, social media administration, research, asset organization, campaign checklists, basic reporting, CMS updates, and content repurposing." },
      { question: "Can I hire a social media virtual assistant in the Philippines?", answer: "Yes. Define the channels, content responsibilities, approval process, posting cadence, working hours, and software you expect the VA to use." },
      { question: "Can a marketing VA create strategy?", answer: "Some experienced marketers can contribute to strategy, but many VA roles are execution-focused. If strategy ownership matters, make that expectation explicit and evaluate senior-level experience." },
      { question: "Can a marketing VA use Canva and social scheduling tools?", answer: "Many candidates use common creative and scheduling platforms. Verify the exact tools and level of design judgment required for your role." },
      { question: "Can a VA publish directly to my accounts?", answer: "Yes, if you choose, but use individual user permissions, documented approval rules, and platform access that matches the person's responsibilities." },
      { question: "What should I look for when hiring?", answer: "Prioritize relevant channel experience, writing quality, organization, attention to brand guidelines, tool familiarity, reporting discipline, and a clear understanding of approval boundaries." }
    ],
    costFactors: ["Channel and campaign experience", "Content or design responsibilities", "Number of platforms", "Required reporting depth", "Level of independent marketing judgment"],
    relatedSlugs: ["seo", "video-editing-creative", "ecommerce", "lead-generation-sales"]
  },
  {
    slug: "phone-reception",
    title: "Phone & Reception Virtual Assistants",
    singularTitle: "Virtual Receptionist",
    category: "Phone & Reception",
    primaryKeyword: "hire virtual receptionist philippines",
    metaTitle: "Hire Virtual Receptionist Philippines",
    metaDescription: "Hire a vetted virtual receptionist in the Philippines for inbound calls, appointment scheduling, message handling, routing, basic qualification, and callbacks.",
    intro: "Add dependable phone and reception coverage for businesses where live calls, appointments, message capture, and routing still matter. Match candidates to your scripts, call tools, schedule, and escalation rules.",
    outcomes: ["Answer routine calls consistently", "Capture messages and next steps", "Reduce interruptions for your core team"],
    tasks: ["Inbound call handling", "Appointment coordination", "Message capture and routing", "Basic qualification scripts", "Follow-up and callback administration"],
    taskGroups: [
      { title: "Inbound reception", intro: "Create a professional first line for routine calls.", tasks: ["Answering inbound calls", "Caller identification", "Message capture", "Department or person routing", "Basic FAQ responses", "Call-log maintenance"] },
      { title: "Scheduling and qualification", intro: "Use approved scripts and rules to move eligible callers to the correct next step.", tasks: ["Appointment booking", "Rescheduling", "Basic lead qualification", "Service-area checks", "Intake questions", "Callback scheduling"] },
      { title: "Follow-up and call administration", intro: "Keep phone workflows organized after the initial conversation.", tasks: ["Missed-call follow-up", "Voicemail processing", "Callback lists", "CRM notes", "Daily call summaries", "Escalation documentation"] }
    ],
    tools: ["RingCentral", "Dialpad", "Aircall", "OpenPhone", "Zoom Phone", "Google Voice", "Calendly", "HubSpot", "Google Workspace", "Microsoft Teams"],
    skills: ["Spoken communication", "Active listening", "Professional phone etiquette", "Scheduling", "Message accuracy", "Script adherence", "CRM documentation", "De-escalation", "Call routing", "Schedule reliability"],
    roleTypes: [
      { title: "Virtual Receptionist", bestFor: "Businesses needing a professional first line for inbound calls and messages.", responsibilities: ["Call answering", "Routing", "Message capture", "Basic FAQs"] },
      { title: "Appointment Setting VA", bestFor: "Service businesses where the main goal is turning qualified calls into scheduled appointments.", responsibilities: ["Qualification", "Scheduling", "Reminders", "Callback follow-up"] },
      { title: "Phone Support VA", bestFor: "Teams needing more ongoing phone-based customer or client communication.", responsibilities: ["Inbound support", "Follow-ups", "Call notes", "Escalations"] }
    ],
    businessUses: [
      { title: "Home and local services", description: "Capture new inquiries, schedule appointments, and route urgent service requests according to your rules." },
      { title: "Dental and healthcare practices", description: "Support non-clinical scheduling, reminders, and front-office call handling." },
      { title: "Real estate teams", description: "Handle listing inquiries, appointment requests, lead information, and message routing." },
      { title: "Professional services", description: "Provide consistent reception coverage while internal teams focus on client work." }
    ],
    interviewQuestions: [
      { question: "How would you handle a caller who is frustrated and speaking quickly?", listenFor: "Calm tone, active listening, accurate clarification, ownership of the next step, and escalation when required." },
      { question: "What information belongs in a good phone message?", listenFor: "Caller identity, contact details, reason for calling, urgency as stated by the caller, requested next step, and time of call." },
      { question: "How do you avoid booking appointments incorrectly?", listenFor: "Use of scheduling rules, confirmation, service-area or eligibility checks, time-zone awareness, and final read-back." },
      { question: "How do you handle a question that is outside your script or authority?", listenFor: "No guessing, accurate message capture, transparent limits, and routing to the correct person." },
      { question: "Which phone or dialer systems have you used?", listenFor: "Relevant live-call experience and comfort with call notes, routing, transfers, and CRM integration." }
    ],
    faqs: [
      { question: "What does a virtual receptionist do?", answer: "A virtual receptionist can answer inbound calls, capture messages, route callers, schedule appointments, follow scripts, complete basic qualification, update the CRM, and manage callbacks." },
      { question: "Can I hire a virtual receptionist in the Philippines?", answer: "Yes. Specify the required phone hours, time zone, call volume, scripts, appointment rules, software, and escalation requirements in your role brief." },
      { question: "Can a virtual receptionist answer calls in my business name?", answer: "Yes. Provide approved greetings, brand language, call-routing rules, FAQs, and clear boundaries for what the receptionist may confirm or promise." },
      { question: "Can a phone VA book appointments?", answer: "Yes, when you provide scheduling access and documented rules for availability, services, buffers, locations, and escalation." },
      { question: "Can a receptionist qualify leads?", answer: "A VA can ask approved qualification questions and record answers. More complex sales discovery or advice should remain with the appropriate salesperson or professional." },
      { question: "What should I test before hiring?", answer: "Evaluate spoken clarity, listening, composure, message accuracy, script comprehension, scheduling accuracy, live-call technology comfort, and judgment about escalation." }
    ],
    costFactors: ["Required live coverage hours", "Call volume", "Qualification or scheduling complexity", "Phone-system experience", "Weekend or shifted schedule requirements"],
    relatedSlugs: ["customer-service", "dental-healthcare", "real-estate", "administrative-support"]
  },
  {
    slug: "real-estate",
    title: "Real Estate Virtual Assistants",
    singularTitle: "Real Estate Virtual Assistant",
    category: "Real Estate",
    primaryKeyword: "hire real estate virtual assistant philippines",
    metaTitle: "Hire Real Estate Virtual Assistant Philippines",
    metaDescription: "Hire a vetted real estate virtual assistant in the Philippines for CRM, lead follow-up, listings, scheduling, transaction checklists, research, and document admin.",
    intro: "Keep leads, listings, appointments, transactions, and recurring real-estate administration moving with a Filipino VA matched to your market, tools, and team workflow.",
    outcomes: ["Keep leads and transactions organized", "Reduce repetitive listing admin", "Improve follow-up consistency"],
    tasks: ["CRM and lead follow-up support", "Listing data updates", "Appointment coordination", "Transaction checklist administration", "Research and document organization"],
    taskGroups: [
      { title: "Lead and CRM support", intro: "Create consistent follow-through around inquiries and database records.", tasks: ["CRM updates", "Lead tagging", "Follow-up reminders", "Inquiry response support", "Database cleanup", "Appointment scheduling"] },
      { title: "Listing and marketing administration", intro: "Keep listing information and routine marketing assets organized.", tasks: ["Listing-data entry", "Photo and file organization", "Open-house coordination", "Property research", "Marketing checklist support", "Portal or website updates"] },
      { title: "Transaction coordination support", intro: "Maintain checklists and documents without assigning licensed activities to the VA.", tasks: ["Transaction checklists", "Deadline tracking", "Document organization", "Vendor scheduling support", "Status updates", "Closing-file preparation"] }
    ],
    tools: ["Follow Up Boss", "kvCORE", "HubSpot", "Salesforce", "Dotloop", "DocuSign", "Google Workspace", "Canva", "Zillow", "MLS-related systems where authorized"],
    skills: ["CRM management", "Lead follow-up", "Scheduling", "Listing administration", "Transaction checklists", "Data accuracy", "Written communication", "Research", "Document organization", "Deadline tracking"],
    roleTypes: [
      { title: "Real Estate Admin VA", bestFor: "Agents and teams with recurring database, listing, document, and scheduling work.", responsibilities: ["CRM", "Listings", "Documents", "Appointments"] },
      { title: "Lead Follow-Up VA", bestFor: "Teams with a lead database that needs consistent contact and appointment administration.", responsibilities: ["Lead follow-up", "CRM notes", "Scheduling", "Pipeline tasks"] },
      { title: "Transaction Support VA", bestFor: "Teams with documented transaction-coordination processes and internal licensed oversight.", responsibilities: ["Checklists", "Deadlines", "Documents", "Vendor coordination"] }
    ],
    businessUses: [
      { title: "Individual agents", description: "Delegate CRM, scheduling, listing updates, and recurring administrative work." },
      { title: "Real estate teams", description: "Add capacity across lead follow-up, listings, transaction checklists, and reporting." },
      { title: "Property managers", description: "Support tenant or vendor administration, records, scheduling, and recurring communications within defined authority." },
      { title: "Investors", description: "Organize lead research, property data, CRM activity, appointments, and document workflows." }
    ],
    interviewQuestions: [
      { question: "How do you keep a real-estate CRM clean and useful?", listenFor: "Consistent stages, notes, source fields, duplicate cleanup, follow-up dates, and clear ownership." },
      { question: "How would you manage a transaction checklist with multiple deadlines?", listenFor: "Central tracking, reminders, document status, escalation, and no assumption of licensed decision-making." },
      { question: "Tell me about your experience with listing administration.", listenFor: "Specific systems, data fields, asset organization, QA, and awareness of brokerage or market rules." },
      { question: "How do you follow up with a lead without losing context?", listenFor: "CRM notes, prior conversation review, next-step tracking, approved scripts, and relevant timing." },
      { question: "Which real-estate tools have you used?", listenFor: "Hands-on experience with CRMs, transaction systems, forms, calendars, and the workflows behind them." }
    ],
    faqs: [
      { question: "What does a real estate virtual assistant do?", answer: "A real estate VA can support CRM administration, lead follow-up, listing data, scheduling, transaction checklists, research, document organization, marketing administration, and recurring team operations." },
      { question: "Can I hire a real estate VA in the Philippines?", answer: "Yes. Define your market, brokerage or team workflow, software, schedule, lead process, and the exact administrative responsibilities you need covered." },
      { question: "Can a real estate VA use my MLS?", answer: "Access and permitted activities depend on your local rules, brokerage policies, licensing requirements, and system permissions. Verify what an unlicensed remote assistant may do in your jurisdiction before granting access." },
      { question: "Can a VA follow up with real estate leads?", answer: "A VA can support approved lead-follow-up workflows where permitted. Define scripts, qualification boundaries, escalation, consent, and any licensing restrictions that apply." },
      { question: "Can a VA coordinate transactions?", answer: "A VA can support administrative checklists, deadlines, documents, and coordination, but activities requiring a real-estate license or professional judgment must remain with authorized people." },
      { question: "What should I look for when hiring?", answer: "Prioritize relevant real-estate systems, CRM discipline, deadline management, communication, data accuracy, understanding of role boundaries, and experience in workflows similar to yours." }
    ],
    costFactors: ["Real-estate workflow experience", "CRM and transaction-system proficiency", "Lead follow-up responsibilities", "Required market-hours overlap", "Complexity of listings and transaction administration"],
    relatedSlugs: ["lead-generation-sales", "phone-reception", "administrative-support", "marketing-social-media"]
  },
  {
    slug: "seo",
    title: "SEO Virtual Assistants",
    singularTitle: "SEO Virtual Assistant",
    category: "SEO",
    primaryKeyword: "hire seo virtual assistant philippines",
    metaTitle: "Hire SEO Virtual Assistant Philippines",
    metaDescription: "Hire a vetted SEO virtual assistant in the Philippines for keyword research, on-page SEO, content updates, audits, outreach, link research, and reporting.",
    intro: "Build a more consistent SEO operation without adding every recurring optimization task to your strategist's backlog. Find Filipino SEO VAs for keyword research, on-page work, content operations, technical checks, outreach support, and reporting.",
    outcomes: ["Increase SEO execution capacity", "Keep audits and content operations organized", "Maintain recurring reporting workflows"],
    tasks: ["Keyword and SERP research", "On-page checklist support", "Content brief preparation", "Internal-linking updates", "SEO reporting and data organization"],
    taskGroups: [
      { title: "Keyword research and content SEO", intro: "Turn search opportunities into organized inputs for content and optimization work.", tasks: ["Keyword research", "Search-intent review", "Keyword clustering", "Content-gap research", "SERP analysis", "Keyword-to-page mapping"] },
      { title: "On-page and content operations", intro: "Keep existing and new pages consistently optimized and published.", tasks: ["Title and meta updates", "Heading review", "Internal linking", "Content updates", "WordPress publishing", "Image-alt-text administration"] },
      { title: "Technical support, links, and reporting", intro: "Support repeatable SEO monitoring and implementation without overstating the VA's strategic or engineering scope.", tasks: ["Site-crawl checks", "Broken-link review", "Search Console monitoring", "Link-prospect research", "Outreach administration", "SEO dashboard and ranking updates"] }
    ],
    tools: ["Google Search Console", "Google Analytics 4", "Ahrefs", "Semrush", "Screaming Frog", "Surfer SEO", "WordPress", "Looker Studio", "Google Sheets", "PageSpeed Insights"],
    skills: ["Keyword research", "Search intent", "On-page SEO", "Internal linking", "Content optimization", "SEO reporting", "WordPress", "Technical SEO basics", "Link research", "Data organization"],
    roleTypes: [
      { title: "SEO Execution VA", bestFor: "Teams with an existing SEO strategy and recurring optimization backlog.", responsibilities: ["Keyword research", "On-page updates", "Internal links", "Reporting"] },
      { title: "SEO Specialist VA", bestFor: "Businesses that need more independent ownership within a specific SEO discipline.", responsibilities: ["Audits", "Content optimization", "Local or ecommerce SEO", "Link workflows"] },
      { title: "Senior SEO Specialist", bestFor: "Teams that need strategy, prioritization, analysis, and cross-functional SEO leadership.", responsibilities: ["SEO roadmaps", "Technical prioritization", "Content strategy", "Performance analysis"] }
    ],
    businessUses: [
      { title: "SEO agencies", description: "Add execution capacity for research, content operations, audits, reporting, and outreach administration." },
      { title: "Ecommerce businesses", description: "Maintain category, product, blog, internal-link, and technical SEO workflows." },
      { title: "SaaS companies", description: "Support keyword research, content optimization, publishing, competitor monitoring, and reporting." },
      { title: "Local and professional-service businesses", description: "Maintain location content, on-page updates, Search Console monitoring, and recurring local SEO administration." }
    ],
    interviewQuestions: [
      { question: "Walk me through how you perform keyword research.", listenFor: "A process involving relevance, search intent, SERP review, competition, existing rankings, and mapping, not just exporting a keyword list." },
      { question: "How would you optimize an existing page that is ranking on page two?", listenFor: "Analysis of query intent, content quality, SERP competitors, on-page signals, internal links, and technical issues before making changes." },
      { question: "How do you decide which internal links to add?", listenFor: "Topical relevance, user journey, contextual placement, anchor clarity, and support for important pages." },
      { question: "What do you normally review in Google Search Console?", listenFor: "Queries, pages, impressions, clicks, CTR, average position, indexing, and changes over time." },
      { question: "What SEO tasks would you escalate to a developer or senior specialist?", listenFor: "Awareness of limits around complex technical issues, migrations, server configuration, JavaScript rendering, or strategic decisions." }
    ],
    faqs: [
      { question: "What is an SEO virtual assistant?", answer: "An SEO virtual assistant is a remote team member who supports search-engine-optimization work such as keyword research, content optimization, page updates, internal linking, technical checks, outreach administration, reporting, and SEO operations." },
      { question: "Can I hire an SEO virtual assistant in the Philippines?", answer: "Yes. VirtualAssistant.com.ph lets businesses review approved Philippines-based VAs with SEO skills and compare experience, tools, availability, and working preferences." },
      { question: "Can an SEO VA handle my entire SEO strategy?", answer: "Some experienced SEO professionals can own strategy, but many SEO VA roles are execution-focused. If you need technical strategy, forecasting, content planning, or prioritization, make those senior responsibilities explicit." },
      { question: "Can an SEO virtual assistant use Ahrefs or Semrush?", answer: "Many SEO professionals use tools such as Ahrefs and Semrush, but experience varies by candidate. Include required software in your role brief and verify practical use during interviews." },
      { question: "Can I hire an SEO VA for link building?", answer: "Yes. A VA can support prospect research, competitor backlink research, outreach administration, follow-ups, link monitoring, and reporting. Your strategy should define acceptable tactics and quality standards." },
      { question: "What's the difference between an SEO VA and an SEO specialist?", answer: "An SEO VA often focuses on recurring execution and operations, while a specialist may have deeper expertise in technical SEO, content strategy, local SEO, ecommerce SEO, or link acquisition. Experience matters more than the title." }
    ],
    costFactors: ["SEO experience and specialization", "Execution versus strategy ownership", "Technical SEO requirements", "SEO-tool proficiency", "Content, outreach, and reporting scope"],
    relatedSlugs: ["marketing-social-media", "web-wordpress", "ecommerce", "video-editing-creative"]
  },
  {
    slug: "video-editing-creative",
    title: "Video Editing & Creative Virtual Assistants",
    singularTitle: "Video Editing Virtual Assistant",
    category: "Video Editing & Creative",
    primaryKeyword: "hire video editing virtual assistant philippines",
    metaTitle: "Hire Video Editing Virtual Assistant Philippines",
    metaDescription: "Hire a vetted video editing virtual assistant in the Philippines for short-form video, long-form edits, captions, creative resizing, assets, and publishing.",
    intro: "Increase creative production capacity with Filipino VAs who can support repeatable editing, short-form repurposing, captioning, asset preparation, versioning, and publishing workflows.",
    outcomes: ["Increase creative production capacity", "Reduce editing backlog", "Keep assets and versions organized"],
    tasks: ["Short-form video editing", "Basic long-form editing support", "Creative resizing and adaptation", "Caption and asset preparation", "File and publishing workflow management"],
    taskGroups: [
      { title: "Short-form video production", intro: "Turn approved source footage into consistent social-ready edits.", tasks: ["Reels and Shorts edits", "Hook and cut variations", "Captions and subtitles", "Aspect-ratio adaptation", "B-roll placement", "Basic sound cleanup"] },
      { title: "Long-form and repurposing support", intro: "Reduce the production backlog around podcasts, webinars, interviews, and educational content.", tasks: ["Rough cuts", "Silence and filler-word cleanup", "Chapter or clip selection", "Basic graphics", "Thumbnail asset preparation", "Long-form to short-form repurposing"] },
      { title: "Creative operations", intro: "Keep footage, versions, exports, and publishing assets organized.", tasks: ["File naming and organization", "Version control", "Export presets", "Template adaptation", "Asset libraries", "Upload and publishing support"] }
    ],
    tools: ["Adobe Premiere Pro", "CapCut", "DaVinci Resolve", "Adobe After Effects", "Canva", "Descript", "Frame.io", "Google Drive", "Dropbox", "YouTube Studio"],
    skills: ["Video editing", "Pacing", "Captioning", "Short-form content", "Asset organization", "Brand consistency", "Basic audio cleanup", "File management", "Creative adaptation", "Deadline management"],
    roleTypes: [
      { title: "Short-Form Video VA", bestFor: "Brands publishing frequent Reels, TikToks, Shorts, and social clips.", responsibilities: ["Short-form edits", "Captions", "Resizing", "Publishing assets"] },
      { title: "Content Repurposing VA", bestFor: "Creators and teams turning long-form material into multiple assets.", responsibilities: ["Clip selection", "Short-form edits", "Thumbnails", "Content packaging"] },
      { title: "Senior Video Editor VA", bestFor: "Teams needing stronger independent editing judgment within an established creative direction.", responsibilities: ["Long-form editing", "Story structure", "Advanced polish", "Review cycles"] }
    ],
    businessUses: [
      { title: "Creators and podcasts", description: "Turn long-form recordings into polished episodes and recurring short-form clips." },
      { title: "Marketing agencies", description: "Add editing capacity across multiple client content calendars and formats." },
      { title: "Ecommerce brands", description: "Support social creative, UGC edits, product clips, and ad variations." },
      { title: "Education and SaaS teams", description: "Edit webinars, tutorials, demos, customer stories, and knowledge content." }
    ],
    interviewQuestions: [
      { question: "Show me a project closest to the style we need and explain your editing decisions.", listenFor: "A relevant portfolio example and clear reasoning about pacing, hooks, structure, audio, graphics, and audience." },
      { question: "How do you organize source files and versions?", listenFor: "Consistent naming, folder structure, proxies when needed, review versions, backups, and final deliverables." },
      { question: "How do you work from a brand or editing guide?", listenFor: "Use of templates, fonts, safe zones, captions, music rules, examples, and a feedback loop." },
      { question: "How do you handle revision feedback?", listenFor: "Clear version tracking, questions when feedback conflicts, efficient batching, and no defensiveness." },
      { question: "Which editing tools do you use most often?", listenFor: "Depth in the software relevant to your workflow and awareness of export, codec, caption, and collaboration needs." }
    ],
    faqs: [
      { question: "What does a video editing virtual assistant do?", answer: "A video editing VA can edit short-form and basic long-form video, add captions, adapt creative sizes, organize assets, prepare thumbnails, manage versions, and support publishing workflows." },
      { question: "Can I hire a video editor in the Philippines?", answer: "Yes. Define the video formats, expected weekly volume, editing style, turnaround, software, source-file workflow, and portfolio standard you need." },
      { question: "Can a video VA edit Reels, TikToks, and YouTube Shorts?", answer: "Yes, if the candidate's portfolio demonstrates the pacing, captioning, framing, and platform style you require." },
      { question: "Can a VA edit long-form YouTube or podcasts?", answer: "Many video VAs can support long-form edits, but the required skill level varies. Review portfolio examples that match your format before hiring." },
      { question: "Who provides music and stock assets?", answer: "Define this in your workflow. Use properly licensed music, stock footage, fonts, and templates, and make responsibility for licensing explicit." },
      { question: "What should I look for in a video editing VA?", answer: "Prioritize relevant portfolio quality, pacing, technical reliability, file organization, responsiveness to feedback, brand consistency, software experience, and realistic turnaround." }
    ],
    costFactors: ["Editing complexity", "Weekly video volume", "Short-form versus long-form mix", "Motion graphics requirements", "Turnaround and revision expectations"],
    relatedSlugs: ["marketing-social-media", "ecommerce", "web-wordpress", "seo"]
  },
  {
    slug: "web-wordpress",
    title: "Web & WordPress Virtual Assistants",
    singularTitle: "WordPress Virtual Assistant",
    category: "Web & WordPress",
    primaryKeyword: "hire wordpress virtual assistant philippines",
    metaTitle: "Hire WordPress Virtual Assistant Philippines",
    metaDescription: "Hire a vetted WordPress virtual assistant in the Philippines for content updates, page publishing, site QA, images, plugins, website admin, and web tasks.",
    intro: "Keep routine website work from sitting in a backlog. Find Filipino WordPress and web VAs who can support content publishing, page updates, QA, asset administration, and documented site-maintenance workflows.",
    outcomes: ["Reduce routine website backlog", "Publish updates more consistently", "Keep site content and QA organized"],
    tasks: ["WordPress content updates", "Page and post publishing", "Basic site QA", "Image and asset updates", "Plugin/content administration under defined access"],
    taskGroups: [
      { title: "WordPress content and page updates", intro: "Keep approved website changes moving without routing every edit through a developer.", tasks: ["Blog publishing", "Page text updates", "Image replacement", "Navigation edits", "Reusable-block updates", "Basic landing-page assembly"] },
      { title: "Website QA and maintenance support", intro: "Catch routine issues and keep a clear record of what needs developer attention.", tasks: ["Link checks", "Responsive QA", "Form testing", "Content consistency checks", "Plugin-update coordination", "Broken-page reporting"] },
      { title: "Web content operations", intro: "Create repeatable systems around assets, SEO inputs, and publishing.", tasks: ["Image optimization", "Alt-text updates", "Metadata entry", "Redirect-request lists", "Content inventories", "Publishing checklists"] }
    ],
    tools: ["WordPress", "Elementor", "Gutenberg", "WooCommerce", "Shopify", "Webflow", "Google Search Console", "PageSpeed Insights", "Canva", "Google Workspace"],
    skills: ["WordPress", "CMS publishing", "Website QA", "Basic HTML/CSS", "Image optimization", "Responsive checking", "Content administration", "Plugin awareness", "SEO basics", "Documentation"],
    roleTypes: [
      { title: "WordPress Content VA", bestFor: "Sites with frequent blog, landing-page, and content updates.", responsibilities: ["Publishing", "Formatting", "Images", "Metadata"] },
      { title: "Website Operations VA", bestFor: "Teams with recurring QA, forms, assets, and site-administration tasks.", responsibilities: ["QA", "Content updates", "Form checks", "Maintenance coordination"] },
      { title: "Advanced WordPress VA", bestFor: "Businesses needing more independent work with builders, WooCommerce, and basic code-level troubleshooting.", responsibilities: ["Builder updates", "WooCommerce admin", "Basic HTML/CSS", "Issue investigation"] }
    ],
    businessUses: [
      { title: "Content teams", description: "Publish and maintain articles, landing pages, images, metadata, and internal links." },
      { title: "Agencies", description: "Add execution capacity for routine client-site updates and QA." },
      { title: "Ecommerce brands", description: "Support product content, store pages, promotions, and routine WooCommerce or Shopify admin." },
      { title: "Small businesses", description: "Keep common website changes moving without using developer time for every content edit." }
    ],
    interviewQuestions: [
      { question: "Walk me through how you publish a new WordPress page safely.", listenFor: "Staging or preview when appropriate, formatting, images, links, metadata, responsive QA, forms, and final verification." },
      { question: "What would you check before updating a WordPress plugin?", listenFor: "Backups, compatibility, staging, changelog or risk review, permissions, and a rollback path rather than blind updating." },
      { question: "How do you troubleshoot a page that looks wrong on mobile?", listenFor: "Reproduction, browser/devices, builder settings, CSS awareness, isolating the issue, and escalation when code changes exceed authority." },
      { question: "What basic HTML or CSS tasks are you comfortable with?", listenFor: "Specific examples that match the role, plus honest boundaries around development work." },
      { question: "How do you keep website changes documented?", listenFor: "Tickets, change notes, before/after checks, screenshots, version history, and clear handoff." }
    ],
    faqs: [
      { question: "What does a WordPress virtual assistant do?", answer: "A WordPress VA can publish and update content, format pages, manage images, perform routine QA, administer approved plugins or settings, update metadata, and support documented website-maintenance workflows." },
      { question: "Can I hire a WordPress virtual assistant in the Philippines?", answer: "Yes. Define your CMS, page builder, ecommerce plugins, expected update volume, access level, working hours, and whether basic HTML/CSS knowledge is required." },
      { question: "Can a WordPress VA build pages with Elementor or Gutenberg?", answer: "Many candidates work with common WordPress builders. Verify portfolio or practical examples that match the builder and design complexity you use." },
      { question: "Can a WordPress VA update plugins?", answer: "A VA can support plugin administration under a documented maintenance process. Use backups, staging where appropriate, limited permissions, and developer escalation for risky or breaking changes." },
      { question: "Is a WordPress VA a web developer?", answer: "Not necessarily. Many VAs specialize in CMS operations and basic site tasks. If you need custom themes, advanced JavaScript, backend development, security engineering, or complex debugging, hire for those development skills explicitly." },
      { question: "What should I look for when hiring?", answer: "Prioritize hands-on CMS experience, QA habits, attention to detail, basic web fundamentals, safe change management, documentation, and evidence that the candidate knows when to escalate to a developer." }
    ],
    costFactors: ["WordPress and builder experience", "Basic coding requirements", "Ecommerce or plugin complexity", "Publishing volume", "Maintenance and QA responsibilities"],
    relatedSlugs: ["seo", "ecommerce", "marketing-social-media", "video-editing-creative"]
  }
];

export function specialtyBySlug(slug: string) {
  return SPECIALTIES.find((x) => x.slug === slug);
}
