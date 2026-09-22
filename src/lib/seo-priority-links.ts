export type SeoPriorityLink = {
  href: string;
  label: string;
  description: string;
};

const RATE_GUIDE: SeoPriorityLink = {
  href: "/average-hourly-rate-virtual-assistants-philippines",
  label: "Virtual Assistant hourly rates in the Philippines",
  description: "Compare first-party rate context, scope factors, and the difference between a headline rate and the work the role actually owns."
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

export const BLOG_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "virtual-assistant-salary-philippines": [RATE_GUIDE, DIRECT_PAYMENT],
  "hire-virtual-assistant-philippines": [RATE_GUIDE, GENERAL_VS_EXECUTIVE],
  "outsourcing-philippines-virtual-assistant": [SSS_GUIDE, DIRECT_PAYMENT],
  "philippines-vs-india-virtual-assistants": [SSS_GUIDE, RATE_GUIDE],
  "virtual-assistant-vs-employee": [SSS_GUIDE, GENERAL_VS_EXECUTIVE],
  "executive-virtual-assistant-cost-philippines": [GENERAL_VS_EXECUTIVE, RATE_GUIDE]
};

export const ARCHIVE_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "become-virtual-assistant-no-experience": [GET_PAID_GUIDE],
  "how-to-become-bookkeeping-virtual-assistant": [GET_PAID_GUIDE],
  "ecommerce-va-vs-in-house-assistant": [RATE_GUIDE],
  "hourly-rates-for-filipino-virtual-project-manager": [RATE_GUIDE],
  "how-to-pay-a-filipino-virtual-assistant-directly": [RATE_GUIDE, SSS_GUIDE],
  "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines": [RATE_GUIDE]
};

export const SERVICE_PRIORITY_LINKS: Record<string, SeoPriorityLink[]> = {
  "project-coordination": [PROJECT_MANAGER_RATES, RATE_GUIDE],
  "operations": [PROJECT_MANAGER_RATES, RATE_GUIDE],
  "general-virtual-assistant": [GENERAL_VS_EXECUTIVE, RATE_GUIDE],
  "executive-virtual-assistant": [GENERAL_VS_EXECUTIVE, RATE_GUIDE],
  "fulfilment": [ECOMMERCE_TASKS],
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
