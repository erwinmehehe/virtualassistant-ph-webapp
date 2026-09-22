import type { Metadata } from "next";
import { SeoHubPage } from "@/components/seo-hub-page";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: { absolute: "What Is a Virtual Assistant? Roles, Tasks, Skills & Cost" },
  description: "Learn what a Virtual Assistant is, what VAs do, common tasks and roles, skills, tools, costs, and when hiring a Filipino Virtual Assistant makes sense.",
  alternates: { canonical: canonicalPath("/what-is-a-virtual-assistant") }
};

const sections = [
  {
    title: "What is a Virtual Assistant?",
    body: [
      "A Virtual Assistant is a remote professional who handles delegated business work such as administration, customer support, marketing operations, sales support, bookkeeping administration, ecommerce, research, scheduling, and industry-specific workflows.",
      "The role can be broad or highly specialized. The useful question is not whether someone is called a Virtual Assistant, but which recurring outcomes, systems, decisions, and response times that person will own."
    ]
  },
  {
    title: "What does a Virtual Assistant do?",
    bullets: [
      "Manage inboxes, calendars, meetings and recurring administration",
      "Update CRMs, follow up leads and coordinate appointments",
      "Handle customer support, reception and service follow-up",
      "Support SEO, social media, email and content operations",
      "Maintain ecommerce listings, orders, customer messages and store admin",
      "Prepare bookkeeping, billing, payroll or finance administration for review",
      "Coordinate real estate, healthcare, legal, recruitment and other specialist workflows"
    ]
  },
  {
    title: "Common Virtual Assistant roles",
    links: [
      { href: "/types-of-virtual-assistants", label: "Types of Virtual Assistants", description: "Compare common VA specialties and when each role fits." },
      { href: "/services", label: "Virtual Assistant services", description: "Browse all current role hiring guides by workload." },
      { href: "/industries", label: "Virtual Assistants by industry", description: "See how delegation changes by business type." }
    ]
  },
  {
    title: "How much does a Virtual Assistant cost?",
    body: [
      "Cost depends on experience, role complexity, hours, live timezone overlap, tools, communication requirements and decision ownership. Specialist work normally costs more than tightly documented routine administration.",
      "Separate the Virtual Assistant's compensation from any recruiting, placement or managed-service fee so you can compare hiring models accurately."
    ],
    links: [
      { href: "/how-much-virtual-assistant-philippines", label: "Virtual Assistant cost guide", description: "Understand the main factors behind Philippines VA pricing." },
      { href: "/research/virtual-assistant-rates-philippines-2026", label: "2026 rate and skills report", description: "See first-party aggregate data from current Filipino VA profiles." }
    ]
  }
];

export default function Page() {
  return <SeoHubPage
    eyebrow="Virtual Assistant guide"
    title="What is a Virtual Assistant?"
    lede="A Virtual Assistant is a remote professional who takes ownership of defined business workflows. The strongest roles are built around recurring outcomes, clear systems, decision boundaries and measurable follow-through rather than a miscellaneous list of errands."
    sections={sections}
  />;
}
