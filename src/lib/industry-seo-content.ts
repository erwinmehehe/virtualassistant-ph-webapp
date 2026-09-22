import type { IndustryPage } from "@/lib/industries";

export type IndustrySeoEnhancement = {
  seoLabel?: string;
  heroIntro?: string;
  workflowDetails?: Record<string, string>;
  toolDetails?: Record<string, string>;
  first30Days?: readonly [string, string, string, string];
  metrics?: readonly string[];
};

export const INDUSTRY_SEO_CONTENT: Record<string, IndustrySeoEnhancement> = {
  "law-firms": {
    seoLabel: "Law Firms & Lawyers",
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
  },
  "professional-services-growth": {
    heroIntro: "Professional-services teams lose billable and growth time when client onboarding, CRM upkeep, research and coordination sit between meetings. A Virtual Assistant can own those recurring workflows so consultants and growth leads stay focused on delivery, relationships and decisions."
  },
  "small-business": {
    heroIntro: "Small-business owners often become the default owner of every inbox, follow-up, spreadsheet and reminder. A Virtual Assistant can take over the repeatable admin layer while the owner keeps pricing, customer exceptions and business decisions."
  },
  "startups": {
    heroIntro: "Early-stage teams need execution without adding another layer of management. A Virtual Assistant can own founder admin, research, CRM upkeep, recruiting coordination and recurring customer follow-up while product, hiring and commercial decisions stay with the core team."
  },
  "construction-companies": {
    heroIntro: "Construction teams lose office time when estimate follow-up, project documents, vendor coordination and customer updates are spread across inboxes and job systems. A Virtual Assistant can keep those administrative queues moving while field, pricing and technical decisions stay with the contractor."
  },
  "insurance-agencies": {
    heroIntro: "Insurance agencies run on accurate records, timely renewal activity and disciplined follow-up. A Virtual Assistant can manage the administrative queues around leads, appointments, documents and renewals while licensed advice, binding authority and coverage decisions remain with authorized staff."
  },
  "accountants-cpas": {
    heroIntro: "Accounting firms lose production time when client documents, calendars, files and routine billing administration are incomplete or late. A Virtual Assistant can keep those workflows organized so accountants spend more time on review, advisory work and regulated decisions."
  },
  "coaches": {
    heroIntro: "Coaches and consultants need a dependable client-operations layer behind delivery. A Virtual Assistant can own scheduling, onboarding, reminders, CRM updates and program administration so the expert can focus on sessions, strategy and client outcomes."
  },
  "dental-practices": {
    heroIntro: "Dental practices need reliable front-office follow-through without moving clinical responsibility outside the practice. A Virtual Assistant can support scheduling, recalls, reminders, insurance administration and billing follow-up within clear privacy and escalation rules."
  },
  "photographers-creatives": {
    heroIntro: "Creative businesses often lose selling and production time to enquiries, scheduling, onboarding and post-project administration. A Virtual Assistant can keep the client journey organized from first enquiry through delivery while creative direction and final client commitments stay with the studio."
  },
  "entrepreneurs": {
    heroIntro: "Founder-led businesses accumulate dozens of small recurring tasks that interrupt higher-value work. A Virtual Assistant can own the operating rhythm around inboxes, calendars, research, CRM updates and coordination while the founder keeps priorities and key decisions."
  },
  "real-estate-investors": {
    heroIntro: "Real estate investors need consistent lead follow-up and clean pipeline data long before an acquisition decision is made. A Virtual Assistant can own list research, seller follow-up, CRM updates and appointment setting while offers, negotiation and investment decisions stay with the investor."
  },
  "ecommerce-stores": {
    heroIntro: "Ecommerce teams need accurate catalog, order and customer workflows every day. A Virtual Assistant can own product updates, support queues, returns administration and store QA while pricing, supplier commitments and policy exceptions stay with the business."
  },
  "therapists": {
    heroIntro: "Therapy and mental-health practices need calm, reliable administrative support without blurring clinical boundaries. A Virtual Assistant can manage scheduling, intake follow-up, reminders, waitlists and routine billing administration while clinical and crisis decisions stay with qualified professionals."
  },
  "banking-financial-services": {
    heroIntro: "Financial-services teams need disciplined administration, strong access controls and a clear audit trail. A Virtual Assistant can support document follow-up, CRM maintenance, scheduling and reporting while advice, approvals and regulated activity stay with authorized professionals."
  },
  "construction-estimating-tender-desk": {
    heroIntro: "Estimating teams lose capacity when take-offs, supplier RFQs, pricing sheets and tender documents are assembled manually across multiple systems. An outsourced tender desk can prepare the package and track revisions while your estimator or business owner keeps final pricing and submission authority."
  },
  "accounting-firms-month-end": {
    heroIntro: "Accounting firms feel margin pressure when month-end production and client document chasing consume senior review capacity. A dedicated production desk can prepare reconciliations, workpapers and supporting schedules while registered professionals retain review, advisory and regulated responsibilities."
  },
  "ndis-providers": {
    heroIntro: "NDIS providers need accurate claims administration and participant records without losing visibility across rejected claims, remittances and service agreements. A dedicated support desk can run the administrative workflow while provider approvals and participant-care decisions remain internal."
  },
  "mortgage-broker-loan-processing": {
    heroIntro: "Mortgage brokers lose client-facing time when every application needs document chasing, data entry and lender-condition follow-up. A processing desk can keep files moving from application through settlement while brokers retain advice, credit discussions and approval decisions."
  },
  "smsf-production": {
    heroIntro: "SMSF teams need clean production files before accountants and auditors can review them efficiently. A production support role can organize source documents, reconcile activity and prepare workpapers while technical judgments, compliance review and sign-off remain with qualified professionals."
  },
  "strata-management-administration": {
    heroIntro: "Strata portfolios create recurring administrative deadlines around meetings, notices, records, levies and follow-up. A dedicated support role can prepare packs, update registers and run approved correspondence while the strata manager retains decisions, approvals and statutory responsibility."
  },
  "property-management-maintenance-coordination": {
    heroIntro: "Property-management maintenance breaks down when tenant requests, contractor updates and work orders live in separate inboxes. A maintenance coordinator can keep each request moving from intake to completion while managers retain urgency, authorization and property-level decisions."
  },
  "allied-health-referral-billing": {
    heroIntro: "Allied-health clinics need referral, scheduling and billing administration to move reliably between appointments. A support desk can keep patient records, follow-up and billing workflows current while clinical interpretation and practitioner decisions remain with qualified staff."
  },
  "trades-service-administration": {
    heroIntro: "Field-service businesses lose margin when calls are not booked, technicians lack job context or completed work sits uninvoiced. A service-administration role can keep jobs moving from enquiry to closeout while technical diagnosis, field safety and pricing authority stay with the business."
  },
  "bim-revit-production": {
    heroIntro: "Architecture and engineering teams often need more production capacity without moving design authority. A BIM support role can process approved markups, model updates, sheets and coordination outputs while professional judgment and final issue remain with qualified project staff."
  },
  "recruitment-candidate-sourcing": {
    heroIntro: "Recruiters lose selling and assessment time when consultants have to build every search, clean every CRM record and chase every scheduling task themselves. A sourcing desk can keep qualified pipelines moving while candidate assessment, client advice and hiring decisions stay with recruiters."
  },
  "insurance-broker-renewal-desk": {
    heroIntro: "Insurance brokers need renewal files complete before advice and placement decisions begin. A renewal desk can chase approved information, update broking systems and prepare factual comparison schedules while licensed recommendations and binding decisions remain with the broker."
  }
  "nonprofits": {
    seoLabel: "Nonprofits & Charities",
    heroIntro: "Nonprofit teams lose time when donor records, volunteer coordination, event administration, newsletters and recurring operations are split across inboxes and spreadsheets. A Virtual Assistant can own that administrative layer while fundraising strategy, governance, financial authority and sensitive beneficiary decisions stay with accountable staff.",
    workflowDetails: {
      "donor CRM updates": "Keep donor contact details, interactions, campaign tags, notes and follow-up fields current so development staff can trust the CRM instead of rebuilding history from email.",
      "volunteer coordination": "Track volunteer availability, schedules, confirmations and routine communication while safeguarding personal information and escalating issues that require staff judgment.",
      "event administration": "Coordinate approved invitations, attendee lists, reminders, venue or supplier follow-up and post-event administration against a shared checklist.",
      "newsletter preparation": "Prepare approved newsletter content, formatting, links, audience segments and send checklists while final messaging and fundraising claims remain with the organization.",
      "research": "Compile publicly available grant, partner, donor or program information from approved sources and document where each item came from.",
      "calendar and inbox support": "Triage routine correspondence, schedule meetings, create reminders and route sensitive or strategic messages to the appropriate staff member.",
      "document organization": "Maintain naming, folders, templates and version control for recurring operational documents while restricting access to sensitive records.",
      "report preparation": "Prepare administrative summaries for donor activity, volunteers, events and open tasks so managers can focus on exceptions and decisions."
    },
    toolDetails: {
      "Salesforce": "Donor or stakeholder CRM records, activities, campaigns and follow-up.",
      "HubSpot": "Contact records, outreach tracking, forms and marketing administration.",
      "Mailchimp": "Newsletter builds, audience administration and campaign QA.",
      "Canva": "Templated event, newsletter and social assets from approved brand materials.",
      "Google Workspace": "Email, calendars, documents, spreadsheets and shared operational records.",
      "Microsoft 365": "Email, calendars, documents and team coordination."
    },
    first30Days: [
      "Week 1: map donor, volunteer, event and communication workflows plus privacy and approval boundaries.",
      "Week 2: own a limited CRM-cleanup or coordination queue with staff review.",
      "Week 3: add newsletter, event or research administration once record accuracy is consistent.",
      "Week 4: review CRM quality, overdue follow-up, volunteer communication and unresolved exceptions."
    ],
    metrics: ["Donor records with a next action", "CRM records missing key fields", "Volunteer confirmations completed", "Event checklist items overdue", "Newsletter QA corrections", "Research items with source notes", "Inbox items awaiting ownership", "Recurring admin backlog"]
  },
};

