import type { VaProfile } from "./types";

type JobLike = {
  title?: string | null;
  summary?: string | null;
  responsibilities?: string[] | null;
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
  "search engine optimization": "seo",
  "customer support": "customer service",
  "customer success support": "customer service",
  "email support": "customer service",
  "executive assistant": "executive assistance",
  "executive support": "executive assistance",
  "administrative assistant": "administrative support",
  "admin assistant": "administrative support",
  "general virtual assistant": "administrative support",
  "general va": "administrative support",
  "appointment scheduling": "appointment setting",
  "calendar scheduling": "calendar management",
  "social media": "social media management",
  "social media marketing": "social media management",
  "book keeper": "bookkeeping",
  "book keeping": "bookkeeping",
  "bookkeeper": "bookkeeping",
  "accounts payable and receivable": "bookkeeping",
  "lead gen": "lead generation",
  "prospecting": "lead generation",
  "real estate assistant": "real estate",
  "property management assistant": "property management",
  "e commerce": "ecommerce",
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

const ROLE_STOP_WORDS = new Set([
  "virtual",
  "assistant",
  "va",
  "remote",
  "philippines",
  "filipino",
  "full",
  "time",
  "part",
  "senior",
  "junior",
  "specialist",
  "expert",
  "staff",
  "needed",
  "hiring",
]);

function baseNormalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string) {
  let normalized = baseNormalize(value);
  if (!normalized) return "";

  const aliases = Object.entries(TAXONOMY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonical] of aliases) {
    const escaped = alias.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    normalized = normalized.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "g"), (_match, prefix: string) => `${prefix}${canonical}`);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function phraseContained(needle: string, haystack: string) {
  if (!needle || !haystack) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

function termsMatch(required: string, supplied: string) {
  const need = normalize(required);
  const have = normalize(supplied);
  if (!need || !have) return false;
  if (need === have) return true;

  // Match complete canonical phrases inside richer evidence, e.g. "seo"
  // inside "technical seo" or "hubspot" inside "hubspot crm automation".
  return phraseContained(need, have) || phraseContained(have, need);
}

function normalizedValues(values: string[] | null | undefined) {
  return (values ?? []).map(normalize).filter(Boolean);
}

function overlapRatio(required: string[] | null | undefined, supplied: string[] | null | undefined) {
  const need = normalizedValues(required);
  if (!need.length) return { pointsRatio: 0, assessed: false, matched: [] as string[], missing: [] as string[] };

  const have = normalizedValues(supplied);
  const matched = need.filter((item) => have.some((candidate) => termsMatch(item, candidate)));
  const missing = need.filter((item) => !have.some((candidate) => termsMatch(item, candidate)));
  return { pointsRatio: matched.length / need.length, assessed: true, matched, missing };
}

function missingHardRequirements(required: string[] | null | undefined, supplied: string[] | null | undefined) {
  return overlapRatio(required, supplied).missing;
}

function roleTokens(value: string | null | undefined) {
  return normalize(String(value || ""))
    .split(" ")
    .filter((token) => token.length >= 2 && !ROLE_STOP_WORDS.has(token));
}

function roleIdentityFit(job: JobLike, va: Partial<VaProfile>) {
  const title = normalize(String(job.title || ""));
  const titleTokens = [...new Set(roleTokens(job.title))];
  if (!titleTokens.length) {
    return { assessed: false, pointsRatio: 0, matchedKeywords: [] as string[] };
  }

  const roleSources = [
    va.headline,
    va.primary_category,
    ...(va.categories ?? []),
    ...(va.skills ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalize(String(value)))
    .filter(Boolean);

  let best = 0;
  for (const source of roleSources) {
    if (source === title) {
      best = 1;
      break;
    }

    const sourceTokens = new Set(roleTokens(source));
    const shared = titleTokens.filter((token) => sourceTokens.has(token));
    if (shared.length && (phraseContained(title, source) || phraseContained(source, title))) {
      best = Math.max(best, 0.95);
    }
  }

  const sourceTokenSet = new Set(roleSources.flatMap((source) => roleTokens(source)));
  const matchedKeywords = titleTokens.filter((token) => sourceTokenSet.has(token));
  const keywordRecall = matchedKeywords.length / titleTokens.length;
  best = Math.max(best, keywordRecall);

  return {
    assessed: true,
    pointsRatio: Math.max(0, Math.min(1, best)),
    matchedKeywords,
  };
}

function categoryFit(job: JobLike, va: Partial<VaProfile>) {
  const need = normalizedValues(job.categories);
  if (!need.length) return { assessed: false, matched: false };

  const supplied = [va.primary_category, ...(va.categories ?? [])]
    .filter(Boolean)
    .map((value) => normalize(String(value)))
    .filter(Boolean);

  return {
    assessed: true,
    matched: need.some((category) => supplied.some((candidate) => termsMatch(category, candidate))),
  };
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
    evidenceGaps.push(`Experience is below the stated preference: role asks ${job.minimum_years_experience} year${job.minimum_years_experience === 1 ? "" : "s"}; profile shows ${Number(va.years_experience ?? 0)}`);
  }
  if (job.max_hourly_rate != null && va.hourly_rate != null && Number(va.hourly_rate) > Number(job.max_hourly_rate)) {
    evidenceGaps.push(`Rate is above the stated client budget: USD ${Number(va.hourly_rate).toFixed(2)}/hr vs USD ${Number(job.max_hourly_rate).toFixed(2)}/hr`);
  }

  if (job.communication_requirement?.trim()) evidenceGaps.push(`Verify communication requirement: ${job.communication_requirement.trim()}`);
  if ((job.dealbreakers ?? []).length) evidenceGaps.push(`Recruiter must verify dealbreakers: ${(job.dealbreakers ?? []).join(", ")}`);

  let score = 0;
  let assessedWeight = 0;
  const totalWeight = 100;

  // Role identity is the strongest ranking signal. A title such as "SEO
  // Virtual Assistant" should rank an SEO VA above a generic admin profile
  // even when both profiles have a few overlapping generic skills.
  const roleMatch = roleIdentityFit(job, va);
  if (roleMatch.assessed) {
    assessedWeight += 35;
    score += Math.round(roleMatch.pointsRatio * 35);
  }

  const categoryMatch = categoryFit(job, va);
  if (categoryMatch.assessed) {
    assessedWeight += 20;
    if (categoryMatch.matched) score += 20;
  }

  const skills = overlapRatio(job.required_skills, va.skills);
  if (skills.assessed) {
    assessedWeight += 25;
    score += Math.round(skills.pointsRatio * 25);
  }

  const tools = overlapRatio(job.required_tools, va.tools);
  if (tools.assessed) {
    assessedWeight += 10;
    score += Math.round(tools.pointsRatio * 10);
  }

  const niceSkills = overlapRatio(job.nice_to_have_skills, va.skills);
  if (niceSkills.assessed) {
    assessedWeight += 5;
    score += Math.round(niceSkills.pointsRatio * 5);
  }

  if (job.hours_per_week) {
    assessedWeight += 5;
    if (va.weekly_hours != null) {
      const hoursFit = Math.max(0, Math.min(1, Number(va.weekly_hours) / Number(job.hours_per_week)));
      score += Math.round(hoursFit * 5);
    }
  }

  const normalizedScore = assessedWeight ? Math.round((score / assessedWeight) * totalWeight) : 0;
  const eligible = hardFailures.length === 0;

  return {
    score: eligible ? Math.min(normalizedScore, 100) : 0,
    rawScore: Math.min(normalizedScore, 100),
    confidence: Math.min(100, Math.round((assessedWeight / totalWeight) * 100)),
    assessedWeight,
    eligible,
    hardFailures,
    evidenceGaps,
    roleMatch,
    categoryMatched: categoryMatch.matched,
    matchedSkills: skills.matched,
    matchedTools: tools.matched,
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
