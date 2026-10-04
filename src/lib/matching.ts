import type { VaProfile } from "./types";

export type VerifiedTrainingEvidence = {
  courseTitle: string;
  courseSlug?: string | null;
  credentialCode?: string | null;
};

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
    return { assessed: false, pointsRatio: 0, matchedKeywords: [] as string[], strongestSource: null as string | null };
  }

  const weightedSources = [
    { source: va.headline, weight: 1, label: "headline" },
    { source: va.primary_category, weight: 0.95, label: "primary category" },
    ...(va.categories ?? []).map((source) => ({ source, weight: 0.6, label: "additional category" })),
    ...(va.skills ?? []).map((source) => ({ source, weight: 0.5, label: "skill" })),
  ]
    .filter((item) => Boolean(item.source))
    .map((item) => ({ ...item, normalized: normalize(String(item.source)) }))
    .filter((item) => Boolean(item.normalized));

  let best = 0;
  let strongestSource: string | null = null;
  for (const item of weightedSources) {
    let sourceFit = 0;
    if (item.normalized === title) {
      sourceFit = 1;
    } else {
      const sourceTokens = new Set(roleTokens(item.normalized));
      const shared = titleTokens.filter((token) => sourceTokens.has(token));
      if (shared.length && (phraseContained(title, item.normalized) || phraseContained(item.normalized, title))) {
        sourceFit = 0.95;
      } else if (shared.length) {
        sourceFit = shared.length / titleTokens.length;
      }
    }

    const weightedFit = sourceFit * item.weight;
    if (weightedFit > best) {
      best = weightedFit;
      strongestSource = item.label;
    }
  }

  const sourceTokenSet = new Set(weightedSources.flatMap((item) => roleTokens(item.normalized)));
  const matchedKeywords = titleTokens.filter((token) => sourceTokenSet.has(token));

  return {
    assessed: true,
    pointsRatio: Math.max(0, Math.min(1, best)),
    matchedKeywords,
    strongestSource,
  };
}

function categoryFit(job: JobLike, va: Partial<VaProfile>) {
  const need = normalizedValues(job.categories);
  if (!need.length) return { assessed: false, matched: false, pointsRatio: 0 };

  const primary = normalize(String(va.primary_category || ""));
  const secondary = normalizedValues(va.categories).filter((value) => value !== primary);
  const primaryMatched = Boolean(primary) && need.some((category) => termsMatch(category, primary));
  const secondaryMatched = need.some((category) => secondary.some((candidate) => termsMatch(category, candidate)));

  return {
    assessed: true,
    matched: primaryMatched || secondaryMatched,
    pointsRatio: primaryMatched ? 1 : secondaryMatched ? 0.7 : 0,
  };
}

function verifiedTrainingFit(job: JobLike, evidence: VerifiedTrainingEvidence[]) {
  const normalizedEvidence = evidence
    .map((credential) => ({
      ...credential,
      searchable: normalize(`${credential.courseTitle} ${credential.courseSlug || ""}`),
    }))
    .filter((credential) => Boolean(credential.searchable));

  if (!normalizedEvidence.length) {
    return {
      assessed: false,
      bonus: 0,
      matchedTools: [] as string[],
      matchedSkills: [] as string[],
      matchedCategories: [] as string[],
      matchedRoleKeywords: [] as string[],
      matchedCourseTitles: [] as string[],
    };
  }

  const evidenceMatches = (value: string) =>
    normalizedEvidence.some((credential) => termsMatch(value, credential.searchable));

  const matchedTools = (job.required_tools || []).filter(evidenceMatches);
  const matchedSkills = (job.required_skills || []).filter(evidenceMatches);
  const matchedCategories = (job.categories || []).filter(evidenceMatches);
  const titleTokens = [...new Set(roleTokens(job.title))];
  const matchedRoleKeywords = titleTokens.filter(evidenceMatches);

  const toolRatio = job.required_tools?.length ? matchedTools.length / job.required_tools.length : 0;
  const skillRatio = job.required_skills?.length ? matchedSkills.length / job.required_skills.length : 0;
  const categoryRatio = job.categories?.length ? matchedCategories.length / job.categories.length : 0;
  const roleRatio = titleTokens.length ? matchedRoleKeywords.length / titleTokens.length : 0;

  // Verified training is deliberately a supporting signal only. It can move a
  // candidate by at most five points and never satisfies a must-have skill,
  // must-have tool, industry-experience, readiness, or availability gate.
  const bonus = Math.min(
    5,
    Math.max(
      0,
      Math.round((toolRatio * 2) + (skillRatio * 1.5) + (categoryRatio * 1) + (roleRatio * 0.5)),
    ),
  );

  const matchedCourseTitles = normalizedEvidence
    .filter((credential) =>
      [...matchedTools, ...matchedSkills, ...matchedCategories, ...matchedRoleKeywords]
        .some((term) => termsMatch(term, credential.searchable)),
    )
    .map((credential) => credential.courseTitle)
    .filter((title, index, values) => values.indexOf(title) === index);

  return {
    assessed: true,
    bonus,
    matchedTools,
    matchedSkills,
    matchedCategories,
    matchedRoleKeywords,
    matchedCourseTitles,
  };
}

export function matchAssessment(
  job: JobLike,
  va: Partial<VaProfile>,
  trainingEvidence: VerifiedTrainingEvidence[] = [],
) {
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
    score += Math.round(categoryMatch.pointsRatio * 20);
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
  const trainingMatch = verifiedTrainingFit(job, trainingEvidence);
  const scoreWithTraining = Math.min(normalizedScore + trainingMatch.bonus, 100);
  const eligible = hardFailures.length === 0;

  return {
    score: eligible ? scoreWithTraining : 0,
    rawScore: scoreWithTraining,
    baseScore: Math.min(normalizedScore, 100),
    trainingBonus: trainingMatch.bonus,
    confidence: Math.min(100, Math.round((assessedWeight / totalWeight) * 100)),
    assessedWeight,
    eligible,
    hardFailures,
    evidenceGaps,
    roleMatch,
    categoryMatched: categoryMatch.matched,
    matchedSkills: skills.matched,
    matchedTools: tools.matched,
    trainingMatch,
  };
}

export function matchScore(
  job: JobLike,
  va: Partial<VaProfile>,
  trainingEvidence: VerifiedTrainingEvidence[] = [],
) {
  return matchAssessment(job, va, trainingEvidence).score;
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
