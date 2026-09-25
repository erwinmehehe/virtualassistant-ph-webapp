export type ServiceSeoPage = {
  slug: string;
  locale?: "en-AU";
  name: string;
  group: string;
  directoryCategory: string;
  primaryKeyword: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  focus: string;
  tasks: string[];
  tools: string[];
  skills: string[];
  bestFor: string[];
  outcomes: string[];
  costFactors: string[];
  relatedSlugs: string[];
};

export function serviceMetaTitle(page: ServiceSeoPage) {
  const base = page.metaTitle;
  const expanded = `${base} | Hire Vetted VAs`;
  return base.length < 40 && expanded.length <= 60 ? expanded : base;
}

export function serviceMetaDescription(page: ServiceSeoPage) {
  return page.metaDescription.replace(/\s+/g, " ").trim();
}

export const SERVICE_PAGES: ServiceSeoPage[] = [
  {
    "slug": "seo",
    "name": "SEO Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "SEO",
    "primaryKeyword": "hire seo virtual assistant philippines",
    "metaTitle": "SEO Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted SEO Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an SEO Virtual Assistant in the Philippines to handle keyword research, on-page optimization, and internal linking. Useful when campaign and content work needs steady execution between strategy reviews.",
    "focus": "SEO strategy execution and recurring optimization",
    "tasks": [
      "keyword research",
      "on-page optimization",
      "internal linking",
      "content briefs",
      "Google Search Console monitoring",
      "technical audit support",
      "competitor research",
      "SEO reporting"
    ],
    "tools": [
      "Ahrefs",
      "Semrush",
      "Google Search Console",
      "GA4",
      "Screaming Frog",
      "WordPress",
      "Looker Studio",
      "Google Sheets"
    ],
    "skills": [
      "search intent analysis",
      "on-page SEO",
      "technical SEO basics",
      "content optimization",
      "reporting",
      "attention to detail"
    ],
    "bestFor": [
      "SEO agencies",
      "SaaS companies",
      "ecommerce brands",
      "local-service businesses"
    ],
    "outcomes": [
      "Create consistent ownership for keyword research",
      "Reduce the backlog around on-page optimization",
      "Keep SEO strategy execution and recurring optimization documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "digital-marketing-virtual-assistant",
      "content-writing",
      "wordpress"
    ]
  },
  {
    "slug": "dental-virtual-assistant",
    "name": "Dental Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire dental virtual assistant philippines",
    "metaTitle": "Dental Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Dental Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Dental Virtual Assistant in the Philippines to handle appointment scheduling, patient reminders, and insurance verification support. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "non-clinical dental front-office support",
    "tasks": [
      "appointment scheduling",
      "patient reminders",
      "insurance verification support",
      "treatment follow-up administration",
      "inbox and phone support",
      "recall workflows",
      "document coordination",
      "billing follow-up support"
    ],
    "tools": [
      "Dentrix",
      "Open Dental",
      "Eaglesoft",
      "Google Workspace",
      "RingCentral",
      "NexHealth",
      "Weave",
      "Microsoft 365"
    ],
    "skills": [
      "patient communication",
      "schedule management",
      "dental workflow familiarity",
      "documentation",
      "privacy awareness",
      "phone etiquette"
    ],
    "bestFor": [
      "dental practices",
      "orthodontic offices",
      "oral surgery practices",
      "multi-location dental groups"
    ],
    "outcomes": [
      "Create consistent ownership for appointment scheduling",
      "Reduce the backlog around patient reminders",
      "Keep non-clinical dental front-office support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "medical-virtual-assistant",
      "dental-billing-virtual-assistant",
      "phone-receptionist",
      "admin-inbox"
    ]
  },
  {
    "slug": "research-data",
    "name": "Data Entry & Research Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "data entry virtual assistant",
    "metaTitle": "Data Entry Virtual Assistant Philippines | Research VA",
    "metaDescription": "Hire a Data Entry Virtual Assistant in the Philippines for research, spreadsheets, database updates, validation, list building, cleanup, and record maintenance.",
    "intro": "Hire a Data Entry Virtual Assistant in the Philippines for web research, spreadsheet work, database updates, validation, list building, cleanup, and record maintenance. The same role can support research workflows when the work centers on accurate data collection and structured records.",
    "focus": "accurate research, data collection, cleanup, and record maintenance",
    "tasks": [
      "web research",
      "data entry",
      "spreadsheet cleanup",
      "contact research",
      "database updates",
      "competitor research",
      "data validation",
      "list building"
    ],
    "tools": [
      "Google Sheets",
      "Excel",
      "Airtable",
      "Notion",
      "Apollo",
      "LinkedIn",
      "HubSpot",
      "Google Workspace"
    ],
    "skills": [
      "research accuracy",
      "spreadsheet proficiency",
      "source validation",
      "data hygiene",
      "attention to detail",
      "documentation"
    ],
    "bestFor": [
      "research teams",
      "sales teams",
      "agencies",
      "small businesses"
    ],
    "outcomes": [
      "Create consistent ownership for web research",
      "Reduce the backlog around data entry",
      "Keep accurate research, data collection, cleanup, and record maintenance documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "general-virtual-assistant",
      "admin-inbox",
      "lead-generation",
      "crm"
    ]
  },
  {
    "slug": "project-coordination",
    "name": "Project Management Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "project management virtual assistant",
    "metaTitle": "Project Management Virtual Assistant Philippines",
    "metaDescription": "Hire a Project Management Virtual Assistant in the Philippines for task tracking, meeting coordination, status updates, documentation, and deadline follow-up.",
    "intro": "Hire a Project Management Virtual Assistant in the Philippines for task tracking, meeting coordination, status updates, documentation, and deadline follow-up. The role can also be described as a Virtual Project Manager or Project Coordination Virtual Assistant, but accountable project decisions should stay with the designated project owner.",
    "focus": "day-to-day coordination that keeps projects moving",
    "tasks": [
      "task tracking",
      "meeting coordination",
      "status updates",
      "deadline follow-up",
      "project documentation",
      "stakeholder reminders",
      "risk and blocker logging",
      "file organization"
    ],
    "tools": [
      "Asana",
      "ClickUp",
      "Monday.com",
      "Trello",
      "Notion",
      "Slack",
      "Google Workspace",
      "Microsoft Teams"
    ],
    "skills": [
      "project organization",
      "follow-up discipline",
      "meeting notes",
      "deadline management",
      "communication",
      "documentation"
    ],
    "bestFor": [
      "agencies",
      "consulting teams",
      "remote teams",
      "operations teams"
    ],
    "outcomes": [
      "Create consistent ownership for task tracking",
      "Reduce the backlog around meeting coordination",
      "Keep day-to-day coordination that keeps projects moving documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "operations",
      "admin-inbox",
      "executive-virtual-assistant",
      "calendar",
      "event-planning-virtual-assistant"
    ]
  },
  {
    "slug": "real-estate",
    "name": "Real Estate Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "hire real estate virtual assistant philippines",
    "metaTitle": "Real Estate Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Real Estate Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Real Estate Virtual Assistant in the Philippines to handle CRM updates, lead follow-up, and listing administration. Tie the work to your lead, listing, transaction, or property system so dates, documents, and follow-up remain visible.",
    "focus": "administrative and lead-management support for real estate teams",
    "tasks": [
      "CRM updates",
      "lead follow-up",
      "listing administration",
      "transaction coordination support",
      "appointment scheduling",
      "property research",
      "database cleanup",
      "marketing coordination"
    ],
    "tools": [
      "Follow Up Boss",
      "KVCore",
      "BoomTown",
      "MLS tools",
      "Google Workspace",
      "DocuSign",
      "Canva",
      "Zillow"
    ],
    "skills": [
      "real estate workflow familiarity",
      "CRM discipline",
      "lead follow-up",
      "transaction support",
      "communication",
      "organization"
    ],
    "bestFor": [
      "real estate agents",
      "brokerages",
      "real estate investors",
      "property teams"
    ],
    "outcomes": [
      "Create consistent ownership for crm updates",
      "Reduce the backlog around lead follow-up",
      "Keep administrative and lead-management support for real estate teams documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "property-management-virtual-assistant",
      "lead-generation",
      "phone-receptionist",
      "admin-inbox"
    ]
  },
  {
    "slug": "medical-virtual-assistant",
    "name": "Medical Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire medical virtual assistant philippines",
    "metaTitle": "Medical Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Medical Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Medical Virtual Assistant in the Philippines to handle appointment scheduling, patient reminders, and referral coordination. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "non-clinical administrative support for medical practices",
    "tasks": [
      "appointment scheduling",
      "patient reminders",
      "referral coordination",
      "records administration",
      "insurance verification support",
      "inbox and phone support",
      "intake coordination",
      "billing administration"
    ],
    "tools": [
      "EHR and practice-management systems",
      "Google Workspace",
      "Microsoft 365",
      "RingCentral",
      "Zoom",
      "secure messaging tools"
    ],
    "skills": [
      "patient communication",
      "medical admin workflow familiarity",
      "privacy awareness",
      "scheduling",
      "documentation",
      "escalation judgment"
    ],
    "bestFor": [
      "medical practices",
      "specialty clinics",
      "telehealth teams",
      "healthcare groups"
    ],
    "outcomes": [
      "Create consistent ownership for appointment scheduling",
      "Reduce the backlog around patient reminders",
      "Keep non-clinical administrative support for medical practices documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "medical-billing-virtual-assistant",
      "medical-scribe-virtual-assistant",
      "mental-health-virtual-assistant",
      "phone-receptionist",
      "medical-receptionist"]
  },
  {
    "slug": "property-management-virtual-assistant",
    "name": "Property Management Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "property management virtual assistant",
    "metaTitle": "Property Management Virtual Assistant Philippines",
    "metaDescription": "Hire a Property Management Virtual Assistant in the Philippines for tenant messages, maintenance coordination, leasing follow-up, vendors, and property admin.",
    "intro": "Hire a Property Management Virtual Assistant in the Philippines for tenant communication, maintenance coordination, leasing inquiry follow-up, vendor administration, inspection scheduling, CRM updates, and document organization. Tie every task to the property-management system so dates, approvals, and next actions remain visible.",
    "focus": "tenant, leasing, maintenance, and property-office administration",
    "tasks": [
      "tenant communication",
      "maintenance coordination",
      "leasing inquiry follow-up",
      "rent-roll administration support",
      "vendor coordination",
      "inspection scheduling",
      "CRM updates",
      "document organization"
    ],
    "tools": [
      "Buildium",
      "AppFolio",
      "Propertyware",
      "Rent Manager",
      "Google Workspace",
      "Slack",
      "DocuSign",
      "Calendly"
    ],
    "skills": [
      "tenant communication",
      "property workflow familiarity",
      "vendor coordination",
      "scheduling",
      "documentation",
      "customer service"
    ],
    "bestFor": [
      "property managers",
      "multifamily operators",
      "short-term rental managers",
      "real estate investors"
    ],
    "outcomes": [
      "Create consistent ownership for tenant communication",
      "Reduce the backlog around maintenance coordination",
      "Keep tenant, leasing, maintenance, and property-office administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "real-estate",
      "airbnb-virtual-assistant",
      "short-term-rental-virtual-assistant",
      "phone-receptionist",
      "trust-accounting"]
  },
  {
    "slug": "executive-virtual-assistant",
    "name": "Executive Virtual Assistant",
    "group": "Executive Support",
    "directoryCategory": "Executive Assistance",
    "primaryKeyword": "hire executive virtual assistant philippines",
    "metaTitle": "Executive Virtual Assistant Philippines",
    "metaDescription": "Hire an Executive Virtual Assistant in the Philippines for calendar, inbox, meeting, travel, and leadership support. Compare judgment, tools, and availability.",
    "intro": "An Executive Virtual Assistant is a high-trust remote professional who supports founders and leaders with complex calendars, inbox triage, meeting preparation, priority tracking, and stakeholder follow-up. Hire one in the Philippines when the role needs stronger judgment, confidentiality, and proactive coordination.",
    "focus": "high-trust support for founders, executives, and leadership teams",
    "tasks": [
      "complex calendar management",
      "inbox triage",
      "meeting preparation",
      "travel research",
      "priority tracking",
      "stakeholder follow-up",
      "document preparation",
      "executive research"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "Slack",
      "Notion",
      "Asana",
      "ClickUp",
      "Zoom",
      "Calendly"
    ],
    "skills": [
      "judgment",
      "confidentiality",
      "executive communication",
      "prioritization",
      "calendar strategy",
      "proactive follow-up"
    ],
    "bestFor": [
      "founders",
      "CEOs",
      "consultants",
      "leadership teams"
    ],
    "outcomes": [
      "Create consistent ownership for complex calendar management",
      "Reduce the backlog around inbox triage",
      "Keep high-trust support for founders, executives, and leadership teams documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "personal-assistant",
      "calendar",
      "admin-inbox",
      "project-coordination"
    ]
  },
  {
    "slug": "fulfilment",
    "name": "Order & Fulfilment Virtual Assistant",
    "group": "Ecommerce",
    "directoryCategory": "Ecommerce",
    "primaryKeyword": "hire order & fulfilment virtual assistant philippines",
    "metaTitle": "Order & Fulfilment Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Order & Fulfilment Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Order & Fulfilment Virtual Assistant in the Philippines to handle order monitoring, shipment tracking, and order exception handling. The role works best when the store, help desk, inventory data, and approval rules are treated as one operating workflow.",
    "focus": "order processing and fulfilment coordination for ecommerce operations",
    "tasks": [
      "order monitoring",
      "shipment tracking",
      "order exception handling",
      "customer updates",
      "returns coordination",
      "inventory status updates",
      "3PL communication",
      "fulfilment reporting"
    ],
    "tools": [
      "Shopify",
      "Amazon Seller Central",
      "ShipStation",
      "Gorgias",
      "Klaviyo",
      "Google Sheets",
      "3PL portals",
      "Slack"
    ],
    "skills": [
      "order accuracy",
      "ecommerce operations",
      "customer communication",
      "exception handling",
      "inventory awareness",
      "reporting"
    ],
    "bestFor": [
      "ecommerce brands",
      "Amazon sellers",
      "Shopify stores",
      "subscription businesses"
    ],
    "outcomes": [
      "Create consistent ownership for order monitoring",
      "Reduce the backlog around shipment tracking",
      "Keep order processing and fulfilment coordination for ecommerce operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "ecommerce",
      "shopify-virtual-assistant",
      "amazon-virtual-assistant",
      "customer-service"
    ]
  },
  {
    "slug": "social-media",
    "name": "Social Media Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "social media virtual assistant",
    "metaTitle": "Social Media Virtual Assistant Philippines",
    "metaDescription": "Hire a Social Media Virtual Assistant in the Philippines for scheduling, content operations, community admin, reporting, asset coordination, and channel upkeep.",
    "intro": "Hire a Social Media Virtual Assistant in the Philippines for content scheduling, community administration, asset coordination, reporting, and recurring channel upkeep. Keep positioning, sensitive replies, paid-media decisions, and final publishing rules with the accountable marketer unless explicitly delegated.",
    "focus": "consistent social publishing, community support, and content operations",
    "tasks": [
      "content scheduling",
      "caption formatting",
      "community management",
      "comment and DM triage",
      "content repurposing",
      "basic analytics",
      "asset organization",
      "social reporting"
    ],
    "tools": [
      "Meta Business Suite",
      "Buffer",
      "Hootsuite",
      "Later",
      "Canva",
      "CapCut",
      "TikTok",
      "LinkedIn"
    ],
    "skills": [
      "social platform fluency",
      "brand voice",
      "community management",
      "content scheduling",
      "basic analytics",
      "creative coordination"
    ],
    "bestFor": [
      "personal brands",
      "ecommerce brands",
      "agencies",
      "local businesses"
    ],
    "outcomes": [
      "Create consistent ownership for content scheduling",
      "Reduce the backlog around caption formatting",
      "Keep consistent social publishing, community support, and content operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "digital-marketing-virtual-assistant",
      "content-writing",
      "graphic-design",
      "video-editing"
    ]
  },
  {
    "slug": "ecommerce",
    "name": "Ecommerce Virtual Assistant",
    "group": "Ecommerce",
    "directoryCategory": "Ecommerce",
    "primaryKeyword": "hire ecommerce virtual assistant philippines",
    "metaTitle": "Ecommerce Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Ecommerce Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Ecommerce Virtual Assistant in the Philippines to handle product listing updates, order support, and inventory coordination. The role works best when the store, help desk, inventory data, and approval rules are treated as one operating workflow.",
    "focus": "day-to-day ecommerce store operations and customer support",
    "tasks": [
      "product listing updates",
      "order support",
      "inventory coordination",
      "customer service",
      "store content updates",
      "promotion setup support",
      "returns administration",
      "sales reporting"
    ],
    "tools": [
      "Shopify",
      "WooCommerce",
      "Amazon Seller Central",
      "Gorgias",
      "Klaviyo",
      "Google Sheets",
      "Canva",
      "ShipStation"
    ],
    "skills": [
      "ecommerce operations",
      "product data",
      "customer service",
      "order workflows",
      "spreadsheet accuracy",
      "merchandising support"
    ],
    "bestFor": [
      "DTC brands",
      "Shopify stores",
      "marketplace sellers",
      "subscription businesses"
    ],
    "outcomes": [
      "Create consistent ownership for product listing updates",
      "Reduce the backlog around order support",
      "Keep day-to-day ecommerce store operations and customer support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "shopify-virtual-assistant",
      "amazon-virtual-assistant",
      "fulfilment",
      "customer-service"
    ]
  },
  {
    "slug": "admin-inbox",
    "name": "Administrative Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "administrative virtual assistant",
    "metaTitle": "Administrative Virtual Assistant Philippines",
    "metaDescription": "Hire an Administrative Virtual Assistant in the Philippines for inbox, calendar, records, research, data entry, coordination, and recurring admin support.",
    "intro": "Hire an Administrative Virtual Assistant in the Philippines for inbox management, calendar support, records, research, data entry, document preparation, and recurring coordination. Use this role for focused administrative support; choose a General Virtual Assistant when the workload spans several unrelated functions.",
    "focus": "inbox, calendar, scheduling, and recurring administrative support",
    "tasks": [
      "inbox triage",
      "email drafting",
      "calendar coordination",
      "meeting scheduling",
      "document formatting",
      "spreadsheet updates",
      "follow-up tracking",
      "file organization"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "Slack",
      "Notion",
      "Asana",
      "Calendly",
      "Zoom",
      "Dropbox"
    ],
    "skills": [
      "written communication",
      "organization",
      "calendar management",
      "email judgment",
      "attention to detail",
      "follow-up"
    ],
    "bestFor": [
      "founders",
      "small businesses",
      "consultants",
      "remote teams"
    ],
    "outcomes": [
      "Create consistent ownership for inbox triage",
      "Reduce the backlog around email drafting",
      "Keep inbox, calendar, scheduling, and recurring administrative support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "general-virtual-assistant",
      "calendar",
      "executive-virtual-assistant",
      "project-coordination",
      "email-management-virtual-assistant"
    ]
  },
  {
    "slug": "legal-virtual-assistant",
    "name": "Legal Virtual Assistant",
    "group": "Legal",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire legal virtual assistant philippines",
    "metaTitle": "Legal Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Legal Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Legal Virtual Assistant in the Philippines to handle client intake administration, calendar and deadline support, and document organization. Use the role for supervised administrative support while legal advice and attorney judgment stay with qualified counsel.",
    "focus": "administrative and case-support workflows for legal teams under appropriate supervision",
    "tasks": [
      "client intake administration",
      "calendar and deadline support",
      "document organization",
      "case-file updates",
      "billing administration",
      "research support",
      "email and phone triage",
      "matter-management updates"
    ],
    "tools": [
      "Clio",
      "MyCase",
      "PracticePanther",
      "Google Workspace",
      "Microsoft 365",
      "DocuSign",
      "Calendly",
      "Zoom"
    ],
    "skills": [
      "legal admin workflow familiarity",
      "confidentiality",
      "document organization",
      "deadline discipline",
      "client communication",
      "research"
    ],
    "bestFor": [
      "law firms",
      "solo attorneys",
      "legal departments",
      "immigration practices"
    ],
    "outcomes": [
      "Create consistent ownership for client intake administration",
      "Reduce the backlog around calendar and deadline support",
      "Keep administrative and case-support workflows for legal teams under appropriate supervision documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "law-firm-virtual-assistant",
      "paralegal-virtual-assistant",
      "admin-inbox",
      "transcription",
      "conveyancing"]
  },
  {
    "slug": "recruitment-hr",
    "name": "Recruitment & HR Virtual Assistant",
    "group": "People & HR",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hr virtual assistant",
    "metaTitle": "HR Virtual Assistant Philippines | Recruitment Support",
    "metaDescription": "Hire an HR Virtual Assistant in the Philippines for sourcing support, interview scheduling, ATS updates, onboarding coordination, and people operations.",
    "intro": "Hire an HR Virtual Assistant in the Philippines for candidate sourcing support, interview scheduling, ATS updates, onboarding coordination, and people-operations administration. The same role is often called a Recruitment Virtual Assistant or Human Resources Virtual Assistant when sourcing and people-operations work share one workflow.",
    "focus": "recruiting coordination and people-operations administration",
    "tasks": [
      "candidate sourcing support",
      "interview scheduling",
      "ATS updates",
      "job posting administration",
      "candidate follow-up",
      "onboarding coordination",
      "HR document organization",
      "reporting"
    ],
    "tools": [
      "LinkedIn Recruiter",
      "Greenhouse",
      "Lever",
      "Workable",
      "BambooHR",
      "Google Workspace",
      "Calendly",
      "Slack"
    ],
    "skills": [
      "candidate communication",
      "sourcing support",
      "ATS discipline",
      "scheduling",
      "documentation",
      "confidentiality"
    ],
    "bestFor": [
      "recruiting agencies",
      "startups",
      "HR teams",
      "growing small businesses"
    ],
    "outcomes": [
      "Create consistent ownership for candidate sourcing support",
      "Reduce the backlog around interview scheduling",
      "Keep recruiting coordination and people-operations administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "admin-inbox",
      "project-coordination",
      "research-data",
      "operations"
    ]
  },
  {
    "slug": "wordpress",
    "name": "WordPress Virtual Assistant",
    "group": "Technology & Web",
    "directoryCategory": "Web & WordPress",
    "primaryKeyword": "wordpress virtual assistant",
    "metaTitle": "WordPress Virtual Assistant Philippines",
    "metaDescription": "Hire a WordPress Virtual Assistant in the Philippines for publishing, page updates, image optimization, plugin support, QA, forms, and internal linking.",
    "intro": "Hire a WordPress Virtual Assistant in the Philippines for content publishing, page updates, image optimization, plugin-update support, basic QA, form checks, and internal linking. Use controlled access, staging or backups where appropriate, and explicit approval for higher-risk production changes.",
    "focus": "WordPress publishing, site maintenance, and content operations",
    "tasks": [
      "page and post updates",
      "content publishing",
      "plugin updates support",
      "image optimization",
      "basic QA",
      "form checks",
      "internal linking",
      "site backups coordination"
    ],
    "tools": [
      "WordPress",
      "Elementor",
      "WooCommerce",
      "Yoast",
      "Rank Math",
      "Google Search Console",
      "Canva",
      "Cloudflare"
    ],
    "skills": [
      "WordPress administration",
      "content publishing",
      "basic SEO",
      "QA",
      "image optimization",
      "troubleshooting"
    ],
    "bestFor": [
      "content sites",
      "agencies",
      "small businesses",
      "ecommerce brands"
    ],
    "outcomes": [
      "Create consistent ownership for page and post updates",
      "Reduce the backlog around content publishing",
      "Keep WordPress publishing, site maintenance, and content operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "seo",
      "content-writing",
      "web-developer-virtual-assistant",
      "ecommerce"
    ]
  },
  {
    "slug": "phone-receptionist",
    "name": "Virtual Receptionist",
    "group": "Customer & Front Desk",
    "directoryCategory": "Phone & Reception",
    "primaryKeyword": "virtual receptionist",
    "metaTitle": "Virtual Receptionist Philippines | Phone Support",
    "metaDescription": "Hire a Virtual Receptionist in the Philippines for inbound calls, appointment booking, message taking, call routing, CRM notes, and front-desk support.",
    "intro": "Hire a Virtual Receptionist in the Philippines for inbound call answering, appointment booking, message taking, call routing, CRM notes, and remote front-desk support. This role fits live phone coverage; use the personal assistant page for one-to-one executive or personal administration.",
    "focus": "live phone, scheduling, and front-desk support for remote teams",
    "tasks": [
      "inbound call answering",
      "appointment booking",
      "message taking",
      "call routing",
      "lead qualification support",
      "customer follow-up",
      "calendar updates",
      "CRM notes"
    ],
    "tools": [
      "RingCentral",
      "Dialpad",
      "Aircall",
      "Google Voice",
      "Calendly",
      "HubSpot",
      "Google Workspace",
      "Microsoft Teams"
    ],
    "skills": [
      "phone etiquette",
      "active listening",
      "scheduling",
      "customer service",
      "clear notes",
      "escalation judgment"
    ],
    "bestFor": [
      "medical offices",
      "home-service companies",
      "law firms",
      "small businesses"
    ],
    "outcomes": [
      "Create consistent ownership for inbound call answering",
      "Reduce the backlog around appointment booking",
      "Keep live phone, scheduling, and front-desk support for remote teams documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "customer-service",
      "appointment-setter-virtual-assistant",
      "admin-inbox",
      "dental-virtual-assistant"
    ]
  },
  {
    "slug": "email-marketing",
    "name": "Email Marketing Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "email marketing virtual assistant",
    "metaTitle": "Email Marketing Virtual Assistant Philippines",
    "metaDescription": "Hire an Email Marketing Virtual Assistant in the Philippines for campaign setup, newsletters, segmentation, automation updates, QA, tagging, and reporting.",
    "intro": "Hire an Email Marketing Virtual Assistant in the Philippines for campaign setup, newsletter production, segmentation, automation updates, QA, tagging, and reporting. Keep strategy, offers, sensitive claims, and final campaign approval with the accountable marketer unless explicitly delegated.",
    "focus": "campaign production, list administration, and email marketing operations",
    "tasks": [
      "campaign setup",
      "newsletter formatting",
      "list segmentation",
      "automation updates",
      "QA testing",
      "UTM tagging",
      "reporting",
      "template maintenance"
    ],
    "tools": [
      "Klaviyo",
      "Mailchimp",
      "HubSpot",
      "ActiveCampaign",
      "ConvertKit",
      "Brevo",
      "Canva",
      "Google Sheets"
    ],
    "skills": [
      "email QA",
      "segmentation",
      "automation logic",
      "copy formatting",
      "deliverability awareness",
      "reporting"
    ],
    "bestFor": [
      "ecommerce brands",
      "SaaS companies",
      "creators",
      "agencies"
    ],
    "outcomes": [
      "Create consistent ownership for campaign setup",
      "Reduce the backlog around newsletter formatting",
      "Keep campaign production, list administration, and email marketing operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "digital-marketing-virtual-assistant",
      "content-writing",
      "crm",
      "ecommerce"
    ]
  },
  {
    "slug": "pinterest-virtual-assistant",
    "name": "Pinterest Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "hire pinterest virtual assistant philippines",
    "metaTitle": "Pinterest Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Pinterest Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Pinterest Virtual Assistant in the Philippines to handle pin scheduling, keyword research, and board organization. Useful when campaign and content work needs steady execution between strategy reviews.",
    "focus": "Pinterest publishing, creative operations, and traffic-focused content support",
    "tasks": [
      "pin scheduling",
      "keyword research",
      "board organization",
      "creative resizing",
      "description writing",
      "link QA",
      "analytics tracking",
      "content repurposing"
    ],
    "tools": [
      "Pinterest",
      "Tailwind",
      "Canva",
      "Google Sheets",
      "GA4",
      "WordPress",
      "Shopify",
      "Notion"
    ],
    "skills": [
      "Pinterest SEO",
      "visual content organization",
      "keyword research",
      "creative adaptation",
      "analytics",
      "consistency"
    ],
    "bestFor": [
      "bloggers",
      "ecommerce brands",
      "publishers",
      "lifestyle businesses"
    ],
    "outcomes": [
      "Create consistent ownership for pin scheduling",
      "Reduce the backlog around keyword research",
      "Keep Pinterest publishing, creative operations, and traffic-focused content support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "social-media",
      "graphic-design",
      "content-writing",
      "digital-marketing-virtual-assistant"
    ]
  },
  {
    "slug": "amazon-virtual-assistant",
    "name": "Amazon Virtual Assistant",
    "group": "Ecommerce",
    "directoryCategory": "Ecommerce",
    "primaryKeyword": "hire amazon virtual assistant philippines",
    "metaTitle": "Amazon Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Amazon Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Amazon Virtual Assistant in the Philippines to handle listing updates, catalog cleanup, and order monitoring. The role works best when the store, help desk, inventory data, and approval rules are treated as one operating workflow.",
    "focus": "Amazon marketplace operations, listing support, and seller administration",
    "tasks": [
      "listing updates",
      "catalog cleanup",
      "order monitoring",
      "customer message support",
      "inventory tracking",
      "case administration",
      "competitor research",
      "reporting"
    ],
    "tools": [
      "Amazon Seller Central",
      "Helium 10",
      "Jungle Scout",
      "Keepa",
      "Google Sheets",
      "Canva",
      "Slack",
      "ShipStation"
    ],
    "skills": [
      "Amazon operations",
      "listing accuracy",
      "catalog management",
      "customer support",
      "inventory awareness",
      "marketplace research"
    ],
    "bestFor": [
      "Amazon sellers",
      "private-label brands",
      "agencies",
      "multichannel ecommerce businesses"
    ],
    "outcomes": [
      "Create consistent ownership for listing updates",
      "Reduce the backlog around catalog cleanup",
      "Keep Amazon marketplace operations, listing support, and seller administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "ecommerce",
      "fulfilment",
      "ebay-virtual-assistant",
      "shopify-virtual-assistant"
    ]
  },
  {
    "slug": "general-virtual-assistant",
    "name": "General Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire general virtual assistant philippines",
    "metaTitle": "General Virtual Assistant Philippines",
    "metaDescription": "Hire a General Virtual Assistant in the Philippines for admin, research, CRM, scheduling, and recurring support. Compare experience, tools, and availability.",
    "intro": "A General Virtual Assistant is a flexible remote support professional for recurring admin, research, coordination, CRM, and customer follow-up. When hiring a General Virtual Assistant in the Philippines, define the recurring workload, systems, priorities, and escalation rules before you compare candidates.",
    "focus": "flexible recurring support across administration, research, coordination, and customer workflows",
    "tasks": [
      "email and calendar support",
      "data entry",
      "research",
      "document updates",
      "customer follow-up",
      "CRM maintenance",
      "meeting coordination",
      "reporting"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "Slack",
      "Notion",
      "Trello",
      "Asana",
      "Canva",
      "HubSpot"
    ],
    "skills": [
      "adaptability",
      "written communication",
      "organization",
      "research",
      "documentation",
      "attention to detail"
    ],
    "bestFor": [
      "small businesses",
      "founders",
      "consultants",
      "remote teams"
    ],
    "outcomes": [
      "Create consistent ownership for email and calendar support",
      "Reduce the backlog around data entry",
      "Keep flexible recurring support across administration, research, coordination, and customer workflows documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "admin-inbox",
      "research-data",
      "project-coordination",
      "small-business-virtual-assistant"
    ]
  },
  {
    "slug": "it-virtual-assistant",
    "name": "IT Virtual Assistant",
    "group": "Technology & Web",
    "directoryCategory": "Web & WordPress",
    "primaryKeyword": "it support virtual assistant",
    "metaTitle": "IT Virtual Assistant Philippines | Remote IT Support",
    "metaDescription": "Hire an IT Virtual Assistant in the Philippines for help-desk admin, account setup, documentation, ticket triage, SaaS support, and remote technical workflows.",
    "intro": "Hire an IT Virtual Assistant in the Philippines for help-desk administration, account setup, documentation, ticket triage, SaaS support, and recurring remote IT workflows. Define access, permissions, escalation, and what requires a senior technician before the role starts.",
    "focus": "remote technical administration and first-line IT coordination",
    "tasks": [
      "user account administration",
      "helpdesk triage",
      "SaaS access tracking",
      "device inventory administration",
      "documentation",
      "password-reset coordination",
      "ticket updates",
      "vendor follow-up"
    ],
    "tools": [
      "Google Workspace Admin",
      "Microsoft 365 Admin",
      "Jira Service Management",
      "Zendesk",
      "Freshservice",
      "Slack",
      "Notion",
      "1Password"
    ],
    "skills": [
      "technical troubleshooting",
      "ticket discipline",
      "documentation",
      "access-control awareness",
      "communication",
      "escalation judgment"
    ],
    "bestFor": [
      "startups",
      "remote teams",
      "MSPs",
      "small businesses"
    ],
    "outcomes": [
      "Create consistent ownership for user account administration",
      "Reduce the backlog around helpdesk triage",
      "Keep remote technical administration and first-line IT coordination documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "web-developer-virtual-assistant",
      "wordpress",
      "operations",
      "admin-inbox"
    ]
  },
  {
    "slug": "airbnb-virtual-assistant",
    "name": "Airbnb Virtual Assistant",
    "group": "Hospitality",
    "directoryCategory": "Customer Service",
    "primaryKeyword": "hire airbnb virtual assistant philippines",
    "metaTitle": "Airbnb Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Airbnb Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Airbnb Virtual Assistant in the Philippines to handle guest messaging, booking coordination, and check-in support. Keep property instructions, guest-response standards, booking details, and urgent escalation rules current in one shared workflow.",
    "focus": "guest messaging, reservation coordination, and short-term rental administration",
    "tasks": [
      "guest messaging",
      "booking coordination",
      "check-in support",
      "cleaner scheduling",
      "review follow-up",
      "calendar monitoring",
      "issue escalation",
      "listing updates"
    ],
    "tools": [
      "Airbnb",
      "Vrbo",
      "Guesty",
      "Hostaway",
      "Hospitable",
      "Google Workspace",
      "WhatsApp",
      "Slack"
    ],
    "skills": [
      "guest communication",
      "hospitality judgment",
      "calendar accuracy",
      "issue escalation",
      "vendor coordination",
      "response speed"
    ],
    "bestFor": [
      "Airbnb hosts",
      "vacation-rental managers",
      "property managers",
      "hospitality operators"
    ],
    "outcomes": [
      "Create consistent ownership for guest messaging",
      "Reduce the backlog around booking coordination",
      "Keep guest messaging, reservation coordination, and short-term rental administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "short-term-rental-virtual-assistant",
      "property-management-virtual-assistant",
      "customer-service",
      "phone-receptionist"
    ]
  },
  {
    "slug": "crm",
    "name": "CRM Virtual Assistant",
    "group": "Sales & CRM",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "crm virtual assistant",
    "metaTitle": "CRM Virtual Assistant Philippines | Sales Operations",
    "metaDescription": "Hire a CRM Virtual Assistant in the Philippines for contact cleanup, pipeline updates, lead assignment, follow-up tasks, reporting, and sales operations.",
    "intro": "Hire a CRM Virtual Assistant in the Philippines for contact cleanup, pipeline updates, lead assignment, follow-up tasks, reporting, data enrichment, and workflow QA. Define pipeline stages and handoff rules first so CRM activity stays useful to sales and customer teams.",
    "focus": "CRM hygiene, pipeline administration, and sales-operations support",
    "tasks": [
      "contact cleanup",
      "pipeline updates",
      "lead assignment",
      "deal-stage maintenance",
      "follow-up task creation",
      "reporting",
      "data enrichment",
      "workflow QA"
    ],
    "tools": [
      "HubSpot",
      "Salesforce",
      "Pipedrive",
      "GoHighLevel",
      "Zoho CRM",
      "Close",
      "Apollo",
      "Google Sheets"
    ],
    "skills": [
      "CRM hygiene",
      "sales process awareness",
      "data accuracy",
      "reporting",
      "automation basics",
      "follow-up discipline"
    ],
    "bestFor": [
      "sales teams",
      "agencies",
      "B2B companies",
      "service businesses"
    ],
    "outcomes": [
      "Create consistent ownership for contact cleanup",
      "Reduce the backlog around pipeline updates",
      "Keep CRM hygiene, pipeline administration, and sales-operations support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "lead-generation",
      "sales-virtual-assistant",
      "appointment-setter-virtual-assistant",
      "research-data"
    ]
  },
  {
    "slug": "calendar",
    "name": "Calendar Management Virtual Assistant",
    "group": "Executive Support",
    "directoryCategory": "Executive Assistance",
    "primaryKeyword": "hire calendar management virtual assistant philippines",
    "metaTitle": "Calendar Management Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Calendar Management Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Calendar Management Virtual Assistant in the Philippines to handle calendar triage, meeting scheduling, and rescheduling. Write down calendar, inbox, meeting, and decision rules so the Virtual Assistant can act consistently without asking the same preference questions every day.",
    "focus": "calendar ownership, scheduling, and meeting coordination",
    "tasks": [
      "calendar triage",
      "meeting scheduling",
      "rescheduling",
      "time-zone coordination",
      "buffer management",
      "agenda preparation",
      "reminders",
      "travel-time planning"
    ],
    "tools": [
      "Google Calendar",
      "Outlook Calendar",
      "Calendly",
      "Motion",
      "Reclaim",
      "Zoom",
      "Google Workspace",
      "Microsoft 365"
    ],
    "skills": [
      "calendar judgment",
      "time-zone accuracy",
      "prioritization",
      "stakeholder communication",
      "attention to detail",
      "confidentiality"
    ],
    "bestFor": [
      "executives",
      "consultants",
      "sales leaders",
      "remote teams"
    ],
    "outcomes": [
      "Create consistent ownership for calendar triage",
      "Reduce the backlog around meeting scheduling",
      "Keep calendar ownership, scheduling, and meeting coordination documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "executive-virtual-assistant",
      "admin-inbox",
      "personal-assistant",
      "project-coordination"
    ]
  },
  {
    "slug": "operations",
    "name": "Operations Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "operations virtual assistant",
    "metaTitle": "Operations Virtual Assistant Philippines",
    "metaDescription": "Hire an Operations Virtual Assistant in the Philippines for SOPs, recurring checklists, process tracking, vendor follow-up, reporting, and workflow QA.",
    "intro": "Hire an Operations Virtual Assistant in the Philippines for SOP maintenance, recurring checklists, process tracking, vendor follow-up, reporting, data maintenance, and workflow QA. The role works best when every recurring process has a source of truth, owner, due date, and definition of done.",
    "focus": "process administration, recurring operations, and SOP follow-through",
    "tasks": [
      "SOP maintenance",
      "checklist ownership",
      "process tracking",
      "vendor follow-up",
      "reporting",
      "data maintenance",
      "quality checks",
      "cross-team coordination"
    ],
    "tools": [
      "ClickUp",
      "Asana",
      "Notion",
      "Airtable",
      "Google Workspace",
      "Slack",
      "Monday.com",
      "Zapier"
    ],
    "skills": [
      "process thinking",
      "documentation",
      "quality control",
      "follow-through",
      "reporting",
      "cross-functional communication"
    ],
    "bestFor": [
      "agencies",
      "startups",
      "service businesses",
      "remote operations teams"
    ],
    "outcomes": [
      "Create consistent ownership for sop maintenance",
      "Reduce the backlog around checklist ownership",
      "Keep process administration, recurring operations, and SOP follow-through documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "project-coordination",
      "admin-inbox",
      "general-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "lead-generation",
    "name": "Lead Generation Virtual Assistant",
    "group": "Sales & CRM",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "hire lead generation virtual assistant philippines",
    "metaTitle": "Lead Generation Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Lead Generation Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Lead Generation Virtual Assistant in the Philippines to handle prospect research, list building, and contact enrichment. Define pipeline stages and handoff rules first so activity in the CRM stays useful to the sales team.",
    "focus": "prospecting, list building, enrichment, and outbound sales support",
    "tasks": [
      "prospect research",
      "list building",
      "contact enrichment",
      "lead qualification support",
      "CRM updates",
      "outreach preparation",
      "follow-up tracking",
      "lead reporting"
    ],
    "tools": [
      "Apollo",
      "LinkedIn Sales Navigator",
      "HubSpot",
      "Clay",
      "ZoomInfo",
      "Instantly",
      "Google Sheets",
      "Pipedrive"
    ],
    "skills": [
      "prospect research",
      "data accuracy",
      "ICP understanding",
      "CRM discipline",
      "written communication",
      "reporting"
    ],
    "bestFor": [
      "B2B companies",
      "agencies",
      "consultants",
      "sales teams"
    ],
    "outcomes": [
      "Create consistent ownership for prospect research",
      "Reduce the backlog around list building",
      "Keep prospecting, list building, enrichment, and outbound sales support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "appointment-setter-virtual-assistant",
      "cold-calling-virtual-assistant",
      "sales-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "personal-assistant",
    "name": "Virtual Personal Assistant",
    "group": "Executive Support",
    "directoryCategory": "Executive Assistance",
    "primaryKeyword": "virtual personal assistant",
    "metaTitle": "Virtual Personal Assistant Philippines",
    "metaDescription": "Hire a Virtual Personal Assistant in the Philippines for calendars, travel, appointments, research, reminders, inbox support, and personal administration.",
    "intro": "Hire a Virtual Personal Assistant in the Philippines for calendar management, travel planning, appointments, research, reminders, inbox support, and personal administration. A virtual secretary can have similar duties, but this role is for one recurring assistant relationship rather than a shared receptionist service.",
    "focus": "personal scheduling, research, coordination, and administrative support",
    "tasks": [
      "personal calendar management",
      "travel planning",
      "appointment booking",
      "research",
      "purchase coordination",
      "reminders",
      "inbox support",
      "household admin research"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "Calendly",
      "Notion",
      "WhatsApp",
      "Slack",
      "Travel platforms",
      "1Password"
    ],
    "skills": [
      "discretion",
      "organization",
      "research",
      "calendar management",
      "communication",
      "judgment"
    ],
    "bestFor": [
      "founders",
      "executives",
      "busy professionals",
      "entrepreneurs"
    ],
    "outcomes": [
      "Create consistent ownership for personal calendar management",
      "Reduce the backlog around travel planning",
      "Keep personal scheduling, research, coordination, and administrative support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "executive-virtual-assistant",
      "calendar",
      "admin-inbox",
      "travel-lifestyle"
    ]
  },
  {
    "slug": "graphic-design",
    "name": "Graphic Design Virtual Assistant",
    "group": "Creative & Content",
    "directoryCategory": "Video Editing & Creative",
    "primaryKeyword": "graphic design virtual assistant",
    "metaTitle": "Graphic Design Virtual Assistant Philippines",
    "metaDescription": "Hire a Graphic Design Virtual Assistant in the Philippines for Canva, social graphics, presentations, resizing, production design, and creative operations.",
    "intro": "Hire a Graphic Design Virtual Assistant in the Philippines for Canva production, social graphics, presentation assets, resizing, template updates, and recurring creative operations. Keep brand direction and final creative approval with the accountable owner while the VA handles repeatable production.",
    "focus": "repeatable design production and brand-asset support",
    "tasks": [
      "social graphics",
      "presentation design",
      "ad creative resizing",
      "simple infographics",
      "template updates",
      "thumbnail design",
      "brand asset organization",
      "print-ready adaptations"
    ],
    "tools": [
      "Canva",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Figma",
      "Google Slides",
      "PowerPoint",
      "Adobe Express",
      "Dropbox"
    ],
    "skills": [
      "visual hierarchy",
      "brand consistency",
      "layout",
      "typography",
      "asset organization",
      "feedback handling"
    ],
    "bestFor": [
      "marketing teams",
      "agencies",
      "ecommerce brands",
      "creators"
    ],
    "outcomes": [
      "Create consistent ownership for social graphics",
      "Reduce the backlog around presentation design",
      "Keep repeatable design production and brand-asset support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "video-editing",
      "social-media",
      "digital-marketing-virtual-assistant",
      "content-writing"
    ]
  },
  {
    "slug": "shopify-virtual-assistant",
    "name": "Shopify Virtual Assistant",
    "group": "Ecommerce",
    "directoryCategory": "Ecommerce",
    "primaryKeyword": "hire shopify virtual assistant philippines",
    "metaTitle": "Shopify Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Shopify Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Shopify Virtual Assistant in the Philippines to handle product uploads, collection updates, and order support. The role works best when the store, help desk, inventory data, and approval rules are treated as one operating workflow.",
    "focus": "Shopify store administration, merchandising, and customer operations",
    "tasks": [
      "product uploads",
      "collection updates",
      "order support",
      "discount setup",
      "inventory updates",
      "app administration",
      "content changes",
      "store QA"
    ],
    "tools": [
      "Shopify",
      "Shopify Flow",
      "Klaviyo",
      "Gorgias",
      "Recharge",
      "Canva",
      "Google Sheets",
      "ShipStation"
    ],
    "skills": [
      "Shopify administration",
      "product data",
      "merchandising",
      "order workflows",
      "QA",
      "customer support"
    ],
    "bestFor": [
      "DTC brands",
      "Shopify Plus stores",
      "subscription brands",
      "ecommerce agencies"
    ],
    "outcomes": [
      "Create consistent ownership for product uploads",
      "Reduce the backlog around collection updates",
      "Keep Shopify store administration, merchandising, and customer operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "ecommerce",
      "fulfilment",
      "email-marketing",
      "customer-service"
    ]
  },
  {
    "slug": "transcription",
    "name": "Transcription Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire transcription virtual assistant philippines",
    "metaTitle": "Transcription Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Transcription Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Transcription Virtual Assistant in the Philippines to handle audio transcription, meeting notes, and interview transcription. This is strongest when recurring work has a clear owner, source of truth, due date, and definition of done.",
    "focus": "accurate transcription, meeting-note cleanup, and documentation support",
    "tasks": [
      "audio transcription",
      "meeting notes",
      "interview transcription",
      "speaker labeling",
      "timestamping",
      "document cleanup",
      "summary preparation",
      "file organization"
    ],
    "tools": [
      "Descript",
      "Otter.ai",
      "Rev workflows",
      "Google Docs",
      "Microsoft Word",
      "Zoom",
      "Dropbox",
      "Notion"
    ],
    "skills": [
      "listening accuracy",
      "grammar",
      "formatting",
      "confidentiality",
      "attention to detail",
      "documentation"
    ],
    "bestFor": [
      "researchers",
      "podcasters",
      "legal teams",
      "consultants"
    ],
    "outcomes": [
      "Create consistent ownership for audio transcription",
      "Reduce the backlog around meeting notes",
      "Keep accurate transcription, meeting-note cleanup, and documentation support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "podcast-virtual-assistant",
      "content-writing",
      "legal-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "video-editing",
    "name": "Video Editing Virtual Assistant",
    "group": "Creative & Content",
    "directoryCategory": "Video Editing & Creative",
    "primaryKeyword": "video editing virtual assistant",
    "metaTitle": "Video Editing Virtual Assistant Philippines",
    "metaDescription": "Hire a Video Editing Virtual Assistant in the Philippines for short-form edits, rough cuts, captions, resizing, B-roll, audio cleanup, and publishing support.",
    "intro": "Hire a Video Editing Virtual Assistant in the Philippines for short-form edits, long-form rough cuts, captions, resizing, B-roll placement, audio cleanup, asset organization, and publishing support. Give the editor a clear brief, file standards, examples, and one approval path before production starts.",
    "focus": "short-form and long-form video editing plus creative operations",
    "tasks": [
      "short-form editing",
      "long-form rough cuts",
      "captioning",
      "creative resizing",
      "B-roll placement",
      "audio cleanup",
      "asset organization",
      "publishing support"
    ],
    "tools": [
      "Adobe Premiere Pro",
      "CapCut",
      "DaVinci Resolve",
      "After Effects",
      "Descript",
      "Frame.io",
      "Canva",
      "YouTube Studio"
    ],
    "skills": [
      "pacing",
      "storytelling",
      "captioning",
      "file organization",
      "brand consistency",
      "revision handling"
    ],
    "bestFor": [
      "creators",
      "podcasts",
      "agencies",
      "ecommerce brands"
    ],
    "outcomes": [
      "Create consistent ownership for short-form editing",
      "Reduce the backlog around long-form rough cuts",
      "Keep short-form and long-form video editing plus creative operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "graphic-design",
      "podcast-virtual-assistant",
      "social-media",
      "content-writing"
    ]
  },
  {
    "slug": "digital-marketing-virtual-assistant",
    "name": "Digital Marketing Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "virtual marketing assistant",
    "metaTitle": "Virtual Marketing Assistant Philippines",
    "metaDescription": "Hire a Virtual Marketing Assistant in the Philippines for campaigns, content operations, reporting, research, CRM updates, and digital marketing execution.",
    "intro": "Hire a Virtual Marketing Assistant in the Philippines for campaign production, digital marketing operations, reporting, research, CRM updates, and content coordination. This role fits teams that need a marketing Virtual Assistant or digital marketing Virtual Assistant for steady execution rather than strategy ownership.",
    "focus": "cross-channel marketing execution and campaign operations",
    "tasks": [
      "campaign coordination",
      "content scheduling",
      "email support",
      "SEO task support",
      "analytics reporting",
      "landing-page updates",
      "asset coordination",
      "marketing research"
    ],
    "tools": [
      "GA4",
      "HubSpot",
      "Canva",
      "Meta Business Suite",
      "Klaviyo",
      "WordPress",
      "Semrush",
      "Google Sheets"
    ],
    "skills": [
      "campaign coordination",
      "analytics basics",
      "content operations",
      "marketing tools",
      "reporting",
      "attention to detail"
    ],
    "bestFor": [
      "agencies",
      "SaaS companies",
      "ecommerce brands",
      "small businesses"
    ],
    "outcomes": [
      "Create consistent ownership for campaign coordination",
      "Reduce the backlog around content scheduling",
      "Keep cross-channel marketing execution and campaign operations documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "seo",
      "email-marketing",
      "social-media",
      "content-marketing-virtual-assistant"
    ]
  },
  {
    "slug": "customer-service",
    "name": "Customer Service Virtual Assistant",
    "group": "Customer & Front Desk",
    "directoryCategory": "Customer Service",
    "primaryKeyword": "hire customer service virtual assistant philippines",
    "metaTitle": "Customer Service Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Customer Service Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Customer Service Virtual Assistant in the Philippines to handle email support, live chat, and ticket triage. Document response standards and escalation rules so customers get consistent answers without unnecessary handoffs.",
    "focus": "email, chat, order, and customer-support workflows",
    "tasks": [
      "email support",
      "live chat",
      "ticket triage",
      "order-status updates",
      "returns support",
      "FAQ responses",
      "escalation handling",
      "support reporting"
    ],
    "tools": [
      "Zendesk",
      "Gorgias",
      "Intercom",
      "Freshdesk",
      "HubSpot",
      "Shopify",
      "Slack",
      "Google Workspace"
    ],
    "skills": [
      "empathy",
      "written communication",
      "ticket discipline",
      "problem solving",
      "escalation judgment",
      "customer service"
    ],
    "bestFor": [
      "ecommerce brands",
      "SaaS companies",
      "service businesses",
      "marketplaces"
    ],
    "outcomes": [
      "Create consistent ownership for email support",
      "Reduce the backlog around live chat",
      "Keep email, chat, order, and customer-support workflows documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "phone-receptionist",
      "ecommerce",
      "fulfilment",
      "admin-inbox"
    ]
  },
  {
    "slug": "accounting-virtual-assistant",
    "name": "Accounting Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "accounting virtual assistant",
    "metaTitle": "Accounting Virtual Assistant Philippines",
    "metaDescription": "Hire an Accounting Virtual Assistant in the Philippines for transaction admin, reconciliations support, records, reporting preparation, and finance operations.",
    "intro": "Hire an Accounting Virtual Assistant in the Philippines for transaction administration, reconciliation support, records, reporting preparation, and recurring finance operations. Use the bookkeeping page when the role is primarily day-to-day books; use this page when the scope is broader accounting administration and finance workflow support.",
    "focus": "accounting administration and finance-process support under appropriate review",
    "tasks": [
      "journal-entry preparation support",
      "account reconciliations support",
      "financial schedule preparation",
      "invoice administration",
      "expense coding",
      "month-end checklist support",
      "data cleanup",
      "report preparation"
    ],
    "tools": [
      "QuickBooks Online",
      "Xero",
      "Excel",
      "Google Sheets",
      "Bill.com",
      "Dext",
      "NetSuite",
      "Microsoft 365"
    ],
    "skills": [
      "accounting fundamentals",
      "reconciliation support",
      "spreadsheet accuracy",
      "documentation",
      "month-end discipline",
      "confidentiality"
    ],
    "bestFor": [
      "accounting firms",
      "small businesses",
      "finance teams",
      "professional services"
    ],
    "outcomes": [
      "Create consistent ownership for journal-entry preparation support",
      "Reduce the backlog around account reconciliations support",
      "Keep accounting administration and finance-process support under appropriate review documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "bookkeeping",
      "payroll-virtual-assistant",
      "quickbooks-virtual-assistant",
      "financial-advisor-virtual-assistant"
    ]
  },
  {
    "slug": "small-business-virtual-assistant",
    "name": "Small Business Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire small business virtual assistant philippines",
    "metaTitle": "Small Business Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Small Business Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Small Business Virtual Assistant in the Philippines to handle inbox and calendar support, customer follow-up, and CRM updates. This is strongest when recurring work has a clear owner, source of truth, due date, and definition of done.",
    "focus": "flexible operational support for owners who need one reliable remote generalist",
    "tasks": [
      "inbox and calendar support",
      "customer follow-up",
      "CRM updates",
      "research",
      "invoicing administration",
      "social scheduling",
      "document updates",
      "reporting"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "Canva",
      "HubSpot",
      "QuickBooks",
      "Trello",
      "Calendly",
      "Slack"
    ],
    "skills": [
      "adaptability",
      "business communication",
      "organization",
      "customer service",
      "research",
      "process follow-through"
    ],
    "bestFor": [
      "small business owners",
      "local-service companies",
      "consultants",
      "solo operators"
    ],
    "outcomes": [
      "Create consistent ownership for inbox and calendar support",
      "Reduce the backlog around customer follow-up",
      "Keep flexible operational support for owners who need one reliable remote generalist documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "general-virtual-assistant",
      "admin-inbox",
      "customer-service",
      "operations"
    ]
  },
  {
    "slug": "content-writing",
    "name": "Content Writing Virtual Assistant",
    "group": "Creative & Content",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "hire content writing virtual assistant philippines",
    "metaTitle": "Content Writing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Content Writing Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Content Writing Virtual Assistant in the Philippines to handle blog drafting, content research, and brief preparation. Give the Virtual Assistant a usable brief, source material, file standards, and one clear approval path before production starts.",
    "focus": "content research, drafting, editing, and publishing support",
    "tasks": [
      "blog drafting",
      "content research",
      "brief preparation",
      "content refreshes",
      "newsletter drafting",
      "social copy",
      "CMS publishing",
      "editorial calendar updates"
    ],
    "tools": [
      "Google Docs",
      "WordPress",
      "Grammarly",
      "Surfer SEO",
      "Ahrefs",
      "Notion",
      "Canva",
      "Google Search Console"
    ],
    "skills": [
      "research",
      "clear writing",
      "editing",
      "SEO basics",
      "brand voice",
      "fact checking"
    ],
    "bestFor": [
      "content teams",
      "SaaS companies",
      "agencies",
      "professional services"
    ],
    "outcomes": [
      "Create consistent ownership for blog drafting",
      "Reduce the backlog around content research",
      "Keep content research, drafting, editing, and publishing support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "seo",
      "content-marketing-virtual-assistant",
      "wordpress",
      "social-media"
    ]
  },
  {
    "slug": "travel-lifestyle",
    "name": "Travel & Lifestyle Virtual Assistant",
    "group": "Hospitality",
    "directoryCategory": "Executive Assistance",
    "primaryKeyword": "hire travel & lifestyle virtual assistant philippines",
    "metaTitle": "Travel & Lifestyle Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Travel & Lifestyle Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Travel & Lifestyle Virtual Assistant in the Philippines to handle flight and hotel research, itinerary planning, and restaurant reservations. Keep property instructions, guest-response standards, booking details, and urgent escalation rules current in one shared workflow.",
    "focus": "travel planning, reservations, research, and lifestyle administration",
    "tasks": [
      "flight and hotel research",
      "itinerary planning",
      "restaurant reservations",
      "appointment booking",
      "event research",
      "travel document checklists",
      "calendar updates",
      "vendor coordination"
    ],
    "tools": [
      "Google Travel",
      "Booking platforms",
      "TripIt",
      "Google Maps",
      "Google Workspace",
      "Notion",
      "WhatsApp",
      "Calendly"
    ],
    "skills": [
      "research",
      "attention to detail",
      "itinerary planning",
      "communication",
      "calendar coordination",
      "discretion"
    ],
    "bestFor": [
      "executives",
      "families",
      "creators",
      "frequent travelers"
    ],
    "outcomes": [
      "Create consistent ownership for flight and hotel research",
      "Reduce the backlog around itinerary planning",
      "Keep travel planning, reservations, research, and lifestyle administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "personal-assistant",
      "executive-virtual-assistant",
      "calendar",
      "airbnb-virtual-assistant"
    ]
  },
  {
    "slug": "bookkeeping",
    "name": "Bookkeeping Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "hire bookkeeping virtual assistant philippines",
    "metaTitle": "Bookkeeping Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Bookkeeping Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Bookkeeping Virtual Assistant in the Philippines to handle transaction categorization, bank reconciliation support, and receipt organization. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "day-to-day bookkeeping administration and clean financial records",
    "tasks": [
      "transaction categorization",
      "bank reconciliation support",
      "receipt organization",
      "invoice tracking",
      "accounts receivable follow-up",
      "expense administration",
      "month-end preparation",
      "bookkeeping reports"
    ],
    "tools": [
      "QuickBooks Online",
      "Xero",
      "Dext",
      "Bill.com",
      "Excel",
      "Google Sheets",
      "Stripe",
      "PayPal"
    ],
    "skills": [
      "bookkeeping fundamentals",
      "reconciliation",
      "data accuracy",
      "invoice administration",
      "spreadsheet proficiency",
      "confidentiality"
    ],
    "bestFor": [
      "small businesses",
      "agencies",
      "ecommerce brands",
      "professional services"
    ],
    "outcomes": [
      "Create consistent ownership for transaction categorization",
      "Reduce the backlog around bank reconciliation support",
      "Keep day-to-day bookkeeping administration and clean financial records documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "accounting-virtual-assistant",
      "quickbooks-virtual-assistant",
      "payroll-virtual-assistant",
      "financial-advisor-virtual-assistant"
    ]
  },
  {
    "slug": "insurance-virtual-assistant",
    "name": "Insurance Virtual Assistant",
    "group": "Finance & Insurance",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire insurance virtual assistant philippines",
    "metaTitle": "Insurance Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Insurance Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Insurance Virtual Assistant in the Philippines to handle lead intake, policy document administration, and renewal reminders. Use checklists and role-based access, with licensed advice and regulated decisions kept with authorized staff.",
    "focus": "policy-service, lead, and agency administration for insurance teams",
    "tasks": [
      "lead intake",
      "policy document administration",
      "renewal reminders",
      "CRM updates",
      "quote follow-up support",
      "appointment scheduling",
      "client communication",
      "reporting"
    ],
    "tools": [
      "Applied Epic",
      "AMS360",
      "HubSpot",
      "Salesforce",
      "EZLynx",
      "Google Workspace",
      "RingCentral",
      "Calendly"
    ],
    "skills": [
      "insurance workflow familiarity",
      "client communication",
      "documentation",
      "CRM discipline",
      "renewal follow-up",
      "privacy awareness"
    ],
    "bestFor": [
      "insurance agencies",
      "independent agents",
      "brokerages",
      "benefits firms"
    ],
    "outcomes": [
      "Create consistent ownership for lead intake",
      "Reduce the backlog around policy document administration",
      "Keep policy-service, lead, and agency administration for insurance teams documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "admin-inbox",
      "crm",
      "appointment-setter-virtual-assistant",
      "sales-virtual-assistant"
    ]
  },
  {
    "slug": "medical-billing-virtual-assistant",
    "name": "Medical Billing Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire medical billing virtual assistant philippines",
    "metaTitle": "Medical Billing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Medical Billing Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Medical Billing Virtual Assistant in the Philippines to handle claim-status follow-up, payment posting support, and denial-worklist administration. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "non-clinical billing administration, claim follow-up, and revenue-cycle support",
    "tasks": [
      "claim-status follow-up",
      "payment posting support",
      "denial-worklist administration",
      "insurance verification",
      "patient balance communication support",
      "billing document organization",
      "AR reporting",
      "coding-query coordination"
    ],
    "tools": [
      "medical billing platforms",
      "EHR systems",
      "clearinghouse portals",
      "Excel",
      "Google Sheets",
      "secure communication tools",
      "Microsoft 365",
      "Google Workspace"
    ],
    "skills": [
      "revenue-cycle familiarity",
      "billing accuracy",
      "insurance workflow knowledge",
      "documentation",
      "privacy awareness",
      "follow-up discipline"
    ],
    "bestFor": [
      "medical practices",
      "specialty clinics",
      "billing companies",
      "healthcare groups"
    ],
    "outcomes": [
      "Create consistent ownership for claim-status follow-up",
      "Reduce the backlog around payment posting support",
      "Keep non-clinical billing administration, claim follow-up, and revenue-cycle support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "medical-virtual-assistant",
      "medical-scribe-virtual-assistant",
      "dental-billing-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "sales-virtual-assistant",
    "name": "Sales Virtual Assistant",
    "group": "Sales & CRM",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "hire sales virtual assistant philippines",
    "metaTitle": "Sales Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Sales Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Sales Virtual Assistant in the Philippines to handle prospect research, CRM maintenance, and outreach preparation. Define pipeline stages and handoff rules first so activity in the CRM stays useful to the sales team.",
    "focus": "sales administration, prospecting, follow-up, and pipeline support",
    "tasks": [
      "prospect research",
      "CRM maintenance",
      "outreach preparation",
      "follow-up tasks",
      "proposal administration",
      "meeting scheduling",
      "pipeline reporting",
      "lead qualification support"
    ],
    "tools": [
      "HubSpot",
      "Salesforce",
      "Pipedrive",
      "Apollo",
      "LinkedIn Sales Navigator",
      "Close",
      "Google Sheets",
      "Calendly"
    ],
    "skills": [
      "sales process awareness",
      "CRM discipline",
      "written communication",
      "prospecting",
      "follow-up",
      "reporting"
    ],
    "bestFor": [
      "B2B companies",
      "agencies",
      "consultants",
      "service businesses"
    ],
    "outcomes": [
      "Create consistent ownership for prospect research",
      "Reduce the backlog around crm maintenance",
      "Keep sales administration, prospecting, follow-up, and pipeline support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "lead-generation",
      "appointment-setter-virtual-assistant",
      "cold-calling-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "law-firm-virtual-assistant",
    "name": "Law Firm Virtual Assistant",
    "group": "Legal",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire law firm virtual assistant philippines",
    "metaTitle": "Law Firm Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Law Firm Virtual Assistant in the Philippines. Compare legal workflow experience, tools, availability, communication, and role fit.",
    "intro": "Hire a Law Firm Virtual Assistant in the Philippines to handle client intake, matter setup, and deadline and calendar support. Use the role for supervised administrative support while legal advice and attorney judgment stay with qualified counsel.",
    "focus": "law-firm administration, intake, scheduling, and case-support workflows",
    "tasks": [
      "client intake",
      "matter setup",
      "deadline and calendar support",
      "document organization",
      "billing administration",
      "case-management updates",
      "client follow-up",
      "research support"
    ],
    "tools": [
      "Clio",
      "MyCase",
      "PracticePanther",
      "Lawmatics",
      "Google Workspace",
      "Microsoft 365",
      "DocuSign",
      "Calendly"
    ],
    "skills": [
      "law-firm workflow familiarity",
      "confidentiality",
      "client communication",
      "deadline management",
      "document organization",
      "matter administration"
    ],
    "bestFor": [
      "solo attorneys",
      "small law firms",
      "immigration firms",
      "litigation practices"
    ],
    "outcomes": [
      "Respond to new inquiries and intake tasks more consistently",
      "Keep matter setup, calendars, documents, and case records organized",
      "Reduce attorney time spent on recurring administrative follow-through"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "legal-virtual-assistant",
      "paralegal-virtual-assistant",
      "phone-receptionist",
      "transcription"
    ]
  },
  {
    "slug": "paralegal-virtual-assistant",
    "name": "Paralegal Virtual Assistant",
    "group": "Legal",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire paralegal virtual assistant philippines",
    "metaTitle": "Paralegal Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Paralegal Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Paralegal Virtual Assistant in the Philippines to handle legal research support, document drafting support, and case chronology preparation. Use the role for supervised administrative support while legal advice and attorney judgment stay with qualified counsel.",
    "focus": "supervised legal research, document, and matter-support workflows",
    "tasks": [
      "legal research support",
      "document drafting support",
      "case chronology preparation",
      "discovery organization",
      "filing checklist support",
      "client intake",
      "matter updates",
      "document review administration"
    ],
    "tools": [
      "Clio",
      "MyCase",
      "Westlaw or Lexis workflows",
      "Microsoft 365",
      "Google Workspace",
      "Adobe Acrobat",
      "DocuSign",
      "PracticePanther"
    ],
    "skills": [
      "legal research",
      "document organization",
      "legal writing support",
      "deadline discipline",
      "confidentiality",
      "matter management"
    ],
    "bestFor": [
      "law firms",
      "solo attorneys",
      "corporate legal teams",
      "specialty practices"
    ],
    "outcomes": [
      "Create consistent ownership for legal research support",
      "Reduce the backlog around document drafting support",
      "Keep supervised legal research, document, and matter-support workflows documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "law-firm-virtual-assistant",
      "legal-virtual-assistant",
      "transcription",
      "research-data"
    ]
  },
  {
    "slug": "ebay-virtual-assistant",
    "name": "eBay Virtual Assistant",
    "group": "Ecommerce",
    "directoryCategory": "Ecommerce",
    "primaryKeyword": "hire ebay virtual assistant philippines",
    "metaTitle": "eBay Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted eBay Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an eBay Virtual Assistant in the Philippines to handle listing creation, item specifics updates, and pricing research. The role works best when the store, help desk, inventory data, and approval rules are treated as one operating workflow.",
    "focus": "eBay listing, order, customer, and marketplace administration",
    "tasks": [
      "listing creation",
      "item specifics updates",
      "pricing research",
      "order monitoring",
      "buyer messages",
      "returns administration",
      "inventory updates",
      "sales reporting"
    ],
    "tools": [
      "eBay Seller Hub",
      "Terapeak",
      "Google Sheets",
      "Canva",
      "ShipStation",
      "PayPal",
      "Slack",
      "Dropbox"
    ],
    "skills": [
      "marketplace listing accuracy",
      "product research",
      "customer communication",
      "order workflows",
      "inventory awareness",
      "data accuracy"
    ],
    "bestFor": [
      "eBay sellers",
      "resellers",
      "collectibles businesses",
      "multichannel ecommerce brands"
    ],
    "outcomes": [
      "Create consistent ownership for listing creation",
      "Reduce the backlog around item specifics updates",
      "Keep eBay listing, order, customer, and marketplace administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "ecommerce",
      "amazon-virtual-assistant",
      "shopify-virtual-assistant",
      "fulfilment"
    ]
  },
  {
    "slug": "mortgage-virtual-assistant",
    "name": "Mortgage Virtual Assistant",
    "group": "Finance & Insurance",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire mortgage virtual assistant philippines",
    "metaTitle": "Mortgage Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Mortgage Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Mortgage Virtual Assistant in the Philippines to handle lead intake, document checklist follow-up, and appointment scheduling. Use checklists and role-based access, with licensed advice and regulated decisions kept with authorized staff.",
    "focus": "mortgage pipeline, borrower communication, and loan-administration support",
    "tasks": [
      "lead intake",
      "document checklist follow-up",
      "appointment scheduling",
      "CRM updates",
      "pipeline status updates",
      "borrower communication support",
      "file organization",
      "referral-partner follow-up"
    ],
    "tools": [
      "Encompass",
      "Jungo",
      "Salesforce",
      "HubSpot",
      "Google Workspace",
      "Microsoft 365",
      "Calendly",
      "DocuSign"
    ],
    "skills": [
      "mortgage workflow familiarity",
      "document tracking",
      "client communication",
      "pipeline discipline",
      "privacy awareness",
      "follow-up"
    ],
    "bestFor": [
      "mortgage brokers",
      "loan officers",
      "mortgage teams",
      "real estate finance firms"
    ],
    "outcomes": [
      "Create consistent ownership for lead intake",
      "Reduce the backlog around document checklist follow-up",
      "Keep mortgage pipeline, borrower communication, and loan-administration support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "admin-inbox",
      "crm",
      "appointment-setter-virtual-assistant",
      "financial-advisor-virtual-assistant"
    ]
  },
  {
    "slug": "construction-virtual-assistant",
    "name": "Construction Virtual Assistant",
    "group": "Home Services",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire construction virtual assistant philippines",
    "metaTitle": "Construction Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Construction Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Construction Virtual Assistant in the Philippines to handle estimate follow-up, project document organization, and vendor coordination. Run the role from the service board so enquiries, schedules, quotes, job status, and customer follow-up do not get lost between the office and field team.",
    "focus": "office, project, vendor, and customer administration for construction companies",
    "tasks": [
      "estimate follow-up",
      "project document organization",
      "vendor coordination",
      "schedule updates",
      "customer communication",
      "purchase-order administration",
      "CRM updates",
      "job reporting"
    ],
    "tools": [
      "Buildertrend",
      "CoConstruct",
      "Procore",
      "Jobber",
      "Google Workspace",
      "Microsoft 365",
      "QuickBooks",
      "DocuSign"
    ],
    "skills": [
      "construction workflow familiarity",
      "project coordination",
      "vendor follow-up",
      "document control",
      "scheduling",
      "customer communication"
    ],
    "bestFor": [
      "general contractors",
      "remodelers",
      "specialty contractors",
      "construction companies"
    ],
    "outcomes": [
      "Create consistent ownership for estimate follow-up",
      "Reduce the backlog around project document organization",
      "Keep office, project, vendor, and customer administration for construction companies documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "project-coordination",
      "operations",
      "roofing-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "roofing-virtual-assistant",
    "name": "Roofing Virtual Assistant",
    "group": "Home Services",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire roofing virtual assistant philippines",
    "metaTitle": "Roofing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Roofing Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Roofing Virtual Assistant in the Philippines to handle lead intake, estimate scheduling, and CRM updates. Run the role from the service board so enquiries, schedules, quotes, job status, and customer follow-up do not get lost between the office and field team.",
    "focus": "lead, scheduling, estimate, and office support for roofing companies",
    "tasks": [
      "lead intake",
      "estimate scheduling",
      "CRM updates",
      "insurance-document follow-up support",
      "customer reminders",
      "production calendar updates",
      "review requests",
      "reporting"
    ],
    "tools": [
      "JobNimbus",
      "AccuLynx",
      "Roofr",
      "CompanyCam",
      "Google Workspace",
      "RingCentral",
      "Calendly",
      "QuickBooks"
    ],
    "skills": [
      "roofing workflow familiarity",
      "lead follow-up",
      "scheduling",
      "CRM discipline",
      "customer communication",
      "document organization"
    ],
    "bestFor": [
      "roofing contractors",
      "storm-restoration companies",
      "residential roofers",
      "commercial roofers"
    ],
    "outcomes": [
      "Create consistent ownership for lead intake",
      "Reduce the backlog around estimate scheduling",
      "Keep lead, scheduling, estimate, and office support for roofing companies documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "construction-virtual-assistant",
      "appointment-setter-virtual-assistant",
      "phone-receptionist",
      "crm"
    ]
  },
  {
    "slug": "podcast-virtual-assistant",
    "name": "Podcast Virtual Assistant",
    "group": "Creative & Content",
    "directoryCategory": "Video Editing & Creative",
    "primaryKeyword": "hire podcast virtual assistant philippines",
    "metaTitle": "Podcast Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Podcast Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Podcast Virtual Assistant in the Philippines to handle guest research, guest scheduling, and episode notes. Give the Virtual Assistant a usable brief, source material, file standards, and one clear approval path before production starts.",
    "focus": "podcast production coordination, guest administration, repurposing, and publishing",
    "tasks": [
      "guest research",
      "guest scheduling",
      "episode notes",
      "audio and video handoff",
      "show-note drafting",
      "clip coordination",
      "publishing",
      "sponsor administration"
    ],
    "tools": [
      "Riverside",
      "Descript",
      "Buzzsprout",
      "Libsyn",
      "YouTube Studio",
      "Canva",
      "Notion",
      "Google Workspace"
    ],
    "skills": [
      "production coordination",
      "guest communication",
      "content repurposing",
      "publishing",
      "research",
      "file organization"
    ],
    "bestFor": [
      "podcasters",
      "creators",
      "B2B brands",
      "agencies"
    ],
    "outcomes": [
      "Create consistent ownership for guest research",
      "Reduce the backlog around guest scheduling",
      "Keep podcast production coordination, guest administration, repurposing, and publishing documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "video-editing",
      "transcription",
      "content-writing",
      "social-media"
    ]
  },
  {
    "slug": "mental-health-virtual-assistant",
    "name": "Mental Health Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire mental health virtual assistant philippines",
    "metaTitle": "Mental Health Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Mental Health Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Mental Health Virtual Assistant in the Philippines to handle appointment scheduling, intake form follow-up, and patient reminders. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "non-clinical scheduling, intake, and practice administration for behavioral-health teams",
    "tasks": [
      "appointment scheduling",
      "intake form follow-up",
      "patient reminders",
      "referral coordination",
      "billing administration support",
      "inbox and phone support",
      "waitlist administration",
      "records coordination"
    ],
    "tools": [
      "therapy practice-management systems",
      "Google Workspace",
      "Microsoft 365",
      "secure messaging tools",
      "RingCentral",
      "Calendly",
      "Zoom",
      "billing portals"
    ],
    "skills": [
      "empathetic communication",
      "privacy awareness",
      "scheduling",
      "intake administration",
      "boundary judgment",
      "documentation"
    ],
    "bestFor": [
      "therapy practices",
      "counseling clinics",
      "psychiatry practices",
      "behavioral-health groups"
    ],
    "outcomes": [
      "Create consistent ownership for appointment scheduling",
      "Reduce the backlog around intake form follow-up",
      "Keep non-clinical scheduling, intake, and practice administration for behavioral-health teams documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "medical-virtual-assistant",
      "medical-billing-virtual-assistant",
      "phone-receptionist",
      "admin-inbox"
    ]
  },
  {
    "slug": "medical-scribe-virtual-assistant",
    "name": "Medical Scribe Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire medical scribe virtual assistant philippines",
    "metaTitle": "Medical Scribe Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Medical Scribe Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Medical Scribe Virtual Assistant in the Philippines to handle encounter note preparation, documentation cleanup, and chart-prep support. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "documentation support that helps clinicians organize encounter notes under appropriate supervision",
    "tasks": [
      "encounter note preparation",
      "documentation cleanup",
      "chart-prep support",
      "template maintenance",
      "medical terminology transcription",
      "follow-up task documentation",
      "record organization",
      "quality checks"
    ],
    "tools": [
      "EHR systems",
      "medical dictation tools",
      "Microsoft 365",
      "Google Workspace",
      "secure communication platforms",
      "Zoom"
    ],
    "skills": [
      "medical terminology",
      "listening accuracy",
      "documentation",
      "privacy awareness",
      "attention to detail",
      "clinical-boundary awareness"
    ],
    "bestFor": [
      "medical practices",
      "specialty clinics",
      "telehealth practices",
      "physician groups"
    ],
    "outcomes": [
      "Create consistent ownership for encounter note preparation",
      "Reduce the backlog around documentation cleanup",
      "Keep documentation support that helps clinicians organize encounter notes under appropriate supervision documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "medical-virtual-assistant",
      "transcription",
      "medical-billing-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "cold-calling-virtual-assistant",
    "name": "Cold Calling Virtual Assistant",
    "group": "Sales & CRM",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "hire cold calling virtual assistant philippines",
    "metaTitle": "Cold Calling Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Cold Calling Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Cold Calling Virtual Assistant in the Philippines to handle outbound calling, lead qualification, and script execution. Define pipeline stages and handoff rules first so activity in the CRM stays useful to the sales team.",
    "focus": "outbound calling, lead qualification, and appointment-generation support",
    "tasks": [
      "outbound calling",
      "lead qualification",
      "script execution",
      "CRM note updates",
      "follow-up scheduling",
      "voicemail drops",
      "appointment booking",
      "call reporting"
    ],
    "tools": [
      "Aircall",
      "Dialpad",
      "RingCentral",
      "GoHighLevel",
      "HubSpot",
      "Salesforce",
      "Close",
      "Calendly"
    ],
    "skills": [
      "phone confidence",
      "script discipline",
      "active listening",
      "objection handling",
      "CRM hygiene",
      "follow-up"
    ],
    "bestFor": [
      "real estate teams",
      "home-service companies",
      "B2B sales teams",
      "agencies"
    ],
    "outcomes": [
      "Create consistent ownership for outbound calling",
      "Reduce the backlog around lead qualification",
      "Keep outbound calling, lead qualification, and appointment-generation support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "appointment-setter-virtual-assistant",
      "lead-generation",
      "sales-virtual-assistant",
      "phone-receptionist"
    ]
  },
  {
    "slug": "financial-advisor-virtual-assistant",
    "name": "Financial Advisor Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "hire financial advisor virtual assistant philippines",
    "metaTitle": "Financial Advisor Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Financial Advisor Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Financial Advisor Virtual Assistant in the Philippines to handle meeting scheduling, client follow-up, and CRM maintenance. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "client-service and practice administration for financial advisors",
    "tasks": [
      "meeting scheduling",
      "client follow-up",
      "CRM maintenance",
      "document collection",
      "review-meeting preparation",
      "marketing administration",
      "workflow updates",
      "reporting"
    ],
    "tools": [
      "Redtail",
      "Wealthbox",
      "Salesforce",
      "Microsoft 365",
      "Google Workspace",
      "Calendly",
      "DocuSign",
      "Zoom"
    ],
    "skills": [
      "client service",
      "financial-practice administration",
      "CRM discipline",
      "confidentiality",
      "scheduling",
      "documentation"
    ],
    "bestFor": [
      "financial advisors",
      "wealth managers",
      "RIAs",
      "financial-planning firms"
    ],
    "outcomes": [
      "Create consistent ownership for meeting scheduling",
      "Reduce the backlog around client follow-up",
      "Keep client-service and practice administration for financial advisors documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "admin-inbox",
      "crm",
      "bookkeeping",
      "appointment-setter-virtual-assistant",
      "financial-planning"]
  },
  {
    "slug": "payroll-virtual-assistant",
    "name": "Payroll Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "hire payroll virtual assistant philippines",
    "metaTitle": "Payroll Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Payroll Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Payroll Virtual Assistant in the Philippines to handle timesheet collection, payroll data preparation, and employee record updates. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "payroll administration and recurring employee-pay process support",
    "tasks": [
      "timesheet collection",
      "payroll data preparation",
      "employee record updates",
      "pay-period checklist support",
      "deduction data administration",
      "payroll report preparation",
      "query routing",
      "document organization"
    ],
    "tools": [
      "Gusto",
      "ADP",
      "Paychex",
      "QuickBooks Payroll",
      "Rippling",
      "Excel",
      "Google Sheets",
      "BambooHR"
    ],
    "skills": [
      "payroll process discipline",
      "data accuracy",
      "confidentiality",
      "spreadsheet skills",
      "deadline management",
      "documentation"
    ],
    "bestFor": [
      "small businesses",
      "accounting firms",
      "HR teams",
      "multi-location service companies"
    ],
    "outcomes": [
      "Create consistent ownership for timesheet collection",
      "Reduce the backlog around payroll data preparation",
      "Keep payroll administration and recurring employee-pay process support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "bookkeeping",
      "accounting-virtual-assistant",
      "quickbooks-virtual-assistant",
      "recruitment-hr"
    ]
  },
  {
    "slug": "short-term-rental-virtual-assistant",
    "name": "Short-Term Rental Virtual Assistant",
    "group": "Hospitality",
    "directoryCategory": "Customer Service",
    "primaryKeyword": "hire short-term rental virtual assistant philippines",
    "metaTitle": "Short-Term Rental Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Short-Term Rental Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Short-Term Rental Virtual Assistant in the Philippines to handle guest messaging, reservation coordination, and calendar monitoring. Keep property instructions, guest-response standards, booking details, and urgent escalation rules current in one shared workflow.",
    "focus": "guest, reservation, calendar, and vendor support across vacation-rental portfolios",
    "tasks": [
      "guest messaging",
      "reservation coordination",
      "calendar monitoring",
      "cleaner scheduling",
      "maintenance follow-up",
      "review requests",
      "listing updates",
      "issue escalation"
    ],
    "tools": [
      "Guesty",
      "Hostaway",
      "Hospitable",
      "Airbnb",
      "Vrbo",
      "PriceLabs",
      "Google Workspace",
      "WhatsApp"
    ],
    "skills": [
      "guest service",
      "reservation accuracy",
      "vendor coordination",
      "calendar management",
      "issue escalation",
      "response speed"
    ],
    "bestFor": [
      "short-term rental managers",
      "vacation-rental operators",
      "Airbnb hosts",
      "property managers"
    ],
    "outcomes": [
      "Create consistent ownership for guest messaging",
      "Reduce the backlog around reservation coordination",
      "Keep guest, reservation, calendar, and vendor support across vacation-rental portfolios documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "airbnb-virtual-assistant",
      "property-management-virtual-assistant",
      "customer-service",
      "phone-receptionist"
    ]
  },
  {
    "slug": "hvac-virtual-assistant",
    "name": "HVAC Virtual Assistant",
    "group": "Home Services",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire hvac virtual assistant philippines",
    "metaTitle": "HVAC Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted HVAC Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a HVAC Virtual Assistant in the Philippines to handle inbound lead intake, service scheduling, and dispatch support. Run the role from the service board so enquiries, schedules, quotes, job status, and customer follow-up do not get lost between the office and field team.",
    "focus": "dispatch, booking, customer, and office support for HVAC companies",
    "tasks": [
      "inbound lead intake",
      "service scheduling",
      "dispatch support",
      "estimate follow-up",
      "maintenance-plan reminders",
      "CRM updates",
      "customer communication",
      "review requests"
    ],
    "tools": [
      "ServiceTitan",
      "Housecall Pro",
      "Jobber",
      "FieldEdge",
      "Google Workspace",
      "RingCentral",
      "Calendly",
      "QuickBooks"
    ],
    "skills": [
      "dispatch awareness",
      "phone etiquette",
      "scheduling",
      "CRM discipline",
      "customer service",
      "follow-up"
    ],
    "bestFor": [
      "HVAC contractors",
      "home-service companies",
      "maintenance providers",
      "multi-location service businesses"
    ],
    "outcomes": [
      "Create consistent ownership for inbound lead intake",
      "Reduce the backlog around service scheduling",
      "Keep dispatch, booking, customer, and office support for HVAC companies documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "phone-receptionist",
      "appointment-setter-virtual-assistant",
      "construction-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "appointment-setter-virtual-assistant",
    "name": "Appointment Setter Virtual Assistant",
    "group": "Sales & CRM",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "hire appointment setter virtual assistant philippines",
    "metaTitle": "Appointment Setter Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Appointment Setter Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Appointment Setter Virtual Assistant in the Philippines to handle lead follow-up, appointment booking, and calendar coordination. Define pipeline stages and handoff rules first so activity in the CRM stays useful to the sales team.",
    "focus": "outbound and inbound follow-up focused on qualified meetings",
    "tasks": [
      "lead follow-up",
      "appointment booking",
      "calendar coordination",
      "CRM updates",
      "scripted outreach",
      "no-show follow-up",
      "lead qualification support",
      "meeting confirmation"
    ],
    "tools": [
      "GoHighLevel",
      "HubSpot",
      "Salesforce",
      "Calendly",
      "Aircall",
      "Dialpad",
      "Close",
      "Google Sheets"
    ],
    "skills": [
      "phone and written communication",
      "qualification",
      "scheduling",
      "CRM hygiene",
      "follow-up discipline",
      "objection handling"
    ],
    "bestFor": [
      "agencies",
      "real estate teams",
      "home-service companies",
      "B2B sales teams"
    ],
    "outcomes": [
      "Create consistent ownership for lead follow-up",
      "Reduce the backlog around appointment booking",
      "Keep outbound and inbound follow-up focused on qualified meetings documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "lead-generation",
      "cold-calling-virtual-assistant",
      "sales-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "google-ads-virtual-assistant",
    "name": "Google Ads Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "hire google ads virtual assistant philippines",
    "metaTitle": "Google Ads Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Google Ads Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Google Ads Virtual Assistant in the Philippines to handle campaign build support, keyword list maintenance, and search-term review. Useful when campaign and content work needs steady execution between strategy reviews.",
    "focus": "paid-search campaign administration, QA, and reporting support",
    "tasks": [
      "campaign build support",
      "keyword list maintenance",
      "search-term review",
      "negative keyword administration",
      "ad copy uploads",
      "conversion-check QA",
      "budget tracking",
      "performance reporting"
    ],
    "tools": [
      "Google Ads",
      "GA4",
      "Google Tag Manager",
      "Looker Studio",
      "Google Sheets",
      "Semrush",
      "Unbounce",
      "WordPress"
    ],
    "skills": [
      "paid-search fundamentals",
      "campaign QA",
      "keyword organization",
      "reporting",
      "attention to detail",
      "conversion tracking awareness"
    ],
    "bestFor": [
      "agencies",
      "local-service businesses",
      "ecommerce brands",
      "SaaS companies"
    ],
    "outcomes": [
      "Create consistent ownership for campaign build support",
      "Reduce the backlog around keyword list maintenance",
      "Keep paid-search campaign administration, QA, and reporting support documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "digital-marketing-virtual-assistant",
      "seo",
      "content-marketing-virtual-assistant",
      "crm"
    ]
  },
  {
    "slug": "dental-billing-virtual-assistant",
    "name": "Dental Billing Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire dental billing virtual assistant philippines",
    "metaTitle": "Dental Billing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Dental Billing Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Dental Billing Virtual Assistant in the Philippines to handle insurance verification, claim submission support, and claim-status follow-up. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "dental insurance, claims, AR, and billing administration",
    "tasks": [
      "insurance verification",
      "claim submission support",
      "claim-status follow-up",
      "AR follow-up",
      "payment posting support",
      "patient billing communication support",
      "billing reports",
      "documentation"
    ],
    "tools": [
      "Dentrix",
      "Open Dental",
      "Eaglesoft",
      "dental clearinghouses",
      "Excel",
      "Google Sheets",
      "secure messaging tools",
      "Microsoft 365"
    ],
    "skills": [
      "dental billing workflow familiarity",
      "insurance verification",
      "claims follow-up",
      "AR discipline",
      "privacy awareness",
      "documentation"
    ],
    "bestFor": [
      "dental practices",
      "orthodontic offices",
      "oral surgery practices",
      "dental billing companies"
    ],
    "outcomes": [
      "Create consistent ownership for insurance verification",
      "Reduce the backlog around claim submission support",
      "Keep dental insurance, claims, AR, and billing administration documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "dental-virtual-assistant",
      "medical-billing-virtual-assistant",
      "admin-inbox",
      "phone-receptionist"
    ]
  },
  {
    "slug": "quickbooks-virtual-assistant",
    "name": "QuickBooks Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "hire quickbooks virtual assistant philippines",
    "metaTitle": "QuickBooks Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted QuickBooks Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a QuickBooks Virtual Assistant in the Philippines to handle transaction categorization, bank-feed review, and reconciliation support. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "QuickBooks Online bookkeeping administration and financial-data maintenance",
    "tasks": [
      "transaction categorization",
      "bank-feed review",
      "reconciliation support",
      "invoice creation",
      "expense cleanup",
      "customer and vendor records",
      "report preparation",
      "month-end checklist support"
    ],
    "tools": [
      "QuickBooks Online",
      "QuickBooks Payroll",
      "Dext",
      "Bill.com",
      "Excel",
      "Google Sheets",
      "Stripe",
      "PayPal"
    ],
    "skills": [
      "QuickBooks proficiency",
      "bookkeeping fundamentals",
      "reconciliation",
      "data accuracy",
      "invoice administration",
      "reporting"
    ],
    "bestFor": [
      "small businesses",
      "bookkeeping firms",
      "ecommerce brands",
      "professional services"
    ],
    "outcomes": [
      "Create consistent ownership for transaction categorization",
      "Reduce the backlog around bank-feed review",
      "Keep QuickBooks Online bookkeeping administration and financial-data maintenance documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "bookkeeping",
      "accounting-virtual-assistant",
      "payroll-virtual-assistant",
      "research-data"
    ]
  },
  {
    "slug": "credit-repair-virtual-assistant",
    "name": "Credit Repair Virtual Assistant",
    "group": "Finance & Insurance",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire credit repair virtual assistant philippines",
    "metaTitle": "Credit Repair Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Credit Repair Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Credit Repair Virtual Assistant in the Philippines to handle client onboarding administration, CRM updates, and document collection. Use checklists and role-based access, with licensed advice and regulated decisions kept with authorized staff.",
    "focus": "administrative support for compliant credit-repair operations and client workflows",
    "tasks": [
      "client onboarding administration",
      "CRM updates",
      "document collection",
      "status follow-up",
      "dispute-workflow administration",
      "appointment scheduling",
      "template organization",
      "operational reporting"
    ],
    "tools": [
      "Credit Repair Cloud",
      "DisputeBee",
      "GoHighLevel",
      "HubSpot",
      "Google Workspace",
      "Calendly",
      "DocuSign",
      "Google Sheets"
    ],
    "skills": [
      "client communication",
      "CRM discipline",
      "document organization",
      "process compliance",
      "follow-up",
      "privacy awareness"
    ],
    "bestFor": [
      "credit repair companies",
      "financial-service operators",
      "consumer-service agencies",
      "consultants"
    ],
    "outcomes": [
      "Create consistent ownership for client onboarding administration",
      "Reduce the backlog around crm updates",
      "Keep administrative support for compliant credit-repair operations and client workflows documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "crm",
      "admin-inbox",
      "appointment-setter-virtual-assistant",
      "research-data"
    ]
  },
  {
    "slug": "web-developer-virtual-assistant",
    "name": "Web Developer Virtual Assistant",
    "group": "Technology & Web",
    "directoryCategory": "Web & WordPress",
    "primaryKeyword": "hire web developer virtual assistant philippines",
    "metaTitle": "Web Developer Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Web Developer Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Web Developer Virtual Assistant in the Philippines to handle website content changes, HTML and CSS updates, and landing-page implementation. Use a ticketed backlog, controlled access, testing notes, and explicit approval for production changes.",
    "focus": "website maintenance, front-end updates, QA, and developer-support workflows",
    "tasks": [
      "website content changes",
      "HTML and CSS updates",
      "landing-page implementation",
      "bug reproduction",
      "cross-browser QA",
      "form and tracking checks",
      "CMS maintenance",
      "developer documentation"
    ],
    "tools": [
      "WordPress",
      "Webflow",
      "HTML",
      "CSS",
      "JavaScript",
      "GitHub",
      "Cloudflare",
      "Google Search Console"
    ],
    "skills": [
      "front-end fundamentals",
      "website QA",
      "CMS administration",
      "debugging",
      "documentation",
      "attention to detail"
    ],
    "bestFor": [
      "agencies",
      "SaaS companies",
      "small businesses",
      "ecommerce brands"
    ],
    "outcomes": [
      "Create consistent ownership for website content changes",
      "Reduce the backlog around html and css updates",
      "Keep website maintenance, front-end updates, QA, and developer-support workflows documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "wordpress",
      "it-virtual-assistant",
      "seo",
      "google-ads-virtual-assistant"
    ]
  },
  {
    "slug": "content-marketing-virtual-assistant",
    "name": "Content Marketing Virtual Assistant",
    "group": "Marketing & Growth",
    "directoryCategory": "Marketing & Social Media",
    "primaryKeyword": "hire content marketing virtual assistant philippines",
    "metaTitle": "Content Marketing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Content Marketing Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a Content Marketing Virtual Assistant in the Philippines to handle editorial calendar updates, content research, and brief preparation. Useful when campaign and content work needs steady execution between strategy reviews.",
    "focus": "content planning support, production coordination, repurposing, and publishing",
    "tasks": [
      "editorial calendar updates",
      "content research",
      "brief preparation",
      "writer coordination",
      "content repurposing",
      "CMS publishing",
      "distribution checklists",
      "performance reporting"
    ],
    "tools": [
      "Notion",
      "Asana",
      "WordPress",
      "Ahrefs",
      "Semrush",
      "Canva",
      "Google Search Console",
      "GA4"
    ],
    "skills": [
      "content operations",
      "research",
      "editorial coordination",
      "SEO basics",
      "repurposing",
      "reporting"
    ],
    "bestFor": [
      "SaaS companies",
      "agencies",
      "professional services",
      "content-led businesses"
    ],
    "outcomes": [
      "Create consistent ownership for editorial calendar updates",
      "Reduce the backlog around content research",
      "Keep content planning support, production coordination, repurposing, and publishing documented and moving"
    ],
    "costFactors": [
      "Relevant experience and independence",
      "Full-time or part-time schedule",
      "Required live overlap and response times",
      "Tool or platform specialization",
      "Scope, complexity, and decision ownership"
    ],
    "relatedSlugs": [
      "content-writing",
      "seo",
      "social-media",
      "email-marketing"
    ]
  },
  {
    "slug": "construction-estimating-virtual-assistant",
    "locale": "en-AU",
    "name": "Construction Estimating & Tender Desk Virtual Assistant",
    "group": "Home Services",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "hire construction estimator virtual assistant philippines",
    "metaTitle": "Construction Estimating Virtual Assistant | Philippines",
    "metaDescription": "Hire Construction Estimating & Tender Desk Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Construction Estimating & Tender Desk Virtual Assistant in the Philippines to handle quantity take-offs from plans, supplier RFQ requests, and pricing spreadsheet preparation. Run the role from the service board so enquiries, schedules, quotes, job status, and customer follow-up do not get lost between the office and field team.",
    "focus": "quantity take-offs, supplier pricing, and tender package preparation",
    "tasks": [
      "quantity take-offs from plans",
      "supplier RFQ requests",
      "pricing spreadsheet preparation",
      "tender documentation assembly",
      "variation register upkeep",
      "CRM and job tracking updates",
      "subcontractor follow-up",
      "addenda and revision tracking"
    ],
    "tools": [
      "Cubit",
      "CostX",
      "Bluebeam",
      "Planswift",
      "Buildxact",
      "Simpro",
      "AroFlo",
      "Google Sheets"
    ],
    "skills": [
      "plan reading and take-off accuracy",
      "supplier pricing research",
      "tender documentation",
      "attention to detail",
      "spreadsheet modelling",
      "deadline management"
    ],
    "bestFor": [
      "general contractors",
      "electrical contractors",
      "mechanical contractors",
      "civil and trade subcontractors"
    ],
    "outcomes": [
      "Turn plans into a completed tender package without pulling your estimator off active jobs",
      "Keep supplier RFQs and pricing organised instead of scattered across email",
      "Free your senior estimator to focus on final pricing and commercial decisions"
    ],
    "costFactors": [
      "Seniority and years of take-off/estimating experience",
      "Software specialisation (Cubit, CostX, Bluebeam, Planswift, etc.)",
      "Volume and complexity of tenders per month",
      "Full-time or part-time schedule",
      "Whether QA review is included"
    ],
    "relatedSlugs": [
      "construction-virtual-assistant",
      "project-coordination",
      "bookkeeping",
      "admin-inbox"
    ]
  },
  {
    "slug": "month-end-production-virtual-assistant",
    "locale": "en-AU",
    "name": "Month-End Production Virtual Assistant for Accounting Firms",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "hire month end accounting virtual assistant philippines",
    "metaTitle": "Month-End Production Virtual Assistant for Accounting Firms",
    "metaDescription": "Hire Month-End Production Virtual Assistant for Accounting Firms Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Month-End Production Virtual Assistant for Accounting Firms in the Philippines to handle bank and balance-sheet reconciliation, accounts payable and receivable processing, and payroll preparation support. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "month-end reconciliation, workpaper preparation, and compliance production",
    "tasks": [
      "bank and balance-sheet reconciliation",
      "accounts payable and receivable processing",
      "payroll preparation support",
      "workpaper preparation",
      "GST/BAS reconciliation support",
      "fixed asset registers",
      "month-end journal entries",
      "management account preparation",
      "client document chasing"
    ],
    "tools": [
      "Xero",
      "QuickBooks Online",
      "MYOB",
      "Dext",
      "Excel",
      "Google Sheets"
    ],
    "skills": [
      "reconciliation accuracy",
      "workpaper documentation",
      "deadline and checklist discipline",
      "client communication for document chasing",
      "attention to detail",
      "confidentiality"
    ],
    "bestFor": [
      "accounting firms",
      "bookkeeping practices",
      "outsourced CFO firms",
      "multi-client finance teams"
    ],
    "outcomes": [
      "Clear the month-end backlog by a defined business day, every cycle",
      "Free your registered accountants to focus on advisory, review, and client relationships",
      "Standardize workpapers and reconciliations across every client file"
    ],
    "costFactors": [
      "Seniority (bookkeeper vs. intermediate vs. senior/workpaper specialist)",
      "Number of client files and reconciliations per cycle",
      "Software specialisation (Xero, QuickBooks, MYOB)",
      "Full-time or part-time schedule",
      "Whether a dedicated review checklist and QA step is included"
    ],
    "relatedSlugs": [
      "bookkeeping",
      "quickbooks-virtual-assistant",
      "accounting-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "ndis-billing-virtual-assistant",
    "locale": "en-AU",
    "name": "NDIS Billing & Claims Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "hire ndis billing virtual assistant philippines",
    "metaTitle": "NDIS Billing & Claims Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted NDIS Billing & Claims Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a NDIS Billing & Claims Virtual Assistant in the Philippines to handle claims processing and submission support, remittance and payment reconciliation, and participant onboarding administration. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "invoice-to-claim processing, reconciliation, and participant administration",
    "tasks": [
      "claims processing and submission support",
      "remittance and payment reconciliation",
      "participant onboarding administration",
      "service agreement documentation",
      "rostering administration support",
      "documentation and audit-readiness administration",
      "exception and rejected-claim follow-up",
      "reporting"
    ],
    "tools": [
      "PACE",
      "Lumary",
      "CareMaster",
      "Brevity",
      "ShiftCare",
      "Splose"
    ],
    "skills": [
      "claims accuracy and attention to detail",
      "reconciliation",
      "participant-facing communication",
      "documentation discipline",
      "confidentiality and data handling",
      "process consistency"
    ],
    "bestFor": [
      "NDIS registered providers",
      "plan management businesses",
      "support coordination providers",
      "allied health NDIS providers"
    ],
    "outcomes": [
      "Reduce claim rejections and payment delays with consistent processing",
      "Keep participant and service documentation audit-ready",
      "Free your operations team from repetitive invoice-to-claim admin"
    ],
    "costFactors": [
      "Participant volume and claims processed per month",
      "Platform specialisation (PACE, Lumary, CareMaster, etc.)",
      "Whether reconciliation and exception-handling are included",
      "Full-time or part-time schedule",
      "Documentation and audit-support requirements"
    ],
    "relatedSlugs": [
      "medical-billing-virtual-assistant",
      "admin-inbox",
      "customer-service",
      "bookkeeping",
      "ndis-rostering"]
  },
  {
    "slug": "mortgage-loan-processing-virtual-assistant",
    "locale": "en-AU",
    "name": "Mortgage Loan Processing Virtual Assistant",
    "group": "Finance & Lending",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "mortgage loan processing virtual assistant",
    "metaTitle": "Mortgage Loan Processing Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Mortgage Loan Processing Virtual Assistant in the Philippines. Compare processing experience, tools, availability, and role fit.",
    "intro": "Hire a Mortgage Loan Processing Virtual Assistant in the Philippines to handle collecting and indexing borrower documents, preparing loan application files, and entering application data into applyonline. Build the role around complete files, visible exceptions, and prompt follow-up while lending decisions stay with authorised staff.",
    "focus": "loan file preparation and settlement support",
    "tasks": [
      "collecting and indexing borrower documents",
      "preparing loan application files",
      "entering application data into applyonline",
      "checking files against submission checklists",
      "tracking lender conditions and outstanding documents",
      "updating broker crm records and milestones",
      "preparing client and lender follow-up lists",
      "tracking valuations, approvals and settlements"
    ],
    "tools": [
      "ApplyOnline",
      "Salestrekker",
      "Mercury Nexus",
      "BrokerEngine",
      "Quickli",
      "DocuSign"
    ],
    "skills": [
      "mortgage file preparation",
      "document verification",
      "accurate data entry",
      "lender condition tracking",
      "crm administration",
      "settlement coordination"
    ],
    "bestFor": [
      "mortgage brokerages",
      "finance broking firms",
      "loan processing teams",
      "asset and residential finance brokers"
    ],
    "outcomes": [
      "Brokers spend less time assembling and chasing loan files.",
      "Applications progress with clearer ownership of outstanding conditions.",
      "Clients receive more consistent updates from submission through settlement."
    ],
    "costFactors": [
      "Application volume and average file complexity.",
      "Number of lenders and loan products handled.",
      "Amount of document collection and borrower follow-up required.",
      "CRM, ApplyOnline and lender portal workflows involved.",
      "Level of settlement tracking and post-approval support."
    ],
    "relatedSlugs": [
      "mortgage-virtual-assistant",
      "real-estate",
      "admin-inbox",
      "customer-service"
    ]
  },
  {
    "slug": "smsf-production-virtual-assistant",
    "locale": "en-AU",
    "name": "SMSF Production Virtual Assistant",
    "group": "Finance & Accounting",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "smsf virtual assistant",
    "metaTitle": "SMSF Production Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted SMSF Production Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a SMSF Production Virtual Assistant in the Philippines to handle coding bank and investment transactions, reconciling bank and investment accounts, and organising annual fund source documents. Separate preparation and reconciliation work from approvals, payment authority, and professional sign-off.",
    "focus": "smsf workpapers and reconciliation production",
    "tasks": [
      "coding bank and investment transactions",
      "reconciling bank and investment accounts",
      "organising annual fund source documents",
      "preparing supporting workpapers",
      "checking pension and contribution records",
      "maintaining document request lists",
      "preparing audit support packs",
      "updating fund production status"
    ],
    "tools": [
      "BGL Simple Fund 360",
      "Class Super",
      "Xero",
      "MYOB AccountRight",
      "FYI",
      "Adobe Acrobat"
    ],
    "skills": [
      "smsf transaction coding",
      "bank reconciliation",
      "investment reconciliation",
      "workpaper preparation",
      "document management",
      "audit pack preparation",
      "accounting data accuracy"
    ],
    "bestFor": [
      "smsf accounting firms",
      "public practice accounting firms",
      "smsf administration businesses",
      "specialist superannuation teams"
    ],
    "outcomes": [
      "Accountants receive cleaner files with core production work already prepared.",
      "Outstanding documents and reconciliation issues surface earlier in the job.",
      "Audit packs are assembled consistently instead of being rebuilt at year end."
    ],
    "costFactors": [
      "Number of SMSF entities processed.",
      "Volume and complexity of investment transactions.",
      "Quality and completeness of source records.",
      "Accounting and document management platforms used.",
      "Depth of workpaper and audit-pack preparation required."
    ],
    "relatedSlugs": [
      "bookkeeping",
      "accounting-virtual-assistant",
      "admin-inbox",
      "research-data"
    ]
  },
  {
    "slug": "strata-management-virtual-assistant",
    "locale": "en-AU",
    "name": "Strata Management Administration Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "strata management virtual assistant",
    "metaTitle": "Strata Management Administration Virtual Assistant",
    "metaDescription": "Hire Strata Management Administration Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Strata Management Administration Virtual Assistant in the Philippines to handle preparing levy notices and owner correspondence, assembling agm and committee meeting packs, and formatting agendas and supporting papers. Tie the work to your lead, listing, transaction, or property system so dates, documents, and follow-up remain visible.",
    "focus": "strata meeting and owner administration",
    "tasks": [
      "preparing levy notices and owner correspondence",
      "assembling agm and committee meeting packs",
      "formatting agendas and supporting papers",
      "drafting meeting minutes from approved notes",
      "updating owner and committee records",
      "tracking action items after meetings",
      "following approved arrears reminder workflows",
      "maintaining document registers and correspondence logs"
    ],
    "tools": [
      "StrataMax",
      "MRI Strata Master",
      "PropertyIQ",
      "Urbanise",
      "MYBOS",
      "DocuSign"
    ],
    "skills": [
      "strata administration",
      "meeting pack preparation",
      "minute drafting",
      "owner correspondence",
      "arrears workflow administration",
      "document control",
      "records management"
    ],
    "bestFor": [
      "strata management firms",
      "owners corporation managers",
      "body corporate management businesses",
      "portfolio strata managers"
    ],
    "outcomes": [
      "Managers spend less time rebuilding meeting packs and routine correspondence.",
      "Committee actions, levy administration and owner records stay easier to track.",
      "Recurring portfolio administration is completed against a consistent workflow."
    ],
    "costFactors": [
      "Number of schemes and lots supported.",
      "Frequency and complexity of meetings.",
      "Volume of owner and committee correspondence.",
      "Arrears follow-up procedures and reporting requirements.",
      "Strata management systems and document workflows used."
    ],
    "relatedSlugs": [
      "real-estate",
      "admin-inbox",
      "customer-service",
      "bookkeeping"
    ]
  },
  {
    "slug": "property-management-maintenance-virtual-assistant",
    "locale": "en-AU",
    "name": "Property Management Maintenance Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "maintenance coordinator virtual assistant",
    "metaTitle": "Maintenance Coordinator Virtual Assistant | Philippines",
    "metaDescription": "Hire Property Management Maintenance Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Property Management Maintenance Virtual Assistant in the Philippines to handle logging tenant maintenance requests, categorising jobs by approved priority rules, and requesting contractor quotes. Tie the work to your lead, listing, transaction, or property system so dates, documents, and follow-up remain visible.",
    "focus": "maintenance request and contractor coordination",
    "tasks": [
      "logging tenant maintenance requests",
      "categorising jobs by approved priority rules",
      "requesting contractor quotes",
      "creating and updating work orders",
      "coordinating tenant and contractor access",
      "following up outstanding maintenance jobs",
      "updating property management software",
      "matching invoices to completed work orders",
      "preparing exception lists for property managers"
    ],
    "tools": [
      "PropertyMe",
      "Console Cloud",
      "Inspection Express",
      "InspectRealEstate",
      "Managed App",
      "Tapi"
    ],
    "skills": [
      "maintenance triage administration",
      "contractor coordination",
      "tenant communication",
      "work order management",
      "quote tracking",
      "property management software",
      "invoice matching"
    ],
    "bestFor": [
      "residential property management agencies",
      "real estate agencies",
      "build-to-rent operators",
      "property management portfolios"
    ],
    "outcomes": [
      "Maintenance requests move into a visible workflow as soon as tenants report them.",
      "Contractor quotes, access arrangements and work orders require fewer manager follow-ups.",
      "Property managers receive clear exception lists instead of monitoring every open job."
    ],
    "costFactors": [
      "Number of properties under management.",
      "Monthly maintenance request volume.",
      "Contractor network size and quote requirements.",
      "After-hours and urgent escalation procedures.",
      "Property management and maintenance platforms used."
    ],
    "relatedSlugs": [
      "property-management-virtual-assistant",
      "real-estate",
      "customer-service",
      "phone-receptionist"
    ]
  },
  {
    "slug": "allied-health-referral-billing-virtual-assistant",
    "locale": "en-AU",
    "name": "Allied Health Referral & Billing Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "allied health virtual assistant",
    "metaTitle": "Allied Health Referral Virtual Assistant | Philippines",
    "metaDescription": "Hire Allied Health Referral & Billing Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire an Allied Health Referral & Billing Virtual Assistant in the Philippines to handle processing new patient referrals, creating and updating patient records, and checking referral documents for required information. Keep the scope administrative and non-clinical, with privacy, access, and escalation rules documented before onboarding.",
    "focus": "referral intake and billing administration",
    "tasks": [
      "processing new patient referrals",
      "creating and updating patient records",
      "checking referral documents for required information",
      "booking and rescheduling appointments",
      "tracking referral and plan expiry dates",
      "preparing invoices and billing records",
      "following approved unpaid account workflows",
      "running patient recall lists",
      "maintaining clinician administration queues"
    ],
    "tools": [
      "Cliniko",
      "Halaxy",
      "Power Diary",
      "Nookal",
      "Tyro Health",
      "Coviu"
    ],
    "skills": [
      "patient intake administration",
      "referral tracking",
      "appointment scheduling",
      "billing administration",
      "patient recalls",
      "practice management software",
      "confidential records handling"
    ],
    "bestFor": [
      "physiotherapy clinics",
      "occupational therapy practices",
      "speech pathology clinics",
      "psychology practices",
      "multidisciplinary allied health clinics"
    ],
    "outcomes": [
      "New referrals reach the right clinician with fewer administrative gaps.",
      "Billing, recalls and referral expiry dates are managed through repeatable queues.",
      "Clinicians spend less non-clinical time maintaining patient records and follow-ups."
    ],
    "costFactors": [
      "Referral and appointment volume.",
      "Number of clinicians and clinic locations.",
      "Billing streams and payer administration involved.",
      "Recall and referral-expiry follow-up requirements.",
      "Practice management and communication systems used."
    ],
    "relatedSlugs": [
      "medical-virtual-assistant",
      "phone-receptionist",
      "customer-service",
      "admin-inbox"
    ]
  },
  {
    "slug": "trades-service-administration-virtual-assistant",
    "locale": "en-AU",
    "name": "Trades Service Administration Virtual Assistant",
    "group": "Home Services",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "trades virtual assistant",
    "metaTitle": "Trades Service Administration Virtual Assistant Philippines",
    "metaDescription": "Hire Trades Service Administration Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Trades Service Administration Virtual Assistant in the Philippines to handle creating jobs from calls and online enquiries, scheduling technicians and service appointments, and updating job notes and customer records. Run the role from the service board so enquiries, schedules, quotes, job status, and customer follow-up do not get lost between the office and field team.",
    "focus": "job scheduling and service administration",
    "tasks": [
      "creating jobs from calls and online enquiries",
      "scheduling technicians and service appointments",
      "updating job notes and customer records",
      "confirming appointments with customers",
      "following up technician forms and photos",
      "preparing quotes and invoices from approved information",
      "tracking purchase orders and job documentation",
      "following outstanding invoice workflows",
      "closing completed jobs in field service software"
    ],
    "tools": [
      "ServiceM8",
      "simPRO",
      "AroFlo",
      "Tradify",
      "Xero",
      "MYOB"
    ],
    "skills": [
      "job management administration",
      "trade scheduling",
      "customer communication",
      "quote preparation",
      "invoice administration",
      "field service software",
      "job documentation"
    ],
    "bestFor": [
      "electrical contractors",
      "hvac businesses",
      "plumbing companies",
      "solar installers",
      "multi-trade service businesses"
    ],
    "outcomes": [
      "New service requests become scheduled jobs instead of sitting in an inbox.",
      "Technicians arrive with clearer job information and fewer office interruptions.",
      "Completed work reaches invoicing faster because paperwork is followed through."
    ],
    "costFactors": [
      "Number of technicians and service areas.",
      "Daily job and enquiry volume.",
      "Scheduling complexity and emergency callout procedures.",
      "Quote, purchase order and invoicing workflows.",
      "Field service and accounting platforms used."
    ],
    "relatedSlugs": [
      "admin-inbox",
      "phone-receptionist",
      "customer-service",
      "bookkeeping"
    ]
  },
  {
    "slug": "bim-revit-production-virtual-assistant",
    "locale": "en-AU",
    "name": "BIM & Revit Production Virtual Assistant",
    "group": "Architecture & Engineering",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "bim production virtual assistant",
    "metaTitle": "BIM Production Virtual Assistant | Revit Documentation",
    "metaDescription": "Hire a vetted BIM & Revit Production Virtual Assistant in the Philippines. Compare relevant experience, tools, availability, and role fit before you interview.",
    "intro": "Hire a BIM & Revit Production Virtual Assistant in the Philippines to handle updating revit models from approved markups, creating and editing drawing sheets, and maintaining views, schedules and annotations. Set file standards, review gates, and model ownership before production work begins; professional design responsibility remains with qualified project staff.",
    "focus": "bim modelling and revit documentation production",
    "tasks": [
      "updating revit models from approved markups",
      "creating and editing drawing sheets",
      "maintaining views, schedules and annotations",
      "building and updating revit families",
      "applying documented bim standards",
      "incorporating consultant model updates",
      "preparing clash review files",
      "processing redlines and drawing revisions",
      "maintaining model and drawing registers"
    ],
    "tools": [
      "Autodesk Revit",
      "AutoCAD",
      "Navisworks Manage",
      "Autodesk Construction Cloud",
      "Bluebeam Revu",
      "Dynamo"
    ],
    "skills": [
      "revit modelling",
      "bim documentation",
      "construction documentation",
      "model coordination",
      "family creation",
      "redline processing",
      "drawing standards"
    ],
    "bestFor": [
      "architecture firms",
      "structural engineering consultancies",
      "mep engineering firms",
      "bim coordination teams",
      "design and construction companies"
    ],
    "outcomes": [
      "Approved design changes move into models and drawing sets faster.",
      "Senior designers spend less time on repetitive documentation production.",
      "Model standards, schedules and revision workflows stay more consistent across projects."
    ],
    "costFactors": [
      "Project size and model complexity.",
      "Required level of model development and documentation.",
      "Discipline and coordination requirements.",
      "Volume of revisions, markups and drawing packages.",
      "BIM standards, templates and software environment."
    ],
    "relatedSlugs": [
      "project-coordination",
      "research-data",
      "general-virtual-assistant",
      "admin-inbox"
    ]
  },
  {
    "slug": "recruitment-candidate-sourcing-virtual-assistant",
    "locale": "en-AU",
    "name": "Recruitment Candidate Sourcing Virtual Assistant",
    "group": "Recruitment",
    "directoryCategory": "Lead Generation & Sales",
    "primaryKeyword": "recruitment sourcing virtual assistant",
    "metaTitle": "Recruitment Candidate Sourcing Virtual Assistant Philippines",
    "metaDescription": "Hire Recruitment Candidate Sourcing Virtual Assistant Philippines. Compare vetted candidates by experience, tools, availability, and role fit.",
    "intro": "Hire a Recruitment Candidate Sourcing Virtual Assistant in the Philippines to handle building linkedin candidate searches, creating targeted candidate longlists, and adding and updating crm records. Define the target candidate and evidence requirements before sourcing begins so recruiters receive relevant profiles instead of raw volume.",
    "focus": "candidate sourcing and recruitment crm production",
    "tasks": [
      "building linkedin candidate searches",
      "creating targeted candidate longlists",
      "adding and updating crm records",
      "deduplicating candidate databases",
      "sending approved candidate outreach",
      "recording screening responses",
      "conducting structured administrative prescreens",
      "scheduling recruiter and client interviews",
      "maintaining candidate pipeline stages"
    ],
    "tools": [
      "LinkedIn Recruiter",
      "Bullhorn",
      "JobAdder",
      "Vincere",
      "SEEK Talent Search",
      "SourceWhale"
    ],
    "skills": [
      "candidate sourcing",
      "boolean search",
      "talent mapping",
      "recruitment crm management",
      "candidate outreach",
      "screening administration",
      "interview coordination"
    ],
    "bestFor": [
      "recruitment agencies",
      "executive search firms",
      "staffing businesses",
      "in-house talent acquisition teams"
    ],
    "outcomes": [
      "Recruiters begin searches with a larger pool of relevant prospects.",
      "Candidate records stay cleaner and easier to reuse across assignments.",
      "Consultants spend more time qualifying and closing candidates instead of maintaining sourcing queues."
    ],
    "costFactors": [
      "Number of concurrent roles being sourced.",
      "Candidate scarcity and search complexity.",
      "Volume of outreach and CRM enrichment required.",
      "Depth of administrative prescreening.",
      "Recruitment platforms and workflow integrations used."
    ],
    "relatedSlugs": [
      "lead-generation",
      "recruitment-hr",
      "admin-inbox",
      "executive-virtual-assistant"
    ]
  },
  {
    "slug": "insurance-broker-renewal-virtual-assistant",
    "locale": "en-AU",
    "name": "Insurance Broker Renewal Virtual Assistant",
    "group": "Insurance & Finance",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "insurance broker virtual assistant",
    "metaTitle": "Insurance Broker Renewal Virtual Assistant Philippines",
    "metaDescription": "Hire a vetted Insurance Broker Renewal Virtual Assistant in the Philippines. Compare renewal experience, tools, availability, and role fit before you interview.",
    "intro": "Hire an Insurance Broker Renewal Virtual Assistant in the Philippines to handle preparing upcoming renewal worklists, updating client and policy records, and requesting approved renewal information. Use checklists and role-based access, with licensed advice and regulated decisions kept with authorised staff.",
    "focus": "insurance renewal file preparation",
    "tasks": [
      "preparing upcoming renewal worklists",
      "updating client and policy records",
      "requesting approved renewal information",
      "assembling insurer submission documents",
      "tracking quote and insurer responses",
      "preparing quote comparison schedules",
      "drafting certificates from approved policy data",
      "maintaining renewal notes and correspondence",
      "tracking outstanding renewal actions"
    ],
    "tools": [
      "Ebix WinBEAT",
      "Sunrise Exchange",
      "Steadfast Client Trading Platform",
      "Microsoft Outlook",
      "DocuSign",
      "Adobe Acrobat"
    ],
    "skills": [
      "insurance renewal administration",
      "policy data management",
      "crm maintenance",
      "quote comparison preparation",
      "certificate preparation",
      "insurer follow-up",
      "document control"
    ],
    "bestFor": [
      "general insurance brokerages",
      "commercial insurance brokers",
      "sme insurance practices",
      "insurance broking networks"
    ],
    "outcomes": [
      "Renewal files reach brokers with key administration already completed.",
      "Outstanding client information and insurer responses become visible earlier in the renewal cycle.",
      "Brokers spend more time reviewing coverage and advising clients instead of rebuilding renewal files."
    ],
    "costFactors": [
      "Number of policies and renewals processed.",
      "Complexity of client programs and insurer submissions.",
      "Volume of quote follow-up and comparison preparation.",
      "Certificate and policy-document administration requirements.",
      "Broking systems, insurer portals and document workflows used."
    ],
    "relatedSlugs": [
      "bookkeeping",
      "admin-inbox",
      "customer-service",
      "executive-virtual-assistant"
    ]
  },
  {
    "slug": "creative-virtual-assistant",
    "name": "Creative Virtual Assistant",
    "group": "Creative & Content",
    "directoryCategory": "Video Editing & Creative",
    "primaryKeyword": "creative virtual assistant",
    "metaTitle": "Creative Virtual Assistant Philippines",
    "metaDescription": "Hire a Creative Virtual Assistant in the Philippines for design production, presentations, social graphics, asset coordination, and campaign support.",
    "intro": "Hire a Creative Virtual Assistant in the Philippines to handle repeatable creative production across social assets, presentations, content formatting, campaign variations, and brand-file organization. Keep creative direction and final brand approval with the client team while the Virtual Assistant owns the production queue.",
    "focus": "repeatable creative production and marketing asset coordination",
    "tasks": [
      "social graphic production",
      "presentation formatting",
      "content and campaign asset resizing",
      "lead magnet formatting",
      "thumbnail and cover production",
      "brand asset organization",
      "simple image cleanup",
      "approved template updates",
      "creative request tracking"
    ],
    "tools": [
      "Canva",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Figma",
      "Google Drive",
      "Dropbox",
      "PowerPoint",
      "Adobe Express"
    ],
    "skills": [
      "visual production",
      "brand consistency",
      "template-based design",
      "asset organization",
      "revision management",
      "content formatting",
      "attention to detail"
    ],
    "bestFor": [
      "marketing teams",
      "creative agencies",
      "ecommerce brands",
      "coaches and creators",
      "content-led businesses"
    ],
    "outcomes": [
      "Recurring creative requests move through one visible production queue.",
      "Approved brand templates are reused more consistently across channels.",
      "Senior marketers and designers spend less time on routine resizing, formatting, and asset preparation."
    ],
    "costFactors": [
      "Volume and frequency of creative requests.",
      "Complexity of the required design work.",
      "Number of channels and output sizes.",
      "Software and file-format requirements.",
      "Whether the role includes original design or mainly template-based production."
    ],
    "relatedSlugs": [
      "graphic-design",
      "social-media",
      "digital-marketing-virtual-assistant",
      "content-writing"
    ]
  },
  {
    "slug": "logistics-virtual-assistant",
    "name": "Logistics Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "logistics virtual assistant",
    "metaTitle": "Logistics Virtual Assistant Philippines",
    "metaDescription": "Hire a Logistics Virtual Assistant in the Philippines for shipment tracking, freight coordination, shipping documents, carrier follow-up, and logistics admin.",
    "intro": "Hire a Logistics Virtual Assistant in the Philippines to coordinate shipment tracking, carrier and supplier follow-up, shipping documents, freight bookings, delivery updates, and recurring logistics administration. Keep commercial commitments, customs decisions, regulated declarations, and exception approvals with authorized staff.",
    "focus": "shipment, freight, carrier, and logistics administration",
    "tasks": [
      "shipment tracking",
      "carrier and freight forwarder follow-up",
      "freight booking administration",
      "shipping document preparation",
      "bill of lading administration",
      "delivery status updates",
      "supplier and warehouse coordination",
      "logistics record maintenance",
      "exception and delay tracking"
    ],
    "tools": [
      "FedEx",
      "UPS",
      "DHL",
      "ShipStation",
      "Google Sheets",
      "Excel",
      "Google Workspace",
      "Microsoft 365"
    ],
    "skills": [
      "logistics coordination",
      "shipment tracking",
      "freight documentation",
      "carrier communication",
      "record accuracy",
      "exception follow-up",
      "time-sensitive coordination"
    ],
    "bestFor": [
      "ecommerce businesses",
      "importers and exporters",
      "freight and logistics teams",
      "manufacturers",
      "wholesale and distribution businesses"
    ],
    "outcomes": [
      "Shipment status and outstanding exceptions stay visible to the operating team.",
      "Carrier, supplier, and warehouse follow-up has one accountable owner.",
      "Shipping paperwork and recurring logistics records are prepared more consistently."
    ],
    "costFactors": [
      "Shipment and order volume.",
      "Domestic versus international freight complexity.",
      "Required live coverage and response times.",
      "Documentation and customs-administration depth.",
      "Number of carriers, warehouses, suppliers, and systems involved."
    ],
    "relatedSlugs": [
      "fulfilment",
      "customer-service",
      "research-data",
      "admin-inbox"
    ]
  },
  {
    "slug": "email-management-virtual-assistant",
    "name": "Email Management Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "email management virtual assistant",
    "metaTitle": "Email Management Virtual Assistant Philippines",
    "metaDescription": "Hire an Email Management Virtual Assistant in the Philippines for inbox triage, follow-up tracking, calendar handoffs, records, and response coordination.",
    "intro": "Hire an Email Management Virtual Assistant in the Philippines to organize shared and executive inboxes, route requests, track promised follow-ups, prepare draft responses, maintain labels, and keep unresolved messages visible. Approval rules should define which replies can be sent, which need review, and which sensitive requests must move to the account owner.",
    "focus": "inbox triage, response coordination, and follow-up ownership",
    "tasks": [
      "inbox triage and prioritization",
      "label and folder maintenance",
      "draft response preparation",
      "follow-up tracking",
      "calendar and task handoffs",
      "shared inbox assignment",
      "newsletter and notification cleanup",
      "contact and CRM updates",
      "exception escalation"
    ],
    "tools": [
      "Gmail",
      "Microsoft Outlook",
      "Google Workspace",
      "Microsoft 365",
      "Front",
      "Help Scout",
      "HubSpot",
      "Slack"
    ],
    "skills": [
      "written communication",
      "inbox prioritization",
      "follow-up discipline",
      "record keeping",
      "confidentiality",
      "calendar coordination",
      "escalation judgment"
    ],
    "bestFor": [
      "founders and executives",
      "consultants",
      "sales and client-service teams",
      "small businesses",
      "shared support inboxes"
    ],
    "outcomes": [
      "Important messages are assigned, answered, or escalated within the agreed window.",
      "Promised follow-ups remain visible until the next action is complete.",
      "The inbox becomes a controlled workflow instead of a private backlog."
    ],
    "costFactors": [
      "Inbox and message volume.",
      "Number of mailboxes and stakeholders.",
      "Required live coverage and response windows.",
      "Drafting versus send authority.",
      "CRM, calendar, or support-desk responsibilities."
    ],
    "relatedSlugs": [
      "admin-inbox",
      "executive-virtual-assistant",
      "calendar",
      "customer-service"
    ]
  },
  {
    "slug": "event-planning-virtual-assistant",
    "name": "Event Planning Virtual Assistant",
    "group": "Admin & Operations",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "event planning virtual assistant",
    "metaTitle": "Event Planning Virtual Assistant Philippines",
    "metaDescription": "Hire an Event Planning Virtual Assistant in the Philippines for vendor follow-up, guest lists, schedules, registration, records, and logistics coordination.",
    "intro": "Hire an Event Planning Virtual Assistant in the Philippines to maintain run sheets, guest and speaker records, registration updates, vendor follow-up, calendar deadlines, and event communications. Keep contract commitments, budget approval, venue decisions, safety responsibility, and final guest or sponsor promises with the authorized event owner.",
    "focus": "event administration, vendor follow-up, and schedule coordination",
    "tasks": [
      "event timeline and run-sheet updates",
      "guest and attendee list administration",
      "speaker and sponsor coordination",
      "vendor follow-up",
      "registration support",
      "calendar and deadline tracking",
      "event inbox administration",
      "document and asset organization",
      "post-event follow-up"
    ],
    "tools": [
      "Eventbrite",
      "Cvent",
      "Google Workspace",
      "Microsoft 365",
      "Asana",
      "Trello",
      "Canva",
      "Zoom"
    ],
    "skills": [
      "event coordination",
      "vendor communication",
      "schedule management",
      "record accuracy",
      "written communication",
      "deadline control",
      "exception escalation"
    ],
    "bestFor": [
      "event planners",
      "agencies",
      "professional associations",
      "coaches and educators",
      "companies running webinars or conferences"
    ],
    "outcomes": [
      "Event dates, owners, and open dependencies stay visible in one working plan.",
      "Guests, vendors, speakers, and sponsors receive consistent administrative follow-up.",
      "The event owner spends less time chasing routine updates and missing records."
    ],
    "costFactors": [
      "Number and frequency of events.",
      "Attendee, vendor, and speaker volume.",
      "Live event coverage requirements.",
      "Registration and communication complexity.",
      "Number of systems, venues, and time zones involved."
    ],
    "relatedSlugs": [
      "project-coordination",
      "calendar",
      "travel-lifestyle",
      "content-writing"
    ]
  },
  {
    "slug": "technical-virtual-assistant",
    "name": "Technical Virtual Assistant",
    "group": "Technology & Web",
    "directoryCategory": "Web & WordPress",
    "primaryKeyword": "technical virtual assistant",
    "metaTitle": "Technical Virtual Assistant Philippines",
    "metaDescription": "Hire a Technical Virtual Assistant in the Philippines for SaaS setup, automation, CRM configuration, integrations, technical documentation and support.",
    "intro": "Hire a Technical Virtual Assistant in the Philippines to maintain repeatable SaaS workflows, configure approved CRM and automation rules, connect business tools, document systems, troubleshoot routine issues, and keep technical operations visible. Architecture, security-sensitive changes, production deployments, and decisions requiring an engineer or system owner remain with the appropriate specialist.",
    "focus": "SaaS configuration, workflow automation, integrations, and technical operations support",
    "tasks": [
      "SaaS account and workspace configuration",
      "Zapier and Make workflow maintenance",
      "CRM field, pipeline, and automation setup",
      "form and lead-routing configuration",
      "webhook and integration troubleshooting",
      "CMS and no-code website maintenance",
      "technical SOP and system documentation",
      "automation monitoring and error logging",
      "tool migration and data-cleanup support"
    ],
    "tools": [
      "Zapier",
      "Make",
      "HubSpot",
      "GoHighLevel",
      "Airtable",
      "Notion",
      "WordPress",
      "Webflow"
    ],
    "skills": [
      "workflow mapping",
      "automation logic",
      "SaaS configuration",
      "technical troubleshooting",
      "documentation",
      "data hygiene",
      "access-control awareness"
    ],
    "bestFor": [
      "agencies",
      "SaaS companies",
      "consultants",
      "online businesses",
      "operations teams"
    ],
    "outcomes": [
      "Approved automations and integrations stay documented and maintained instead of becoming one-off experiments.",
      "Routine SaaS configuration and troubleshooting have a clear owner before issues reach senior technical staff.",
      "CRM, forms, workflows, and no-code systems remain more consistent as the business changes."
    ],
    "costFactors": [
      "Number and complexity of connected systems.",
      "Required automation and integration depth.",
      "Whether the role maintains existing workflows or builds new approved ones.",
      "Access level and production-risk sensitivity.",
      "Required live overlap for troubleshooting and releases."
    ],
    "relatedSlugs": [
      "it-virtual-assistant",
      "web-developer-virtual-assistant",
      "crm",
      "operations"
    ]
  },
{
    "slug": "conveyancing",
    "locale": "en-AU",
    "name": "Conveyancing Virtual Assistant",
    "group": "Legal",
    "directoryCategory": "Administrative Support",
    "primaryKeyword": "conveyancing virtual assistant",
    "metaTitle": "Conveyancing Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Conveyancing Virtual Assistant for Australian matter admin, PEXA preparation, document follow-up, milestones and client updates.",
    "intro": "Hire a Conveyancing Virtual Assistant to support Australian conveyancing administration across matter opening, document collection, client follow-up, PEXA preparation, settlement milestones and file close. Legal advice, contract interpretation, signing authority and regulated conveyancing decisions remain with the Australian conveyancer, solicitor or licensed professional.",
    "focus": "Australian conveyancing matter administration and settlement support",
    "tasks": ["matter opening and file setup","client document follow-up","contract and disclosure document administration","PEXA workspace preparation support","settlement milestone tracking","search and certificate follow-up","client and agent status updates","post-settlement file administration"],
    "tools": ["PEXA","LEAP","Smokeball","InfoTrack","Microsoft 365","Adobe Acrobat","DocuSign"],
    "skills": ["conveyancing workflow familiarity","document control","deadline management","client communication","matter administration","privacy awareness"],
    "bestFor": ["Australian conveyancing firms","property law practices","settlement teams","high-volume conveyancers"],
    "outcomes": ["Matter files stay current and easier to review.","Outstanding documents and settlement milestones remain visible.","Conveyancers spend less time on repeatable file administration."],
    "costFactors": ["Matter volume and settlement frequency","Required live overlap with Australian business hours","PEXA and practice-management experience","Document and client follow-up complexity","Level of independent file administration"],
    "relatedSlugs": ["legal-virtual-assistant","paralegal-virtual-assistant","real-estate","admin-inbox"]
  },
{
    "slug": "buyers-agent",
    "locale": "en-AU",
    "name": "Buyers Agent Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "buyers agent virtual assistant",
    "metaTitle": "Buyers Agent Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Virtual Assistant for Australian buyers agents handling CRM updates, property research, inspections, follow-up and deal admin.",
    "intro": "Hire a Buyers Agent Virtual Assistant to keep Australian property-search administration moving across CRM updates, property research, inspection scheduling, client follow-up, agent communication and due-diligence checklists. Negotiation, property recommendations and licensed real-estate decisions remain with the buyers agent.",
    "focus": "Australian buyers agency research, CRM and transaction administration",
    "tasks": ["CRM and brief updates","property shortlist research","inspection scheduling","selling-agent follow-up","comparable property data collection","due-diligence checklist administration","client update preparation","contract and settlement administration support"],
    "tools": ["VaultRE","AgentBox","CoreLogic","Domain","realestate.com.au","Google Workspace","DocuSign"],
    "skills": ["property research","CRM discipline","schedule coordination","data accuracy","client communication","follow-up"],
    "bestFor": ["Australian buyers agencies","property advisory firms","real-estate investors","multi-agent buyers agency teams"],
    "outcomes": ["Property opportunities and next actions stay visible.","Inspection and agent follow-up takes less adviser time.","Client files remain cleaner from brief through settlement."],
    "costFactors": ["Active client and property-search volume","Required Australian-hours overlap","CRM and property-research tool experience","Inspection and agent follow-up workload","Transaction administration depth"],
    "relatedSlugs": ["real-estate","property-management-virtual-assistant","admin-inbox","research-data"]
  },
{
    "slug": "financial-planning",
    "locale": "en-AU",
    "name": "Financial Planning Virtual Assistant",
    "group": "Finance & Insurance",
    "directoryCategory": "Bookkeeping & Finance",
    "primaryKeyword": "financial planning virtual assistant australia",
    "metaTitle": "Financial Planning Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Financial Planning Virtual Assistant for Australian client administration, Xplan workflows, document follow-up and review preparation.",
    "intro": "Hire a Financial Planning Virtual Assistant to support Australian advice practices with client administration, Xplan updates, review preparation, document collection, implementation tracking and routine follow-up. Personal financial advice, product recommendations, advice documents requiring authorised review and regulated decisions remain with appropriately licensed Australian advisers.",
    "focus": "Australian financial planning client administration and advice-production support",
    "tasks": ["Xplan client record maintenance","annual review preparation","document and data collection","fact-find administration","implementation tracking","provider follow-up","meeting preparation","client service administration"],
    "tools": ["Xplan","Microsoft 365","DocuSign","Adobe Acrobat","financial planning portals","CRM systems"],
    "skills": ["financial planning workflow familiarity","client record accuracy","document control","follow-up discipline","privacy awareness","professional communication"],
    "bestFor": ["Australian financial planning practices","wealth advisers","paraplanning teams","multi-adviser firms"],
    "outcomes": ["Client files are better prepared before adviser review.","Review and implementation follow-up stays visible.","Advisers spend less time maintaining routine administration."],
    "costFactors": ["Client and review volume","Xplan experience","Required Australian-hours overlap","Advice-production and implementation complexity","Level of independent client administration"],
    "relatedSlugs": ["financial-advisor-virtual-assistant","admin-inbox","calendar","research-data"]
  },
{
    "slug": "ndis-rostering",
    "locale": "en-AU",
    "name": "NDIS Rostering Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "ndis rostering virtual assistant",
    "metaTitle": "NDIS Rostering Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based NDIS Rostering Virtual Assistant for ShiftCare rosters, participant scheduling, worker availability, notes and admin follow-up.",
    "intro": "Hire an NDIS Rostering Virtual Assistant to support Australian providers with participant schedules, support-worker availability, ShiftCare updates, shift changes, timesheet follow-up and routine service administration. Participant safety, care decisions, incident management and compliance accountability remain with the provider and qualified local staff.",
    "focus": "NDIS rostering, participant scheduling and service administration",
    "tasks": ["participant roster maintenance","support-worker availability updates","shift change coordination","ShiftCare record updates","timesheet and note follow-up","service booking administration","participant and worker communication","roster exception escalation"],
    "tools": ["ShiftCare","Microsoft 365","Google Workspace","Teams","Slack","NDIS provider systems"],
    "skills": ["rostering","schedule coordination","participant communication","record accuracy","exception escalation","privacy awareness"],
    "bestFor": ["NDIS providers","disability support businesses","community care teams","multi-worker support organisations"],
    "outcomes": ["Roster changes are recorded and followed up faster.","Workers and participant schedules stay easier to reconcile.","Managers receive a clearer queue of exceptions requiring local decisions."],
    "costFactors": ["Participant and worker volume","After-hours or live rostering coverage","ShiftCare experience","Frequency of roster changes","Communication and escalation requirements"],
    "relatedSlugs": ["ndis-billing-virtual-assistant","allied-health-referral-billing-virtual-assistant","admin-inbox","customer-service"]
  },
{
    "slug": "aged-care",
    "locale": "en-AU",
    "name": "Aged Care Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "aged care virtual assistant australia",
    "metaTitle": "Aged Care Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Aged Care Virtual Assistant for Australian rostering, client administration, referral follow-up, records and service coordination.",
    "intro": "Hire an Aged Care Virtual Assistant to support Australian community and home-care teams with rostering, referral administration, client records, service updates, document follow-up and routine communication. Care decisions, clinical judgement, incidents, safeguarding and regulatory accountability remain with qualified local staff.",
    "focus": "Australian aged-care rostering and client administration",
    "tasks": ["client record administration","service roster updates","worker availability coordination","referral and intake follow-up","document collection","service change administration","routine client communication","exception and incident escalation support"],
    "tools": ["ShiftCare","AlayaCare","Microsoft 365","Google Workspace","Teams","practice-management systems"],
    "skills": ["care administration","rostering","client communication","record accuracy","privacy awareness","escalation judgement"],
    "bestFor": ["home-care providers","community care organisations","aged-care service teams","multi-site care businesses"],
    "outcomes": ["Routine service administration has a clear owner.","Roster and client-record updates remain more current.","Local care teams spend less time chasing documents and routine follow-up."],
    "costFactors": ["Client and worker volume","Rostering complexity","Required Australian-hours overlap","Care-management system experience","After-hours and escalation expectations"],
    "relatedSlugs": ["ndis-rostering","medical-virtual-assistant","allied-health-referral-billing-virtual-assistant","admin-inbox"]
  },
{
    "slug": "trust-accounting",
    "locale": "en-AU",
    "name": "Trust Accounting Virtual Assistant",
    "group": "Real Estate",
    "directoryCategory": "Real Estate",
    "primaryKeyword": "trust accounting virtual assistant australia",
    "metaTitle": "Trust Accounting Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Trust Accounting Virtual Assistant for Australian property management reconciliations, receipts, ledgers and review preparation.",
    "intro": "Hire a Trust Accounting Virtual Assistant to prepare Australian property-management trust administration such as receipt allocation, ledger maintenance, reconciliation support, owner and tenant record checks, and exception preparation. Trust-account authority, approvals, regulated handling of funds and final reconciliation sign-off remain with authorised local staff.",
    "focus": "Australian property-management trust administration and reconciliation support",
    "tasks": ["receipt allocation support","trust ledger administration","reconciliation preparation","owner and tenant record checks","arrears data preparation","statement administration","exception reporting","document and audit-trail organisation"],
    "tools": ["PropertyMe","Property Tree","Console Cloud","Xero","Excel","Microsoft 365"],
    "skills": ["trust-account workflow familiarity","reconciliation support","record accuracy","exception reporting","document control","confidentiality"],
    "bestFor": ["Australian property management agencies","real-estate agencies","trust-account teams","multi-office property businesses"],
    "outcomes": ["Trust records are better prepared for local review.","Exceptions are surfaced earlier instead of sitting in private queues.","Property managers spend less time on routine reconciliation preparation."],
    "costFactors": ["Portfolio and transaction volume","Trust-account system experience","Reconciliation frequency","Required Australian-hours overlap","Level of review and exception handling"],
    "relatedSlugs": ["property-management-virtual-assistant","property-management-maintenance-virtual-assistant","bookkeeping","accounting-virtual-assistant"]
  },
{
    "slug": "medical-receptionist",
    "locale": "en-AU",
    "name": "Medical Receptionist Virtual Assistant",
    "group": "Healthcare",
    "directoryCategory": "Dental & Healthcare",
    "primaryKeyword": "medical receptionist virtual assistant australia",
    "metaTitle": "Medical Receptionist Virtual Assistant Australia",
    "metaDescription": "Hire a Philippines-based Medical Receptionist Virtual Assistant for Australian clinics using Best Practice, Cliniko or similar practice systems.",
    "intro": "Hire a Medical Receptionist Virtual Assistant to support Australian clinics with appointment booking, patient calls, recalls, referrals, inbox administration, records follow-up and routine Best Practice or Cliniko updates. Clinical advice, triage decisions, prescribing and other regulated healthcare decisions remain with qualified local clinicians.",
    "focus": "Australian medical reception and non-clinical practice administration",
    "tasks": ["appointment booking and changes","patient call and inbox handling","recall and reminder administration","referral follow-up","patient record updates","document and results routing support","billing administration support","front-desk exception escalation"],
    "tools": ["Best Practice Premier","Cliniko","HotDoc","HealthEngine","Microsoft 365","RingCentral"],
    "skills": ["medical reception","patient communication","practice-management systems","scheduling","privacy awareness","escalation judgement"],
    "bestFor": ["Australian GP clinics","specialist practices","allied health clinics","multi-practitioner medical centres"],
    "outcomes": ["Appointments and patient follow-up queues stay more current.","Reception teams spend less time on repetitive administration.","Clinical staff receive clearer escalations when judgement is required."],
    "costFactors": ["Call and appointment volume","Required Australian-hours coverage","Practice-management system experience","Patient communication responsibilities","Billing and referral administration depth"],
    "relatedSlugs": ["medical-virtual-assistant","phone-receptionist","allied-health-referral-billing-virtual-assistant","medical-billing-virtual-assistant"]
  }


];

export function servicePageBySlug(slug: string) { return SERVICE_PAGES.find((page) => page.slug === slug); }

export const SERVICE_GROUPS = Array.from(new Set(SERVICE_PAGES.map((page) => page.group)));
