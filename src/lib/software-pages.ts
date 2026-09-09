// Software-focused SEO landing pages for VirtualAssistant.com.ph

export type SoftwareSeoPage = {
  slug: string;
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
    name: "ServiceM8 Virtual Assistant",
    software: "ServiceM8",
    category: "Trades & Field Service",
    directoryCategory: "Administrative Support",
    primaryKeyword: "servicem8 virtual assistant",
    metaTitle: "Hire ServiceM8 Virtual Assistant Philippines",
    metaDescription:
      "Outsource ServiceM8 job creation, scheduling, customer updates, technician paperwork, quoting and invoice administration.",
    h1: "Keep Every ServiceM8 Job Moving From First Call to Invoice",
    intro:
      "A ServiceM8 Virtual Assistant can manage the office workflow around your field technicians. Jobs are created, scheduled, updated and prepared for invoicing while your licensed tradespeople handle technical decisions and field work.",
    focus: "servicem8 job administration",
    workflows: [
      "receive the customer enquiry",
      "create the customer and job record",
      "record approved job scope",
      "schedule the technician",
      "send appointment confirmations",
      "track job notes and photos",
      "prepare approved quote or invoice data",
      "follow outstanding paperwork",
      "close the administrative workflow"
    ],
    tasks: [
      "job creation",
      "technician scheduling",
      "customer updates",
      "quote preparation",
      "invoice preparation",
      "job note follow-up",
      "service administration"
    ],
    bestFor: [
      "electricians",
      "plumbers",
      "hvac companies",
      "solar installers",
      "field service businesses"
    ],
    outcomes: [
      "Incoming work becomes scheduled jobs faster.",
      "Technicians spend less time updating office systems.",
      "Completed jobs move toward invoicing with fewer administrative delays."
    ],
    hiringNotes: [
      "Define booking rules, service areas and technician capabilities.",
      "Keep technical and safety decisions with qualified field staff.",
      "The licensed local trade professional retains final technical advice, approvals and compliance responsibility."
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
    name: "Cliniko Virtual Assistant",
    software: "Cliniko",
    category: "Allied Health",
    directoryCategory: "Dental & Healthcare",
    primaryKeyword: "cliniko virtual assistant",
    metaTitle: "Hire Cliniko Virtual Assistant Philippines",
    metaDescription:
      "Outsource Cliniko patient intake, appointment administration, referrals, recalls, billing workflows and practice data management.",
    h1: "Keep Cliniko Referrals, Appointments and Billing Moving",
    intro:
      "A Cliniko Virtual Assistant can manage the administrative queues around each patient journey. Practitioners keep control of clinical decisions, treatment and advice while the Virtual Assistant handles approved intake, scheduling, billing and recall workflows.",
    focus: "cliniko practice administration",
    workflows: [
      "create or update the patient record",
      "process referral information",
      "schedule the appointment",
      "record administrative referral dates",
      "maintain appointment notes and status",
      "prepare approved billing records",
      "run recall lists",
      "update administrative follow-up tasks"
    ],
    tasks: [
      "patient intake",
      "referral processing",
      "appointment scheduling",
      "billing administration",
      "recall management",
      "patient record maintenance",
      "administrative follow-up"
    ],
    bestFor: [
      "physiotherapy clinics",
      "occupational therapy clinics",
      "speech pathology practices",
      "psychology practices",
      "allied health clinics"
    ],
    outcomes: [
      "Patient administration moves consistently between appointments.",
      "Referral and recall queues stay easier to manage.",
      "Clinicians spend less time maintaining non-clinical workflows."
    ],
    hiringNotes: [
      "Use role-based access to patient information.",
      "Document referral and billing escalation rules.",
      "The licensed local healthcare professional retains final clinical decisions, advice, treatment approval and compliance responsibility."
    ],
    relatedServiceSlugs: [
      "allied-health-referral-billing-virtual-assistant"
    ],
    relatedIndustrySlugs: [
      "allied-health-referral-billing"
    ]
  },

  // --- 11. Halaxy ---
  {
    slug: "halaxy-virtual-assistant",
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
    name: "Revit Virtual Assistant",
    software: "Autodesk Revit",
    category: "Architecture & Engineering",
    directoryCategory: "Administrative Support",
    primaryKeyword: "hire revit virtual assistant",
    metaTitle: "Hire Revit Virtual Assistant Philippines",
    metaDescription:
      "Add Revit production support for model updates, sheets, schedules, families, redlines and BIM documentation.",
    h1: "Add Revit Production Capacity Without Moving Design Authority",
    intro:
      "A Revit Virtual Assistant can handle clearly documented modeling and drawing production from approved instructions and markups. Architects and engineers retain control of design intent, technical decisions and final approvals.",
    focus: "revit modeling and documentation production",
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
      "revit modeling",
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
  }
];

export const softwarePagesBySlug = Object.fromEntries(
  softwarePages.map((page) => [page.slug, page])
) as Record<string, SoftwareSeoPage>;

export function getSoftwarePage(slug: string): SoftwareSeoPage | undefined {
  return softwarePagesBySlug[slug];
}
