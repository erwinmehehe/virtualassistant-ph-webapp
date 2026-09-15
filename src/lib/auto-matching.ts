import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";

const SUGGESTION_SCORE_THRESHOLD = 60;
const SUGGESTION_MAX_CANDIDATES = 8;

type JobForMatching = {
  id: string;
  client_id?: string | null;
  title: string;
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

/**
 * Automatic matching is intentionally recruiter-only. It can propose strong
 * candidates, but only a human recruiter can move a proposal to `released`.
 */
export async function refreshMatchSuggestionsForJob(job: JobForMatching): Promise<{ proposedCount: number }> {
  const admin = createAdminClient();
  const { data: vettingRows } = await admin.from("va_vetting").select("va_id").in("stage", ["approved", "bench"]);
  const ids = [...new Set((vettingRows || []).map((row: any) => row.va_id))];
  if (!ids.length) return { proposedCount: 0 };

  const [{ data: vas }, { data: existing }, { data: recruiters }] = await Promise.all([
    admin.from("va_profiles").select("*").in("user_id", ids),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", job.id),
    admin.from("profiles").select("id").eq("role", "recruiter")
  ]);
  const existingMap = new Map((existing || []).map((row: any) => [row.va_id, row.shortlist_status]));

  const qualified = (vas || [])
    .filter((va: any) => va.availability_status === "available")
    .map((va: any) => ({ va, ...matchAssessment(job, va) }))
    .filter((entry) => entry.eligible && entry.score >= SUGGESTION_SCORE_THRESHOLD)
    .filter((entry) => !["hidden", "released"].includes(existingMap.get(entry.va.user_id) || ""))
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence)
    .slice(0, SUGGESTION_MAX_CANDIDATES);

  if (!qualified.length) return { proposedCount: 0 };
  const newlyProposed = qualified.filter((entry) => !existingMap.has(entry.va.user_id));
  const rows = qualified.map((entry) => ({
    job_id: job.id,
    va_id: entry.va.user_id,
    match_score: entry.score,
    match_confidence: entry.confidence,
    shortlist_status: "proposed",
    created_by: null,
    released_at: null
  }));
  const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
  if (error) throw error;

  if (newlyProposed.length) {
    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action: "automatic_match_refresh",
      description: `${newlyProposed.length} new recruiter-only match suggestion${newlyProposed.length === 1 ? "" : "s"} found`,
      actor_id: null,
      metadata: { va_ids: newlyProposed.map((entry) => entry.va.user_id) }
    });
    if (recruiters?.length) {
      await admin.from("notifications").insert(recruiters.map((recruiter: any) => ({
        user_id: recruiter.id,
        title: `${newlyProposed.length} new match suggestion${newlyProposed.length === 1 ? "" : "s"}`,
        body: `Review the recruiter-only suggestions for ${job.title}. Nothing has been sent to the client.`,
        href: `/workspace/recruiter/matching/${job.id}`,
        type: "matching",
        priority: "normal"
      })));
    }
  }
  return { proposedCount: newlyProposed.length };
}

export async function refreshMatchesForVa(vaId: string) {
  const admin = createAdminClient();
  const { data: jobs } = await admin.from("jobs").select("*").in("status", ["pending", "published"]).limit(250);
  let proposedCount = 0;
  for (const job of jobs || []) {
    const result = await refreshMatchSuggestionsForJob(job as JobForMatching);
    if (result.proposedCount) {
      const { data: row } = await admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", job.id).eq("va_id", vaId).maybeSingle();
      if (row?.shortlist_status === "proposed") proposedCount += 1;
    }
  }
  return { proposedCount };
}

/**
 * Backward-compatible export for older callers. Despite the historical name,
 * this no longer releases candidates to clients.
 */
export async function autoReleaseTopMatches(job: JobForMatching): Promise<{ releasedCount: number; proposedCount: number }> {
  const result = await refreshMatchSuggestionsForJob(job);
  return { releasedCount: 0, proposedCount: result.proposedCount };
}
