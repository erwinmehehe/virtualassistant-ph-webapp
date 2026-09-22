export type SeoPriorityLink = {
  href: string;
  label: string;
  description: string;
};

const SERVICES_HUB: SeoPriorityLink = {
  href: "/services",
  label: "Virtual Assistant services",
  description: "Compare role categories and move from a broad workload to the service page that owns the specific hiring intent."
};

const HIRE_HUB: SeoPriorityLink = {
  href: "/hire",
  label: "Hire a Virtual Assistant",
  description: "Turn the workload into a clear hiring brief and start a structured match with vetted Filipino Virtual Assistant candidates."
};

const PRICING_HUB: SeoPriorityLink = {
  href: "/pricing",
  label: "Virtual Assistant pricing",
  description: "Compare direct-hire and managed-service pricing, what is included, and how role scope and hours affect the budget."
};

const COMPANIES_GUIDE: SeoPriorityLink = {
  href: "/blog/virtual-assistant-companies-philippines",
  label: "Virtual Assistant companies in the Philippines",
  description: "Compare agencies, recruiters, marketplaces, and managed providers by hiring model, screening, support, and pricing structure."
};

const OUTSOURCING_GUIDE: SeoPriorityLink = {
  href: "/outsourcing-philippines-virtual-assistant",
  label: "Outsourcing Virtual Assistant work to the Philippines",
  description: "Plan the operating model, role scope, screening, handoff, and management approach before outsourcing recurring work."
};

const RATE_REPORT: SeoPriorityLink = {
  href: "/research/virtual-assistant-rates-philippines-2026",
  label: "2026 Virtual Assistant Rate & Skills Report",
  description: "See anonymized first-party platform data on preferred USD hourly rates, experience, specialties, skills, and tools."
};

const RATE_GUIDE: SeoPriorityLink = {
  href: "/average-hourly-rate-virtual-assistants-philippines",
  label: "Virtual Assistant hourly rates in the Philippines",
  description: "Compare first-party rate context, scope factors, and the difference between a headline rate and the work the role actually owns."
};

const SALARY_GUIDE: SeoPriorityLink = {
  href: "/blog/virtual-assistant-salary-philippines",
  label: "Virtual Assistant salary in the Philippines",
  description: "Compare salary and compensation context separately from hourly pricing so the working arrangement and responsibility level stay clear."
};

const SSS_GUIDE: SeoPriorityLink = {
  href: "/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
  label: "SSS, PhilHealth, and Pag-IBIG for Filipino Virtual Assistants",
  description: "Review the employment and contractor questions clients should resolve before assuming which Philippine benefit obligations apply."
};

const PROJECT_MANAGER_RATES: SeoPriorityLink = {
  href: "/blog/hourly-rates-for-filipino-virtual-project-manager",
  label: "Filipino Virtual Project Manager rates",
  description: "Use project scope, decision ownership, hours, and experience to set a realistic budget for coordination and project-management support."
};

const GET_PAID_GUIDE: SeoPriorityLink = {
  href: "/blog/get-paid-virtual-assistant-philippines",
  label: "How Filipino Virtual Assistants get paid by global clients",
  description: "A candidate-focused guide to payment methods, currency, records, fees, and safer payment setup for international work."
};

const GENERAL_VS_EXECUTIVE: SeoPriorityLink = {
  href: "/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
  label: "General vs Executive Virtual Assistant",
  description: "Compare the two roles by judgment, confidentiality, workflow ownership, proximity to leadership, and escalation responsibility."
};

const DIRECT_PAYMENT: SeoPriorityLink = {
  href: "/blog/how-to-pay-a-filipino-virtual-assistant-directly",
  label: "How to pay a Filipino Virtual Assistant directly",
  description: "Set the rate, currency, invoices, transfer method, fee handling, and worker-classification questions before the first payment."
};

const ECOMMERCE_TASKS: SeoPriorityLink = {
  href: "/blog/ecommerce-tasks",
  label: "Ecommerce Virtual Assistant tasks",
  description: "Turn order, catalog, customer-support, and store-admin work into a clearer role with defined ownership and escalation rules."
};

