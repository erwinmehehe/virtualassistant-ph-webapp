export type IndustryPage = {
  slug: string;
  label: string;
  h1: string;
  primaryKeyword: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  audience: string;
  workflows: string[];
  serviceSlugs: string[];
  tools: string[];
  hiringNotes: string[];
  /**
   * Slug of the general industry page this is a specialization of, e.g.
   * "construction-estimating-tender-desk" -> "construction-companies".
   * Keeps overlapping general + narrow pages (flagged as "getting messy")
   * connected as one topical cluster instead of competing, unlinked pages --
   * the hub links down to its specializations, each specialization links
   * back up. Omit for pages that don't cleanly belong under a broader hub.
   */
  clusterSlug?: string;
};

export const INDUSTRIES: IndustryPage[] = [
  {
    "slug": "healthcare-dental",
    "label": "Healthcare & Dental",
    "h1": "Virtual Assistants for Healthcare & Dental Teams",
    "primaryKeyword": "virtual assistant for healthcare",
    "metaTitle": "Healthcare & Dental Virtual Assistants | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for healthcare and dental practices, including scheduling. Compare skills, tools, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to healthcare and dental practices. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "healthcare and dental practices",
    "workflows": [
      "scheduling",
      "patient reminders",
      "referral follow-up",
      "billing administration support",
      "front-desk communication",
      "records coordination"
    ],
    "serviceSlugs": [
      "medical-virtual-assistant",
      "dental-virtual-assistant",
      "medical-billing-virtual-assistant",
      "phone-receptionist"
    ],
    "tools": [
      "EHR or practice-management systems",
      "Google Workspace",
      "Microsoft 365",
      "RingCentral",
      "secure messaging tools"
    ],
    "hiringNotes": [
      "Define exactly which records and systems the Virtual Assistant may access.",
      "Keep clinical decisions with licensed professionals.",
      "Document escalation rules for privacy, billing, and urgent patient issues."
    ]
  },
  {
    "slug": "home-local-services",
    "label": "Home & Local Services",
    "h1": "Virtual Assistants for Home & Local Service Businesses",
    "primaryKeyword": "virtual assistant for home service business",
    "metaTitle": "Home & Local Services Virtual Assistants | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for home and local service companies, including inbound lead handling. Compare skills, tools, availability, and role.",
    "intro": "Build a remote support role around the workflows that matter to home and local service companies. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "home and local service companies",
    "workflows": [
      "inbound lead handling",
      "appointment booking",
      "dispatch support",
      "estimate follow-up",
      "CRM updates",
      "customer reminders",
      "review requests",
      "vendor coordination"
    ],
    "serviceSlugs": [
      "phone-receptionist",
      "appointment-setter-virtual-assistant",
      "construction-virtual-assistant",
      "hvac-virtual-assistant"
    ],
    "tools": [
      "ServiceTitan",
      "Housecall Pro",
      "Jobber",
      "GoHighLevel",
      "Google Workspace",
      "RingCentral"
    ],
    "hiringNotes": [
      "Define service areas, pricing rules, and booking boundaries.",
      "Prioritize live schedule overlap when phone coverage matters.",
      "Create clear escalation rules for emergencies and field-team issues."
    ]
  },
  {
    "slug": "professional-services-growth",
    "label": "Professional Services",
    "h1": "Virtual Assistants for Professional Services & Growth Teams",
    "primaryKeyword": "virtual assistant for professional services",
    "metaTitle": "Professional Services Virtual Assistants | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for professional services. Compare relevant experience, tools, communication, availability, and role fit before you.",
    "intro": "Build a remote support role around the workflows that matter to professional-services and growth teams. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "professional-services and growth teams",
    "workflows": [
      "calendar and inbox coordination",
      "client onboarding",
      "prospect research",
      "CRM upkeep",
      "marketing operations",
      "reporting",
      "research",
      "project coordination"
    ],
    "serviceSlugs": [
      "executive-virtual-assistant",
      "lead-generation",
      "digital-marketing-virtual-assistant",
      "project-coordination"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "HubSpot",
      "Notion",
      "Asana",
      "Slack"
    ],
    "hiringNotes": [
      "Separate strategy from repeatable execution.",
      "List the systems the Virtual Assistant will use from week one.",
      "Define response expectations and decision boundaries."
    ]
  },
  {
    "slug": "small-business",
    "label": "Small Business",
    "h1": "Hire a Virtual Assistant for Your Small Business",
    "primaryKeyword": "virtual assistant for small business",
    "metaTitle": "Virtual Assistant for Your Small Business | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for small business owners, including inbox and calendar support. Compare skills, tools, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to small business owners. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "small business owners",
    "workflows": [
      "inbox and calendar support",
      "customer follow-up",
      "CRM updates",
      "research",
      "invoicing administration",
      "social scheduling",
      "document updates",
      "reporting"
    ],
    "serviceSlugs": [
      "small-business-virtual-assistant",
      "general-virtual-assistant",
      "admin-inbox",
      "customer-service"
    ],
    "tools": [
      "Google Workspace",
      "Microsoft 365",
      "HubSpot",
      "QuickBooks",
      "Canva",
      "Calendly"
    ],
    "hiringNotes": [
      "Choose a small number of recurring workflows before adding one-off tasks.",
      "Define which customer or financial actions need owner approval.",
      "Prioritize broad business communication and follow-through."
    ]
  },
  {
    "slug": "medical-practices",
    "label": "Doctors & Medical Practices",
    "h1": "Hire a Virtual Assistant for Doctors & Medical Practices",
    "primaryKeyword": "virtual assistant for doctors",
    "metaTitle": "Doctors & Medical Practices Virtual Assistants | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for doctors & medical practices. Compare relevant experience, tools, communication, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to medical practices, physicians, and clinics. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "medical practices, physicians, and clinics",
    "workflows": [
      "appointment scheduling",
      "patient reminders",
      "referral coordination",
      "insurance verification support",
      "records administration",
      "billing support",
      "inbox and phone coverage",
      "intake follow-up"
    ],
    "serviceSlugs": [
      "medical-virtual-assistant",
      "medical-billing-virtual-assistant",
      "medical-scribe-virtual-assistant",
      "phone-receptionist"
    ],
    "tools": [
      "EHR and practice-management systems",
      "RingCentral",
      "Google Workspace",
      "Microsoft 365",
      "secure messaging tools",
      "billing portals"
    ],
    "hiringNotes": [
      "Keep the role non-clinical unless separately qualified and authorized.",
      "Define privacy, access, and supervision requirements before onboarding.",
      "Document what must be escalated to clinical or billing staff."
    ]
  },
  {
    "slug": "law-firms",
    "label": "Law Firms",
    "h1": "Hire a Virtual Assistant for Lawyers & Law Firms",
    "primaryKeyword": "virtual assistant for lawyers",
    "metaTitle": "Virtual Assistant for Lawyers & Law Firms | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for law firms, attorneys, and solo practitioners, including client intake. Compare skills, tools, availability, and.",
    "intro": "Build a remote support role around the workflows that matter to law firms, attorneys, and solo practitioners. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "law firms, attorneys, and solo practitioners",
    "workflows": [
      "client intake",
      "calendar and deadline support",
      "matter setup",
      "document organization",
      "billing administration",
      "case-management updates",
      "client follow-up",
      "research support"
    ],
    "serviceSlugs": [
      "law-firm-virtual-assistant",
      "legal-virtual-assistant",
      "paralegal-virtual-assistant",
      "phone-receptionist"
    ],
    "tools": [
      "Clio",
      "MyCase",
      "PracticePanther",
      "Lawmatics",
      "Microsoft 365",
      "DocuSign"
    ],
    "hiringNotes": [
      "Keep legal advice and attorney judgment with licensed counsel.",
      "Define confidentiality, supervision, and jurisdiction-specific limits.",
      "Give the Virtual Assistant clear matter-naming, filing, and escalation rules."
    ]
  },
  {
    "slug": "real-estate-agents",
    "label": "Real Estate Agents & Realtors",
    "h1": "Hire a Virtual Assistant for Real Estate Agents",
    "primaryKeyword": "virtual assistant for real estate agents",
    "metaTitle": "Virtual Assistant for Real Estate Agents | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for real estate agents & realtors. Compare relevant experience, tools, communication, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to real estate agents, Realtors, and brokerages. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "real estate agents, Realtors, and brokerages",
    "workflows": [
      "lead follow-up",
      "CRM updates",
      "listing administration",
      "appointment coordination",
      "transaction support",
      "database cleanup",
      "property research",
      "marketing coordination"
    ],
    "serviceSlugs": [
      "real-estate",
      "lead-generation",
      "appointment-setter-virtual-assistant",
      "admin-inbox"
    ],
    "tools": [
      "Follow Up Boss",
      "KVCore",
      "BoomTown",
      "MLS tools",
      "DocuSign",
      "Canva"
    ],
    "hiringNotes": [
      "Define which lead stages the Virtual Assistant owns and when an agent takes over.",
      "Document listing and transaction checklists.",
      "Match schedule overlap to live lead-response expectations."
    ]
  },
  {
    "slug": "financial-advisors",
    "label": "Financial Advisors",
    "h1": "Hire a Virtual Assistant for Financial Advisors",
    "primaryKeyword": "virtual assistant for financial advisors",
    "metaTitle": "Virtual Assistant for Financial Advisors | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for financial advisors. Compare relevant experience, tools, communication, availability, and role fit before you hire.",
    "intro": "Build a remote support role around the workflows that matter to financial advisors, RIAs, and wealth-management firms. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "financial advisors, RIAs, and wealth-management firms",
    "workflows": [
      "meeting scheduling",
      "client follow-up",
      "CRM upkeep",
      "document collection",
      "review-meeting preparation",
      "marketing administration",
      "workflow updates",
      "reporting"
    ],
    "serviceSlugs": [
      "financial-advisor-virtual-assistant",
      "admin-inbox",
      "crm",
      "bookkeeping"
    ],
    "tools": [
      "Redtail",
      "Wealthbox",
      "Salesforce",
      "Microsoft 365",
      "Google Workspace",
      "DocuSign"
    ],
    "hiringNotes": [
      "Keep regulated advice and final recommendations with appropriately licensed professionals.",
      "Define client-data access and review rules.",
      "Document which communications require advisor approval."
    ]
  },
  {
    "slug": "startups",
    "label": "Startups",
    "h1": "Hire a Virtual Assistant for a Startup",
    "primaryKeyword": "virtual assistant for startups",
    "metaTitle": "Virtual Assistant for a Startup | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for startups. Compare relevant experience, tools, communication, availability, and role fit before you hire. Get.",
    "intro": "Build a remote support role around the workflows that matter to startups and founder-led companies. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "startups and founder-led companies",
    "workflows": [
      "founder inbox and calendar support",
      "customer follow-up",
      "research",
      "CRM updates",
      "project coordination",
      "recruiting administration",
      "marketing operations",
      "reporting"
    ],
    "serviceSlugs": [
      "executive-virtual-assistant",
      "general-virtual-assistant",
      "project-coordination",
      "recruitment-hr"
    ],
    "tools": [
      "Google Workspace",
      "Slack",
      "Notion",
      "HubSpot",
      "Asana",
      "Calendly"
    ],
    "hiringNotes": [
      "Hire around repeatable ownership rather than a vague do-everything role.",
      "Define priorities because startup requests change quickly.",
      "Choose a communication cadence for blockers and changing deadlines."
    ]
  },
  {
    "slug": "construction-companies",
    "label": "Construction Companies",
    "h1": "Hire a Virtual Assistant for a Construction Company",
    "primaryKeyword": "virtual assistant for construction company",
    "metaTitle": "Virtual Assistant for a Construction Company | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for construction companies. Compare relevant experience, tools, communication, availability, and role fit before you.",
    "intro": "Build a remote support role around the workflows that matter to general contractors and construction companies. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "general contractors and construction companies",
    "workflows": [
      "estimate follow-up",
      "project document organization",
      "vendor coordination",
      "schedule updates",
      "customer communication",
      "purchase-order administration",
      "CRM updates",
      "job reporting"
    ],
    "serviceSlugs": [
      "construction-virtual-assistant",
      "project-coordination",
      "operations",
      "phone-receptionist"
    ],
    "tools": [
      "Buildertrend",
      "CoConstruct",
      "Procore",
      "Jobber",
      "QuickBooks",
      "DocuSign"
    ],
    "hiringNotes": [
      "Define field-team versus office-team ownership.",
      "Create clear escalation rules for schedule or customer issues.",
      "Standardize document naming, estimate follow-up, and project updates."
    ]
  },
  {
    "slug": "insurance-agencies",
    "label": "Insurance Agencies",
    "h1": "Hire a Virtual Assistant for an Insurance Agency",
    "primaryKeyword": "virtual assistant for insurance agency",
    "metaTitle": "Virtual Assistant for an Insurance Agency | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for insurance agencies, agents, and brokerages, including lead intake. Compare skills, tools, availability, and role.",
    "intro": "Build a remote support role around the workflows that matter to insurance agencies, agents, and brokerages. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "insurance agencies, agents, and brokerages",
    "workflows": [
      "lead intake",
      "appointment scheduling",
      "renewal reminders",
      "policy-document administration",
      "CRM updates",
      "quote follow-up support",
      "client communication",
      "reporting"
    ],
    "serviceSlugs": [
      "insurance-virtual-assistant",
      "crm",
      "appointment-setter-virtual-assistant",
      "admin-inbox"
    ],
    "tools": [
      "Applied Epic",
      "AMS360",
      "EZLynx",
      "HubSpot",
      "Salesforce",
      "Calendly"
    ],
    "hiringNotes": [
      "Separate licensed insurance activity from administrative support.",
      "Define which communications and policy actions need agent review.",
      "Use role-based access for client and policy data."
    ]
  },
  {
    "slug": "property-management-companies",
    "label": "Property Management",
    "h1": "Hire a Virtual Assistant for Property Management",
    "primaryKeyword": "virtual assistant for property management",
    "metaTitle": "Virtual Assistant for Property Management | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for property management. Compare relevant experience, tools, communication, availability, and role fit before you hire.",
    "intro": "Build a remote support role around the workflows that matter to property managers and real estate operators. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "property managers and real estate operators",
    "workflows": [
      "tenant communication",
      "maintenance coordination",
      "leasing inquiry follow-up",
      "vendor scheduling",
      "calendar management",
      "document administration",
      "CRM updates",
      "reporting"
    ],
    "serviceSlugs": [
      "property-management-virtual-assistant",
      "real-estate",
      "phone-receptionist",
      "short-term-rental-virtual-assistant"
    ],
    "tools": [
      "AppFolio",
      "Buildium",
      "Propertyware",
      "Rent Manager",
      "Google Workspace",
      "DocuSign"
    ],
    "hiringNotes": [
      "Define maintenance emergencies and escalation rules.",
      "Clarify which tenant or vendor decisions require manager approval.",
      "Match live coverage to leasing and maintenance communication needs."
    ]
  },
  {
    "slug": "accountants-cpas",
    "label": "Accountants & CPAs",
    "h1": "Hire a Virtual Assistant for Accountants & CPAs",
    "primaryKeyword": "virtual assistant for accountants",
    "metaTitle": "Virtual Assistant for Accountants & CPAs | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for accountants & cpas. Compare relevant experience, tools, communication, availability, and role fit before you hire.",
    "intro": "Build a remote support role around the workflows that matter to accounting firms, CPAs, and finance practices. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "accounting firms, CPAs, and finance practices",
    "workflows": [
      "client document follow-up",
      "calendar coordination",
      "bookkeeping administration",
      "CRM updates",
      "tax-season workflow support",
      "file organization",
      "billing administration",
      "reporting"
    ],
    "serviceSlugs": [
      "accounting-virtual-assistant",
      "bookkeeping",
      "quickbooks-virtual-assistant",
      "admin-inbox"
    ],
    "tools": [
      "QuickBooks Online",
      "Xero",
      "Microsoft 365",
      "Google Workspace",
      "Dext",
      "TaxDome"
    ],
    "hiringNotes": [
      "Keep professional accounting judgments with the responsible accountant or CPA.",
      "Define secure document handling and client-data access.",
      "Create seasonal workflow rules for deadlines and escalations."
    ]
  },
  {
    "slug": "coaches",
    "label": "Coaches & Consultants",
    "h1": "Hire a Virtual Assistant for Coaches & Consultants",
    "primaryKeyword": "virtual assistant for coaches",
    "metaTitle": "Virtual Assistant for Coaches & Consultants | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for coaches & consultants. Compare relevant experience, tools, communication, availability, and role fit before you.",
    "intro": "Build a remote support role around the workflows that matter to coaches, consultants, and expert-led businesses. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "coaches, consultants, and expert-led businesses",
    "workflows": [
      "calendar management",
      "client onboarding",
      "session reminders",
      "CRM updates",
      "content scheduling",
      "email support",
      "research",
      "program administration"
    ],
    "serviceSlugs": [
      "personal-assistant",
      "admin-inbox",
      "email-marketing",
      "social-media"
    ],
    "tools": [
      "Calendly",
      "Zoom",
      "Kajabi",
      "HubSpot",
      "ConvertKit",
      "Google Workspace"
    ],
    "hiringNotes": [
      "Define the client experience the Virtual Assistant should own between sessions.",
      "Separate expert advice from administrative execution.",
      "Document response times, onboarding steps, and content approvals."
    ]
  },
  {
    "slug": "dental-practices",
    "label": "Dental Practices",
    "h1": "Hire a Virtual Assistant for a Dental Office",
    "primaryKeyword": "virtual assistant for dental office",
    "metaTitle": "Virtual Assistant for a Dental Office | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for dental offices and dental groups, including appointment scheduling. Compare skills, tools, availability, and.",
    "intro": "Build a remote support role around the workflows that matter to dental offices and dental groups. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "dental offices and dental groups",
    "workflows": [
      "appointment scheduling",
      "patient reminders",
      "recall workflows",
      "insurance verification support",
      "billing follow-up support",
      "inbox and phone coverage",
      "document coordination",
      "front-desk administration"
    ],
    "serviceSlugs": [
      "dental-virtual-assistant",
      "dental-billing-virtual-assistant",
      "phone-receptionist",
      "admin-inbox"
    ],
    "tools": [
      "Dentrix",
      "Open Dental",
      "Eaglesoft",
      "NexHealth",
      "Weave",
      "RingCentral"
    ],
    "hiringNotes": [
      "Keep clinical decisions with licensed dental professionals.",
      "Define privacy and patient-data access before onboarding.",
      "Document which billing, scheduling, and urgent patient issues must be escalated."
    ]
  },
  {
    "slug": "photographers-creatives",
    "label": "Photographers & Creatives",
    "h1": "Hire a Virtual Assistant for Photographers & Creatives",
    "primaryKeyword": "virtual assistant for photographers",
    "metaTitle": "Photographers & Creatives Virtual Assistants | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for photographers & creatives. Compare relevant experience, tools, communication, availability, and role fit before.",
    "intro": "Build a remote support role around the workflows that matter to photographers, studios, and creative businesses. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "photographers, studios, and creative businesses",
    "workflows": [
      "inquiry follow-up",
      "calendar coordination",
      "client onboarding",
      "gallery administration",
      "CRM updates",
      "social scheduling",
      "invoice administration",
      "travel and shoot research"
    ],
    "serviceSlugs": [
      "admin-inbox",
      "personal-assistant",
      "social-media",
      "graphic-design"
    ],
    "tools": [
      "HoneyBook",
      "Dubsado",
      "Google Workspace",
      "Calendly",
      "Canva",
      "Lightroom workflows"
    ],
    "hiringNotes": [
      "Build the role around client experience and admin handoffs.",
      "Keep creative direction and final image decisions with the photographer unless delegated.",
      "Define busy-season response times and booking rules."
    ]
  },
  {
    "slug": "entrepreneurs",
    "label": "Entrepreneurs",
    "h1": "Hire a Virtual Assistant for Entrepreneurs",
    "primaryKeyword": "virtual assistant for entrepreneurs",
    "metaTitle": "Virtual Assistant for Entrepreneurs | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for entrepreneurs. Compare relevant experience, tools, communication, availability, and role fit before you hire..",
    "intro": "Build a remote support role around the workflows that matter to entrepreneurs and founder-led businesses. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "entrepreneurs and founder-led businesses",
    "workflows": [
      "inbox and calendar management",
      "research",
      "customer follow-up",
      "CRM updates",
      "travel planning",
      "project coordination",
      "content support",
      "reporting"
    ],
    "serviceSlugs": [
      "executive-virtual-assistant",
      "personal-assistant",
      "general-virtual-assistant",
      "project-coordination"
    ],
    "tools": [
      "Google Workspace",
      "Notion",
      "Slack",
      "HubSpot",
      "Calendly",
      "Asana"
    ],
    "hiringNotes": [
      "Choose recurring ownership areas instead of a constant stream of unrelated requests.",
      "Define what the Virtual Assistant can decide without asking.",
      "Use a weekly priority and blocker review."
    ]
  },
  {
    "slug": "real-estate-investors",
    "label": "Real Estate Investors",
    "h1": "Hire a Virtual Assistant for Real Estate Investors",
    "primaryKeyword": "virtual assistant for real estate investors",
    "metaTitle": "Virtual Assistant for Real Estate Investors | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for real estate investors. Compare relevant experience, tools, communication, availability, and role fit before you.",
    "intro": "Build a remote support role around the workflows that matter to real estate investors and acquisition teams. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "real estate investors and acquisition teams",
    "workflows": [
      "lead list research",
      "seller lead follow-up",
      "CRM updates",
      "property research",
      "appointment setting",
      "transaction coordination support",
      "vendor follow-up",
      "reporting"
    ],
    "serviceSlugs": [
      "real-estate",
      "lead-generation",
      "cold-calling-virtual-assistant",
      "appointment-setter-virtual-assistant"
    ],
    "tools": [
      "REsimpli",
      "Podio",
      "InvestorFuse",
      "PropStream",
      "BatchLeads",
      "Google Sheets"
    ],
    "hiringNotes": [
      "Define lead qualification and offer boundaries.",
      "Keep pricing, acquisition, and legal decisions with the responsible investor or professional.",
      "Document follow-up cadence and CRM stages."
    ]
  },
  {
    "slug": "ecommerce-stores",
    "label": "Ecommerce Stores",
    "h1": "Hire a Virtual Assistant for an Ecommerce Store",
    "primaryKeyword": "virtual assistant for ecommerce store",
    "metaTitle": "Virtual Assistant for an Ecommerce Store | Philippines",
    "metaDescription": "Hire vetted Filipino virtual assistants for ecommerce stores and DTC brands, including product updates. Compare skills, tools, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to ecommerce stores and DTC brands. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "ecommerce stores and DTC brands",
    "workflows": [
      "product updates",
      "order support",
      "customer service",
      "inventory coordination",
      "email campaign support",
      "store QA",
      "returns administration",
      "reporting"
    ],
    "serviceSlugs": [
      "ecommerce",
      "shopify-virtual-assistant",
      "fulfilment",
      "customer-service"
    ],
    "tools": [
      "Shopify",
      "WooCommerce",
      "Gorgias",
      "Klaviyo",
      "ShipStation",
      "Google Sheets"
    ],
    "hiringNotes": [
      "Define which customer exceptions require manager approval.",
      "Document order, refund, and return rules.",
      "Match live support hours to the customer promise on your site."
    ]
  },
  {
    "slug": "therapists",
    "label": "Therapists & Mental Health Practices",
    "h1": "Hire a Virtual Assistant for Therapists",
    "primaryKeyword": "virtual assistant for therapists",
    "metaTitle": "Virtual Assistant for Therapists | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for therapists & mental health practices. Compare relevant experience, tools, communication, availability, and role.",
    "intro": "Build a remote support role around the workflows that matter to therapists, counselors, and mental-health practices. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "therapists, counselors, and mental-health practices",
    "workflows": [
      "appointment scheduling",
      "intake follow-up",
      "patient reminders",
      "waitlist administration",
      "billing administration support",
      "inbox and phone coverage",
      "referral coordination",
      "records administration"
    ],
    "serviceSlugs": [
      "mental-health-virtual-assistant",
      "medical-virtual-assistant",
      "phone-receptionist",
      "admin-inbox"
    ],
    "tools": [
      "therapy practice-management systems",
      "Google Workspace",
      "Microsoft 365",
      "secure messaging tools",
      "RingCentral",
      "Calendly"
    ],
    "hiringNotes": [
      "Keep clinical decisions and crisis response with qualified professionals.",
      "Define privacy, access, and urgent-message escalation rules.",
      "Use scripts carefully for non-clinical scheduling and administrative communication."
    ]
  },
  {
    "slug": "banking-financial-services",
    "label": "Banking & Financial Services",
    "h1": "Hire a Virtual Assistant for Banking & Financial Services",
    "primaryKeyword": "virtual assistant for banking",
    "metaTitle": "Banking & Financial Services Virtual Assistant | Philippines",
    "metaDescription": "Hire vetted Filipino Virtual Assistants for banking & financial services. Compare relevant experience, tools, communication, availability, and role fit.",
    "intro": "Build a remote support role around the workflows that matter to banking and financial-service teams. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your internal team or licensed professionals.",
    "audience": "banking and financial-service teams",
    "workflows": [
      "client appointment coordination",
      "document follow-up",
      "CRM maintenance",
      "research",
      "report preparation",
      "inbox administration",
      "workflow tracking",
      "data entry"
    ],
    "serviceSlugs": [
      "admin-inbox",
      "financial-advisor-virtual-assistant",
      "research-data",
      "crm"
    ],
    "tools": [
      "Microsoft 365",
      "Google Workspace",
      "Salesforce",
      "Excel",
      "DocuSign",
      "Calendly"
    ],
    "hiringNotes": [
      "Define access controls and regulated activity boundaries before onboarding.",
      "Keep financial advice and approvals with authorized professionals.",
      "Document secure handling, review, and escalation procedures."
    ]
  },
  {
    "slug": "construction-estimating-tender-desk",
    "clusterSlug": "construction-companies",
    "label": "Construction Estimating & Tender Desk",
    "h1": "Your Outsourced Estimating & Tender Desk",
    "primaryKeyword": "outsourced construction estimating philippines",
    "metaTitle": "Construction Estimating & Tender Desk | Philippines",
    "metaDescription": "Build an outsourced estimating and tender desk with vetted Filipino estimators. Plans to completed tender packages, ready for your estimator to review.",
    "intro": "We turn plans into completed tender packages ready for your estimator or builder to review -- not just \"a Filipino estimator,\" an outsourced estimating function built around your take-off, pricing, and tender workflow. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your licensed estimator or the business owner.",
    "audience": "general contractors, electrical, mechanical, and civil subcontractors",
    "workflows": [
      "plans to quantity take-off",
      "supplier RFQs",
      "pricing spreadsheet preparation",
      "tender documentation assembly",
      "variation register upkeep",
      "CRM and job tracking",
      "addenda and revision tracking",
      "subcontractor follow-up"
    ],
    "serviceSlugs": [
      "construction-estimating-virtual-assistant",
      "construction-virtual-assistant",
      "project-coordination",
      "admin-inbox"
    ],
    "tools": [
      "Cubit",
      "CostX",
      "Bluebeam",
      "Planswift",
      "Buildxact",
      "Simpro"
    ],
    "hiringNotes": [
      "The final commercial and pricing decision stays with your estimator or business owner -- this role prepares the package, it doesn't submit the bid.",
      "Define which trades, take-off software, and pricing sources the role should specialize in.",
      "Standardize your tender checklist before onboarding so quality is consistent from the first package."
    ]
  },
  {
    "slug": "accounting-firms-month-end",
    "clusterSlug": "accountants-cpas",
    "label": "Accounting & Bookkeeping Firms",
    "h1": "Clear Your Firm's Month-End & Compliance Production Backlog",
    "primaryKeyword": "outsourced month end production accounting firm",
    "metaTitle": "Month-End Production for Accounting Firms | Philippines",
    "metaDescription": "Build an outsourced month-end production team with vetted Filipino accountants and bookkeepers. Reconciliations, workpapers, and management accounts, on.",
    "intro": "We clear your firm's month-end and compliance production backlog -- not \"offshore accountants,\" a production function built around your firm's checklist and deadlines. Use this guide to decide what to delegate, which tools and schedule matter, and which decisions should stay with your registered accountant.",
    "audience": "accounting firms, bookkeeping practices, and outsourced CFO teams",
    "workflows": [
      "bank and balance-sheet reconciliation",
      "accounts payable and receivable",
      "payroll preparation",
      "workpaper preparation",
      "GST/BAS reconciliation support",
      "fixed asset registers",
      "month-end journals",
      "management account preparation",
      "client document chasing"
    ],
    "serviceSlugs": [
      "month-end-production-virtual-assistant",
      "bookkeeping",
      "quickbooks-virtual-assistant",
      "accounting-virtual-assistant"
    ],
    "tools": [
      "Xero",
      "QuickBooks Online",
      "MYOB",
      "Dext",
      "Excel"
    ],
    "hiringNotes": [
      "Your registered accountant retains client advisory, review, and any regulated tax or BAS-agent responsibilities -- this role prepares the production work under your firm's supervision.",
      "Define a defined-business-day turnaround and review checklist before onboarding.",
      "Standardize workpaper templates across client files so quality is consistent as volume grows."
    ]
  },
  {
    "slug": "ndis-providers",
    "label": "NDIS Providers",
    "h1": "Run Your Invoice-to-Claim Back Office",
    "primaryKeyword": "outsourced ndis billing claims processing",
    "metaTitle": "NDIS Billing & Claims Operations | Philippines",
    "metaDescription": "Build an outsourced NDIS billing and claims desk with vetted Filipino specialists. Invoice-to-claim processing, reconciliation, and participant admin.",
    "intro": "We run the invoice-to-claim back office for NDIS providers -- not \"an NDIS virtual assistant,\" a claims operations function sized to your participant volume. Use this guide to decide what to delegate, which platforms and schedule matter, and which approvals should stay with your organization.",
    "audience": "NDIS registered providers, plan managers, and support coordination businesses",
    "workflows": [
      "claims processing and submission support",
      "remittance and payment reconciliation",
      "participant onboarding administration",
      "service agreement documentation",
      "rostering administration",
      "documentation and audit-readiness",
      "rejected-claim follow-up",
      "reporting"
    ],
    "serviceSlugs": [
      "ndis-billing-virtual-assistant",
      "medical-billing-virtual-assistant",
      "admin-inbox",
      "customer-service"
    ],
    "tools": [
      "PACE",
      "Lumary",
      "CareMaster",
      "Brevity",
      "ShiftCare",
      "Splose"
    ],
    "hiringNotes": [
      "Your organization retains required approvals and professional responsibility -- this role handles processing, reconciliation, and exceptions under your supervision.",
      "Define participant volume and claims-per-month before sizing the role.",
      "Document audit and privacy requirements before granting platform access."
    ]
  },
  {
    "slug": "mortgage-broker-loan-processing",
    "clusterSlug": "real-estate-agents",
    "label": "Mortgage Loan Processing",
    "h1": "Keep More Mortgage Files Moving From Application to Settlement",
    "primaryKeyword": "mortgage broker loan processing outsourcing",
    "metaTitle": "Mortgage Broker Loan Processing Support",
    "metaDescription": "Build an outsourced mortgage processing desk for file preparation, ApplyOnline entry, lender conditions, approvals and settlement tracking.",
    "intro": "Your brokers should be structuring deals and advising clients, not rebuilding checklists and chasing every outstanding document. An outsourced processing desk handles the production workflow around each application while your broker retains the lending advice and approval decisions.",
    "audience": "mortgage brokers, finance brokers and loan processing teams",
    "workflows": [
      "receive the new application and confirm the processing checklist",
      "collect, name and organise borrower supporting documents",
      "enter application and supporting data into the crm and applyonline",
      "prepare the submission file for broker review and approval",
      "record lender requests and follow up outstanding conditions",
      "track valuations, conditional approvals and formal approvals",
      "coordinate outstanding documents ahead of settlement",
      "update the crm and notify the broker of settlement milestones"
    ],
    "serviceSlugs": [
      "mortgage-loan-processing-virtual-assistant",
      "mortgage-virtual-assistant",
      "real-estate",
      "admin-inbox"
    ],
    "tools": [
      "ApplyOnline",
      "Salestrekker",
      "Mercury Nexus",
      "BrokerEngine",
      "Quickli",
      "DocuSign"
    ],
    "hiringNotes": [
      "Document the brokerage's submission checklist, naming conventions and lender escalation rules before delegating live files.",
      "Give the Virtual Assistant access only to the CRM, lender portals and client information required for assigned processing work.",
      "The licensed or authorised local mortgage professional retains final approval, credit advice, product recommendations and compliance responsibility; the Virtual Assistant performs preparation and administration."
    ]
  },
  {
    "slug": "smsf-production",
    "clusterSlug": "accountants-cpas",
    "label": "SMSF Production",
    "h1": "Clear Your SMSF Production Backlog Before Review Season",
    "primaryKeyword": "smsf production outsourcing",
    "metaTitle": "SMSF Production Outsourcing Support",
    "metaDescription": "Outsource SMSF coding, reconciliations, workpapers, document follow-up and audit-pack preparation while your accountant retains final review.",
    "intro": "The bottleneck in SMSF work is often the production queue before an accountant can review the fund. A dedicated production workflow gets transactions coded, investments reconciled, documents organised, and audit support assembled before professional review.",
    "audience": "smsf accountants, public practice firms and superannuation administration teams",
    "workflows": [
      "open the annual fund job and review the production checklist",
      "collect and organise bank, investment and supporting documents",
      "import or code transactions in the fund accounting platform",
      "reconcile bank balances, investments and transaction activity",
      "prepare supporting schedules and workpapers",
      "record unresolved items and request missing information",
      "assemble supporting documents for accountant review",
      "prepare the completed file and evidence set for audit handoff"
    ],
    "serviceSlugs": [
      "smsf-production-virtual-assistant",
      "bookkeeping",
      "accounting-virtual-assistant",
      "research-data"
    ],
    "tools": [
      "BGL Simple Fund 360",
      "Class Super",
      "Xero",
      "MYOB AccountRight",
      "FYI",
      "Adobe Acrobat"
    ],
    "hiringNotes": [
      "Define the firm's chart-of-account conventions, workpaper templates and escalation rules before assigning production files.",
      "Use reviewer checkpoints for unusual transactions, related-party activity, contribution issues and unreconciled balances.",
      "The appropriately qualified or registered local accountant, tax agent, auditor or adviser retains final approval, advice and compliance responsibility; the Virtual Assistant performs production work only."
    ]
  },
  {
    "slug": "strata-management-administration",
    "clusterSlug": "property-management-companies",
    "label": "Strata Administration",
    "h1": "Keep Every Strata Portfolio Ready for the Next Meeting",
    "primaryKeyword": "strata management administration outsourcing",
    "metaTitle": "Strata Management Administration Support",
    "metaDescription": "Run levy notices, AGM packs, minutes, owner records and arrears follow-up through a dedicated strata administration workflow.",
    "intro": "Strata managers need portfolio information, meeting documents, correspondence, and action lists ready before deadlines arrive. An outsourced administration desk keeps those production tasks moving so managers can focus on committees, disputes, decisions, and portfolio oversight.",
    "audience": "strata managers, owners corporation managers and body corporate management firms",
    "workflows": [
      "review upcoming meetings, levy dates and portfolio deadlines",
      "update owner, committee and scheme records",
      "prepare approved notices, agendas and supporting documents",
      "assemble and quality-check the meeting pack",
      "record attendance, motions and meeting notes supplied by the manager",
      "draft minutes for manager review and approval",
      "issue approved correspondence and update action registers",
      "run authorised arrears reminders and escalate exceptions to the manager"
    ],
    "serviceSlugs": [
      "strata-management-virtual-assistant",
      "real-estate",
      "admin-inbox",
      "bookkeeping"
    ],
    "tools": [
      "StrataMax",
      "MRI Strata Master",
      "PropertyIQ",
      "Urbanise",
      "MYBOS",
      "DocuSign"
    ],
    "hiringNotes": [
      "Set templates and approval rules for notices, minutes, levy correspondence and arrears communications before delegation.",
      "Keep scheme-specific escalation rules visible so disputes, legal issues and sensitive owner matters go straight to the manager.",
      "The licensed, registered or otherwise authorised local strata professional retains final decisions, advice, approvals and compliance responsibility; the Virtual Assistant handles administrative production."
    ]
  },
  {
    "slug": "property-management-maintenance-coordination",
    "clusterSlug": "property-management-companies",
    "label": "Maintenance Coordination",
    "h1": "Move Tenant Maintenance Requests From Inbox to Completion",
    "primaryKeyword": "property management maintenance outsourcing",
    "metaTitle": "Property Management Maintenance Coordination",
    "metaDescription": "Build a maintenance coordination desk for tenant requests, contractor quotes, work orders, follow-ups and PropertyMe or Console updates.",
    "intro": "Property managers should manage owner decisions and tenancy issues, not manually chase every contractor appointment. A maintenance coordination desk moves routine requests from intake through completion while escalating emergencies, approvals, and exceptions to the local manager.",
    "audience": "property managers, real estate agencies and residential portfolio teams",
    "workflows": [
      "receive the tenant request and record the issue in the property system",
      "categorise the request using the agency's urgency and escalation rules",
      "confirm available details, photos and access requirements",
      "request quotes or issue approved work orders to contractors",
      "coordinate appointment times between tenant and contractor",
      "follow up incomplete jobs and update maintenance status",
      "collect completion confirmation and contractor documentation",
      "match invoices to work orders and escalate discrepancies",
      "close the job after manager approval where required"
    ],
    "serviceSlugs": [
      "property-management-maintenance-virtual-assistant",
      "property-management-virtual-assistant",
      "real-estate",
      "customer-service"
    ],
    "tools": [
      "PropertyMe",
      "Console Cloud",
      "Inspection Express",
      "InspectRealEstate",
      "Managed App",
      "Tapi"
    ],
    "hiringNotes": [
      "Create written urgency, spending-limit and preferred-contractor rules so the Virtual Assistant can route routine jobs consistently.",
      "Emergency repairs, disputed responsibility and expenditure outside delegated limits should be escalated immediately.",
      "The licensed or authorised local property professional retains final approval, tenancy advice, expenditure decisions and compliance responsibility; the Virtual Assistant coordinates the workflow."
    ]
  },
  {
    "slug": "allied-health-referral-billing",
    "label": "Allied Health Admin",
    "h1": "Keep Referrals, Billing and Recalls Moving Between Appointments",
    "primaryKeyword": "allied health administration outsourcing",
    "metaTitle": "Allied Health Referral & Billing Support",
    "metaDescription": "Run referral intake, patient administration, billing, recalls and appointment workflows through a dedicated allied health support desk.",
    "intro": "A growing caseload creates administrative work before and after every appointment. A dedicated support desk moves referrals, patient records, billing tasks, and recalls through the practice workflow while clinicians keep control of clinical decisions and patient care.",
    "audience": "physiotherapists, occupational therapists, speech pathologists, psychologists and allied health clinics",
    "workflows": [
      "receive the referral and create or locate the patient record",
      "check that required administrative referral information is present",
      "route incomplete or clinically sensitive referrals for practitioner review",
      "contact the patient and schedule the appropriate appointment type",
      "record referral, plan and administrative expiry dates",
      "prepare billing records after services are confirmed",
      "run approved outstanding-account and rejected-payment follow-ups",
      "generate recall and inactive-patient lists for approved outreach",
      "update the practice system after each administrative action"
    ],
    "serviceSlugs": [
      "allied-health-referral-billing-virtual-assistant",
      "medical-virtual-assistant",
      "phone-receptionist",
      "customer-service"
    ],
    "tools": [
      "Cliniko",
      "Halaxy",
      "Power Diary",
      "Nookal",
      "Tyro Health",
      "Coviu"
    ],
    "hiringNotes": [
      "Document referral types, appointment rules, billing workflows and escalation criteria before the Virtual Assistant handles patient queues.",
      "Limit access according to role and maintain the clinic's privacy, consent and patient-information procedures.",
      "The licensed local clinician or other regulated healthcare professional retains final clinical decisions, advice, treatment approval and compliance responsibility; the Virtual Assistant performs administrative work only."
    ]
  },
  {
    "slug": "trades-service-administration",
    "clusterSlug": "home-local-services",
    "label": "Trades Administration",
    "h1": "Turn Every Service Call Into a Scheduled, Invoiced Job",
    "primaryKeyword": "trades administration outsourcing",
    "metaTitle": "Trades Service Administration Support",
    "metaDescription": "Run job intake, scheduling, technician follow-up and invoicing through ServiceM8, simPRO, AroFlo or Tradify.",
    "intro": "The office workload grows every time another technician goes into the field. A dedicated service administration desk turns calls into jobs, keeps schedules and paperwork current, and pushes completed work toward invoicing while the trade business controls technical decisions.",
    "audience": "electricians, hvac contractors, plumbers, solar installers and field service businesses",
    "workflows": [
      "receive the service request and create the customer or site record",
      "create the job with approved scope and priority information",
      "assign the appropriate technician and schedule the visit",
      "send appointment confirmations and access instructions",
      "monitor schedule changes and update affected customers",
      "check completed jobs for required notes, forms and photos",
      "prepare approved quotes, purchase records or invoice drafts",
      "send authorised invoices and run approved follow-up queues",
      "close the job after required documentation is complete"
    ],
    "serviceSlugs": [
      "trades-service-administration-virtual-assistant",
      "phone-receptionist",
      "customer-service",
      "bookkeeping"
    ],
    "tools": [
      "ServiceM8",
      "simPRO",
      "AroFlo",
      "Tradify",
      "Xero",
      "MYOB"
    ],
    "hiringNotes": [
      "Define service areas, technician skills, booking windows, emergency rules and pricing authorities before delegating scheduling.",
      "Technical faults, safety concerns, scope changes and pricing outside approved rules should be escalated to the business.",
      "The licensed local trade contractor or other regulated professional retains final technical decisions, advice, approvals and compliance responsibility; the Virtual Assistant handles service administration."
    ]
  },
  {
    "slug": "bim-revit-production",
    "clusterSlug": "construction-companies",
    "label": "BIM & Revit",
    "h1": "Expand Your BIM Production Capacity Without Moving Design Authority",
    "primaryKeyword": "bim revit outsourcing",
    "metaTitle": "BIM & Revit Production Outsourcing",
    "metaDescription": "Extend BIM production capacity with Revit modeling, documentation, redline processing, family work and coordination support.",
    "intro": "Design teams often lose senior hours to model housekeeping, sheet production, markups, and repetitive documentation. An outsourced BIM production layer handles that defined production work while architects and engineers retain responsibility for design intent and technical approval.",
    "audience": "architecture practices, structural engineers, mep consultants and bim teams",
    "workflows": [
      "receive the approved brief, model package and bim standards",
      "open or link the current project and consultant models",
      "update model elements according to approved markups",
      "prepare views, sheets, schedules and annotations",
      "create or update approved families and project content",
      "run documented model checks and coordination reviews",
      "prepare navisworks or coordination outputs where required",
      "process returned redlines and revision comments",
      "package the updated model and drawings for professional review"
    ],
    "serviceSlugs": [
      "bim-revit-production-virtual-assistant",
      "project-coordination",
      "research-data",
      "general-virtual-assistant"
    ],
    "tools": [
      "Autodesk Revit",
      "AutoCAD",
      "Navisworks Manage",
      "Autodesk Construction Cloud",
      "Bluebeam Revu",
      "Dynamo"
    ],
    "hiringNotes": [
      "Provide the firm's BIM execution plan, naming standards, templates, family rules and model-sharing procedures before production starts.",
      "Use controlled markups and reviewer checkpoints so design changes are never inferred from incomplete instructions.",
      "The registered architect, licensed engineer or other regulated local professional retains final design authority, technical advice, approval and compliance responsibility; the Virtual Assistant performs documented production work."
    ]
  },
  {
    "slug": "recruitment-candidate-sourcing",
    "label": "Candidate Sourcing",
    "h1": "Keep Recruiter Pipelines Full Before Consultants Start Calling",
    "primaryKeyword": "recruitment candidate sourcing outsourcing",
    "metaTitle": "Recruitment Candidate Sourcing Support",
    "metaDescription": "Build candidate pipelines with LinkedIn sourcing, talent mapping, CRM cleanup, screening administration and interview scheduling.",
    "intro": "Recruiters create the most value when they are qualifying candidates, advising clients, and closing placements. A sourcing desk handles repeatable search, database, outreach, and scheduling work so each consultant starts with a structured candidate pipeline.",
    "audience": "recruitment agencies, executive search firms and talent acquisition teams",
    "workflows": [
      "receive the role brief and approved candidate criteria",
      "build linkedin, database and talent-pool searches",
      "identify prospective candidates and create the longlist",
      "check existing crm records and remove duplicates",
      "add missing candidate data and source information",
      "send approved outreach and record candidate responses",
      "run structured administrative screening questions",
      "route qualified candidates to the recruiter for assessment",
      "schedule recruiter or client interviews and update pipeline stages"
    ],
    "serviceSlugs": [
      "recruitment-candidate-sourcing-virtual-assistant",
      "lead-generation",
      "recruitment-hr",
      "admin-inbox"
    ],
    "tools": [
      "LinkedIn Recruiter",
      "Bullhorn",
      "JobAdder",
      "Vincere",
      "SEEK Talent Search",
      "SourceWhale"
    ],
    "hiringNotes": [
      "Give the sourcing team written role criteria, exclusion rules, outreach templates and CRM stage definitions for each assignment.",
      "Keep candidate consent, privacy, data-retention and equal-opportunity procedures built into the sourcing workflow.",
      "Where employment, immigration, licensing or other regulated decisions apply, the authorised local recruiter, hiring manager or professional retains final selection, advice, approval and compliance responsibility; the Virtual Assistant performs sourcing and administration."
    ]
  },
  {
    "slug": "insurance-broker-renewal-desk",
    "clusterSlug": "insurance-agencies",
    "label": "Insurance Renewals",
    "h1": "Put Every Renewal File in Front of the Broker Ready for Review",
    "primaryKeyword": "insurance broker renewal outsourcing",
    "metaTitle": "Insurance Broker Renewal Desk Support",
    "metaDescription": "Run renewal preparation, client data updates, insurer follow-up, certificate drafting and quote comparison through a dedicated support desk.",
    "intro": "Renewal season becomes a capacity problem when brokers have to collect data, update systems, chase markets, and rebuild comparison material themselves. A renewal desk handles the administrative production around each policy so the broker can focus on coverage decisions and client advice.",
    "audience": "general insurance brokers, commercial brokerages and insurance broking teams",
    "workflows": [
      "generate the upcoming renewal list and confirm file ownership",
      "review existing client and policy data for administrative gaps",
      "send approved requests for updated renewal information",
      "update the broking system with returned client information",
      "prepare insurer submissions using broker-approved instructions",
      "track insurer responses, quotes and outstanding requirements",
      "prepare factual quote comparison schedules for broker review",
      "draft certificates and routine documents from approved policy information",
      "record the broker's approved outcome and complete renewal administration"
    ],
    "serviceSlugs": [
      "insurance-broker-renewal-virtual-assistant",
      "insurance-virtual-assistant",
      "bookkeeping",
      "admin-inbox"
    ],
    "tools": [
      "Ebix WinBEAT",
      "Sunrise Exchange",
      "Steadfast Client Trading Platform",
      "Microsoft Outlook",
      "DocuSign",
      "Adobe Acrobat"
    ],
    "hiringNotes": [
      "Define the brokerage's renewal calendar, insurer submission rules, document templates and escalation points before allocating live renewals.",
      "Quote comparisons prepared by the Virtual Assistant should present factual information without recommending coverage, insurers or policy terms.",
      "The licensed or authorised local insurance broker retains final coverage decisions, recommendations, advice, approvals and compliance responsibility; the Virtual Assistant performs renewal production and administration."
    ]
  }
];

export function industryBySlug(slug: string) { return INDUSTRIES.find((industry) => industry.slug === slug); }
