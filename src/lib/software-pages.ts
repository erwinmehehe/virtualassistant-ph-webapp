// Software-focused SEO landing pages for VirtualAssistant.com.ph

export type SoftwareSeoPage = {
  slug: string;
  locale?: "en-AU" | "en-GB";
  name: string;
  software: string;
  aliases?: string[];
  category: string;
  directoryCategory:
    | "Administrative Support"
    | "Bookkeeping & Finance"
    | "Customer Service"
    | "Dental & Healthcare"
    | "Ecommerce"
    | "Executive Assistance"
    | "Lead Generation & Sales"
    | "Marketing & Social Media"
    | "Phone & Reception"
    | "Real Estate"
    | "SEO"
    | "Video Editing & Creative"
    | "Web & WordPress";
  primaryKeyword: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  focus: string;
  workflows: string[];
  tasks: string[];
  bestFor: string[];
  outcomes: string[];
  hiringNotes: string[];
  relatedServiceSlugs: string[];
  relatedIndustrySlugs: string[];
};

export function softwareSeoTitle(page: SoftwareSeoPage) {
  return page.metaTitle;
}

export function softwareSeoDescription(page: SoftwareSeoPage) {
  return page.metaDescription;
}

export function softwareSeoH1(page: SoftwareSeoPage) {
  return page.metaTitle;
}

