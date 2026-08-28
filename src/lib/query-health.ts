import "server-only";

type SupabaseErrorLike = { message?: string; code?: string } | null | undefined;

// PostgREST returns this when .single() matches no row. That is an expected
// state for a brand-new account, not a failure, so it must never be reported
// as "we couldn't load your data".
const NO_ROWS = "PGRST116";

/**
 * Collects the human-readable labels of the dashboard queries that failed.
 *
 * Every dashboard query previously destructured only `data`, so a failed query
 * silently became `null` -> a zero -> a confident but wrong statement ("All
 * caught up", "Your profile is ready for matching"). Callers pass a label per
 * query and surface the result so an outage reads as an outage.
 */
export function collectQueryIssues(entries: Record<string, SupabaseErrorLike>): string[] {
  const failed: string[] = [];
  for (const [label, error] of Object.entries(entries)) {
    if (!error) continue;
    if (error.code === NO_ROWS) continue;
    failed.push(label);
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[dashboard] query failed: ${label}:`, error.message);
    }
  }
  return failed;
}