const CONTENT_MARKETING_GUIDE: SeoPriorityLink = {
  href: "/blog/what-does-a-content-marketing-virtual-assistant-do",
  label: "Content Marketing Virtual Assistant scope",
  description: "Compare content operations, publishing support, reporting, and workflow ownership before combining writing with broader marketing work."
};

const DENTAL_INTERVIEW: SeoPriorityLink = {
  href: "/blog/dental-virtual-assistant-interview-questions",
  label: "Dental Virtual Assistant interview questions",
  description: "Use practical dental workflow scenarios to test communication, tools, quality checks, privacy judgment, and escalation."
};

const DENTAL_COST: SeoPriorityLink = {
  href: "/blog/dental-virtual-assistant-cost-philippines",
  label: "Dental Virtual Assistant cost in the Philippines",
  description: "Plan a dental support budget around patient contact, systems access, coverage hours, billing scope, and experience."
};

const DENTAL_SERVICE: SeoPriorityLink = {
  href: "/service/dental-virtual-assistant",
  label: "Hire a Dental Virtual Assistant",
  description: "Review the role scope, approved talent, responsibilities, tools, and managed hiring process for dental support."
};

const HVAC_HIRING: SeoPriorityLink = {
  href: "/blog/how-to-hire-a-hvac-virtual-assistant",
  label: "HVAC Virtual Assistant hiring guide",
  description: "Define the HVAC workflow, screen for evidence, test live customer and dispatch scenarios, and set escalation boundaries."
};

const HVAC_COST: SeoPriorityLink = {
  href: "/blog/hvac-virtual-assistant-cost-philippines",
  label: "HVAC Virtual Assistant cost in the Philippines",
  description: "Budget HVAC support around call coverage, scheduling, dispatch coordination, tools, seasonality, and responsibility level."
};

const EBAY_HIRING: SeoPriorityLink = {
  href: "/blog/how-to-hire-a-ebay-virtual-assistant",
  label: "eBay Virtual Assistant hiring guide",
  description: "Screen eBay candidates on listing workflows, customer support, order handling, account discipline, and marketplace evidence."
};

const EBAY_COST: SeoPriorityLink = {
  href: "/blog/ebay-virtual-assistant-cost-philippines",
  label: "eBay Virtual Assistant cost in the Philippines",
  description: "Plan an eBay support budget around catalog complexity, order volume, customer service, tools, and marketplace experience."
};

const MEDICAL_SERVICE: SeoPriorityLink = {
  href: "/service/medical-virtual-assistant",
  label: "Hire a Medical Virtual Assistant",
  description: "Review the role scope, approved talent, non-clinical workflows, tools, access boundaries, and managed hiring process."
};

const MEDICAL_COST: SeoPriorityLink = {
  href: "/blog/medical-virtual-assistant-cost-philippines",
  label: "Medical Virtual Assistant cost in the Philippines",
  description: "Plan a medical support budget around workflow complexity, patient contact, privacy requirements, systems, and coverage."
};

const COLD_CALLING_SERVICE: SeoPriorityLink = {
  href: "/service/cold-calling-virtual-assistant",
  label: "Hire a Cold Calling Virtual Assistant",
  description: "Review cold-calling responsibilities, approved talent, coverage, call workflow, QA, and escalation expectations."
};

const COLD_CALLING_COST: SeoPriorityLink = {
  href: "/blog/cold-calling-virtual-assistant-cost-philippines",
  label: "Cold Calling Virtual Assistant cost in the Philippines",
  description: "Budget a calling role around campaign scope, coverage hours, lead volume, tooling, QA, and objection-handling responsibility."
};