export const softwarePages: SoftwareSeoPage[] = [
  // --- 1. ApplyOnline ---
  {
    slug: "applyonline",
    locale: "en-AU",
    name: "ApplyOnline Virtual Assistant",
    software: "ApplyOnline",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "applyonline virtual assistant philippines",
    metaTitle: "ApplyOnline Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based ApplyOnline Virtual Assistants for application data entry, document uploading. Get support from vetted Filipino remote professionals.",
    h1: "Keep ApplyOnline Applications Moving Without Loading Up Your Brokers",
    intro:
      "A trained assistant can prepare application data, organise supporting documents and keep lender conditions visible inside your mortgage workflow. Your broker retains responsibility for credit advice, product selection and final submission approval.",
    focus: "mortgage application production in applyonline",
    workflows: [
      "receive the approved loan application checklist",
      "collect and organise borrower supporting documents",
      "enter borrower and application data into applyonline",
      "attach and classify supporting documents",
      "prepare the application for broker review",
      "record lender requests and outstanding conditions",
      "update application milestones after broker instructions",
      "track the file through approval and settlement"
    ],
    tasks: [
      "application data entry",
      "document uploading",
      "borrower file organisation",
      "lender condition tracking",
      "application status updates",
      "settlement tracking",
      "crm administration"
    ],
    bestFor: [
      "mortgage brokers",
      "finance brokerages",
      "loan processing teams",
      "residential lending businesses"
    ],
    outcomes: [
      "Applications reach broker review with less manual preparation outstanding.",
      "Supporting documents and lender conditions stay easier to track.",
      "Brokers spend more time advising clients instead of maintaining application files."
    ],
    hiringNotes: [
      "Use written submission checklists and naming conventions for every application.",
      "Give assistants only the borrower and lender access needed for assigned files.",
      "The licensed or authorised local broker retains final credit advice, product recommendations, submission approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "mortgage-loan-processing-virtual-assistant",
      "admin-inbox",
      "customer-service"
    ],
    relatedIndustrySlugs: [
      "mortgage-broker-loan-processing",
      "real-estate-agents"
    ]
  },

  // --- 2. Salestrekker ---
  {
    slug: "salestrekker",
    locale: "en-AU",
    name: "Salestrekker Virtual Assistant",
    software: "Salestrekker",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "salestrekker virtual assistant philippines",
    metaTitle: "Salestrekker Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Salestrekker Virtual Assistants for crm data entry, pipeline updates. Get support from vetted Filipino remote professionals.",
    h1: "Keep Your Salestrekker Pipeline Current From Lead to Settlement",
    intro:
      "Your mortgage CRM should show exactly where every opportunity and application stands. A Salestrekker Virtual Assistant keeps records, tasks, documents and milestones current while brokers handle advice and client decisions.",
    focus: "mortgage crm and pipeline administration",
    workflows: [
      "create or update the client opportunity",
      "record approved contact and loan information",
      "maintain document and task checklists",
      "update application and lender milestones",
      "record outstanding client requirements",
      "maintain broker follow-up tasks",
      "track approval and settlement dates",
      "close or archive completed workflows"
    ],
    tasks: [
      "crm data entry",
      "pipeline updates",
      "task management",
      "document tracking",
      "client follow-up administration",
      "settlement updates",
      "database cleanup"
    ],
    bestFor: [
      "mortgage brokerages",
      "finance brokers",
      "loan processing teams"
    ],
    outcomes: [
      "Broker pipelines reflect the real status of each client file.",
      "Outstanding tasks become easier to assign and follow through.",
      "Client and application information stays more consistent across the team."
    ],
    hiringNotes: [
      "Define CRM stages and required fields before delegating pipeline administration.",
      "Use task templates for recurring loan-processing workflows.",
      "The authorised local broker retains final lending advice, recommendations, approvals and regulatory responsibility."
    ],
    relatedServiceSlugs: [
      "mortgage-loan-processing-virtual-assistant",
      "admin-inbox"
    ],
    relatedIndustrySlugs: [
      "mortgage-broker-loan-processing"
    ]
  },

  // --- 3. BrokerEngine ---
  {
    slug: "brokerengine",
    locale: "en-AU",
    name: "BrokerEngine Virtual Assistant",
    software: "BrokerEngine",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "brokerengine virtual assistant philippines",
    metaTitle: "BrokerEngine Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based BrokerEngine Virtual Assistants for workflow maintenance, task updates. Get support from vetted Filipino remote professionals.",
    h1: "Turn BrokerEngine Into a Consistent Mortgage Processing Workflow",
    intro:
      "BrokerEngine works best when every task, milestone and client requirement is kept current. A mortgage Virtual Assistant can maintain those production workflows so brokers see what needs attention without managing every administrative step.",
    focus: "mortgage workflow administration",
    workflows: [
      "open the client workflow",
      "assign approved processing tasks",
      "track required client documents",
      "update loan milestones",
      "record lender conditions",
      "maintain follow-up dates",
      "prepare files for broker review",
      "complete post-settlement administration"
    ],
    tasks: [
      "workflow maintenance",
      "task updates",
      "document tracking",
      "client follow-up",
      "lender condition administration",
      "milestone updates",
      "file preparation"
    ],
    bestFor: [
      "mortgage brokers",
      "loan processing businesses",
      "finance brokerages"
    ],
    outcomes: [
      "Processing tasks remain visible instead of being buried in inboxes.",
      "Brokers receive cleaner files before review.",
      "Application workflows become easier to standardise across the business."
    ],
    hiringNotes: [
      "Build standard workflows before assigning live client files.",
      "Create clear escalation points for lender issues and incomplete applications.",
      "The licensed or authorised mortgage professional retains advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "mortgage-loan-processing-virtual-assistant",
      "admin-inbox"
    ],
    relatedIndustrySlugs: [
      "mortgage-broker-loan-processing"
    ]
  },

  // --- 4. PropertyMe ---
  {
    slug: "propertyme",
    locale: "en-AU",
    name: "PropertyMe Virtual Assistant",
    software: "PropertyMe",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "propertyme virtual assistant philippines",
    metaTitle: "PropertyMe Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based PropertyMe Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep PropertyMe Maintenance Jobs Moving From Request to Completion",
    intro:
      "A PropertyMe Virtual Assistant can turn incoming maintenance requests into organised jobs, work orders and follow-up queues. Your property managers retain authority over tenancy decisions, spending approvals and compliance matters.",
    focus: "propertyme maintenance and portfolio administration",
    workflows: [
      "receive and log the tenant request",
      "record photos and access details",
      "categorise the maintenance request",
      "create the work order",
      "request approved contractor quotes",
      "coordinate tenant and contractor access",
      "update job status",
      "record completion information",
      "prepare the job for manager closure"
    ],
    tasks: [
      "maintenance request logging",
      "work order creation",
      "contractor follow-up",
      "tenant communication",
      "quote tracking",
      "property record updates",
      "invoice matching"
    ],
    bestFor: [
      "property management agencies",
      "real estate agencies",
      "residential property managers"
    ],
    outcomes: [
      "Maintenance requests enter a visible workflow sooner.",
      "Property managers spend less time chasing contractors.",
      "Tenants receive more consistent administrative updates."
    ],
    hiringNotes: [
      "Document urgency rules and contractor approval limits.",
      "Escalate emergency repairs and disputed responsibility immediately.",
      "The licensed or authorised local property professional retains final tenancy advice, spending decisions, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "property-management-maintenance-virtual-assistant",
      "customer-service"
    ],
    relatedIndustrySlugs: [
      "property-management-maintenance-coordination",
      "property-management-companies"
    ]
  },

  // --- 5. Console Cloud ---
  {
    slug: "console-cloud",
    locale: "en-AU",
    name: "Console Cloud Virtual Assistant",
    software: "Console Cloud",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "console cloud virtual assistant philippines",
    metaTitle: "Console Cloud Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Console Cloud Virtual Assistants for property data updates, tenant administration. Get support from vetted Filipino remote professionals.",
    h1: "Keep Console Cloud Property Workflows Up to Date Every Day",
    intro:
      "Property managers need accurate records and visible task queues before they can manage a portfolio properly. A Console Cloud Virtual Assistant maintains routine property, tenant and maintenance administration while local managers handle decisions and exceptions.",
    focus: "console cloud property administration",
    workflows: [
      "review assigned portfolio tasks",
      "update tenant and property records",
      "log maintenance requests",
      "create approved maintenance jobs",
      "coordinate contractor follow-up",
      "record communication notes",
      "track outstanding actions",
      "prepare exception lists for the property manager"
    ],
    tasks: [
      "property data updates",
      "tenant administration",
      "maintenance coordination",
      "contractor follow-up",
      "task management",
      "communication logging",
      "portfolio administration"
    ],
    bestFor: [
      "property management agencies",
      "residential real estate businesses",
      "portfolio managers"
    ],
    outcomes: [
      "Portfolio records stay easier to trust.",
      "Open maintenance and tenant tasks remain visible.",
      "Managers receive clearer queues of work requiring professional attention."
    ],
    hiringNotes: [
      "Standardise task categories and escalation rules.",
      "Restrict delegated spending and contractor approvals.",
      "The authorised local property professional retains final tenancy decisions, advice, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "property-management-maintenance-virtual-assistant",
      "admin-inbox"
    ],
    relatedIndustrySlugs: [
      "property-management-maintenance-coordination"
    ]
  },

  // --- 6. ServiceM8 ---
  {
    slug: "servicem8",
    locale: "en-AU",
    name: "ServiceM8 Virtual Assistant",
    software: "ServiceM8",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "servicem8 virtual assistant philippines",
    metaTitle: "ServiceM8 Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based ServiceM8 Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep ServiceM8 Jobs Moving From Enquiry to Payment",
    intro:
      "A ServiceM8 Virtual Assistant can run the repeatable office workflow around your field team: clean job records, accurate scheduling, quote follow-up, completion checks, invoice administration and automation QA. Your technicians and authorised managers keep technical, pricing, safety and finance decisions.",
    focus: "servicem8 job and dispatch administration",
    workflows: [
      "receive the customer enquiry and check the existing client record",
      "create the job as Quote or Work Order under the approved workflow",
      "use Queues only when the job is genuinely waiting on something",
      "schedule the right technician using capability, travel, duration and access rules",
      "send approved booking confirmations and customer updates",
      "prepare and follow approved quotes without changing scope or price",
      "track online quote acceptance and move the next action into scheduling",
      "check technician notes, photos, checklists and Forms before completion",
      "prepare approved invoices and monitor payment status",
      "audit booking, quote and payment automations for replies, acceptance and exceptions"
    ],
    tasks: [
      "client and job-card maintenance",
      "job status and Queue administration",
      "dispatch and technician scheduling",
      "booking communication",
      "quote preparation and follow-up",
      "checklist and Form follow-up",
      "completion evidence review",
      "invoice and payment administration",
      "automation QA",
      "accounting exception handoff"
    ],
    bestFor: [
      "electricians",
      "plumbers",
      "hvac companies",
      "solar installers",
      "field service businesses"
    ],
    outcomes: [
      "Jobs show the correct operational state instead of getting lost in custom admin labels.",
      "Scheduling reflects technician capability, travel and customer constraints.",
      "Accepted quotes, return visits and missing field paperwork trigger the right next action.",
      "Completed jobs move toward invoicing with fewer avoidable delays.",
      "Quote and payment reminders are less likely to fire after the customer has already replied, accepted or paid."
    ],
    hiringNotes: [
      "Document when new work starts as Quote versus Work Order and how the business uses ServiceM8 Queues.",
      "Define technician capabilities, service areas, booking durations, travel rules and urgent-job escalation.",
      "Set clear authority for quote sending, pricing changes, invoice issue, credits, write-offs and payment disputes.",
      "Require the VA to inspect the job Diary, checklist/Form evidence and return-work notes before marking work ready for invoicing.",
      "Review booking, quote-follow-up and payment-follow-up automation against customer replies, acceptance and payment exceptions.",
      "Keep technical diagnosis, scope changes, trade compliance, safety decisions and accounting judgment with authorised staff."
    ],
    relatedServiceSlugs: [
      "trades-service-administration-virtual-assistant",
      "phone-receptionist",
      "bookkeeping"
    ],
    relatedIndustrySlugs: [
      "trades-service-administration"
    ]
  },

  // --- 7. simPRO ---
  {
    slug: "simpro",
    locale: "en-AU",
    name: "simPRO Virtual Assistant",
    software: "simPRO",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "simpro virtual assistant philippines",
    metaTitle: "simPRO Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based simPRO Virtual Assistants for job entry, resource scheduling. Get support from vetted Filipino remote professionals.",
    h1: "Run the simPRO Back Office Behind Your Field Team",
    intro:
      "A simPRO Virtual Assistant handles repeatable office workflows around jobs, technicians, customers and paperwork. Your operations and trade professionals retain technical, commercial and compliance authority.",
    focus: "simpro service and job administration",
    workflows: [
      "create the customer and site record",
      "open the approved job",
      "schedule field resources",
      "maintain job notes",
      "track purchase and job documents",
      "follow technician paperwork",
      "prepare invoice information",
      "update job status",
      "close completed administration"
    ],
    tasks: [
      "job entry",
      "resource scheduling",
      "customer administration",
      "purchase order tracking",
      "technician follow-up",
      "invoice administration",
      "database maintenance"
    ],
    bestFor: [
      "electrical contractors",
      "hvac businesses",
      "plumbing businesses",
      "commercial service companies"
    ],
    outcomes: [
      "Office workflows keep pace with field activity.",
      "Missing documentation becomes visible before billing.",
      "Managers spend less time maintaining individual job records."
    ],
    hiringNotes: [
      "Document job stages and role permissions.",
      "Escalate variations and technical decisions to local staff.",
      "The licensed or authorised local professional retains final technical decisions, advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "trades-service-administration-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "trades-service-administration"
    ]
  },

  // --- 8. AroFlo ---
  {
    slug: "aroflo",
    locale: "en-AU",
    name: "AroFlo Virtual Assistant",
    software: "AroFlo",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "aroflo virtual assistant philippines",
    metaTitle: "AroFlo Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based AroFlo Virtual Assistants for task creation, scheduling, customer communication. Get support from vetted Filipino remote professionals.",
    h1: "Keep AroFlo Jobs Organised Before and After the Technician Visit",
    intro:
      "AroFlo can hold the operational workflow for busy field teams, but only when job information stays current. A Virtual Assistant can maintain task records, schedules, paperwork and invoice preparation while qualified staff retain trade authority.",
    focus: "aroflo field service administration",
    workflows: [
      "create the client and task record",
      "enter approved job information",
      "schedule assigned resources",
      "update customer communication",
      "track purchase and material records",
      "follow missing technician documentation",
      "prepare billing information",
      "update completion status"
    ],
    tasks: [
      "task creation",
      "scheduling",
      "customer communication",
      "document follow-up",
      "purchase administration",
      "billing support",
      "record maintenance"
    ],
    bestFor: [
      "electrical businesses",
      "maintenance contractors",
      "plumbing companies",
      "multi-trade businesses"
    ],
    outcomes: [
      "Jobs remain easier to track from booking to billing.",
      "Missing field documentation is followed up sooner.",
      "Office staff have cleaner operational records."
    ],
    hiringNotes: [
      "Define task types and delegated workflow permissions.",
      "Keep technical changes and scope decisions with qualified staff.",
      "The licensed local trade professional retains final advice, technical approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "trades-service-administration-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "trades-service-administration"
    ]
  },

  // --- 9. Tradify ---
  {
    slug: "tradify",
    locale: "en-AU",
    name: "Tradify Virtual Assistant",
    software: "Tradify",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "tradify virtual assistant philippines",
    metaTitle: "Tradify Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Tradify Virtual Assistants for customer setup, job creation, quote administration. Get support from vetted Filipino remote professionals.",
    h1: "Move Tradify Jobs From Enquiry to Invoice With Less Office Work",
    intro:
      "A Tradify Virtual Assistant can maintain the administrative workflow around quotes, jobs, appointments and invoices. Your trade team stays focused on field work and retains control of pricing, scope and technical decisions.",
    focus: "tradify job and quote administration",
    workflows: [
      "create the customer record",
      "open the job",
      "record approved scope details",
      "prepare quote information",
      "schedule the technician",
      "update job status",
      "collect completion details",
      "prepare invoice information"
    ],
    tasks: [
      "customer setup",
      "job creation",
      "quote administration",
      "scheduling",
      "customer updates",
      "invoice preparation",
      "job status maintenance"
    ],
    bestFor: [
      "small trade businesses",
      "electricians",
      "plumbers",
      "builders",
      "maintenance contractors"
    ],
    outcomes: [
      "Administrative work moves alongside field jobs.",
      "Quotes and invoices are prepared with fewer delays.",
      "Owners spend less time updating jobs after hours."
    ],
    hiringNotes: [
      "Document quote and booking templates.",
      "Do not delegate technical scope or unapproved pricing decisions.",
      "The licensed or authorised local trade professional retains final technical advice, pricing approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "trades-service-administration-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "trades-service-administration"
    ]
  },

  // --- 10. Cliniko ---
  {
    slug: "cliniko",
    locale: "en-AU",
    name: "Cliniko Virtual Assistant",
    software: "Cliniko",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "cliniko virtual assistant philippines",
    metaTitle: "Cliniko Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Cliniko Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Cliniko Front-Desk Work Moving Without Pulling Clinicians Into Admin",
    intro:
      "A Cliniko Virtual Assistant can handle defined non-clinical workflows such as appointment scheduling, patient record administration, reminders, secure forms, invoices, payments and routine follow-up. Clinicians retain responsibility for treatment notes, clinical decisions and patient care.",
    focus: "cliniko allied-health and practice administration",
    workflows: [
      "create or update the patient record from approved information",
      "book, reschedule or cancel the correct appointment type",
      "send or monitor approved confirmations and reminders",
      "manage secure patient-form requests and completion status",
      "record non-clinical communication and follow-up",
      "prepare or send approved invoices",
      "record approved payments and outstanding balances",
      "run recall and missed-appointment follow-up",
      "escalate privacy, billing, complaint or clinical exceptions"
    ],
    tasks: [
      "appointment scheduling",
      "patient record administration",
      "appointment reminders",
      "secure patient form administration",
      "invoice administration",
      "payment recording",
      "outstanding invoice follow-up",
      "recall and missed-appointment administration"
    ],
    bestFor: [
      "physiotherapy clinics",
      "occupational therapy practices",
      "speech pathology clinics",
      "psychology practices",
      "allied health clinics"
    ],
    outcomes: [
      "Practitioner calendars and patient follow-up stay more current.",
      "Routine front-desk work moves without exposing staff to unnecessary patient information.",
      "Invoices, payments and administrative exceptions reach the right owner sooner."
    ],
    hiringNotes: [
      "Use the lowest Cliniko security role that supports the assigned work; Scheduler may be enough for booking-only support, while broader front-desk finance work may require Receptionist access.",
      "Do not give a Virtual Assistant treatment-note or clinical access simply for convenience.",
      "Keep clinical decisions, treatment documentation, sensitive complaints, refunds outside policy, and privacy exceptions with the authorised practitioner or practice owner."
    ],
    relatedServiceSlugs: [
      "allied-health-referral-billing-virtual-assistant",
      "medical-virtual-assistant",
      "phone-receptionist",
      "medical-billing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "allied-health-referral-billing",
      "healthcare-dental",
      "medical-practices"
    ]
  },

  // --- 11. Halaxy ---
  {
    slug: "halaxy",
    locale: "en-AU",
    name: "Halaxy Virtual Assistant",
    software: "Halaxy",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "halaxy virtual assistant philippines",
    metaTitle: "Halaxy Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Halaxy Virtual Assistants for patient registration, appointment scheduling. Get support from vetted Filipino remote professionals.",
    h1: "Keep Halaxy Administration Moving Around Every Patient Visit",
    intro:
      "A Halaxy Virtual Assistant manages routine patient and practice administration before and after appointments. Clinicians retain responsibility for clinical care, advice and regulated decisions.",
    focus: "halaxy patient and billing administration",
    workflows: [
      "receive the patient or referral request",
      "create the patient record",
      "schedule the appointment",
      "record administrative referral information",
      "update appointment status",
      "prepare billing information",
      "track outstanding administrative actions",
      "run approved recall workflows"
    ],
    tasks: [
      "patient registration",
      "appointment scheduling",
      "referral administration",
      "billing support",
      "recall administration",
      "record maintenance"
    ],
    bestFor: [
      "allied health clinics",
      "psychology practices",
      "physiotherapy practices",
      "multidisciplinary clinics"
    ],
    outcomes: [
      "Patient records stay more complete.",
      "Administrative follow-ups are easier to track.",
      "Clinicians carry less routine practice administration."
    ],
    hiringNotes: [
      "Limit access according to the assistant's role.",
      "Create clear escalation rules for clinical questions.",
      "The licensed healthcare professional retains final advice, clinical approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "allied-health-referral-billing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "allied-health-referral-billing"
    ]
  },

  // --- 12. Power Diary ---
  {
    slug: "power-diary",
    locale: "en-AU",
    name: "Power Diary Virtual Assistant",
    software: "Power Diary",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "power diary virtual assistant philippines",
    metaTitle: "Power Diary Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Power Diary Virtual Assistants for appointment management, patient setup. Get support from vetted Filipino remote professionals.",
    h1: "Keep Your Power Diary Admin Queue Under Control",
    intro:
      "A Power Diary Virtual Assistant can maintain routine scheduling, records, referral dates, recalls and approved billing workflows. Clinical advice and treatment decisions remain with the qualified practitioner.",
    focus: "power diary practice administration",
    workflows: [
      "create the patient profile",
      "record referral information",
      "schedule appointments",
      "maintain appointment status",
      "prepare approved billing records",
      "run recall lists",
      "update administrative notes",
      "route clinical questions to the practitioner"
    ],
    tasks: [
      "appointment management",
      "patient setup",
      "referral tracking",
      "billing administration",
      "recall management",
      "practice data entry"
    ],
    bestFor: [
      "psychologists",
      "physiotherapists",
      "speech pathologists",
      "allied health clinics"
    ],
    outcomes: [
      "Scheduling and patient records stay more current.",
      "Recall and referral tasks remain visible.",
      "Practitioners have fewer administrative queues to manage."
    ],
    hiringNotes: [
      "Document booking and referral procedures.",
      "Keep sensitive clinical questions outside delegated administrative work.",
      "The licensed local practitioner retains final clinical advice, decisions, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "allied-health-referral-billing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "allied-health-referral-billing"
    ]
  },

  // --- 13. JobAdder ---
  {
    slug: "jobadder",
    locale: "en-AU",
    name: "JobAdder Virtual Assistant",
    software: "JobAdder",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "jobadder virtual assistant philippines",
    metaTitle: "JobAdder Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based JobAdder Virtual Assistants for candidate sourcing, crm cleanup. Get support from vetted Filipino remote professionals.",
    h1: "Keep JobAdder Filled With Candidates Your Recruiters Can Actually Work",
    intro:
      "A JobAdder Virtual Assistant can build candidate lists, maintain CRM records and move administrative sourcing workflows forward. Recruiters retain responsibility for candidate assessment, client advice and hiring recommendations.",
    focus: "jobadder candidate and crm administration",
    workflows: [
      "receive the approved role brief",
      "search existing candidate records",
      "add sourced candidates",
      "clean duplicate records",
      "update candidate information",
      "send approved outreach",
      "record responses",
      "schedule interviews",
      "update pipeline stages"
    ],
    tasks: [
      "candidate sourcing",
      "crm cleanup",
      "candidate data entry",
      "outreach administration",
      "screening administration",
      "interview scheduling",
      "pipeline maintenance"
    ],
    bestFor: [
      "recruitment agencies",
      "staffing firms",
      "executive search businesses",
      "talent acquisition teams"
    ],
    outcomes: [
      "Recruiters start with cleaner candidate pipelines.",
      "Candidate records are easier to reuse.",
      "Consultants spend less time maintaining the ATS."
    ],
    hiringNotes: [
      "Define candidate criteria and CRM stages.",
      "Use approved outreach and privacy procedures.",
      "The authorised recruiter or hiring professional retains final candidate assessment, recommendations, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "recruitment-candidate-sourcing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "recruitment-candidate-sourcing"
    ]
  },

  // --- 14. Bullhorn ---
  {
    slug: "bullhorn",
    locale: "en-AU",
    name: "Bullhorn Virtual Assistant",
    software: "Bullhorn",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "bullhorn virtual assistant philippines",
    metaTitle: "Bullhorn Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Bullhorn Virtual Assistants for candidate sourcing, database cleanup. Get support from vetted Filipino remote professionals.",
    h1: "Turn Bullhorn Into a Cleaner, More Usable Candidate Database",
    intro:
      "A Bullhorn Virtual Assistant handles the repeatable work that keeps candidate and vacancy records usable. Recruiters retain control of assessment, selection and client-facing recruitment advice.",
    focus: "bullhorn sourcing and database administration",
    workflows: [
      "review the vacancy brief",
      "search existing crm records",
      "source additional candidates",
      "check duplicate profiles",
      "enrich candidate records",
      "record approved outreach",
      "update responses",
      "schedule interviews"
    ],
    tasks: [
      "candidate sourcing",
      "database cleanup",
      "candidate enrichment",
      "pipeline updates",
      "outreach administration",
      "interview scheduling"
    ],
    bestFor: [
      "staffing agencies",
      "recruitment firms",
      "executive search firms"
    ],
    outcomes: [
      "Candidate records become easier to search.",
      "Recruiters receive better-prepared longlists.",
      "CRM maintenance consumes fewer consultant hours."
    ],
    hiringNotes: [
      "Create consistent data standards.",
      "Use approved candidate communication templates.",
      "The authorised recruiter retains final candidate judgment, recommendations, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "recruitment-candidate-sourcing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "recruitment-candidate-sourcing"
    ]
  },

  // --- 15. Vincere ---
  {
    slug: "vincere",
    locale: "en-AU",
    name: "Vincere Virtual Assistant",
    software: "Vincere",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "vincere virtual assistant philippines",
    metaTitle: "Vincere Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Vincere Virtual Assistants for candidate sourcing, talent mapping. Get support from vetted Filipino remote professionals.",
    h1: "Keep Vincere Pipelines Ready for Recruiter Action",
    intro:
      "A Vincere Virtual Assistant builds and maintains the administrative layer around candidate sourcing and vacancy pipelines. Recruiters keep control of qualification, client advice and placement decisions.",
    focus: "vincere candidate pipeline administration",
    workflows: [
      "receive candidate criteria",
      "search talent pools",
      "create longlists",
      "update candidate records",
      "remove duplicate information",
      "record outreach",
      "route responses",
      "schedule interviews",
      "maintain pipeline status"
    ],
    tasks: [
      "candidate sourcing",
      "talent mapping",
      "crm administration",
      "database cleanup",
      "pipeline updates",
      "interview scheduling"
    ],
    bestFor: [
      "recruitment agencies",
      "executive search firms",
      "specialist staffing businesses"
    ],
    outcomes: [
      "Candidate pipelines stay more current.",
      "Recruiters have less database administration.",
      "Sourcing work becomes easier to repeat across assignments."
    ],
    hiringNotes: [
      "Define sourcing and pipeline standards.",
      "Maintain candidate privacy procedures.",
      "The authorised recruiter or hiring professional retains final candidate assessment, advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "recruitment-candidate-sourcing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "recruitment-candidate-sourcing"
    ]
  },

  // --- 16. StrataMax ---
  {
    slug: "stratamax",
    locale: "en-AU",
    name: "StrataMax Virtual Assistant",
    software: "StrataMax",
    category: "Strata Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "stratamax virtual assistant philippines",
    metaTitle: "StrataMax Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based StrataMax Virtual Assistants for owner record updates, levy administration. Get support from vetted Filipino remote professionals.",
    h1: "Keep StrataMax Portfolios Ready for Meetings, Levies and Follow-Up",
    intro:
      "A StrataMax Virtual Assistant can maintain routine portfolio records, meeting preparation and authorised follow-up workflows. The local strata manager retains control of regulated decisions, advice and approvals.",
    focus: "stratamax portfolio administration",
    workflows: [
      "review portfolio deadlines",
      "update owner and committee records",
      "prepare levy administration",
      "assemble meeting information",
      "record approved correspondence",
      "update action registers",
      "run authorised arrears workflows",
      "prepare exceptions for manager review"
    ],
    tasks: [
      "owner record updates",
      "levy administration",
      "meeting pack preparation",
      "correspondence logging",
      "arrears administration",
      "action register updates"
    ],
    bestFor: [
      "strata management firms",
      "owners corporation managers",
      "body corporate managers"
    ],
    outcomes: [
      "Portfolio records remain easier to manage.",
      "Recurring meeting and levy administration becomes more consistent.",
      "Managers receive clearer lists of work needing professional review."
    ],
    hiringNotes: [
      "Define approved templates and arrears procedures.",
      "Escalate disputes and legal matters.",
      "The licensed or authorised local strata professional retains final decisions, advice, approvals and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "strata-management-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "strata-management-administration"
    ]
  },

  // --- 17. MRI Strata Master ---
  {
    slug: "strata-master",
    locale: "en-AU",
    name: "MRI Strata Master Virtual Assistant",
    software: "MRI Strata Master",
    category: "Strata Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "mri strata master virtual assistant philippines",
    metaTitle: "MRI Strata Master Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based MRI Strata Master Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Strata Master Administration Current Across Every Scheme",
    intro:
      "A Strata Master Virtual Assistant handles routine production work around records, meetings, correspondence and approved arrears workflows. Local strata professionals remain responsible for management decisions and compliance.",
    focus: "strata master portfolio administration",
    workflows: [
      "review scheme records",
      "update owner information",
      "prepare meeting documents",
      "maintain action items",
      "record approved correspondence",
      "run levy administration",
      "track authorised arrears follow-up",
      "prepare manager exception lists"
    ],
    tasks: [
      "scheme data maintenance",
      "meeting administration",
      "levy support",
      "arrears follow-up",
      "owner correspondence",
      "records management"
    ],
    bestFor: [
      "strata firms",
      "owners corporation businesses",
      "body corporate management teams"
    ],
    outcomes: [
      "Routine scheme administration stays more current.",
      "Meeting preparation becomes easier to standardise.",
      "Managers spend less time maintaining system records."
    ],
    hiringNotes: [
      "Document scheme workflows and templates.",
      "Escalate disputes, legal matters and unapproved financial decisions.",
      "The authorised local strata professional retains final advice, decisions, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "strata-management-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "strata-management-administration"
    ]
  },

  // --- 18. BGL Simple Fund 360 ---
  {
    slug: "bgl-simple-fund-360",
    locale: "en-AU",
    name: "BGL Simple Fund 360 Virtual Assistant",
    software: "BGL Simple Fund 360",
    category: "SMSF & Accounting",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "bgl simple fund 360 virtual assistant philippines",
    metaTitle: "BGL Simple Fund 360 Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based BGL Simple Fund 360 Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Clear More SMSF Production Work in Simple Fund 360",
    intro:
      "A Simple Fund 360 Virtual Assistant can handle defined production tasks such as coding, reconciliation, document organisation and workpaper preparation. Qualified accountants and auditors retain responsibility for review, advice and compliance decisions.",
    focus: "simple fund 360 smsf production",
    workflows: [
      "open the annual fund job",
      "collect fund source documents",
      "review imported transactions",
      "code routine transactions",
      "reconcile bank accounts",
      "reconcile investment activity",
      "prepare supporting workpapers",
      "record unresolved items",
      "prepare the file for accountant review"
    ],
    tasks: [
      "transaction coding",
      "bank reconciliation",
      "investment reconciliation",
      "workpaper preparation",
      "document management",
      "audit pack preparation"
    ],
    bestFor: [
      "smsf accounting firms",
      "smsf administrators",
      "public practice accountants"
    ],
    outcomes: [
      "More fund production work is completed before accountant review.",
      "Reconciliation issues surface earlier.",
      "Annual files reach review with better-organised supporting evidence."
    ],
    hiringNotes: [
      "Use written coding and workpaper standards.",
      "Escalate unusual transactions and unresolved balances.",
      "The qualified or registered local accountant, tax agent or auditor retains final advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "smsf-production-virtual-assistant",
      "bookkeeping"
    ],
    relatedIndustrySlugs: [
      "smsf-production"
    ]
  },

  // --- 19. Class Super ---
  {
    slug: "class-super",
    locale: "en-AU",
    name: "Class Super Virtual Assistant",
    software: "Class Super",
    category: "SMSF & Accounting",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "class super virtual assistant philippines",
    metaTitle: "Class Super Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Class Super Virtual Assistants for smsf coding, bank reconciliation. Get support from vetted Filipino remote professionals.",
    h1: "Move More Class Super Funds Through Production Before Review",
    intro:
      "A Class Super Virtual Assistant can prepare routine accounting production work before the accountant reviews the fund. Professional judgment, tax advice, audit opinions and compliance decisions remain with qualified local professionals.",
    focus: "class super smsf production",
    workflows: [
      "open the assigned fund",
      "collect supporting documents",
      "review transaction feeds",
      "code routine transactions",
      "reconcile cash accounts",
      "reconcile investments",
      "prepare supporting schedules",
      "record exceptions",
      "prepare the fund for review"
    ],
    tasks: [
      "smsf coding",
      "bank reconciliation",
      "investment reconciliation",
      "workpaper preparation",
      "document follow-up",
      "audit file preparation"
    ],
    bestFor: [
      "smsf accountants",
      "public practice firms",
      "smsf administration teams"
    ],
    outcomes: [
      "Production queues move faster.",
      "Review files contain more complete supporting work.",
      "Accountants spend less time on repetitive preparation."
    ],
    hiringNotes: [
      "Document firm accounting standards.",
      "Use reviewer checkpoints for exceptions.",
      "The qualified accountant, auditor or tax professional retains final advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "smsf-production-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "smsf-production"
    ]
  },

  // --- 20. Autodesk Revit ---
  {
    slug: "revit",
    locale: "en-AU",
    name: "Revit Virtual Assistant",
    software: "Autodesk Revit",
    category: "Architecture & Engineering",
    directoryCategory: "Administrative Support",
    primaryKeyword: "autodesk revit virtual assistant philippines",
    metaTitle: "Autodesk Revit Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Autodesk Revit Virtual Assistants for revit modelling, sheet production. Get support from vetted Filipino remote professionals.",
    h1: "Add Revit Production Capacity Without Moving Design Authority",
    intro:
      "A Revit Virtual Assistant can handle clearly documented modelling and drawing production from approved instructions and markups. Architects and engineers retain control of design intent, technical decisions and final approvals.",
    focus: "revit modelling and documentation production",
    workflows: [
      "receive the approved model and markup package",
      "review project standards",
      "update model elements",
      "prepare views and sheets",
      "update schedules and annotations",
      "create or edit approved families",
      "process redlines",
      "run documented model checks",
      "package updates for professional review"
    ],
    tasks: [
      "revit modelling",
      "sheet production",
      "schedule updates",
      "family editing",
      "redline processing",
      "bim documentation",
      "model housekeeping"
    ],
    bestFor: [
      "architecture firms",
      "structural engineering firms",
      "mep consultancies",
      "bim teams"
    ],
    outcomes: [
      "Senior staff spend less time on repetitive model production.",
      "Approved changes move into drawings faster.",
      "Documentation standards remain easier to maintain across projects."
    ],
    hiringNotes: [
      "Provide BIM standards, templates and controlled markups.",
      "Do not delegate undocumented design changes.",
      "The registered architect, licensed engineer or regulated local professional retains final design decisions, technical advice, approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "bim-revit-production-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "bim-revit-production"
    ]
  },
  {
    slug: "canva",
    name: "Canva Virtual Assistant",
    software: "Canva",
    category: "Marketing & Creative",
    directoryCategory: "Video Editing & Creative",
    primaryKeyword: "canva virtual assistant philippines",
    metaTitle: "Canva Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Canva Virtual Assistants for social graphic production, presentation formatting. Get support from vetted Filipino remote professionals.",
    h1: "Add Reliable Canva Production Without Turning Every Request Into a Design Project",
    intro: "A Canva Virtual Assistant can turn approved brand rules and repeatable creative briefs into consistent social assets, presentations, lead magnets and campaign variations. Brand direction and final creative approval stay with the client team.",
    focus: "repeatable canva design production",
    workflows: [
      "receive the approved brief and source assets",
      "select the correct brand template",
      "produce the requested asset or variation",
      "check copy, sizing and brand consistency",
      "prepare alternate platform dimensions",
      "name and organize final files",
      "route the asset for approval",
      "record requested revisions",
      "export approved formats"
    ],
    tasks: [
      "social graphic production",
      "presentation formatting",
      "template updates",
      "ad and banner resizing",
      "lead magnet formatting",
      "brand asset organization",
      "thumbnail production"
    ],
    bestFor: ["marketing teams", "agencies", "ecommerce brands", "content-led businesses"],
    outcomes: [
      "Recurring design requests move through a consistent production queue.",
      "Approved brand templates are reused correctly across channels.",
      "Marketing teams spend less time on routine resizing and formatting work."
    ],
    hiringNotes: [
      "Provide brand guidelines, approved templates and file naming rules.",
      "Test the candidate on a representative brief rather than a generic design exercise.",
      "Keep final brand direction, sensitive claims and campaign approval with the client team."
    ],
    relatedServiceSlugs: ["graphic-design", "social-media", "digital-marketing-virtual-assistant"],
    relatedIndustrySlugs: ["ecommerce-stores", "professional-services-growth"]
  },
  {
    slug: "gohighlevel",
    name: "GoHighLevel Virtual Assistant",
    software: "GoHighLevel",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "gohighlevel virtual assistant philippines",
    metaTitle: "GoHighLevel Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based GoHighLevel Virtual Assistants for crm updates, pipeline maintenance. Get support from vetted Filipino remote professionals.",
    h1: "Keep GoHighLevel Pipelines and CRM Workflows Current",
    intro: "A GoHighLevel Virtual Assistant can maintain contacts, opportunities, tasks, calendars, approved campaign assets and recurring CRM administration. Strategy, offer decisions and high-risk automation changes remain with the accountable client team.",
    focus: "gohighlevel crm and pipeline administration",
    workflows: [
      "review new contacts and opportunities",
      "clean and tag records to the agreed rules",
      "update pipeline stages from approved evidence",
      "maintain tasks and follow-up dates",
      "prepare approved campaign assets",
      "check forms and calendar routing",
      "record exceptions and failed automations",
      "prepare pipeline reports",
      "escalate configuration changes outside the runbook"
    ],
    tasks: [
      "crm updates",
      "pipeline maintenance",
      "contact tagging",
      "task administration",
      "calendar administration",
      "campaign setup support",
      "report preparation"
    ],
    bestFor: ["marketing agencies", "local-service businesses", "sales teams", "lead-generation businesses"],
    outcomes: [
      "Pipeline records reflect the actual state of leads and opportunities.",
      "Follow-up tasks and contact data stay easier to trust.",
      "Teams spend less time cleaning routine CRM administration."
    ],
    hiringNotes: [
      "Document pipeline stages, tags and approved automation boundaries before delegation.",
      "Use controlled permissions and test automation changes outside live workflows when possible.",
      "Keep offer strategy, messaging approvals and material automation decisions with the client team."
    ],
    relatedServiceSlugs: ["crm", "lead-generation", "appointment-setter-virtual-assistant"],
    relatedIndustrySlugs: ["professional-services-growth", "home-local-services"]
  },
  {
    slug: "salesforce",
    name: "Salesforce Virtual Assistant",
    software: "Salesforce",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "salesforce virtual assistant philippines",
    metaTitle: "Salesforce Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Salesforce Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Salesforce Records Clean Enough for the Sales Team to Trust",
    intro: "A Salesforce Virtual Assistant can own recurring CRM administration such as contact updates, opportunity hygiene, task follow-up, duplicate checks and report preparation. Sales strategy, forecasting judgment and sensitive configuration decisions remain with the client.",
    focus: "salesforce crm administration",
    workflows: [
      "review assigned CRM update requests",
      "check source information before editing records",
      "create or update contacts and accounts",
      "maintain opportunity fields and stages from approved evidence",
      "log activities and next steps",
      "identify duplicate or incomplete records",
      "prepare recurring reports",
      "document uncertain changes",
      "escalate configuration or permission issues"
    ],
    tasks: [
      "salesforce data entry",
      "contact and account updates",
      "opportunity administration",
      "task maintenance",
      "duplicate cleanup",
      "activity logging",
      "report preparation"
    ],
    bestFor: ["B2B sales teams", "SaaS companies", "agencies", "professional services firms"],
    outcomes: [
      "Salesforce records stay more accurate and complete.",
      "Open tasks and opportunity updates remain visible.",
      "Sales managers spend less time correcting routine CRM administration."
    ],
    hiringNotes: [
      "Define required fields, stage rules and duplicate handling before bulk updates.",
      "Restrict permissions to the records and actions the role actually needs.",
      "Keep forecasting, sales strategy, admin configuration and destructive bulk changes with authorized staff."
    ],
    relatedServiceSlugs: ["crm", "sales-virtual-assistant", "lead-generation"],
    relatedIndustrySlugs: ["professional-services-growth", "small-business"]
  }
,
  {
    slug: "hubspot",
    name: "HubSpot Virtual Assistant",
    software: "HubSpot",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "hubspot virtual assistant philippines",
    metaTitle: "HubSpot Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based HubSpot Virtual Assistants for crm cleanup, pipeline updates, contact enrichment. Get support from vetted Filipino remote professionals.",
    h1: "Keep HubSpot Clean Enough for Sales and Marketing Teams to Trust It",
    intro: "A HubSpot Virtual Assistant can keep contacts, lifecycle stages, tasks, notes and routine reports current so your team spends less time repairing CRM data.",
    focus: "hubspot crm and revenue-operations administration",
    workflows: ["clean contacts and companies","maintain lifecycle and pipeline stages","merge duplicate records","assign follow-up tasks","update notes and activities","prepare lead lists","check required fields","build routine reports"],
    tasks: ["crm cleanup","pipeline updates","contact enrichment","task administration","lead routing","report preparation","database hygiene"],
    bestFor: ["sales teams","marketing agencies","B2B service businesses","SaaS companies"],
    outcomes: ["CRM records stay current and easier to trust.","Sales follow-up becomes more visible.","Reporting requires less manual cleanup."],
    hiringNotes: ["Define lifecycle stages and required fields before delegation.","Restrict permissions for exports, deletions and automation changes.","Keep pricing, deal approvals and sensitive customer decisions with authorised staff."],
    relatedServiceSlugs: ["crm","lead-generation","sales-virtual-assistant","digital-marketing-virtual-assistant"],
    relatedIndustrySlugs: ["professional-services-growth","small-business","startups"]
  },
  {
    slug: "xero",
    locale: "en-AU",
    name: "Xero Virtual Assistant",
    software: "Xero",
    category: "Accounting & Bookkeeping",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "xero virtual assistant philippines",
    metaTitle: "Xero Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Xero Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Xero Bookkeeping Administration Ready for Review",
    intro: "A Xero Virtual Assistant can prepare recurring bookkeeping workflows and surface exceptions while final accounting, tax and payment decisions stay with qualified staff.",
    focus: "xero bookkeeping and finance administration",
    workflows: ["collect source documents","prepare transaction coding","match bank activity","support reconciliations","track receivables","organise bills","prepare exception lists","support month-end close"],
    tasks: ["transaction coding support","bank reconciliation support","document collection","accounts receivable follow-up","bill administration","month-end preparation","exception tracking"],
    bestFor: ["accounting firms","Australian SMEs","bookkeeping practices"],
    outcomes: ["Bookkeeping queues stay more current.","Exceptions reach reviewers sooner.","Month-end preparation requires less chasing."],
    hiringNotes: ["Separate data preparation from approval.","Limit payment and banking permissions.","Keep tax positions, final journals and financial advice with qualified professionals."],
    relatedServiceSlugs: ["bookkeeping","accounting-virtual-assistant","month-end-production-virtual-assistant"],
    relatedIndustrySlugs: ["accountants-cpas","accounting-firms-month-end","small-business"]
  },
  {
    slug: "klaviyo",
    name: "Klaviyo Virtual Assistant",
    software: "Klaviyo",
    category: "Email Marketing",
    directoryCategory: "Marketing & Social Media",
    primaryKeyword: "klaviyo virtual assistant philippines",
    metaTitle: "Klaviyo Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Klaviyo Virtual Assistants for campaign builds, segmentation, flow support. Get support from vetted Filipino remote professionals.",
    h1: "Keep Klaviyo Campaign Production and QA Moving",
    intro: "A Klaviyo Virtual Assistant can build and check approved ecommerce email campaigns while strategy, offers, compliance interpretation and final sends remain under client control.",
    focus: "klaviyo campaign production and email administration",
    workflows: ["receive the approved campaign brief","build the email from templates","prepare audience segments","check links and tracking","review mobile formatting","support approved flows","prepare test sends","report campaign results"],
    tasks: ["campaign builds","segmentation","flow support","template updates","link QA","test sends","performance reporting"],
    bestFor: ["Shopify stores","ecommerce brands","retention marketing teams"],
    outcomes: ["Campaign production takes less specialist time.","QA becomes more consistent.","Routine reporting and list administration stay current."],
    hiringNotes: ["Use approval gates before live sends.","Restrict list exports and high-impact flow changes.","Keep offers, claims and compliance decisions with the accountable marketer."],
    relatedServiceSlugs: ["email-marketing","ecommerce","shopify-virtual-assistant"],
    relatedIndustrySlugs: ["ecommerce-stores"]
  },
  {
    slug: "quickbooks",
    name: "QuickBooks Virtual Assistant",
    software: "QuickBooks",
    category: "Accounting & Bookkeeping",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "quickbooks virtual assistant philippines",
    metaTitle: "QuickBooks Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based QuickBooks Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep QuickBooks Administration Clean and Ready for Review",
    intro: "A QuickBooks Virtual Assistant can prepare recurring bookkeeping administration, maintain supporting records and flag exceptions while approvals and professional accounting judgment remain with the client.",
    focus: "quickbooks bookkeeping administration",
    workflows: ["collect supporting documents","prepare transaction entries","support bank matching","organise bills and invoices","track receivables","prepare reconciliation items","flag exceptions","support month-end review"],
    tasks: ["bookkeeping administration","transaction preparation","reconciliation support","invoice administration","receivables follow-up","document collection","month-end preparation"],
    bestFor: ["small businesses","bookkeeping firms","accounting teams"],
    outcomes: ["QuickBooks records stay more current.","Reviewers receive cleaner supporting information.","Outstanding bookkeeping items become easier to track."],
    hiringNotes: ["Use role-based access and approval rules.","Keep payment authority and bank changes restricted.","Keep tax, final accounting and financial advice with qualified professionals."],
    relatedServiceSlugs: ["quickbooks-virtual-assistant","bookkeeping","accounting-virtual-assistant"],
    relatedIndustrySlugs: ["small-business","accountants-cpas","accounting-firms-month-end"]
  },
{
    slug: "shiftcare",
    locale: "en-AU",
    name: "ShiftCare Virtual Assistant",
    software: "ShiftCare",
    category: "NDIS & Care Management",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "shiftcare virtual assistant philippines",
    metaTitle: "ShiftCare Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based ShiftCare Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep ShiftCare Rosters and Participant Administration Current",
    intro: "A ShiftCare Virtual Assistant can maintain approved rosters, participant records, worker availability, timesheet follow-up and service administration while care decisions and compliance accountability stay with the Australian provider.",
    focus: "shiftcare rostering and participant administration",
    workflows: ["review approved participant schedules","update worker availability","maintain roster changes","record participant and service updates","follow up missing notes or timesheets","track service booking administration","prepare exception queues","escalate urgent care or roster issues"],
    tasks: ["rostering support","participant record administration","worker availability updates","timesheet follow-up","service note follow-up","schedule change administration","exception reporting"],
    bestFor: ["NDIS providers","aged-care providers","community care teams"],
    outcomes: ["Roster changes remain visible.","Participant and worker records stay more current.","Managers spend less time chasing routine service administration."],
    hiringNotes: ["Define which roster changes may be processed without manager approval.","Limit access to assigned participants and workflows where possible.","Keep care decisions, incidents, safeguarding and compliance responsibility with qualified local staff."],
    relatedServiceSlugs: ["ndis-rostering","ndis-billing-virtual-assistant","aged-care"],
    relatedIndustrySlugs: ["ndis-providers","aged-care-providers"]
  },
{
    slug: "best-practice-premier",
    locale: "en-AU",
    name: "Best Practice Premier Virtual Assistant",
    software: "Best Practice Premier",
    category: "Medical Practice Management",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "best practice premier virtual assistant philippines",
    metaTitle: "Best Practice Premier Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Best Practice Premier Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Best Practice Reception and Patient Administration Moving",
    intro: "A Best Practice Premier Virtual Assistant can support Australian clinics with appointments, recalls, referral follow-up, inbox administration and routine patient-record updates while clinical judgement remains with qualified staff.",
    focus: "best practice premier reception and patient administration",
    workflows: ["review the clinic reception queue","book or update approved appointments","maintain recall and reminder tasks","record referral administration","route approved documents and messages","update routine patient details","track outstanding reception items","escalate clinical questions immediately"],
    tasks: ["appointment administration","recalls and reminders","referral follow-up","patient record updates","inbox administration","document routing","reception follow-up"],
    bestFor: ["Australian GP clinics","specialist practices","multi-doctor medical centres"],
    outcomes: ["Reception queues stay more current.","Routine patient follow-up takes less local staff time.","Clinical questions are separated from administrative work more clearly."],
    hiringNotes: ["Keep all clinical triage and advice with qualified clinicians.","Use individual accounts and minimum necessary patient access.","Document privacy, message routing and escalation rules before live work."],
    relatedServiceSlugs: ["medical-receptionist","medical-virtual-assistant","phone-receptionist"],
    relatedIndustrySlugs: ["medical-practices","healthcare-dental"]
  },
{
    slug: "xplan",
    locale: "en-AU",
    name: "Xplan Virtual Assistant",
    software: "Xplan",
    category: "Financial Planning",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "xplan virtual assistant philippines",
    metaTitle: "Xplan Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Xplan Virtual Assistants for client record maintenance, review preparation. Get support from vetted Filipino remote professionals.",
    h1: "Keep Xplan Client Administration Ready for Adviser Review",
    intro: "An Xplan Virtual Assistant can maintain client records, prepare review administration, track implementation actions and keep workflow tasks current while personal advice and regulated approvals remain with authorised Australian advisers.",
    focus: "xplan financial planning administration",
    workflows: ["open the approved client workflow","update client and household records","prepare annual review administration","collect supporting documents","maintain tasks and review dates","track implementation actions","prepare exception lists","close completed administrative steps"],
    tasks: ["client record maintenance","review preparation","fact-find administration","document follow-up","implementation tracking","workflow updates","service calendar administration"],
    bestFor: ["Australian financial planning firms","wealth advisers","paraplanning teams"],
    outcomes: ["Client records stay better prepared.","Review workflows become easier to track.","Advisers spend less time maintaining routine Xplan administration."],
    hiringNotes: ["Separate data preparation from personal financial advice.","Use role-based permissions and documented review gates.","Keep recommendations, advice documents and regulated approvals with authorised advisers."],
    relatedServiceSlugs: ["financial-planning","financial-advisor-virtual-assistant","admin-inbox"],
    relatedIndustrySlugs: ["financial-planning-firms","financial-advisors"]
  },
{
    slug: "pexa",
    locale: "en-AU",
    name: "PEXA Virtual Assistant",
    software: "PEXA",
    category: "Conveyancing",
    directoryCategory: "Administrative Support",
    primaryKeyword: "pexa virtual assistant philippines",
    metaTitle: "PEXA Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based PEXA Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep PEXA Administration Prepared for Conveyancer Review",
    intro: "A PEXA Virtual Assistant can support workspace preparation, matter administration, document follow-up and settlement milestone tracking while signing, legal judgement and regulated settlement responsibility remain with authorised Australian professionals.",
    focus: "pexa workspace preparation and conveyancing administration",
    workflows: ["open the approved matter checklist","prepare workspace information","upload or organise approved supporting documents","track outstanding client and transaction details","maintain settlement milestones","prepare status updates","flag exceptions for conveyancer review","complete approved post-settlement administration"],
    tasks: ["workspace preparation support","document administration","settlement milestone tracking","client follow-up","matter updates","exception reporting","post-settlement administration"],
    bestFor: ["Australian conveyancers","property law firms","settlement teams"],
    outcomes: ["PEXA preparation becomes more consistent.","Outstanding matter inputs remain visible.","Conveyancers receive cleaner files before regulated review."],
    hiringNotes: ["Do not delegate signing authority or legal advice.","Use documented matter checklists and role-based access.","Keep regulated conveyancing decisions and final settlement approval with authorised professionals."],
    relatedServiceSlugs: ["conveyancing","paralegal-virtual-assistant","legal-virtual-assistant"],
    relatedIndustrySlugs: ["conveyancing-firms","law-firms"]
  },
{
    slug: "leap",
    locale: "en-AU",
    name: "LEAP Virtual Assistant",
    software: "LEAP",
    category: "Legal Practice Management",
    directoryCategory: "Administrative Support",
    primaryKeyword: "leap virtual assistant philippines",
    metaTitle: "LEAP Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based LEAP Virtual Assistants for matter administration, document organisation. Get support from vetted Filipino remote professionals.",
    h1: "Keep LEAP Matters, Documents and Tasks Current",
    intro: "A LEAP Virtual Assistant can maintain approved matter records, document workflows, tasks and client follow-up while legal advice, privileged strategy and regulated legal decisions remain with Australian practitioners.",
    focus: "leap matter and document administration",
    workflows: ["open approved matters","maintain contact and matter details","organise approved documents","update tasks and key dates","prepare routine correspondence from templates","track client follow-up","maintain matter notes","escalate legal decisions"],
    tasks: ["matter administration","document organisation","task updates","client follow-up","template correspondence support","key-date tracking","file maintenance"],
    bestFor: ["Australian law firms","conveyancing practices","small legal teams"],
    outcomes: ["Matter records remain more current.","Routine file administration takes less practitioner time.","Deadlines and follow-up become easier to see."],
    hiringNotes: ["Keep legal advice and privileged judgement with qualified practitioners.","Use approved templates and document naming standards.","Restrict sensitive matter access to the work assigned."],
    relatedServiceSlugs: ["conveyancing","legal-virtual-assistant","paralegal-virtual-assistant"],
    relatedIndustrySlugs: ["conveyancing-firms","law-firms"]
  },
{
    slug: "vaultre",
    locale: "en-AU",
    name: "VaultRE Virtual Assistant",
    software: "VaultRE",
    category: "Real Estate CRM",
    directoryCategory: "Real Estate",
    primaryKeyword: "vaultre virtual assistant philippines",
    metaTitle: "VaultRE Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based VaultRE Virtual Assistants for CRM updates, property record administration. Get support from vetted Filipino remote professionals.",
    h1: "Keep VaultRE Contacts, Properties and Follow-Up Current",
    intro: "A VaultRE Virtual Assistant can maintain CRM records, property data, tasks and approved follow-up so Australian agents and buyers agents spend less time on routine database administration.",
    focus: "vaultre real-estate CRM administration",
    workflows: ["capture approved contacts and enquiries","maintain property records","update pipeline stages","record calls and follow-up tasks","prepare inspection or appraisal lists","clean duplicate records","track outstanding actions","prepare routine reports"],
    tasks: ["CRM updates","property record administration","contact management","task follow-up","database cleanup","pipeline updates","report preparation"],
    bestFor: ["Australian real-estate agencies","buyers agencies","property sales teams"],
    outcomes: ["CRM data stays easier to trust.","Follow-up tasks remain visible.","Agents spend less time maintaining records."],
    hiringNotes: ["Define CRM stages and required fields.","Keep negotiation and licensed real-estate decisions with agents.","Use role-based access and review bulk data changes."],
    relatedServiceSlugs: ["buyers-agent","real-estate","admin-inbox"],
    relatedIndustrySlugs: ["buyers-agents","real-estate-agents"]
  },
{
    slug: "agentbox",
    locale: "en-AU",
    name: "AgentBox Virtual Assistant",
    software: "AgentBox",
    category: "Real Estate CRM",
    directoryCategory: "Real Estate",
    primaryKeyword: "agentbox virtual assistant philippines",
    metaTitle: "AgentBox Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based AgentBox Virtual Assistants for CRM data entry, contact administration. Get support from vetted Filipino remote professionals.",
    h1: "Keep AgentBox CRM Administration Current",
    intro: "An AgentBox Virtual Assistant can maintain contacts, property records, tasks, campaign administration and approved follow-up while Australian agents retain negotiation, advice and licensed real-estate responsibilities.",
    focus: "agentbox CRM and property administration",
    workflows: ["capture approved enquiries","maintain contact records","update property records","record tasks and next actions","support campaign administration","prepare call or follow-up lists","clean database records","report outstanding actions"],
    tasks: ["CRM data entry","contact administration","property record updates","task follow-up","campaign support","database cleanup","reporting"],
    bestFor: ["Australian real-estate agencies","buyers agents","property sales teams"],
    outcomes: ["AgentBox data stays more current.","Follow-up is easier to manage.","Agents spend less time on repeatable CRM work."],
    hiringNotes: ["Document required fields and pipeline stages.","Review bulk changes before they are applied.","Keep negotiation, pricing and licensed decisions with Australian agents."],
    relatedServiceSlugs: ["buyers-agent","real-estate","admin-inbox"],
    relatedIndustrySlugs: ["buyers-agents","real-estate-agents"]
  },
{
    slug: "property-tree",
    locale: "en-AU",
    name: "Property Tree Virtual Assistant",
    software: "Property Tree",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "property tree virtual assistant philippines",
    metaTitle: "Property Tree Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Property Tree Virtual Assistants for platform administration and workflow support from vetted Filipino remote professionals.",
    h1: "Keep Property Tree Property Administration Moving",
    intro: "A Property Tree Virtual Assistant can maintain approved tenant, property, maintenance and trust-administration workflows while property managers retain tenancy decisions, spending authority and regulated trust-account responsibility.",
    focus: "property tree portfolio and property administration",
    workflows: ["review the property administration queue","update tenant and property records","log approved maintenance items","track contractor follow-up","maintain inspection administration","prepare ledger or trust review items","record outstanding actions","prepare manager exception lists"],
    tasks: ["tenant administration","property record updates","maintenance coordination","inspection administration","trust-account support","contractor follow-up","exception reporting"],
    bestFor: ["Australian property management agencies","real-estate agencies","portfolio teams"],
    outcomes: ["Property records stay more current.","Maintenance follow-up becomes easier to track.","Managers receive cleaner exception queues."],
    hiringNotes: ["Define spending and maintenance approval limits.","Keep trust-account authority and tenancy decisions with authorised local staff.","Use one documented workflow for tenant and contractor communication."],
    relatedServiceSlugs: ["property-management-virtual-assistant","property-management-maintenance-virtual-assistant","trust-accounting"],
    relatedIndustrySlugs: ["property-management-companies","property-management-maintenance-coordination"]
  },
{
    slug: "ailo",
    locale: "en-AU",
    name: "Ailo Virtual Assistant",
    software: "Ailo",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "ailo virtual assistant philippines",
    metaTitle: "Ailo Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Ailo Virtual Assistants for tenant communication, maintenance administration. Get support from vetted Filipino remote professionals.",
    h1: "Keep Ailo Tenant and Portfolio Administration Current",
    intro: "An Ailo Virtual Assistant can support routine tenant communication, maintenance administration, portfolio follow-up and payment-related administration while property managers retain tenancy decisions, trust authority and regulated responsibilities.",
    focus: "ailo tenant communication and property administration",
    workflows: ["review approved tenant enquiries","record property and tenancy updates","log maintenance requests","track contractor and tenant follow-up","prepare payment or arrears admin queues","maintain communication notes","report unresolved exceptions","prepare manager handoffs"],
    tasks: ["tenant communication","maintenance administration","portfolio updates","payment admin support","follow-up","record maintenance","exception reporting"],
    bestFor: ["Australian property managers","real-estate agencies","residential portfolio teams"],
    outcomes: ["Tenant follow-up remains more consistent.","Property administration queues stay visible.","Managers spend less time chasing routine updates."],
    hiringNotes: ["Define which tenant messages may be handled from approved templates.","Keep trust, tenancy and legal decisions with authorised local staff.","Escalate sensitive disputes, hardship and safety issues immediately."],
    relatedServiceSlugs: ["property-management-virtual-assistant","property-management-maintenance-virtual-assistant","trust-accounting"],
    relatedIndustrySlugs: ["property-management-companies","property-management-maintenance-coordination"]
  },
{
    slug: "myob",
    locale: "en-AU",
    name: "MYOB Virtual Assistant",
    software: "MYOB",
    category: "Accounting & Bookkeeping",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "myob virtual assistant philippines",
    metaTitle: "MYOB Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based MYOB Virtual Assistants for bookkeeping administration, transaction preparation. Get support from vetted Filipino remote professionals.",
    h1: "Keep MYOB Bookkeeping Administration Ready for Review",
    intro: "A MYOB Virtual Assistant can prepare recurring bookkeeping administration, maintain supporting records and flag exceptions while payment authority, tax positions and final accounting judgement remain with qualified staff.",
    focus: "myob bookkeeping and finance administration",
    workflows: ["collect source documents","prepare transaction entries","maintain invoices and bills","support bank matching","track receivables and payables","prepare reconciliation items","flag exceptions","support month-end review"],
    tasks: ["bookkeeping administration","transaction preparation","invoice administration","accounts payable support","accounts receivable follow-up","reconciliation support","month-end preparation"],
    bestFor: ["Australian SMEs","bookkeeping firms","accounting practices"],
    outcomes: ["MYOB records stay more current.","Reviewers receive cleaner supporting information.","Outstanding finance-administration items become easier to track."],
    hiringNotes: ["Separate data preparation from approval.","Restrict payment and banking permissions.","Keep tax, final accounting and financial advice with qualified professionals."],
    relatedServiceSlugs: ["bookkeeping","accounting-virtual-assistant","month-end-production-virtual-assistant"],
    relatedIndustrySlugs: ["accountants-cpas","accounting-firms-month-end","small-business"]
  }

,
{
    slug: "winbeat",
    locale: "en-AU",
    name: "WinBEAT Virtual Assistant",
    software: "WinBEAT",
    aliases: ["Ebix WinBEAT"],
    category: "Insurance Broking",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "winbeat virtual assistant philippines",
    metaTitle: "WinBEAT Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based WinBEAT Virtual Assistants for policy records, renewals, document administration and broker workflow support.",
    h1: "Keep WinBEAT Renewal and Policy Administration Current",
    intro: "A WinBEAT Virtual Assistant can maintain approved client and policy records, prepare renewal administration, organise documents and keep follow-up visible while licensed advice, coverage recommendations and final approvals stay with authorised brokers.",
    focus: "winbeat insurance broking administration",
    workflows: ["review the approved renewal worklist","update client and policy records","organise renewal documents","record approved insurer and client follow-up","prepare broker review items","maintain correspondence and notes","track outstanding actions","escalate advice or coverage decisions"],
    tasks: ["client record updates","policy administration","renewal preparation","document administration","broker follow-up support","correspondence logging","exception tracking"],
    bestFor: ["general insurance brokerages","commercial insurance brokers","insurance broking networks"],
    outcomes: ["Renewal records stay more current.","Outstanding client and insurer actions remain visible.","Brokers spend less time on repeatable system administration."],
    hiringNotes: ["Use documented renewal and record-maintenance procedures.","Limit access to assigned client and policy work.","Keep insurance advice, coverage decisions, recommendations and regulated approvals with authorised brokers."],
    relatedServiceSlugs: ["insurance-broker-renewal-virtual-assistant","insurance-virtual-assistant","admin-inbox"],
    relatedIndustrySlugs: ["insurance-broker-renewal-desk","insurance-agencies"]
  },
{
    slug: "insight",
    locale: "en-AU",
    name: "INSIGHT Virtual Assistant",
    software: "INSIGHT",
    aliases: ["Ebix INSIGHT"],
    category: "Insurance Broking",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "insight virtual assistant philippines",
    metaTitle: "INSIGHT Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based INSIGHT Virtual Assistants for client records, renewal administration, documents and broker workflow support.",
    h1: "Keep INSIGHT Broker Administration Ready for Review",
    intro: "An INSIGHT Virtual Assistant can support defined broking administration such as client-record maintenance, renewal preparation, document organisation and approved follow-up while licensed advice and final insurance decisions remain with authorised staff.",
    focus: "insight insurance broker administration",
    workflows: ["review the assigned administration queue","update approved client and policy information","prepare renewal records","organise supporting documents","record correspondence and follow-up","track outstanding actions","prepare broker review items","escalate regulated decisions"],
    tasks: ["client record maintenance","renewal administration","document organisation","follow-up tracking","correspondence logging","broker review preparation","exception reporting"],
    bestFor: ["insurance brokerages","commercial broking teams","insurance administration teams"],
    outcomes: ["Broker records stay easier to trust.","Renewal administration moves with fewer hidden follow-ups.","Regulated decisions remain clearly separated from delegated administration."],
    hiringNotes: ["Define the fields and documents the role may update.","Use individual accounts and least-privilege access where supported.","Keep insurance advice, product recommendations and final approvals with authorised brokers."],
    relatedServiceSlugs: ["insurance-broker-renewal-virtual-assistant","insurance-virtual-assistant","admin-inbox"],
    relatedIndustrySlugs: ["insurance-broker-renewal-desk","insurance-agencies"]
  },
{
    slug: "lumary",
    locale: "en-AU",
    name: "Lumary Virtual Assistant",
    software: "Lumary",
    category: "NDIS & Care Management",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "lumary virtual assistant philippines",
    metaTitle: "Lumary Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Lumary Virtual Assistants for participant records, service administration, scheduling support and follow-up.",
    h1: "Keep Lumary Participant and Service Administration Current",
    intro: "A Lumary Virtual Assistant can maintain approved participant records, service administration, scheduling support, document follow-up and operational queues while care decisions, incidents, safeguarding and compliance accountability stay with qualified local staff.",
    focus: "lumary participant and service administration",
    workflows: ["review assigned participant and service queues","update approved participant information","maintain service administration records","support scheduling updates","follow up approved documents and notes","track incomplete administration","prepare exception queues","escalate care or compliance decisions"],
    tasks: ["participant record administration","service administration","scheduling support","document follow-up","record updates","exception reporting","routine workflow follow-up"],
    bestFor: ["NDIS providers","aged-care providers","community care organisations"],
    outcomes: ["Participant administration stays more current.","Routine follow-up is easier to track.","Managers receive clearer exceptions instead of hidden administration backlogs."],
    hiringNotes: ["Limit access to the participants and workflows the role actually needs.","Document escalation rules for incidents, safeguarding and sensitive care issues.","Keep clinical, care and compliance decisions with qualified responsible staff."],
    relatedServiceSlugs: ["ndis-rostering","ndis-billing-virtual-assistant","aged-care"],
    relatedIndustrySlugs: ["ndis-providers","aged-care-providers"]
  },
{
    slug: "splose",
    locale: "en-AU",
    name: "Splose Virtual Assistant",
    software: "Splose",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "splose virtual assistant philippines",
    metaTitle: "Splose Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Splose Virtual Assistants for scheduling, patient records, referrals, billing administration and recalls.",
    h1: "Keep Splose Practice Administration Moving Around Every Appointment",
    intro: "A Splose Virtual Assistant can support non-clinical practice workflows such as scheduling, patient records, referral administration, billing support, recalls and routine follow-up while clinical judgement and treatment decisions stay with qualified practitioners.",
    focus: "splose allied health practice administration",
    workflows: ["review the practice administration queue","create or update approved patient records","book and update appointments","record referral administration","prepare approved billing information","run recall and follow-up lists","track incomplete administration","escalate clinical or privacy exceptions"],
    tasks: ["appointment scheduling","patient record administration","referral tracking","billing administration","recall follow-up","document administration","practice workflow updates"],
    bestFor: ["allied health clinics","physiotherapy practices","occupational therapy practices","speech pathology clinics","psychology practices"],
    outcomes: ["Scheduling and referral records stay more current.","Routine billing and recall work remains visible.","Clinicians spend less time maintaining non-clinical administration."],
    hiringNotes: ["Use minimum necessary patient access.","Keep clinical notes, treatment decisions and sensitive complaints with qualified practitioners.","Document privacy, billing and escalation rules before live work."],
    relatedServiceSlugs: ["allied-health-referral-billing-virtual-assistant","medical-virtual-assistant","medical-billing-virtual-assistant"],
    relatedIndustrySlugs: ["allied-health-referral-billing","healthcare-dental"]
  }
,

  // --- AU software expansion: construction, HR, allied health ---
  {
    slug: "buildxact",
    locale: "en-AU",
    name: "Buildxact Virtual Assistant",
    software: "Buildxact",
    category: "Construction & Trades",
    directoryCategory: "Administrative Support",
    primaryKeyword: "buildxact virtual assistant philippines",
    metaTitle: "Buildxact Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Buildxact Virtual Assistants for estimating admin, job records, quote follow-up, purchasing, and construction workflow support.",
    h1: "Keep Buildxact Estimating and Job Administration Moving",
    intro: "A Buildxact Virtual Assistant can support repeatable construction administration such as estimate data entry, take-off preparation, quote follow-up, purchase-order administration, job records and supplier coordination. Builders and authorised managers retain final responsibility for scope, quantities, pricing, margins, contracts and construction decisions.",
    focus: "buildxact estimating and construction administration",
    workflows: [
      "receive approved plans, scope notes and estimating instructions",
      "prepare estimate or take-off data using the agreed cost structure",
      "maintain quote, supplier and purchase-order records",
      "update job stages and approved project information",
      "track outstanding pricing, selections and supporting documents",
      "prepare quote or variation administration for authorised review",
      "maintain cost and document checklists around active jobs",
      "escalate quantity, scope, pricing or contract exceptions"
    ],
    tasks: [
      "estimate data entry",
      "take-off preparation support",
      "quote follow-up",
      "supplier price administration",
      "purchase-order administration",
      "job record maintenance",
      "variation administration",
      "document and checklist follow-up"
    ],
    bestFor: [
      "residential builders",
      "construction companies",
      "estimating teams",
      "trade contractors"
    ],
    outcomes: [
      "Estimating and job records stay more current between manager reviews.",
      "Supplier pricing, quotes and project documents are easier to track.",
      "Builders spend less time on repeatable administration without delegating final pricing or scope decisions."
    ],
    hiringNotes: [
      "Document the cost-code structure, naming conventions and review stages before assigning live estimating work.",
      "Require authorised review before quotes, variations, purchase orders or pricing changes are issued.",
      "Keep quantity sign-off, scope interpretation, margins, contract decisions and final estimates with the responsible builder or estimator."
    ],
    relatedServiceSlugs: [
      "construction-estimating-virtual-assistant",
      "construction-virtual-assistant",
      "trades-service-administration-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "construction-estimating-tender-desk",
      "construction-companies",
      "trades-service-administration"
    ]
  },
  {
    slug: "employment-hero",
    locale: "en-AU",
    name: "Employment Hero Virtual Assistant",
    software: "Employment Hero",
    category: "HR & People Operations",
    directoryCategory: "Administrative Support",
    primaryKeyword: "employment hero virtual assistant philippines",
    metaTitle: "Employment Hero Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Employment Hero Virtual Assistants for HR admin, employee records, onboarding, recruitment support, and people operations.",
    h1: "Keep Employment Hero People Administration Current",
    intro: "An Employment Hero Virtual Assistant can support defined HR administration such as employee records, onboarding checklists, recruitment coordination, document follow-up and routine people-operations updates. Employment decisions, workplace advice, payroll approval and legal compliance remain with authorised local staff.",
    focus: "employment hero hr and people operations administration",
    workflows: [
      "review the assigned people-operations queue",
      "create or update approved employee records",
      "prepare onboarding and offboarding checklists",
      "coordinate approved recruitment administration",
      "follow up outstanding employee documents and acknowledgements",
      "maintain routine leave, policy and people records",
      "prepare payroll or HR exceptions for authorised review",
      "escalate employment, conduct, payroll or compliance decisions"
    ],
    tasks: [
      "employee record administration",
      "onboarding coordination",
      "offboarding administration",
      "recruitment coordination",
      "document follow-up",
      "leave and policy record updates",
      "people-operations reporting"
    ],
    bestFor: [
      "Australian SMEs",
      "people and culture teams",
      "recruitment teams",
      "multi-location businesses"
    ],
    outcomes: [
      "Employee records and onboarding tasks stay more current.",
      "Routine recruitment and people administration requires less manager chasing.",
      "HR exceptions reach authorised staff with clearer context and supporting records."
    ],
    hiringNotes: [
      "Use role-based access and limit the assistant to the employee and HR records required for assigned work.",
      "Document which updates may be completed independently and which require manager approval.",
      "Keep hiring decisions, disciplinary action, workplace advice, payroll approval and statutory compliance with authorised staff."
    ],
    relatedServiceSlugs: [
      "recruitment-hr",
      "recruitment-candidate-sourcing-virtual-assistant",
      "payroll-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "recruitment-candidate-sourcing",
      "small-business"
    ]
  },
  {
    slug: "nookal",
    locale: "en-AU",
    name: "Nookal Virtual Assistant",
    software: "Nookal",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "nookal virtual assistant philippines",
    metaTitle: "Nookal Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Nookal Virtual Assistants for scheduling, patient admin, referrals, billing support, and non-clinical clinic workflows.",
    h1: "Keep Nookal Front-Desk and Patient Administration Moving",
    intro: "A Nookal Virtual Assistant can support defined non-clinical workflows such as appointment scheduling, patient administration, referral follow-up, billing preparation and routine clinic communication. Clinical decisions, treatment records, privacy exceptions and sensitive patient matters remain with authorised practitioners and practice staff.",
    focus: "nookal allied health and clinic administration",
    workflows: [
      "review the assigned reception and administration queue",
      "create or update approved patient details",
      "book, reschedule or cancel the correct appointment type",
      "track referral and document follow-up",
      "send approved confirmations and routine patient communication",
      "prepare approved billing or payment administration",
      "run recall and missed-appointment follow-up",
      "escalate clinical, privacy, billing or complaint exceptions"
    ],
    tasks: [
      "appointment scheduling",
      "patient record administration",
      "referral follow-up",
      "appointment reminders",
      "billing administration",
      "recall follow-up",
      "document administration",
      "routine clinic communication"
    ],
    bestFor: [
      "physiotherapy clinics",
      "allied health practices",
      "multidisciplinary clinics",
      "therapy practices"
    ],
    outcomes: [
      "Appointments, referrals and routine patient administration stay more current.",
      "Front-desk follow-up becomes easier to track across the clinic.",
      "Practitioners spend less time maintaining non-clinical workflow queues."
    ],
    hiringNotes: [
      "Use the minimum patient access needed for the assigned reception or administration workflow.",
      "Document identity checks, privacy rules, billing boundaries and escalation paths before live work.",
      "Keep treatment notes, clinical judgement, sensitive complaints and privacy exceptions with authorised clinic staff."
    ],
    relatedServiceSlugs: [
      "medical-receptionist",
      "allied-health-referral-billing-virtual-assistant",
      "medical-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "allied-health-referral-billing",
      "medical-practices",
      "healthcare-dental"
    ]
  },

  // --- AU construction software expansion ---
  {
    slug: "buildertrend",
    locale: "en-AU",
    name: "Buildertrend Virtual Assistant",
    software: "Buildertrend",
    category: "Construction & Trades",
    directoryCategory: "Administrative Support",
    primaryKeyword: "buildertrend virtual assistant philippines",
    metaTitle: "Buildertrend Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Buildertrend Virtual Assistants for project admin, schedules, purchase orders, job records, client updates, and workflow support.",
    h1: "Keep Buildertrend Project Administration Current",
    intro: "A Buildertrend Virtual Assistant can support repeatable construction administration such as project records, schedules, purchase orders, change-order preparation, client updates and document follow-up. Builders and authorised managers retain responsibility for scope, pricing, contracts, approvals and construction decisions.",
    focus: "buildertrend construction project administration",
    workflows: [
      "review the assigned project administration queue",
      "create or update approved project records",
      "maintain schedules, tasks and milestone information",
      "prepare purchase-order and change-order administration",
      "track supplier, subcontractor and document follow-up",
      "record approved client and project updates",
      "prepare missing-information and exception lists",
      "escalate scope, pricing, contract or compliance decisions"
    ],
    tasks: [
      "project record maintenance",
      "schedule administration",
      "purchase-order administration",
      "change-order preparation",
      "supplier and subcontractor follow-up",
      "client update administration",
      "document control",
      "project exception reporting"
    ],
    bestFor: [
      "residential builders",
      "remodelling companies",
      "construction project teams",
      "trade contractors"
    ],
    outcomes: [
      "Project records and schedules stay more current between manager reviews.",
      "Purchase orders, change orders and supporting documents are easier to track.",
      "Project managers spend less time chasing routine administration."
    ],
    hiringNotes: [
      "Document who may create, edit and approve project records, purchase orders and change orders.",
      "Use clear naming, document and status conventions across live jobs.",
      "Keep scope, pricing, contract, supplier-selection and final project decisions with authorised construction staff."
    ],
    relatedServiceSlugs: [
      "construction-virtual-assistant",
      "project-coordination",
      "construction-estimating-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "construction-companies",
      "construction-estimating-tender-desk"
    ]
  },
  {
    slug: "procore",
    locale: "en-AU",
    name: "Procore Virtual Assistant",
    software: "Procore",
    category: "Construction & Trades",
    directoryCategory: "Administrative Support",
    primaryKeyword: "procore virtual assistant philippines",
    metaTitle: "Procore Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Procore Virtual Assistants for project records, RFIs, submittal admin, document control, logs, and construction workflow support.",
    h1: "Keep Procore Project Records and Document Workflows Current",
    intro: "A Procore Virtual Assistant can support defined project administration such as document control, log maintenance, RFI and submittal administration, meeting records and routine project follow-up. Project managers, engineers and authorised construction staff retain final technical, contractual, safety and commercial decisions.",
    focus: "procore construction project and document administration",
    workflows: [
      "review the assigned project administration queue",
      "create or update approved project records",
      "maintain document registers and controlled files",
      "prepare RFI and submittal administration for review",
      "update meeting, action and correspondence logs",
      "track outstanding project documentation",
      "prepare exception lists for project managers",
      "escalate technical, contractual, safety or commercial decisions"
    ],
    tasks: [
      "project record maintenance",
      "document control",
      "RFI administration",
      "submittal administration",
      "meeting and action logs",
      "correspondence tracking",
      "document follow-up",
      "project exception reporting"
    ],
    bestFor: [
      "commercial builders",
      "general contractors",
      "construction project teams",
      "specialty contractors"
    ],
    outcomes: [
      "Project records and document registers stay easier to trust.",
      "RFIs, submittals and action items have clearer administrative follow-through.",
      "Project managers receive cleaner exception lists instead of hidden document backlogs."
    ],
    hiringNotes: [
      "Define the Procore tools, projects and permission level the role actually needs.",
      "Use written rules for document naming, status changes and review handoffs.",
      "Keep engineering judgement, safety decisions, contract interpretation, approvals and commercial decisions with authorised staff."
    ],
    relatedServiceSlugs: [
      "construction-virtual-assistant",
      "project-coordination",
      "construction-estimating-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "construction-companies",
      "construction-estimating-tender-desk"
    ]
  },
  {
    slug: "groundplan",
    locale: "en-AU",
    name: "Groundplan Virtual Assistant",
    software: "Groundplan",
    category: "Construction & Trades",
    directoryCategory: "Administrative Support",
    primaryKeyword: "groundplan virtual assistant philippines",
    metaTitle: "Groundplan Virtual Assistant Philippines",
    metaDescription: "Hire Philippines-based Groundplan Virtual Assistants for take-off admin, measurements, estimate preparation, plan revisions, and tender workflow support.",
    h1: "Keep Groundplan Take-Off and Estimating Administration Moving",
    intro: "A Groundplan Virtual Assistant can support repeatable estimating administration such as plan setup, take-off preparation, measurement records, revision tracking and tender support. Estimators and authorised construction staff retain responsibility for quantity sign-off, scope interpretation, rates, margins and final pricing.",
    focus: "groundplan take-off and estimating administration",
    workflows: [
      "receive approved drawings and estimating instructions",
      "prepare project and plan files in groundplan",
      "complete defined take-off and measurement work",
      "record assumptions, exclusions and missing information",
      "track drawing revisions and superseded plans",
      "prepare estimate-support outputs for estimator review",
      "maintain tender and supplier follow-up records",
      "escalate quantity, scope, rate or pricing decisions"
    ],
    tasks: [
      "plan setup",
      "take-off preparation",
      "measurement administration",
      "drawing revision tracking",
      "estimate support",
      "tender document preparation",
      "supplier follow-up",
      "estimating exception reporting"
    ],
    bestFor: [
      "residential builders",
      "trade contractors",
      "estimating teams",
      "construction companies"
    ],
    outcomes: [
      "Take-off work reaches estimator review with fewer administrative gaps.",
      "Drawing revisions and measurement records stay easier to trace.",
      "Estimators spend more time on final pricing and commercial judgement."
    ],
    hiringNotes: [
      "Document measurement conventions, plan-version controls and review checkpoints before live work.",
      "Require estimator review before quantities are treated as final or used for pricing.",
      "Keep scope interpretation, quantity sign-off, rates, margins and final estimates with authorised estimators or builders."
    ],
    relatedServiceSlugs: [
      "construction-estimating-virtual-assistant",
      "construction-virtual-assistant",
      "project-coordination"
    ],
    relatedIndustrySlugs: [
      "construction-estimating-tender-desk",
      "construction-companies"
    ]
  }
];

function normalizedSoftwareTool(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function softwarePagesForTools(tools: string[]) {
  const normalizedTools = new Set(tools.map(normalizedSoftwareTool));
  return softwarePages.filter((page) =>
    [page.software, ...(page.aliases || [])].some((name) => normalizedTools.has(normalizedSoftwareTool(name)))
  );
}

export const softwarePagesBySlug = Object.fromEntries(
  softwarePages.map((page) => [page.slug, page])
) as Record<string, SoftwareSeoPage>;

export function getSoftwarePage(slug: string): SoftwareSeoPage | undefined {
  return softwarePagesBySlug[slug];
}
