import type { IndustryPage } from "@/lib/industries";

export type IndustrySeoEnhancement = {
  seoLabel?: string;
  metaDescription?: string;
  heroIntro?: string;
  workflowDetails?: Record<string, string>;
  toolDetails?: Record<string, string>;
  first30Days?: readonly [string, string, string, string];
  metrics?: readonly string[];
};

export const INDUSTRY_SEO_CONTENT: Record<string, IndustrySeoEnhancement> = {
  "law-firms": {
    seoLabel: "Law Firms & Lawyers",
    metaDescription: "Virtual Assistant services for law firms and lawyers. Delegate client intake, matter admin, scheduling, billing support, case updates and follow-up.",
    heroIntro: "Law firms lose valuable attorney and paralegal time to work that does not require legal judgment. A Virtual Assistant can keep intake, matter administration, calendars, documents, billing support and routine client follow-up moving while legal work stays with qualified professionals.",
    workflowDetails: {
      "client intake": "Respond to new enquiries, collect basic contact and matter information, send approved intake forms, follow up on missing details and keep the intake record current. Conflict decisions and legal evaluation stay with authorized law-firm staff.",
      "calendar and deadline support": "Maintain calendars, enter dates supplied by the legal team, create reminders, coordinate appointments and flag incomplete tasks before deadlines approach. Calculating legal deadlines should remain with appropriately qualified staff unless the firm has an approved supervised process.",
      "matter setup": "Create accepted matters in Clio, MyCase or the firm’s case-management system, apply naming conventions, add contacts, organize folders and prepare the administrative onboarding checklist for review.",
      "document organization": "Rename, categorize, upload and organize documents using the firm’s filing rules, maintain version control and track missing documents without making legal judgments about their contents.",
      "billing administration": "Prepare routine billing information, organize time-entry inputs, follow up on administrative items and keep billing records current while approvals, trust-account activity and financial authority remain with the firm.",
      "case-management updates": "Keep matter stages, tasks, contacts, notes and administrative statuses current so attorneys and managers can see what is waiting, overdue or complete without rebuilding the history from inboxes.",
      "client follow-up": "Send approved appointment reminders, document requests and routine status follow-ups. Questions that require legal advice, interpretation or strategy should be escalated immediately.",
      "research support": "Compile publicly available information, organize source documents and prepare administrative research summaries. Legal research, legal conclusions and professional judgment remain with qualified legal staff."
    },
    toolDetails: {
      "Clio": "Matter records, contacts, tasks, documents and administrative workflow updates.",
      "MyCase": "Matter administration, calendaring, client coordination and document organization.",
      "PracticePanther": "Contacts, matter tasks, calendar support and workflow maintenance.",
      "Lawmatics": "Lead intake, CRM updates and prospective-client follow-up workflows.",
      "Microsoft 365": "Email, calendars, documents, spreadsheets and internal coordination.",
      "DocuSign": "Sending approved documents for signature and monitoring completion."
    },
    first30Days: [
      "Week 1: train on confidentiality, systems, naming rules, intake flow and escalation boundaries.",
      "Week 2: run a small set of intake, calendar and matter-admin tasks under close review.",
      "Week 3: give the VA ownership of approved recurring workflows with a daily exception check.",
      "Week 4: review turnaround time, accuracy, backlog and escalation quality before expanding scope."
    ],
    metrics: ["Lead response time", "Intake enquiries followed up", "Missing-document backlog", "Administrative tasks overdue", "Calendar corrections", "Matter records requiring correction", "Client follow-ups completed on time", "Billing administration backlog"]
  },
  "real-estate-agents": {
    seoLabel: "Real Estate Agents & Realtors",
    metaDescription: "Virtual Assistant services for real estate agents and Realtors. Delegate lead follow-up, CRM updates, listing admin, appointments, transactions and marketing support.",
    heroIntro: "Real estate teams move quickly, but follow-up, listing administration and CRM work often fall behind when agents are in appointments or on the road. A Virtual Assistant can own the repeatable coordination work while licensed agents keep negotiations, advice and client decisions.",
    workflowDetails: {
      "lead follow-up": "Respond to new enquiries using approved scripts, capture qualification details, schedule the next step and keep follow-up dates visible so warm prospects do not disappear between calls and showings.",
      "CRM updates": "Keep contacts, lead stages, notes, source data and next actions accurate in Follow Up Boss, KVCore, BoomTown or the team’s CRM so agents can trust the pipeline.",
      "listing administration": "Prepare listing checklists, collect approved property information, coordinate assets, update internal status fields and track what is still missing before publication or launch.",
      "appointment coordination": "Coordinate calls, showings and meetings, confirm attendance, handle routine rescheduling and make sure the agent has the relevant property and lead context before the appointment.",
      "transaction support": "Track administrative milestones, documents, signatures and handoffs against the brokerage’s checklist while licensed representation and transaction decisions remain with authorized staff.",
      "database cleanup": "Merge duplicates, normalize contact data, tag records, identify stale leads and create clear next-action lists instead of letting years of CRM history become unusable.",
      "property research": "Compile approved property, neighborhood and public-record information for the agent to review without presenting the research as licensed advice or valuation.",
      "marketing coordination": "Coordinate approved listing posts, email sends, Canva assets, open-house reminders and campaign checklists while final claims, pricing and positioning stay with the agent or marketing owner."
    },
    toolDetails: {
      "Follow Up Boss": "Lead routing, stages, notes, action plans and next-touch visibility.",
      "KVCore": "Lead capture, CRM follow-up and campaign administration.",
      "BoomTown": "Lead management, follow-up queues and database organization.",
      "MLS tools": "Approved listing and property administration under brokerage rules.",
      "DocuSign": "Tracking approved signature requests and completed documents.",
      "Canva": "Preparing templated listing and social assets from approved brand material."
    },
    first30Days: [
      "Week 1: map lead stages, response rules, CRM fields, listing checklists and escalation points.",
      "Week 2: own CRM hygiene and a limited lead-follow-up queue with agent review.",
      "Week 3: add appointment and listing coordination once response quality is consistent.",
      "Week 4: review speed-to-lead, overdue follow-ups, CRM accuracy and agent handoff quality."
    ],
    metrics: ["Speed to lead", "Follow-ups completed on time", "Leads with a next action", "CRM records missing key fields", "Appointments booked", "No-show rate", "Listing checklist completion", "Stale lead backlog"]
  },
  "medical-practices": {
    seoLabel: "Doctors & Medical Practices",
    metaDescription: "Virtual Assistant services for doctors and medical practices. Delegate scheduling, reminders, referrals, records admin, billing support, calls and intake follow-up.",
    heroIntro: "Medical practices need reliable administrative follow-through without blurring clinical responsibility. A Virtual Assistant can support scheduling, reminders, referrals, records administration, billing workflows and routine patient communication while clinical decisions remain with qualified staff.",
    workflowDetails: {
      "appointment scheduling": "Book and reschedule appointments using the practice’s approved rules, record the correct visit type and provider, confirm required information and escalate exceptions that need clinical or front-desk judgment.",
      "patient reminders": "Send approved appointment, preparation and follow-up reminders through the practice’s authorized channels and document outcomes so staff can see who confirmed, cancelled or needs attention.",
      "referral coordination": "Track referral status, request missing administrative information, follow up with approved contacts and keep the referral queue current without making clinical decisions.",
      "insurance verification support": "Collect and organize verification information according to the practice workflow, flag discrepancies and route exceptions to qualified billing or insurance staff for review.",
      "records administration": "Index, organize and route records using approved naming and access rules while protecting patient information and limiting access to the minimum necessary systems.",
      "billing support": "Prepare administrative billing inputs, follow up on missing information and maintain work queues while coding judgment, claims decisions and regulated billing work stay with qualified staff.",
      "inbox and phone coverage": "Handle routine administrative calls and inbox items, document the interaction and escalate urgent, clinical or ambiguous requests using a defined protocol.",
      "intake follow-up": "Follow up on incomplete forms, demographics, documents and scheduling steps so the care team receives a more complete administrative record before the visit."
    },
    first30Days: [
      "Week 1: train on privacy, access, practice terminology, escalation rules and approved communication scripts.",
      "Week 2: handle a narrow scheduling or reminder workflow under daily review.",
      "Week 3: add referral, records or billing-administration queues after accuracy is consistent.",
      "Week 4: review turnaround time, documentation quality, privacy compliance and exception handling."
    ],
    metrics: ["Call response time", "Appointments confirmed", "Scheduling corrections", "Referral items overdue", "Incomplete intake records", "Administrative billing backlog", "Unresolved inbox items", "Escalations handled correctly"]
  },
  "financial-advisors": {
    seoLabel: "Financial Advisors & RIAs",
    metaDescription: "Virtual Assistant services for financial advisors and RIAs. Delegate scheduling, CRM upkeep, client follow-up, document collection, meeting prep and reporting support.",
    heroIntro: "Advisory firms need clean client data, consistent preparation and reliable follow-through without delegating regulated advice. A Virtual Assistant can own recurring administrative workflows around meetings, CRM records, document collection and client coordination while recommendations and regulated decisions stay with licensed professionals.",
    workflowDetails: {
      "meeting scheduling": "Coordinate review meetings, confirmations and rescheduling, capture the correct meeting purpose and make sure the advisor has the relevant client context before the appointment.",
      "client follow-up": "Send approved administrative follow-ups, request outstanding documents and record the next action while advice, recommendations and investment discussions stay with authorized professionals.",
      "CRM upkeep": "Keep household records, activities, notes, workflow stages and next-review dates accurate in Redtail, Wealthbox or Salesforce so the team can trust the system of record.",
      "document collection": "Track requested forms and supporting documents, flag missing items and organize received files according to the firm’s access and retention rules.",
      "review-meeting preparation": "Prepare administrative checklists, confirm required documents, collect open action items and assemble approved meeting materials for advisor review.",
      "marketing administration": "Coordinate approved newsletters, event lists, CRM segments and campaign logistics while compliance review and regulated claims remain with the firm.",
      "workflow updates": "Move recurring service tasks through the firm’s documented process, record exceptions and surface anything that is blocked or requires licensed review.",
      "reporting": "Prepare operational reports on service queues, follow-ups, meetings and workflow status without presenting administrative reporting as financial advice."
    },
    toolDetails: {
      "Redtail": "CRM records, activities, workflows, review dates and client-service follow-up.",
      "Wealthbox": "Contacts, tasks, notes and recurring client-service workflows.",
      "Salesforce": "CRM administration, pipeline or service workflows and reporting.",
      "DocuSign": "Tracking approved signature requests and completed forms."
    },
    first30Days: [
      "Week 1: define regulated boundaries, client-data access, CRM standards and advisor approval rules.",
      "Week 2: own scheduling, CRM hygiene and document follow-up under review.",
      "Week 3: add review-meeting preparation and recurring service workflows.",
      "Week 4: review CRM accuracy, overdue actions, meeting readiness and escalation quality."
    ],
    metrics: ["CRM records with a next action", "Overdue client follow-ups", "Review meetings ready on time", "Missing-document backlog", "Scheduling corrections", "Workflow items overdue", "Client-service response time", "Exceptions requiring advisor review"]
  },
  "property-management-companies": {
    seoLabel: "Property Management Companies",
    metaDescription: "Virtual Assistant services for property management companies. Delegate tenant communication, maintenance coordination, leasing follow-up, vendors, documents and reporting.",
    heroIntro: "Property managers juggle tenant communication, maintenance, leasing enquiries and vendor coordination at the same time. A Virtual Assistant can keep those queues organized, documented and moving while property-level decisions and regulated responsibilities stay with the manager.",
    workflowDetails: {
      "tenant communication": "Handle approved routine messages, record the interaction, route requests to the correct property or work order and escalate emergencies, disputes or policy exceptions immediately.",
      "maintenance coordination": "Create and update work orders, collect issue details, coordinate approved vendors or time windows and keep tenants informed while repair authorization and emergency decisions follow management rules.",
      "leasing inquiry follow-up": "Respond to enquiries using approved property information, capture prospect details, coordinate viewings and maintain follow-up without making unauthorized promises about availability or terms.",
      "vendor scheduling": "Coordinate approved vendors, access windows and appointment confirmations, then record completion status and unresolved items in the property-management system.",
      "calendar management": "Maintain inspections, maintenance visits, lease-related dates and internal reminders so property teams can see upcoming commitments in one place.",
      "document administration": "Organize approved leases, notices, invoices and property documents according to naming and access rules while legal interpretation stays with qualified staff.",
      "CRM updates": "Keep prospect, tenant and vendor records current with notes, statuses and next actions so communication does not depend on individual inboxes.",
      "reporting": "Prepare operating summaries for open maintenance items, leasing enquiries, overdue follow-ups and vendor activity so managers can focus on exceptions."
    },
    toolDetails: {
      "AppFolio": "Tenant, property, work-order and leasing workflow administration.",
      "Buildium": "Resident communication, leasing administration, tasks and property records.",
      "Propertyware": "Portfolio records, maintenance coordination and workflow tracking.",
      "Rent Manager": "Property records, service requests and administrative follow-up.",
      "DocuSign": "Tracking approved signature requests and completed documents."
    },
    first30Days: [
      "Week 1: map properties, emergency definitions, maintenance rules, vendor lists and communication templates.",
      "Week 2: own routine tenant messages and a limited maintenance queue under review.",
      "Week 3: add leasing follow-up, vendor coordination and document administration.",
      "Week 4: review response time, open work orders, missed follow-ups and escalation accuracy."
    ],
    metrics: ["Tenant response time", "Open maintenance items", "Emergency escalations handled correctly", "Leasing enquiries followed up", "Vendor appointments completed", "Work orders without updates", "Document backlog", "Prospects with a next action"]
  },
  "healthcare-dental": {
    seoLabel: "Healthcare & Dental Practices",
    metaDescription: "Virtual Assistant services for healthcare and dental practices. Delegate scheduling, reminders, referrals, billing admin, front-desk communication and records coordination.",
    heroIntro: "Healthcare and dental teams need consistent administrative support without moving clinical responsibility outside the practice. A Virtual Assistant can keep scheduling, reminders, referrals, records and front-desk workflows moving within clearly documented privacy and escalation rules.",
    workflowDetails: {
      "scheduling": "Book, reschedule and confirm appointments using the practice’s visit types, provider rules and escalation process so calendars stay accurate and exceptions reach the right staff member.",
      "patient reminders": "Send approved reminders, document confirmations and surface cancellations or unanswered outreach so the front desk can focus on exceptions.",
      "referral follow-up": "Track referral status, request missing administrative information and keep outstanding referral items visible until completed or escalated.",
      "billing administration support": "Organize administrative billing inputs, follow up on missing information and maintain work queues while coding, claims decisions and regulated billing work remain with qualified staff.",
      "front-desk communication": "Handle routine administrative calls and messages using approved scripts, document each interaction and escalate clinical, urgent or ambiguous requests.",
      "records coordination": "Organize and route records using approved privacy, naming and access rules while limiting the VA to the minimum information required for the workflow."
    },
    first30Days: [
      "Week 1: train on privacy, access, scheduling rules, scripts and clinical escalation boundaries.",
      "Week 2: own a narrow scheduling or reminder queue with daily quality review.",
      "Week 3: add referrals, records or billing-administration support once accuracy is stable.",
      "Week 4: review response time, scheduling accuracy, backlog and escalation quality."
    ],
    metrics: ["Appointment confirmations", "Scheduling corrections", "Referral backlog", "Unanswered routine messages", "Records tasks overdue", "Billing-admin backlog", "Escalation accuracy", "Front-desk response time"]
  },
  "home-local-services": {
    seoLabel: "Home & Local Service Businesses",
    metaDescription: "Virtual Assistant services for home and local service businesses. Delegate lead response, booking, dispatch support, estimate follow-up, CRM updates and reminders.",
    heroIntro: "Home-service companies lose revenue when calls are missed, estimates sit untouched or schedule changes are not communicated quickly. A Virtual Assistant can keep the service board, lead queue and customer follow-up organized while field and pricing decisions stay with the business.",
    workflowDetails: {
      "inbound lead handling": "Respond to new enquiries using approved service-area and qualification rules, capture the job details and move valid opportunities to booking or the correct internal owner.",
      "appointment booking": "Book approved job types into available windows, confirm addresses and contact details, send reminders and escalate requests that fall outside standard scheduling rules.",
      "dispatch support": "Keep job statuses, technician assignments and customer updates current while field supervisors retain control of routing, emergency and technical decisions.",
      "estimate follow-up": "Track open estimates, send approved reminders, record customer responses and surface jobs that need a salesperson or manager rather than letting opportunities disappear after the quote.",
      "CRM updates": "Keep contact details, job notes, lead stages, outcomes and next actions accurate so office and field staff share the same picture of each customer.",
      "customer reminders": "Send approved appointment, arrival-window and follow-up messages and record the outcome so missed communication does not become a failed visit.",
      "review requests": "Trigger approved review requests after completed jobs, track responses and route complaints or service-recovery issues to a manager before asking again.",
      "vendor coordination": "Coordinate approved supplier or subcontractor communication, confirm timing and document outstanding items while purchasing authority stays with the business."
    },
    toolDetails: {
      "ServiceTitan": "Lead, booking, job and customer workflow administration.",
      "Housecall Pro": "Scheduling, customer communication and job-status support.",
      "Jobber": "Requests, quotes, scheduling and customer follow-up administration.",
      "GoHighLevel": "Lead capture, pipeline stages, automations and follow-up queues.",
      "RingCentral": "Inbound and outbound customer communication using approved scripts."
    },
    first30Days: [
      "Week 1: map service areas, job types, booking rules, emergency definitions and escalation paths.",
      "Week 2: own a limited lead-response and booking queue under office review.",
      "Week 3: add estimate follow-up, customer reminders and CRM cleanup.",
      "Week 4: review speed-to-lead, booking accuracy, missed calls, open estimates and escalation quality."
    ],
    metrics: ["Speed to lead", "Calls answered or returned", "Bookings created", "Scheduling corrections", "Open estimates without follow-up", "No-show or failed-visit rate", "CRM records without next action", "Customer follow-ups completed"]
  }
};