export function industrySeoTitle(industry: IndustryPage) {
  return industry.metaTitle;
}

export function industryMetaDescription(industry: IndustryPage) {
  return industry.metaDescription;
}

export function industryHeroIntro(industry: IndustryPage) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.heroIntro || industry.intro;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function derivedWorkflowDescription(industry: IndustryPage, workflow: string) {
  const w = workflow.toLowerCase();
  if (/schedule|calendar|appointment|rostering/.test(w)) return `Own ${workflow} using the team's approved availability, job or appointment rules. Confirm changes, keep the shared system current and escalate conflicts or exceptions that require an internal decision.`;
  if (/crm|record|data entry|database/.test(w)) return `Keep ${workflow} accurate enough that ${industry.audience} can rely on the system without rebuilding context from inboxes. Update required fields, notes, status and next actions, then flag missing or contradictory information.`;
  if (/lead|prospect|inquiry|enquiry|follow-up|outreach/.test(w)) return `Run ${workflow} from an approved queue or cadence. Capture the response, record the next step and route qualified, sensitive or unusual cases to the person responsible for the commercial decision.`;
  if (/document|file|workpaper|pack|agreement|supporting/.test(w)) return `Prepare and maintain ${workflow} using the team's naming, version and review rules. Track what is missing, keep the current version easy to find and send anything requiring professional judgment for review.`;
  if (/billing|invoice|payment|reconciliation|accounts|payroll|journal|financial/.test(w)) return `Support ${workflow} by preparing records, matching source information and maintaining an exception list. Keep approvals, payment authority, accounting judgments and regulated decisions with authorized staff.`;
  if (/report|tracking|register|status/.test(w)) return `Maintain ${workflow} as a management view, not a retrospective cleanup exercise. Keep statuses current, identify overdue items and make blockers visible so managers can act on exceptions quickly.`;
  if (/research|take-off|quantity|property research|candidate|sourcing/.test(w)) return `Complete ${workflow} against a written brief and record the source or evidence behind the result. Separate factual research from recommendations or decisions that belong to the client team.`;
  if (/customer|client|patient|tenant|participant|owner/.test(w)) return `Handle ${workflow} using approved scripts, service standards and escalation rules. Document each interaction and move complaints, clinical issues, regulated questions or policy exceptions to the appropriate internal owner.`;
  if (/coordination|vendor|contractor|technician|subcontractor|settlement/.test(w)) return `Coordinate ${workflow} across the people and systems involved, confirm dates and outstanding items, and keep the next owner visible. Do not make commitments outside the authority defined by ${industry.audience}.`;
  if (/marketing|content|social|email campaign/.test(w)) return `Run the administrative side of ${workflow}: prepare approved assets, schedule activity, update trackers and report completion. Final positioning, claims, budget and publishing decisions stay with the responsible marketer or owner.`;
  return `Own ${workflow} as a documented recurring process for ${industry.audience}. Keep the source information, status, completion evidence and exceptions visible so the work can be reviewed without chasing private messages.`;
}

