// Software-focused SEO landing pages for VirtualAssistant.com.ph

export type SoftwareSeoPage = {
  slug: string;
  locale?: "en-AU";
  name: string;
  software: string;
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

export const softwarePages: SoftwareSeoPage[] = [
  // --- 1. ApplyOnline ---
  {
    slug: "applyonline-virtual-assistant",
    locale: "en-AU",
    name: "ApplyOnline Virtual Assistant",
    software: "ApplyOnline",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "applyonline virtual assistant",
    metaTitle: "Hire ApplyOnline Virtual Assistant Philippines",
    metaDescription:
      "Get support with ApplyOnline data entry, loan file preparation, document tracking, lender conditions and settlement administration.",
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
    slug: "salestrekker-virtual-assistant",
    locale: "en-AU",
    name: "Salestrekker Virtual Assistant",
    software: "Salestrekker",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "salestrekker virtual assistant",
    metaTitle: "Hire Salestrekker Virtual Assistant Philippines",
    metaDescription:
      "Outsource Salestrekker CRM updates, mortgage pipeline administration, document tracking, follow-ups and settlement workflows.",
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
    slug: "brokerengine-virtual-assistant",
    locale: "en-AU",
    name: "BrokerEngine Virtual Assistant",
    software: "BrokerEngine",
    category: "Mortgage & Finance",
    directoryCategory: "Real Estate",
    primaryKeyword: "brokerengine virtual assistant",
    metaTitle: "Hire BrokerEngine Virtual Assistant Philippines",
    metaDescription:
      "Run mortgage workflow administration in BrokerEngine with support for tasks, document collection, milestones and client follow-up.",
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
    slug: "propertyme-virtual-assistant",
    locale: "en-AU",
    name: "PropertyMe Virtual Assistant",
    software: "PropertyMe",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "propertyme virtual assistant",
    metaTitle: "Hire PropertyMe Virtual Assistant Philippines",
    metaDescription:
      "Outsource PropertyMe maintenance workflows, tenant administration, work orders, contractor follow-up and property management data entry.",
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
    slug: "console-cloud-virtual-assistant",
    locale: "en-AU",
    name: "Console Cloud Virtual Assistant",
    software: "Console Cloud",
    category: "Property Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "console cloud virtual assistant",
    metaTitle: "Hire Console Cloud Virtual Assistant Philippines",
    metaDescription:
      "Get Console Cloud support for tenant requests, property records, maintenance jobs, contractor coordination and portfolio administration.",
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
    slug: "servicem8-virtual-assistant",
    locale: "en-AU",
    name: "ServiceM8 Virtual Assistant",
    software: "ServiceM8",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "servicem8 virtual assistant",
    metaTitle: "Hire ServiceM8 Virtual Assistant Philippines",
    metaDescription:
      "Hire a ServiceM8 Virtual Assistant for job setup, dispatch, quote follow-up, customer updates, completion paperwork, invoicing and workflow QA for tradies.",
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
    slug: "simpro-virtual-assistant",
    locale: "en-AU",
    name: "simPRO Virtual Assistant",
    software: "simPRO",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "simpro virtual assistant",
    metaTitle: "Hire simPRO Virtual Assistant Philippines",
    metaDescription:
      "Get simPRO support for job administration, scheduling, customer records, purchase orders, technician paperwork and invoicing workflows.",
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
    slug: "aroflo-virtual-assistant",
    locale: "en-AU",
    name: "AroFlo Virtual Assistant",
    software: "AroFlo",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "aroflo virtual assistant",
    metaTitle: "Hire AroFlo Virtual Assistant Philippines",
    metaDescription:
      "Outsource AroFlo task creation, scheduling, customer updates, purchase administration, technician follow-up and invoicing support.",
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
    slug: "tradify-virtual-assistant",
    locale: "en-AU",
    name: "Tradify Virtual Assistant",
    software: "Tradify",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "tradify virtual assistant",
    metaTitle: "Hire Tradify Virtual Assistant Philippines",
    metaDescription:
      "Get Tradify support for job creation, scheduling, quote preparation, customer updates and invoicing administration.",
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
    slug: "cliniko-virtual-assistant",
    locale: "en-AU",
    name: "Cliniko Virtual Assistant",
    software: "Cliniko",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "cliniko virtual assistant",
    metaTitle: "Hire Cliniko Virtual Assistant Philippines",
    metaDescription:
      "Hire a Cliniko Virtual Assistant for scheduling, reminders, patient admin, secure forms, invoices, payments and allied-health front desk support.",
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
    slug: "halaxy-virtual-assistant",
    locale: "en-AU",
    name: "Halaxy Virtual Assistant",
    software: "Halaxy",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "halaxy virtual assistant",
    metaTitle: "Hire Halaxy Virtual Assistant Philippines",
    metaDescription:
      "Get Halaxy support for patient intake, appointment administration, referral tracking, invoicing, recalls and practice workflows.",
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
    slug: "power-diary-virtual-assistant",
    locale: "en-AU",
    name: "Power Diary Virtual Assistant",
    software: "Power Diary",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "power diary virtual assistant",
    metaTitle: "Hire Power Diary Virtual Assistant Philippines",
    metaDescription:
      "Outsource Power Diary scheduling, patient administration, recalls, billing support, referral tracking and practice workflows.",
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
    slug: "jobadder-virtual-assistant",
    locale: "en-AU",
    name: "JobAdder Virtual Assistant",
    software: "JobAdder",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "jobadder virtual assistant",
    metaTitle: "Hire JobAdder Virtual Assistant Philippines",
    metaDescription:
      "Outsource JobAdder candidate sourcing, CRM cleanup, record enrichment, screening administration and interview scheduling.",
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
    slug: "bullhorn-virtual-assistant",
    locale: "en-AU",
    name: "Bullhorn Virtual Assistant",
    software: "Bullhorn",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "bullhorn virtual assistant",
    metaTitle: "Hire Bullhorn Virtual Assistant Philippines",
    metaDescription:
      "Get Bullhorn support for candidate sourcing, database cleanup, record enrichment, outreach administration and interview coordination.",
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
    slug: "vincere-virtual-assistant",
    locale: "en-AU",
    name: "Vincere Virtual Assistant",
    software: "Vincere",
    category: "Recruitment",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "vincere virtual assistant",
    metaTitle: "Hire Vincere Virtual Assistant Philippines",
    metaDescription:
      "Outsource Vincere sourcing, candidate records, CRM cleanup, pipeline administration and interview scheduling.",
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
    slug: "stratamax-virtual-assistant",
    locale: "en-AU",
    name: "StrataMax Virtual Assistant",
    software: "StrataMax",
    category: "Strata Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "stratamax virtual assistant",
    metaTitle: "Hire StrataMax Virtual Assistant Philippines",
    metaDescription:
      "Outsource StrataMax records, levy administration, meeting preparation, owner correspondence, arrears workflows and portfolio updates.",
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
    slug: "strata-master-virtual-assistant",
    locale: "en-AU",
    name: "MRI Strata Master Virtual Assistant",
    software: "MRI Strata Master",
    category: "Strata Management",
    directoryCategory: "Real Estate",
    primaryKeyword: "strata master virtual assistant",
    metaTitle: "Hire MRI Strata Master Virtual Assistant Philippines",
    metaDescription:
      "Get MRI Strata Master support for owner records, meeting administration, levies, arrears workflows and strata portfolio updates.",
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
    slug: "bgl-simple-fund-360-virtual-assistant",
    locale: "en-AU",
    name: "BGL Simple Fund 360 Virtual Assistant",
    software: "BGL Simple Fund 360",
    category: "SMSF & Accounting",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "bgl simple fund 360 virtual assistant",
    metaTitle: "Hire BGL Simple Fund 360 Virtual Assistant Philippines",
    metaDescription:
      "Outsource SMSF transaction coding, reconciliation, workpapers, document collection and audit-pack production in Simple Fund 360.",
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
    slug: "class-super-virtual-assistant",
    locale: "en-AU",
    name: "Class Super Virtual Assistant",
    software: "Class Super",
    category: "SMSF & Accounting",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "class super virtual assistant",
    metaTitle: "Hire Class Super Virtual Assistant Philippines",
    metaDescription:
      "Get Class Super support for SMSF transaction coding, investment reconciliation, workpapers, document collection and audit preparation.",
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
    slug: "revit-virtual-assistant",
    locale: "en-AU",
    name: "Revit Virtual Assistant",
    software: "Autodesk Revit",
    category: "Architecture & Engineering",
    directoryCategory: "Administrative Support",
    primaryKeyword: "revit virtual assistant",
    metaTitle: "Hire Revit Virtual Assistant Philippines",
    metaDescription:
      "Add Revit production support for model updates, sheets, schedules, families, redlines and BIM documentation.",
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
    slug: "canva-virtual-assistant",
    name: "Canva Virtual Assistant",
    software: "Canva",
    category: "Marketing & Creative",
    directoryCategory: "Video Editing & Creative",
    primaryKeyword: "canva virtual assistant",
    metaTitle: "Hire Canva Virtual Assistant Philippines",
    metaDescription: "Hire a Canva Virtual Assistant for branded social graphics, presentations, templates, resizing, asset organization and recurring design production.",
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
    slug: "gohighlevel-virtual-assistant",
    name: "GoHighLevel Virtual Assistant",
    software: "GoHighLevel",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "gohighlevel virtual assistant",
    metaTitle: "Hire GoHighLevel Virtual Assistant Philippines",
    metaDescription: "Hire a GoHighLevel Virtual Assistant for CRM updates, pipeline administration, contact cleanup, campaign setup support, tasks, and reporting.",
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
    slug: "salesforce-virtual-assistant",
    name: "Salesforce Virtual Assistant",
    software: "Salesforce",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "salesforce virtual assistant",
    metaTitle: "Hire Salesforce Virtual Assistant Philippines",
    metaDescription: "Hire a Salesforce Virtual Assistant for CRM data entry, contact and opportunity updates, task administration, cleanup, reporting and sales support.",
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
    slug: "hubspot-virtual-assistant",
    name: "HubSpot Virtual Assistant",
    software: "HubSpot",
    category: "CRM & Sales",
    directoryCategory: "Lead Generation & Sales",
    primaryKeyword: "hubspot virtual assistant",
    metaTitle: "Hire HubSpot Virtual Assistant Philippines",
    metaDescription: "Hire HubSpot Virtual Assistant support for CRM cleanup, pipeline updates, lead routing, contact enrichment, follow-up tasks and reporting.",
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
    slug: "xero-virtual-assistant",
    locale: "en-AU",
    name: "Xero Virtual Assistant",
    software: "Xero",
    category: "Accounting & Bookkeeping",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "xero virtual assistant",
    metaTitle: "Hire Xero Virtual Assistant Philippines",
    metaDescription: "Hire Xero Virtual Assistant support for transaction coding, reconciliations, document collection, receivables follow-up and month-end preparation.",
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
    slug: "klaviyo-virtual-assistant",
    name: "Klaviyo Virtual Assistant",
    software: "Klaviyo",
    category: "Email Marketing",
    directoryCategory: "Marketing & Social Media",
    primaryKeyword: "klaviyo virtual assistant",
    metaTitle: "Hire Klaviyo Virtual Assistant Philippines",
    metaDescription: "Hire Klaviyo Virtual Assistant support for campaign builds, list segments, flow QA, template updates, link checks, reporting and email admin.",
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
    slug: "quickbooks-virtual-assistant",
    name: "QuickBooks Virtual Assistant",
    software: "QuickBooks",
    category: "Accounting & Bookkeeping",
    directoryCategory: "Bookkeeping & Finance",
    primaryKeyword: "quickbooks virtual assistant",
    metaTitle: "Hire QuickBooks Virtual Assistant Philippines",
    metaDescription: "Hire QuickBooks Virtual Assistant support for bookkeeping admin, reconciliations, invoices, document collection, receivables and month-end prep.",
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
    primaryKeyword: "shiftcare virtual assistant",
    metaTitle: "Hire ShiftCare Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based ShiftCare support for Australian NDIS and aged-care rostering, participant records, worker availability, notes and service admin.",
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
    primaryKeyword: "best practice virtual assistant",
    metaTitle: "Hire Best Practice Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based Best Practice Premier support for Australian clinics covering appointments, recalls, referrals, patient records and reception admin.",
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
    primaryKeyword: "xplan virtual assistant",
    metaTitle: "Hire Xplan Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based Xplan support for Australian financial planning firms covering client records, review prep, workflows, documents and implementation.",
    h1: "Keep Xplan Client Administration Ready for Adviser Review",
    intro: "An Xplan Virtual Assistant can maintain client records, prepare review administration, track implementation actions and keep workflow tasks current while personal advice and regulated approvals remain with authorised Australian advisers.",
    focus: "xplan financial planning administration",
    workflows: ["open the approved client workflow","update client and household records","prepare annual review administration","collect supporting documents","maintain tasks and review dates","track implementation actions","prepare exception lists","close completed administrative steps"],
    tasks: ["client record maintenance","review preparation","fact-find administration","document follow-up","implementation tracking","workflow updates","service calendar administration"],
    bestFor: ["Australian financial planning firms","wealth advisers","paraplanning teams"],
    outcomes: ["Client records stay better prepared.","Review workflows become easier to track.","Advisers spend less time maintaining routine Xplan administration."],
    hiringNotes: ["Separate data preparation from personal financial advice.","Use role-based permissions and documented review gates.","Keep recommendations, advice documents and regulated approvals with authorised advisers."],
    relatedServiceSlugs: ["financial-planning","financial-advisor-virtual-assistant","admin-inbox"],
    relatedIndustrySlugs: ["financial-planning-firms","financial-advisers"]
  },
{
    slug: "pexa",
    locale: "en-AU",
    name: "PEXA Virtual Assistant",
    software: "PEXA",
    category: "Conveyancing",
    directoryCategory: "Administrative Support",
    primaryKeyword: "pexa virtual assistant",
    metaTitle: "Hire PEXA Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based PEXA administration support for Australian conveyancing teams covering workspace preparation, documents, milestones and follow-up.",
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
    primaryKeyword: "leap virtual assistant",
    metaTitle: "Hire LEAP Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based LEAP support for Australian legal and conveyancing teams covering matters, documents, tasks, client follow-up and file administration.",
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
    primaryKeyword: "vaultre virtual assistant",
    metaTitle: "Hire VaultRE Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based VaultRE support for Australian real-estate and buyers agency teams covering CRM, properties, contacts, tasks and follow-up.",
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
    primaryKeyword: "agentbox virtual assistant",
    metaTitle: "Hire AgentBox Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based AgentBox CRM support for Australian real-estate teams covering contacts, properties, tasks, campaigns and follow-up administration.",
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
    primaryKeyword: "property tree virtual assistant",
    metaTitle: "Hire Property Tree Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based Property Tree support for Australian property management teams covering maintenance, tenants, ledgers, inspections and admin.",
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
    primaryKeyword: "ailo virtual assistant",
    metaTitle: "Hire Ailo Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based Ailo support for Australian property management teams covering tenant communication, maintenance, payments admin and portfolio follow-up.",
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
    primaryKeyword: "myob virtual assistant",
    metaTitle: "Hire MYOB Virtual Assistant Australia",
    metaDescription: "Hire Philippines-based MYOB support for Australian businesses covering bookkeeping admin, invoices, bills, reconciliations and month-end preparation.",
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


];

export const softwarePagesBySlug = Object.fromEntries(
  softwarePages.map((page) => [page.slug, page])
) as Record<string, SoftwareSeoPage>;

export function getSoftwarePage(slug: string): SoftwareSeoPage | undefined {
  return softwarePagesBySlug[slug];
}
