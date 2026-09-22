import type { Metadata } from "next";
import { SeoHubPage } from "@/components/seo-hub-page";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Australia | Hire Filipino VAs" },
  description: "Hire Filipino Virtual Assistants for Australian businesses. Compare support for admin, accounting, NDIS, SMSF, strata, mortgage, property, trades and more.",
  alternates: { canonical: canonicalPath("/virtual-assistant-australia") }
};

const sections = [
  {
    title: "Virtual Assistants for Australian business hours",
    body: [
      "A Philippines-based Virtual Assistant can be matched for Australian timezone overlap, part-time or full-time coverage, and role-specific experience. The right schedule depends on how much of the work requires live customer, team or supplier interaction.",
      "Use the role brief to define AEST or AEDT overlap, working days, response windows and which tasks can be completed asynchronously."
    ]
  },
  {
    title: "Australian accounting, finance and mortgage support",
    links: [
      { href: "/service/month-end-production-virtual-assistant", label: "Accounting month-end production", description: "Recurring production support for accounting firms." },
      { href: "/service/smsf-production-virtual-assistant", label: "SMSF production support", description: "SMSF administration and production workflows." },
      { href: "/service/mortgage-loan-processing-virtual-assistant", label: "Mortgage loan processing", description: "Loan file, document and broker administration support." },
      { href: "/service/insurance-broker-renewal-virtual-assistant", label: "Insurance broker renewal support", description: "Renewal desk and policy administration workflows." }
    ]
  },
  {
    title: "Property, NDIS, allied health and trades",
    links: [
      { href: "/service/ndis-billing-virtual-assistant", label: "NDIS billing and claims support", description: "Administrative NDIS billing and claims workflows." },
      { href: "/service/strata-management-virtual-assistant", label: "Strata management administration", description: "Strata records, communication and recurring administration." },
      { href: "/service/allied-health-referral-billing-virtual-assistant", label: "Allied health referral and billing support", description: "Non-clinical referral, intake and billing administration." },
      { href: "/service/trades-service-administration-virtual-assistant", label: "Trades service administration", description: "Booking, dispatch, follow-up and service administration." }
    ]
  },
  {
    title: "Construction, recruitment and technical production",
    links: [
      { href: "/service/construction-estimating-virtual-assistant", label: "Construction estimating support", description: "Takeoffs, tender desk and estimating administration." },
      { href: "/service/bim-revit-production-virtual-assistant", label: "BIM and Revit production", description: "Production documentation support under qualified project supervision." },
      { href: "/service/recruitment-candidate-sourcing-virtual-assistant", label: "Recruitment candidate sourcing", description: "Candidate research, ATS updates and sourcing workflows." },
      { href: "/service/it-virtual-assistant", label: "IT Virtual Assistant", description: "Technical coordination, support queues and recurring IT administration." }
    ]
  }
];

export default function Page() {
  return <SeoHubPage
    eyebrow="Australia"
    title="Hire Filipino Virtual Assistants for Australian businesses"
    lede="Build a Philippines-based remote role around Australian business hours, your systems, and the work that needs a dependable owner. Compare general support with specialist Australian workflows such as NDIS, SMSF, strata, mortgage, accounting, property and trades administration."
    sections={sections}
  />;
}