export function industrySeoTitle(industry: IndustryPage) {
  const label = INDUSTRY_SEO_CONTENT[industry.slug]?.seoLabel || industry.label;
  return `Virtual Assistant Services for ${label}`;
}

export function industryMetaDescription(industry: IndustryPage) {
  const custom = INDUSTRY_SEO_CONTENT[industry.slug]?.metaDescription;
  if (custom) return custom;
  const tasks = industry.workflows.slice(0, 3).join(", ");
  return `Virtual Assistant services for ${industry.audience}. Delegate ${tasks} with vetted talent matched to your tools, hours and workflow.`;
}

export function industryHeroIntro(industry: IndustryPage) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.heroIntro || industry.intro;
}

export function industryWorkflowDescription(industry: IndustryPage, workflow: string) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.workflowDetails?.[workflow]
    || `Give ${workflow} a clear owner. Document the source information, expected output, turnaround time and escalation rule, then keep the result visible in the system your team already uses.`;
}

export function industryToolDescription(industry: IndustryPage, tool: string) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.toolDetails?.[tool]
    || `Use ${tool} only where it is part of the real workflow. Test the candidate on the tasks they will perform rather than treating software names as proof of experience.`;
}

export function industryFirst30Days(industry: IndustryPage) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.first30Days || [
    `Week 1: document the first workflows, tools, access rules and escalation points for ${industry.audience}.`,
    "Week 2: let the Virtual Assistant run a narrow set of recurring tasks under close review.",
    "Week 3: increase ownership only where accuracy, communication and follow-through are consistent.",
    "Week 4: review turnaround time, backlog, quality and exceptions before expanding the role."
  ] as const;
}

export function industryMetrics(industry: IndustryPage) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.metrics || [
    "Response time",
    "Tasks completed on time",
    "Items waiting on follow-up",
    "Records requiring correction",
    "Exceptions escalated correctly",
    "Backlog at the end of the week"
  ];
}