export function industryWorkflowDescription(industry: IndustryPage, workflow: string) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.workflowDetails?.[workflow] || derivedWorkflowDescription(industry, workflow);
}

export function industryToolDescription(industry: IndustryPage, tool: string) {
  const custom = INDUSTRY_SEO_CONTENT[industry.slug]?.toolDetails?.[tool];
  if (custom) return custom;
  const index = Math.max(0, industry.tools.indexOf(tool));
  const primary = industry.workflows[index % industry.workflows.length];
  const secondary = industry.workflows[(index + 1) % industry.workflows.length];
  return `Use ${tool} for the parts of the workflow it actually supports, especially ${primary} and ${secondary}. In the interview, ask the candidate to show what they changed, how they checked the result and what they would escalate.`;
}

export function industryFirst30Days(industry: IndustryPage) {
  return INDUSTRY_SEO_CONTENT[industry.slug]?.first30Days || [
    `Week 1: map ${industry.workflows[0]}, ${industry.workflows[1]} and the access needed in ${industry.tools.slice(0, 2).join(" and ")}.`,
    `Week 2: let the Virtual Assistant own ${industry.workflows[0]} and ${industry.workflows[1]} under close review, with every exception documented.`,
    `Week 3: add ${industry.workflows[2]} and ${industry.workflows[3] || industry.workflows[0]} only after the first workflows are accurate and predictable.`,
    `Week 4: review turnaround, rework, backlog and escalation quality for ${industry.audience} before expanding the role.`
  ] as const;
}

export function industryMetrics(industry: IndustryPage) {
  const selected = industry.workflows.slice(0, 5).map((workflow) => `${sentenceCase(workflow)} completed on time`);
  return INDUSTRY_SEO_CONTENT[industry.slug]?.metrics || [
    ...selected,
    "Items returned for correction",
    "Exceptions escalated to the right owner",
    "Open work without a documented next action"
  ];
}
