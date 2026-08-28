import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";

// A match only auto-releases without staff review when it's both a strong
// fit (score) and the assessment actually had enough job fields to judge
// confidently (confidence) -- a high score computed from very little signal
// is exactly the case that should still go through a human.
const AUTO_RELEASE_SCORE_THRESHOLD = 80;
const AUTO_RELEASE_CONFIDENCE_THRESHOLD = 70;
const AUTO_RELEASE_MAX_CANDIDATES = 3;

/**
 * Runs the same pre-application matching used by staff (StaffJobMatching)
 * against the full approved/bench VA pool, and auto-releases only the
 * strongest, highest-confidence matches -- everything else is left alone
 * for staff to curate manually via the normal shortlist tools. This keeps
 * the platform's curation model intact; it only removes the wait for the
 * small number of matches that are unambiguous.
 */
type JobForMatching = {
  id: string;
  client_id: string | null;
  title: string;
  categories?: string[] | null;
  required_skills?: string[] | null;
  required_tools?: string[] | null;
  hours_per_week?: number | null;
  overlap_hours?: number | null;
};

export async function autoReleaseTopMatches(job: JobForMatching): Promise<{ releasedCount: number }> {
  if (!job.client_id) return { releasedCount: 0 };
  const admin = createAdminClient();

  const { data: vettingRows } = await admin.from("va_vetting").select("va_id").in("stage", ["approved", "bench"]);
  const ids = [...new Set((vettingRows || []).map((row: any) => row.va_id))];
  if (!ids.length) return { releasedCount: 0 };

  const [{ data: vas }, { data: existing }] = await Promise.all([
    admin.from("va_profiles").select("*").in("user_id", ids),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", job.id)
  ]);
  const existingMap = new Map((existing || []).map((row: any) => [row.va_id, row.shortlist_status]));

  const qualified = (vas || [])
    .map((va: any) => ({ va, ...matchAssessment(job, va) }))
    .filter((entry) => entry.score >= AUTO_RELEASE_SCORE_THRESHOLD && entry.confidence >= AUTO_RELEASE_CONFIDENCE_THRESHOLD)
    // Never touch a candidate a staff member has already hidden/rejected from this job.
    .filter((entry) => existingMap.get(entry.va.user_id) !== "hidden")
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence)
    .slice(0, AUTO_RELEASE_MAX_CANDIDATES);

  if (!qualified.length) return { releasedCount: 0 };

  const now = new Date().toISOString();
  const rows = qualified.map((entry) => ({
    job_id: job.id,
    va_id: entry.va.user_id,
    match_score: entry.score,
    match_confidence: entry.confidence,
    shortlist_status: "released",
    created_by: null,
    released_at: now
  }));
  const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
  if (error) throw error;

  const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", job.id).maybeSingle();
  const unlocked = access?.access_status === "paid" || access?.access_status === "comped";
  await admin.from("notifications").insert({
    user_id: job.client_id,
    title: "Strong matches found automatically",
    body: unlocked
      ? `${qualified.length} strongly matched VA profile${qualified.length === 1 ? " is" : "s are"} ready to review for "${job.title}".`
      : `${qualified.length} strongly matched VA${qualified.length === 1 ? " is" : "s are"} ready for "${job.title}". Candidate identities stay protected until candidate access is activated.`,
    href: `/workspace/client/jobs/${job.id}`
  });

  return { releasedCount: qualified.length };
}
