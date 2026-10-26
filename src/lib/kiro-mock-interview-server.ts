import "server-only";

/**
 * Real-model interviews are limited to one verified Preview branch with a
 * DIFFERENT Supabase project from Production, or to a manually approved local
 * acceptance test with disposable loopback data. Production is never eligible.
 */
function loopbackHttp(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isMockInterviewVerifiedPreview(): boolean {
  if (process.env.VERCEL_ENV !== "preview") return false;
  const branch = (process.env.AI_MOCK_INTERVIEW_PREVIEW_BRANCH || "").trim();
  // An exact preview branch must be reviewed. Main and wildcard branches
  // cannot inherit this pilot merely because a broad Preview flag exists.
  if (!branch || branch === "main" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{2,120}$/.test(branch) ||
      process.env.VERCEL_GIT_COMMIT_REF !== branch) return false;

  const pilotRef = (process.env.AI_MOCK_INTERVIEW_PREVIEW_SUPABASE_REF || "").trim().toLowerCase();
  const productionRef = (process.env.AI_MOCK_INTERVIEW_PRODUCTION_SUPABASE_REF || "").trim().toLowerCase();
  // Two explicit, independently reviewed references must be nonempty and
  // different. An unverified/missing project identity fails shut.
  if (!/^[a-z0-9]{12,32}$/.test(pilotRef) ||
      !/^[a-z0-9]{12,32}$/.test(productionRef) ||
      pilotRef === productionRef) return false;

  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return url.protocol === "https:" &&
      url.hostname === pilotRef + ".supabase.co" &&
      !url.username && !url.password && !url.port &&
      (url.pathname === "/" || url.pathname === "");
  } catch {
    return false;
  }
}

/** For the manual real-model UAT ONLY: fake accounts on a local DB and app. */
export function isMockInterviewOperatorSandbox(): boolean {
  return process.env.NODE_ENV === "development" &&
    process.env.VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT === "operator-approved" &&
    process.env.AI_MOCK_INTERVIEW_LOCAL_SANDBOX_ONLY === "true" &&
    process.env.AI_MOCK_INTERVIEW_E2E_MOCK !== "true" &&
    loopbackHttp(process.env.NEXT_PUBLIC_SUPABASE_URL || "") &&
    loopbackHttp(process.env.E2E_BASE_URL || "");
}

/**
 * This is intentionally stricter than the lesson coach's separate pilot.
 * Both the account allowlist AND the verified execution environment are needed.
 */
export function isMockInterviewLivePilot(userId: string): boolean {
  if (!userId ||
      process.env.AI_MOCK_INTERVIEW_ENABLED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_PROVIDER_APPROVED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_FREE_ONLY !== "true" ||
      !(isMockInterviewVerifiedPreview() || isMockInterviewOperatorSandbox())) return false;
  const allowedIds = (process.env.AI_MOCK_INTERVIEW_PILOT_USER_IDS || "")
    .split(",").map((id) => id.trim().toLowerCase()).filter(Boolean);
  return allowedIds.includes(userId.toLowerCase());
}

/** Fake replies only with a disposable loopback Supabase instance in development. */
export function allowMockInterviewFixture(): boolean {
  if (process.env.NODE_ENV !== "development" ||
      process.env.AI_MOCK_INTERVIEW_ENABLED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_E2E_MOCK !== "true") return false;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}
