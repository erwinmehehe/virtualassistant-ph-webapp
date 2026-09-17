import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";

const SUGGESTION_SCORE_THRESHOLD = 60;
const SUGGESTION_MAX_CANDIDATES = 8;
const VA_OPPORTUNITY_SCORE_THRESHOLD = 60;
const VA_OPPORTUNITY_CONFIDENCE_THRESHOLD = 50;

type JobForMatching = {
  id: string;
  client_id?: string | null;
  status?: string | null;
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

type QualifiedMatch = {
  vaId: string;
  score: number;
  confidence: number;
};

type RefreshOptions = {
  notifyMatchingVas?: boolean;
};

async function notifyMatchingVasForPublishedJob(
  admin: ReturnType<typeof createAdminClient>,
  job: JobForMatching,
  matches: QualifiedMatch[]
) {
  if (job.status !== "published") return 0;

  const candidates = matches.filter(
    (match) => match.score >= VA_OPPORTUNITY_SCORE_THRESHOLD && match.confidence >= VA_OPPORTUNITY_CONFIDENCE_THRESHOLD
  );
  if (!candidates.length) return 0;

  const vaIds = candidates.map((match) => match.vaId);
  const href = `/jobs/${job.id}`;
  const [{ data: existingNotifications }, { data: existingApplications }] = await Promise.all([
    admin.from("notifications")
      .select("user_id")
      .eq("type", "matching")
      .eq("href", href)
      .in("user_id", vaIds),
    admin.from("applications")
      .select("va_id")
      .eq("job_id", job.id)
      .in("va_id", vaIds)
  ]);

  const alreadyNotified = new Set((existingNotifications || []).map((row: { user_id: string }) => row.user_id));
  const alreadyInterested = new Set((existingApplications || []).map((row: { va_id: string }) => row.va_id));
  const toNotify = candidates.filter((match) => !alreadyNotified.has(match.vaId) && !alreadyInterested.has(match.vaId));
  if (!toNotify.length) return 0;

  const { error } = await admin.from("notifications").insert(toNotify.map((match) => ({
    user_id: match.vaId,
    title: `New opportunity: ${job.title}`,
    body: "This role appears to match your approved profile. Review the role and express interest.",
    href,
    type: "matching",
    priority: "normal"
  })));
  if (error) throw error;

  try {
    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action: "matching_va_opportunity_alerts_sent",
      description: `${toNotify.length} matching VA${toNotify.length === 1 ? "" : "s"} notified about the published opportunity`,
      actor_id: null,
      metadata: {
        va_ids: toNotify.map((match) => match.vaId),
        min_score: VA_OPPORTUNITY_SCORE_THRESHOLD,
        min_confidence: VA_OPPORTUNITY_CONFIDENCE_THRESHOLD
      }
    });
  } catch {
    // Notification delivery is the source of truth; activity logging is best effort.
  }

  return toNotify.length;
}

/**
 * Automatic matching is intentionally recruiter-only. It can propose strong
 * candidates, but only a human recruiter can move a proposal to `released`.
 */
export async function refreshMatchSuggestionsForJob(
  job: JobForMatching,
  options: RefreshOptions = {}
): Promise<{ proposedCount: number; notifiedVaCount: number }> {
  const admin = createAdminClient();
  const { data: vettingRows } = await admin.from("va_vetting").select("va_id").in("stage", ["approved", "bench"]);
  const ids = [...new Set((vettingRows || []).map((row: { va_id: string }) => row.va_id))];
  if (!ids.length) return { proposedCount: 0, notifiedVaCount: 0 };

  const [{ data: vas }, { data: existing }, { data: recruiters }] = await Promise.all([
    admin.from("va_profiles").select("*").in("user_id", ids),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", job.id),
    admin.from("profiles").select("id").eq("role", "recruiter")
  ]);
  const existingMap = new Map((existing || []).map((row: { va_id: string; shortlist_status: string }) => [row.va_id, row.shortlist_status]));

  const qualified = (vas || [])
    .filter((va: { availability_status?: string | null }) => va.availability_status === "available")
    .map((va) => ({ va, ...matchAssessment(job, va) }))
    .filter((entry) => entry.eligible && entry.score >= SUGGESTION_SCORE_THRESHOLD)
    .filter((entry) => !["hidden", "released"].includes(existingMap.get(entry.va.user_id) || ""))
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence)
    .slice(0, SUGGESTION_MAX_CANDIDATES);

  if (!qualified.length) return { proposedCount: 0, notifiedVaCount: 0 };
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
      await admin.from("notifications").insert(recruiters.map((recruiter: { id: string }) => ({
        user_id: recruiter.id,
        title: `${newlyProposed.length} new match suggestion${newlyProposed.length === 1 ? "" : "s"}`,
        body: `Review the recruiter-only suggestions for ${job.title}. Nothing has been sent to the client.`,
        href: `/workspace/recruiter/matching/${job.id}`,
        type: "matching",
        priority: "normal"
      })));
    }
  }

  const notifiedVaCount = options.notifyMatchingVas
    ? await notifyMatchingVasForPublishedJob(admin, job, qualified.map((entry) => ({
      vaId: entry.va.user_id,
      score: entry.score,
      confidence: entry.confidence
    })))
    : 0;

  return { proposedCount: newlyProposed.length, notifiedVaCount };
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

export async function refreshPublishedJobMatchesAndNotifyVas(job: JobForMatching) {
  if (job.status !== "published") return { proposedCount: 0, notifiedVaCount: 0 };
  return refreshMatchSuggestionsForJob(job, { notifyMatchingVas: true });
}

/**
 * Backward-compatible publish hook. It still never releases candidates to the
 * client, but it now confirms the persisted job is published before sending
 * opportunity alerts to qualifying VAs.
 */
export async function autoReleaseTopMatches(job: JobForMatching): Promise<{ releasedCount: number; proposedCount: number }> {
  const admin = createAdminClient();
  const { data: currentJob, error } = await admin.from("jobs").select("*").eq("id", job.id).maybeSingle();
  if (error) throw error;
  const persistedJob = (currentJob || job) as JobForMatching;
  const result = persistedJob.status === "published"
    ? await refreshMatchSuggestionsForJob(persistedJob, { notifyMatchingVas: true })
    : await refreshMatchSuggestionsForJob(persistedJob);
  return { releasedCount: 0, proposedCount: result.proposedCount };
}
