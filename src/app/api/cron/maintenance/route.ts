import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { sendVettingNudgeEmail, sendClaimDraftEmail } from "@/lib/email";

// Runs on Vercel's schedule (see vercel.json). Two jobs, both idempotent and
// safe to run repeatedly:
//   1. Nudge VAs stuck at "profile" stage -- but only once every 3 days per
//      person, and only after they've had 2 days to finish on their own.
//   2. Run pre-application matching against any pending job that doesn't
//      have a shortlist yet, releasing the best available candidate(s).
// Both mirror the manual admin actions built for the one-time backlog
// clear, but run automatically so new signups don't pile up again.

const NUDGE_GRACE_DAYS = 2;
const NUDGE_REPEAT_DAYS = 3;
const AUTO_RELEASE_SCORE_THRESHOLD = 80;
const AUTO_RELEASE_CONFIDENCE_THRESHOLD = 70;
const FALLBACK_SCORE_FLOOR = 40;
const MAX_CANDIDATES = 3;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function runProfileNudges(admin: ReturnType<typeof createAdminClient>) {
  const graceCutoff = daysAgo(NUDGE_GRACE_DAYS);
  const repeatCutoff = daysAgo(NUDGE_REPEAT_DAYS);

  const { data: stuck } = await admin.from("va_vetting").select("va_id,nudged_at,created_at").eq("stage", "profile").lte("created_at", graceCutoff);
  const due = (stuck || []).filter((row: any) => !row.nudged_at || row.nudged_at <= repeatCutoff);

  const { data: profiles } = due.length ? await admin.from("profiles").select("id,full_name").in("id", due.map((r: any) => r.va_id)) : { data: [] as any[] };
  const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

  let sent = 0;
  for (const row of due) {
    const { data } = await admin.auth.admin.getUserById(row.va_id);
    const email = data.user?.email;
    if (!email) continue;
    const result = await sendVettingNudgeEmail({ to: email, fullName: nameMap.get(row.va_id), appUrl });
    if (result.sent) {
      await admin.from("va_vetting").update({ nudged_at: new Date().toISOString() }).eq("va_id", row.va_id);
      sent += 1;
    }
  }
  return { checked: stuck?.length || 0, sent };
}

async function runLeadClaimNudges(admin: ReturnType<typeof createAdminClient>) {
  const graceCutoff = daysAgo(NUDGE_GRACE_DAYS);
  const repeatCutoff = daysAgo(NUDGE_REPEAT_DAYS);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

  const { data: jobs } = await admin.from("jobs").select("id,title,lead_id,client_id").is("client_id", null).not("lead_id", "is", null).lte("created_at", graceCutoff);
  const leadIds = [...new Set((jobs || []).map((j: any) => j.lead_id).filter(Boolean))];
  const { data: leads } = leadIds.length ? await admin.from("lead_intake").select("id,name,email,nudged_at").in("id", leadIds) : { data: [] as any[] };
  const leadMap = new Map((leads || []).map((l: any) => [l.id, l]));

  let sent = 0;
  for (const job of jobs || []) {
    const lead = leadMap.get(job.lead_id);
    if (!lead?.email) continue;
    if (lead.nudged_at && lead.nudged_at > repeatCutoff) continue;
    const result = await sendClaimDraftEmail({ to: lead.email, name: lead.name, jobTitle: job.title, leadId: lead.id, appUrl });
    if (result.sent) {
      await admin.from("lead_intake").update({ nudged_at: new Date().toISOString() }).eq("id", lead.id);
      sent += 1;
    }
  }
  return { checked: jobs?.length || 0, sent };
}

async function runPendingJobMatching(admin: ReturnType<typeof createAdminClient>) {
  const { data: jobs } = await admin.from("jobs").select("id,client_id,title,categories,required_skills,required_tools,hours_per_week,overlap_hours").eq("status", "pending");
  const { data: vettingRows } = await admin.from("va_vetting").select("va_id").in("stage", ["approved", "bench"]);
  const vaIds = [...new Set((vettingRows || []).map((row: any) => row.va_id))];
  const { data: vas } = vaIds.length ? await admin.from("va_profiles").select("*").in("user_id", vaIds) : { data: [] as any[] };

  let jobsMatched = 0;
  let candidatesReleased = 0;
  for (const job of jobs || []) {
    const { data: existing } = await admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", job.id);
    if (existing?.length) continue; // already matched at least once -- don't re-run every cycle

    const ranked = (vas || [])
      .map((va: any) => ({ va, ...matchAssessment(job, va) }))
      .sort((a, b) => b.score - a.score || b.confidence - a.confidence);
    const strict = ranked.filter((e) => e.score >= AUTO_RELEASE_SCORE_THRESHOLD && e.confidence >= AUTO_RELEASE_CONFIDENCE_THRESHOLD).slice(0, MAX_CANDIDATES);
    const qualified = strict.length ? strict : ranked.filter((e) => e.score >= FALLBACK_SCORE_FLOOR).slice(0, 1);
    if (!qualified.length) continue;

    const now = new Date().toISOString();
    const rows = qualified.map((e) => ({ job_id: job.id, va_id: e.va.user_id, match_score: e.score, match_confidence: e.confidence, shortlist_status: "released", created_by: null, released_at: now }));
    const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
    if (error) continue;
    if (job.client_id) {
      await admin.from("notifications").insert({
        user_id: job.client_id,
        title: "Strong matches found automatically",
        body: `${qualified.length} matched VA(s) ready for "${job.title}".`,
        href: `/workspace/client/jobs/${job.id}`
      });
    }
    jobsMatched += 1;
    candidatesReleased += qualified.length;
  }
  return { jobsChecked: jobs?.length || 0, jobsMatched, candidatesReleased };
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Auto-publish runs first and changes job statuses (pending -> published),
  // so it must finish before the pending-job matching pass reads the table
  // -- otherwise a job could get matched twice or the counts would be stale.
  const { autoPublishStraightforwardJobs } = await import("@/lib/auto-publish");
  const publishResult = await autoPublishStraightforwardJobs();

  const [nudgeResult, leadNudgeResult, matchResult] = await Promise.all([runProfileNudges(admin), runLeadClaimNudges(admin), runPendingJobMatching(admin)]);

  return NextResponse.json({ ok: true, publishing: publishResult, nudges: nudgeResult, leadNudges: leadNudgeResult, matching: matchResult });
}
