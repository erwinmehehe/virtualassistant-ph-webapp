import "server-only";

/**
 * A separate, fail-closed pilot from the lesson coach. Never assume that an
 * approved course, a free model, or a signed-in account grants AI interview access.
 */
export function isMockInterviewLivePilot(userId: string): boolean {
  if (!userId ||
      process.env.AI_MOCK_INTERVIEW_ENABLED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_PROVIDER_APPROVED !== "true" ||
      process.env.AI_MOCK_INTERVIEW_FREE_ONLY !== "true") return false;
  return (process.env.AI_MOCK_INTERVIEW_PILOT_USER_IDS || "")
    .split(",").map((id) => id.trim().toLowerCase()).filter(Boolean)
    .includes(userId.toLowerCase());
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
