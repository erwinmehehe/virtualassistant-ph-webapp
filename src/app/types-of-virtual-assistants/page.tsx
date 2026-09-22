import type { Metadata } from "next";
import { SeoHubPage } from "@/components/seo-hub-page";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: { absolute: "Types of Virtual Assistants | Roles, Niches & Specialties" },
  description: "Compare types of Virtual Assistants, VA niches and specialties across admin, executive, marketing, sales, ecommerce, finance, healthcare, legal and more.",
  alternates: { canonical: canonicalPath("/types-of-virtual-assistants") }
};

const sections = [
  {
    title: "Administrative and executive support",
    links: [
      { href: "/service/admin-inbox", label: "Administrative Virtual Assistant", description: "Inbox, calendar, records, research and recurring admin workflows." },
      { href: "/service/executive-virtual-assistant", label: "Executive Virtual Assistant", description: "High-trust calendar, inbox, meeting and leadership support." },
      { href: "/service/personal-assistant", label: "Personal Assistant", description: "Scheduling, coordination and recurring personal or business administration." }
    ]
  },
  {
    title: "Marketing and growth",
    links: [
      { href: "/service/digital-marketing-virtual-assistant", label: "Digital Marketing Virtual Assistant", description: "Campaign execution, reporting and marketing operations." },
      { href: "/service/seo", label: "SEO Virtual Assistant", description: "Keyword research, on-page optimization, content operations and reporting." },
      { href: "/service/social-media", label: "Social Media Virtual Assistant", description: "Scheduling, community support, asset coordination and reporting." },
      { href: "/service/email-marketing", label: "Email Marketing Virtual Assistant", description: "Campaign builds, lists, QA, automation support and reporting." }
    ]
  },
  {
    title: "Sales, customer service and front desk",
    links: [
      { href: "/service/sales-virtual-assistant", label: "Sales Virtual Assistant", description: "CRM updates, follow-up, prospecting and sales administration." },
      { href: "/service/lead-generation", label: "Lead Generation Virtual Assistant", description: "Prospect research, list building, enrichment and outreach support." },
      { href: "/service/customer-service", label: "Customer Service Virtual Assistant", description: "Inbox, chat, ticket and customer follow-up workflows." },
      { href: "/service/phone-receptionist", label: "Virtual Receptionist", description: "Calls, scheduling, routing and front-desk support." }
    ]
  },
  {
    title: "Finance, ecommerce and specialist roles",
    links: [
      { href: "/service/bookkeeping", label: "Bookkeeping Virtual Assistant", description: "Transaction processing, reconciliations and bookkeeping administration." },
      { href: "/service/accounting-virtual-assistant", label: "Accounting Virtual Assistant", description: "Month-end support, finance operations and accounting administration." },
      { href: "/service/ecommerce", label: "Ecommerce Virtual Assistant", description: "Orders, listings, customer support and store operations." },
      { href: "/services", label: "Browse all VA specialties", description: "See every current role guide across healthcare, legal, real estate, creative, technical and industry-specific work." }
    ]
  }
];

export default function Page() {
  return <SeoHubPage
    eyebrow="VA roles and niches"
    title="Types of Virtual Assistants: roles, niches and specialties"
    lede="Virtual Assistants range from broad administrative generalists to highly specialized professionals supporting a specific workflow, software stack or industry. Use the workload—not just the job title—to choose the right type."
    sections={sections}
  />;
}