export const BLOG_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "average-hourly-rate-virtual-assistants-philippines": [RATE_REPORT],
  "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va": [DIRECT_PAYMENT, RATE_GUIDE, SALARY_GUIDE, PRICING_HUB],
  "dental-virtual-assistant-interview-questions": [DENTAL_COST, DENTAL_SERVICE, HIRE_HUB],
  "medical-virtual-assistant-interview-questions": [MEDICAL_COST, MEDICAL_SERVICE, HIRE_HUB],
  "what-does-a-cold-calling-virtual-assistant-do": [COLD_CALLING_SERVICE, COLD_CALLING_COST, HIRE_HUB],
  "medical-virtual-assistant-cost-philippines": [RATE_REPORT, MEDICAL_SERVICE, PRICING_HUB],
  "virtual-assistant-salary-philippines": [RATE_GUIDE, RATE_REPORT, PRICING_HUB, HIRE_HUB],
  "hire-virtual-assistant-philippines": [RATE_GUIDE, GENERAL_VS_EXECUTIVE, COMPANIES_GUIDE, OUTSOURCING_GUIDE],
  "outsourcing-philippines-virtual-assistant": [SSS_GUIDE, DIRECT_PAYMENT, COMPANIES_GUIDE, HIRE_HUB],
  "philippines-vs-india-virtual-assistants": [SSS_GUIDE, RATE_GUIDE, COMPANIES_GUIDE],
  "virtual-assistant-vs-employee": [SSS_GUIDE, GENERAL_VS_EXECUTIVE, PRICING_HUB],
  "executive-virtual-assistant-cost-philippines": [GENERAL_VS_EXECUTIVE, RATE_GUIDE, PRICING_HUB],
  "what-does-a-real-estate-virtual-assistant-do": [SERVICES_HUB, HIRE_HUB],
  "what-is-a-virtual-medical-assistant": [MEDICAL_SERVICE, HIRE_HUB],
  "what-does-a-shopify-virtual-assistant-do": [SERVICES_HUB, HIRE_HUB],
  "how-to-hire-a-medical-virtual-assistant": [MEDICAL_SERVICE, HIRE_HUB, PRICING_HUB],
  "virtual-assistant-agency-vs-freelancer": [COMPANIES_GUIDE, HIRE_HUB, PRICING_HUB],
  "onlinejobs-ph-vs-virtual-assistant-agency": [COMPANIES_GUIDE, HIRE_HUB],
  "what-does-an-appointment-setter-virtual-assistant-do": [SERVICES_HUB, HIRE_HUB]
};

export const ARCHIVE_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "become-virtual-assistant-no-experience": [GET_PAID_GUIDE],
  "how-to-become-bookkeeping-virtual-assistant": [GET_PAID_GUIDE],
  "get-paid-virtual-assistant-philippines": [SALARY_GUIDE, RATE_GUIDE, SSS_GUIDE],
  "ecommerce-va-vs-in-house-assistant": [RATE_GUIDE, COMPANIES_GUIDE, HIRE_HUB],
  "hourly-rates-for-filipino-virtual-project-manager": [RATE_GUIDE, RATE_REPORT, PRICING_HUB, HIRE_HUB],
  "how-to-pay-a-filipino-virtual-assistant-directly": [RATE_GUIDE, SSS_GUIDE, PRICING_HUB, OUTSOURCING_GUIDE],
  "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines": [RATE_GUIDE, SERVICES_HUB, HIRE_HUB, PRICING_HUB]
};

export const SERVICE_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "project-coordination": [PROJECT_MANAGER_RATES, RATE_GUIDE, PRICING_HUB],
  "operations": [PROJECT_MANAGER_RATES, RATE_GUIDE],
  "general-virtual-assistant": [GENERAL_VS_EXECUTIVE, RATE_GUIDE, SALARY_GUIDE],
  "executive-virtual-assistant": [GENERAL_VS_EXECUTIVE, RATE_GUIDE, SALARY_GUIDE],
  "fulfilment": [ECOMMERCE_TASKS],
  "dental-virtual-assistant": [DENTAL_INTERVIEW, DENTAL_COST],
  "hvac-virtual-assistant": [HVAC_HIRING, HVAC_COST],
  "ebay-virtual-assistant": [EBAY_HIRING, EBAY_COST],
  "transcription": [RATE_GUIDE],
  "travel-lifestyle": [RATE_GUIDE],
  "content-writing": [CONTENT_MARKETING_GUIDE]
};

export function seoPriorityLinksForBlog(slug: string) {
  return BLOG_PRIORITY_LINKS[slug] || [];
}

export function seoPriorityLinksForArchive(slug: string) {
  return ARCHIVE_PRIORITY_LINKS[slug] || [];
}

export function seoPriorityLinksForService(slug: string) {
  return SERVICE_PRIORITY_LINKS[slug] || [];
}
