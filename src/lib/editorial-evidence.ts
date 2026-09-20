import type { BlogPost } from "@/lib/blog-types";

export const MARKETPLACE_SNAPSHOT = {
  asOf: "2026-09-20",
  approvedBenchProfiles: 101,
  shortlistRows: 444,
  shortlistJobs: 58,
  shortlistCandidates: 69,
  medianYearsExperience: 3,
  experienceSample: 85,
  medianWeeklyHours: 40,
  weeklyHoursSample: 83,
  medianOverlapHours: 4,
  overlapSample: 67,
  // No structured candidate rejection-reason records exist yet. Do not publish
  // observed rejection-reason claims until a structured, reviewable source exists.
  candidateRejectionRecords: 0,
  candidateTools: {
    Canva: 40,
    "Google Workspace": 34,
    Slack: 20,
    Zoom: 14,
    "Microsoft Office": 9,
    ChatGPT: 8,
    "Microsoft Teams": 8,
    Salesforce: 7,
    ClickUp: 6,
    "Google Drive": 6,
    Notion: 6,
    Outlook: 6,
    Shopify: 6,
    Zendesk: 6
  },
  candidateSkills: {
    "Customer Support": 20,
    "Calendar Management": 17,
    "Data Entry": 17,
    "Email Management": 14,
    "Administrative Support": 10,
    "Social Media Management": 10,
    "Customer Service": 9,
    "Attention To Detail": 6,
    "Lead Generation": 6
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
    },
    {
      value: `${MARKETPLACE_SNAPSHOT.candidateTools.Canva} profiles`,
      label: `listed Canva among self-reported tools; Google Workspace appeared on ${MARKETPLACE_SNAPSHOT.candidateTools["Google Workspace"]} approved/bench profiles and Slack on ${MARKETPLACE_SNAPSHOT.candidateTools.Slack}`
    },
    {
      value: `${MARKETPLACE_SNAPSHOT.candidateSkills["Customer Support"]} profiles`,
      label: `listed Customer Support among normalized self-reported skills; Calendar Management and Data Entry each appeared on ${MARKETPLACE_SNAPSHOT.candidateSkills["Calendar Management"]} approved/bench profiles`
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
    note: "Snapshot from VirtualAssistant.com.ph platform records. Candidate experience, availability, tools and skills are self-reported and optional fields are not complete for every profile. Tool and skill labels are normalized only where stated. These figures describe this platform snapshot, not a market-wide survey of Filipino virtual assistants."
  };
}
