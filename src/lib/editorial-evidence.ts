import type { BlogPost } from "@/lib/blog-types";

export const MARKETPLACE_SNAPSHOT = {
  asOf: "2026-09-20",
  approvedBenchProfiles: 101,
  publicDirectoryProfiles: 97,
  shortlistRows: 521,
  shortlistJobs: 69,
  shortlistCandidates: 69,
  medianYearsExperience: 3,
  experienceSample: 94,
  medianWeeklyHours: 40,
  weeklyHoursSample: 93,
  medianOverlapHours: 4,
  overlapSample: 81,
  candidateTools: {
    Canva: 42,
    "Google Workspace": 37,
    Slack: 21,
    Zoom: 14,
    ChatGPT: 10,
    HubSpot: 7,
    Salesforce: 7,
    Zendesk: 7,
    Shopify: 6,
    WordPress: 6
  },
  jobCategoryCounts: {
    "Administrative Support": 35,
    "Lead Generation & Sales": 18,
    "Customer Service": 10,
    "Marketing & Social Media": 8,
    "Dental & Healthcare": 5,
    "Bookkeeping & Finance": 3,
    SEO: 3,
    Ecommerce: 2,
    "Real Estate": 2,
    "Executive Assistance": 1
  }
} as const;

type EvidenceItem = { value: string; label: string };
export type MarketplaceEvidence = {
  asOf: string;
  items: EvidenceItem[];
  note: string;
};

const roleDemand: Record<string, { category: keyof typeof MARKETPLACE_SNAPSHOT.jobCategoryCounts; label: string }> = {
  bookkeeping: { category: "Bookkeeping & Finance", label: "bookkeeping and finance jobs" },
  "executive-virtual-assistant": { category: "Executive Assistance", label: "executive-assistance jobs" },
  "medical-virtual-assistant": { category: "Dental & Healthcare", label: "dental and healthcare jobs" },
  "real-estate": { category: "Real Estate", label: "real-estate jobs" },
  ecommerce: { category: "Ecommerce", label: "ecommerce jobs" },
  "amazon-virtual-assistant": { category: "Ecommerce", label: "ecommerce jobs, the closest current marketplace category for Amazon work" },
  "lead-generation": { category: "Lead Generation & Sales", label: "lead-generation and sales jobs" },
  "customer-service": { category: "Customer Service", label: "customer-service jobs" },
  seo: { category: "SEO", label: "SEO jobs" }
};

export function marketplaceEvidenceForPost(post: Pick<BlogPost, "serviceSlug" | "topic">): MarketplaceEvidence {
  const items: EvidenceItem[] = [
    {
      value: String(MARKETPLACE_SNAPSHOT.approvedBenchProfiles),
      label: "candidate profiles were in approved or bench stages in our vetting records"
    },
    {
      value: `${MARKETPLACE_SNAPSHOT.medianYearsExperience} years`,
      label: `median self-reported experience among ${MARKETPLACE_SNAPSHOT.experienceSample} profiles that supplied an experience value`
    },
    {
      value: `${MARKETPLACE_SNAPSHOT.medianWeeklyHours} hrs/week`,
      label: `median stated availability among ${MARKETPLACE_SNAPSHOT.weeklyHoursSample} profiles that supplied weekly hours`
    }
  ];

  if (post.serviceSlug && roleDemand[post.serviceSlug]) {
    const signal = roleDemand[post.serviceSlug];
    items.push({
      value: String(MARKETPLACE_SNAPSHOT.jobCategoryCounts[signal.category]),
      label: `${signal.label} in the current job records used for this snapshot`
    });
  } else {
    items.push({
      value: `${MARKETPLACE_SNAPSHOT.shortlistRows} / ${MARKETPLACE_SNAPSHOT.shortlistJobs}`,
      label: "shortlist-candidate rows across jobs in the matching workflow"
    });
  }

  return {
    asOf: MARKETPLACE_SNAPSHOT.asOf,
    items,
    note: "Snapshot from VirtualAssistant.com.ph platform records. Candidate experience, availability, tools and some profile fields are self-reported and optional fields are not complete for every profile. These figures describe this platform snapshot, not a market-wide survey of Filipino virtual assistants."
  };
}
