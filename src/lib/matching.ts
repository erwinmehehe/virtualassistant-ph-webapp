import type { VaProfile } from "./types";

type JobLike = {
  categories?: string[] | null;
  required_skills?: string[] | null;
  required_tools?: string[] | null;
  hours_per_week?: number | null;
  overlap_hours?: number | null;
};

const TAXONOMY_ALIASES: Record<string, string> = {
  "customer support": "customer service",
  "customer success support": "customer service",
  "email support": "customer service",
  "appointment scheduling": "appointment setting",
  "calendar scheduling": "calendar management",
  "social media": "social media management",
  "social media marketing": "social media management",
  "book keeping": "bookkeeping",
  "accounts payable and receivable": "bookkeeping",
  "lead gen": "lead generation",
  "prospecting": "lead generation",
  "g suite": "google workspace",
  "google suite": "google workspace",
  "microsoft 365": "microsoft office",
  "office 365": "microsoft office",
  "ms office": "microsoft office",
  "quickbooks online": "quickbooks",
  "wordpress cms": "wordpress",
  "hubspot crm": "hubspot",
  "salesforce crm": "salesforce"
};

function normalize(value: string) {
  const normalized = value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return TAXONOMY_ALIASES[normalized] ?? normalized;
}

function overlapRatio(required: string[] | null | undefined, supplied: string[] | null | undefined) {
  const need = (required ?? []).map(normalize).filter(Boolean);
  if (!need.length) return { pointsRatio: 0, assessed: false };
  const have = new Set((supplied ?? []).map(normalize).filter(Boolean));
  const matched = need.filter((item) => have.has(item)).length;
  return { pointsRatio: matched / need.length, assessed: true };
}

export function matchAssessment(job: JobLike, va: Partial<VaProfile>) {
  let score = 0;
  let assessedWeight = 0;
  const totalWeight = 100;

  const jobCategories = new Set((job.categories ?? []).map(normalize).filter(Boolean));
  const vaCategories = [va.primary_category, ...(va.categories ?? [])].filter(Boolean).map((x) => normalize(String(x)));
  if (jobCategories.size) {
    assessedWeight += 35;
    if (vaCategories.some((x) => jobCategories.has(x))) score += 35;
  }

  const skills = overlapRatio(job.required_skills, va.skills);
  if (skills.assessed) { assessedWeight += 25; score += Math.round(skills.pointsRatio * 25); }

  const tools = overlapRatio(job.required_tools, va.tools);
  if (tools.assessed) { assessedWeight += 15; score += Math.round(tools.pointsRatio * 15); }

  if (job.hours_per_week) {
    assessedWeight += 15;
    if (va.weekly_hours != null && va.weekly_hours >= job.hours_per_week) score += 15;
  }

  if (job.overlap_hours) {
    assessedWeight += 10;
    if (va.overlap_hours != null && va.overlap_hours >= job.overlap_hours) score += 10;
  }

  const normalizedScore = assessedWeight ? Math.round((score / assessedWeight) * totalWeight) : 0;
  return {
    score: Math.min(normalizedScore, 100),
    confidence: Math.round((assessedWeight / totalWeight) * 100),
    assessedWeight
  };
}

export function matchScore(job: JobLike, va: Partial<VaProfile>) {
  return matchAssessment(job, va).score;
}

export function matchLabel(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Good fit";
  if (score >= 40) return "Potential fit";
  return "Review fit";
}
