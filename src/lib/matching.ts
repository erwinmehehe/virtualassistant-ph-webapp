import type { VaProfile } from "./types";

type JobLike = {
  categories?: string[] | null;
  required_skills?: string[] | null;
  required_tools?: string[] | null;
  must_have_skills?: string[] | null;
  nice_to_have_skills?: string[] | null;
  must_have_tools?: string[] | null;
  required_industries?: string[] | null;
  minimum_years_experience?: number | null;
  hours_per_week?: number | null;
  overlap_hours?: number | null;
  max_hourly_rate?: number | null;
  communication_requirement?: string | null;
  dealbreakers?: string[] | null;
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

function normalizedSet(values: string[] | null | undefined) {
  return new Set((values ?? []).map(normalize).filter(Boolean));
}

function overlapRatio(required: string[] | null | undefined, supplied: string[] | null | undefined) {
  const need = (required ?? []).map(normalize).filter(Boolean);
  if (!need.length) return { pointsRatio: 0, assessed: false, matched: [] as string[], missing: [] as string[] };
  const have = normalizedSet(supplied);
  const matched = need.filter((item) => have.has(item));
  const missing = need.filter((item) => !have.has(item));
  return { pointsRatio: matched.length / need.length, assessed: true, matched, missing };
}

function missingHardRequirements(required: string[] | null | undefined, supplied: string[] | null | undefined) {
  return overlapRatio(required, supplied).missing;
}

export function matchAssessment(job: JobLike, va: Partial<VaProfile>) {
  const hardFailures: string[] = [];
  const evidenceGaps: string[] = [];

  const missingSkills = missingHardRequirements(job.must_have_skills, va.skills);
  if (missingSkills.length) hardFailures.push(`Missing must-have skill${missingSkills.length === 1 ? "" : "s"}: ${missingSkills.join(", ")}`);

  const missingTools = missingHardRequirements(job.must_have_tools, va.tools);
  if (missingTools.length) hardFailures.push(`Missing required tool${missingTools.length === 1 ? "" : "s"}: ${missingTools.join(", ")}`);

  const missingIndustries = missingHardRequirements(job.required_industries, va.industries);
  if (missingIndustries.length) hardFailures.push(`Missing required industry experience: ${missingIndustries.join(", ")}`);

  if (job.minimum_years_experience != null && Number(va.years_experience ?? 0) < job.minimum_years_experience) {
    hardFailures.push(`Needs at least ${job.minimum_years_experience} year${job.minimum_years_experience === 1 ? "" : "s"} of experience`);
  }
  if (job.hours_per_week && Number(va.weekly_hours ?? 0) < job.hours_per_week) {
    hardFailures.push(`Needs ${job.hours_per_week} hrs/week; profile shows ${Number(va.weekly_hours ?? 0)}`);
  }
  if (job.max_hourly_rate != null && va.hourly_rate != null && Number(va.hourly_rate) > Number(job.max_hourly_rate)) {
    hardFailures.push(`Rate is above the client's USD ${Number(job.max_hourly_rate).toFixed(2)}/hr ceiling`);
  }

  if (job.communication_requirement?.trim()) evidenceGaps.push(`Verify communication requirement: ${job.communication_requirement.trim()}`);
  if ((job.dealbreakers ?? []).length) evidenceGaps.push(`Recruiter must verify dealbreakers: ${(job.dealbreakers ?? []).join(", ")}`);
  let score = 0;
  let assessedWeight = 0;
  const totalWeight = 100;

  const jobCategories = normalizedSet(job.categories);
  const vaCategories = [va.primary_category, ...(va.categories ?? [])].filter(Boolean).map((x) => normalize(String(x)));
  if (jobCategories.size) {
    assessedWeight += 30;
    if (vaCategories.some((x) => jobCategories.has(x))) score += 30;
  }

  const skills = overlapRatio(job.required_skills, va.skills);
  if (skills.assessed) { assessedWeight += 25; score += Math.round(skills.pointsRatio * 25); }

  const tools = overlapRatio(job.required_tools, va.tools);
  if (tools.assessed) { assessedWeight += 15; score += Math.round(tools.pointsRatio * 15); }

  const niceSkills = overlapRatio(job.nice_to_have_skills, va.skills);
  if (niceSkills.assessed) { assessedWeight += 10; score += Math.round(niceSkills.pointsRatio * 10); }

  if (job.hours_per_week) {
    assessedWeight += 10;
    if (va.weekly_hours != null && va.weekly_hours >= job.hours_per_week) score += 10;
  }

  const normalizedScore = assessedWeight ? Math.round((score / assessedWeight) * totalWeight) : 0;
  const eligible = hardFailures.length === 0;
  return {
    score: eligible ? Math.min(normalizedScore, 100) : 0,
    rawScore: Math.min(normalizedScore, 100),
    confidence: Math.round((assessedWeight / totalWeight) * 100),
    assessedWeight,
    eligible,
    hardFailures,
    evidenceGaps
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

// Client-facing fit stays qualitative while recruiter scoring remains internal.
export function clientMatchLabel(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Good fit";
  return "Potential fit";
}
