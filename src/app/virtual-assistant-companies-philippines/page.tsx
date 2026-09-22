import type { Metadata } from "next";
import { SeoHubPage } from "@/components/seo-hub-page";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Companies Philippines | How to Compare" },
  description: "Compare Virtual Assistant companies in the Philippines by hiring model, vetting, pricing structure, support, replacement terms, specialization and client control.",
  alternates: { canonical: canonicalPath("/virtual-assistant-companies-philippines") }
};

const sections = [
  {
    title: "What counts as a Virtual Assistant company?",
    body: [
      "The label can describe very different businesses: recruiting agencies, managed-service providers, direct-hire recruiters, staffing firms, open marketplaces, and outsourcing companies. Compare the operating model before comparing price.",
      "A useful shortlist should make clear who recruits the Virtual Assistant, who manages the employment or contractor relationship, how candidates are screened, how replacements work, and what the client controls after placement."
    ]
  },
  {
    title: "How to compare VA companies",
    bullets: [
      "Role-specific screening instead of generic profile approval",
      "Clear distinction between Virtual Assistant compensation and agency or service fees",
      "Documented replacement, recovery, and support terms",
      "Real candidate profiles, skills, tools, availability, and work evidence",
      "Timezone and schedule matching for US, Australian, UK, or other business hours",
      "Defined data-access, confidentiality, and account-security practices"
    ]
  },
  {
    title: "Agency, marketplace or direct hire?",
    body: [
      "A marketplace gives you the broadest candidate pool but usually puts more sourcing, screening, interviewing, onboarding, and replacement work on your team. A recruiting agency narrows the pool and can coordinate screening and interviews. A managed service remains involved after the person starts.",
      "Choose the model around the amount of hiring and operating support you actually need, not around a single advertised hourly rate."
    ],
    links: [
      { href: "/managed-vs-direct-hire", label: "Managed vs direct hire", description: "Compare the two hiring models on control, support and ongoing responsibility." },
      { href: "/how-vetting-works", label: "How our vetting works", description: "See what happens before a candidate is approved for client presentation." }
    ]
  },
  {
    title: "What to verify before choosing a provider",
    bullets: [
      "The exact responsibilities the provider will screen for",
      "Whether candidate rates are visible and how fees are calculated",
      "Who owns onboarding, day-to-day management and performance follow-up",
      "How access to client systems is handled",
      "What happens if the first placement is not a fit",
      "Whether the provider has relevant talent for your industry and software stack"
    ],
    links: [
      { href: "/pricing", label: "Virtual Assistant pricing", description: "See how our current managed and direct-hire pricing structure works." },
      { href: "/services", label: "Virtual Assistant services", description: "Browse role-specific hiring guides and service categories." }
    ]
  }
];

export default function Page() {
  return <SeoHubPage
    eyebrow="Provider comparison"
    title="How to compare Virtual Assistant companies in the Philippines"
    lede="Virtual Assistant companies can look similar in search results while using very different recruiting, pricing, screening and support models. Compare the operating model first, then decide which provider fits the work you need delegated."
    sections={sections}
  />;
}
