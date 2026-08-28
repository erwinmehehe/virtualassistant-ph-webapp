import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { sendProfileCompletionReminderEmail, sendClaimDraftEmail, sendTransactionalEventEmail } from "@/lib/email";

// Runs on Vercel's schedule (see vercel.json). Two jobs, both idempotent and
// safe to run repeatedly:
//   1. Remind incomplete active VA profiles at most once every 7 days,
//      starting after a 2-day grace period, with a maximum of three reminders.
//   2. Run pre-application matching against any pending job that doesn't
//      have a shortlist yet, releasing the best available candidate(s).
// Both mirror the manual admin actions built for the one-time backlog
// clear, but run automatically so new signups don't pile up again.

const NUDGE_GRACE_DAYS = 2;
const NUDGE_REPEAT_DAYS = 7;
const MAX_PROFILE_REMINDERS = 3;
const STALE_HIDE_DAYS = 90;
const STALE_HIDE_GRACE_AFTER_REMINDER_DAYS = 14;
const AUTO_RELEASE_SCORE_THRESHOLD = 80;
const AUTO_RELEASE_CONFIDENCE_THRESHOLD = 70;
const FALLBACK_SCORE_FLOOR = 40;
const MAX_CANDIDATES = 3;
const WORKFLOW_REMINDER_GRACE_DAYS = 3;
const WORKFLOW_REMINDER_REPEAT_DAYS = 5;
const MAX_WORKFLOW_REMINDERS = 3;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function runProfileNudges(admin: ReturnType<typeof createAdminClient>) {
  const graceCutoff = daysAgo(NUDGE_GRACE_DAYS);
  const repeatCutoff = daysAgo(NUDGE_REPEAT_DAYS);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

  // Recruiter directory already computes readiness and missing items in one
  // private, service-role-only view. This keeps reminder copy specific rather
  // than sending every incomplete VA the same generic email.
  const { data: candidates } = await admin
    .from("recruiter_va_directory")
    .select("user_id,full_name,completion_score,missing_items,account_created_at,account_status")
    .eq("account_status", "active")
    .lt("completion_score", 100)
    .lte("account_created_at", graceCutoff)
    .limit(500);

  const ids = (candidates || []).map((row: any) => row.user_id);
  const { data: reminders } = ids.length
    ? await admin.from("va_profile_reminders").select("va_id,reminder_count,last_sent_at").in("va_id", ids)
    : { data: [] as any[] };
  const reminderMap = new Map((reminders || []).map((row: any) => [row.va_id, row]));

  let sent = 0;
  for (const row of candidates || []) {
    const previous: any = reminderMap.get(row.user_id);
    if (Number(previous?.reminder_count || 0) >= MAX_PROFILE_REMINDERS) continue;
    if (previous?.last_sent_at && previous.last_sent_at > repeatCutoff) continue;

    const { data } = await admin.auth.admin.getUserById(row.user_id);
    const email = data.user?.email;
    if (!email) continue;
    const result = await sendProfileCompletionReminderEmail({
      to: email,
      fullName: row.full_name,
      score: Number(row.completion_score || 0),
      missing: Array.isArray(row.missing_items) ? row.missing_items : [],
      appUrl
    });
    if (!result.sent) continue;

    await admin.from("va_profile_reminders").upsert({
      va_id: row.user_id,
      reminder_count: Number(previous?.reminder_count || 0) + 1,
      last_score: Number(row.completion_score || 0),
      last_sent_at: new Date().toISOString(),
      last_sent_by: null,
      updated_at: new Date().toISOString()
    }, { onConflict: "va_id" });
    sent += 1;
  }
  return { checked: candidates?.length || 0, sent };
}

async function runStaleVaCleanup(admin: ReturnType<typeof createAdminClient>) {
  const staleCutoff = daysAgo(STALE_HIDE_DAYS);
  const reminderGraceCutoff = daysAgo(STALE_HIDE_GRACE_AFTER_REMINDER_DAYS);
  const { data: stale } = await admin
    .from("recruiter_va_directory")
    .select("user_id,last_activity_at,directory_visible,account_status")
    .eq("account_status", "active")
    .eq("directory_visible", true)
    .not("last_activity_at", "is", null)
    .lte("last_activity_at", staleCutoff)
    .limit(500);
  const ids = (stale || []).map((row: any) => row.user_id);
  const { data: reminders } = ids.length
    ? await admin.from("va_profile_reminders").select("va_id,reminder_count,last_sent_at").in("va_id", ids)
    : { data: [] as any[] };
  const eligible = new Set((reminders || [])
    .filter((row: any) => Number(row.reminder_count || 0) >= 2 && row.last_sent_at && row.last_sent_at <= reminderGraceCutoff)
    .map((row: any) => row.va_id));
  const hideIds = ids.filter((id: string) => eligible.has(id));
  if (!hideIds.length) return { checked: stale?.length || 0, hidden: 0 };

  const now = new Date().toISOString();
  const { error } = await admin.from("va_profiles").update({ directory_visible: false, updated_at: now }).in("user_id", hideIds);
  if (error) throw error;
  await admin.from("notifications").insert(hideIds.map((id: string) => ({
    user_id: id,
    title: "Your VA profile is hidden until you update it",
    body: "Your profile was inactive for 90+ days after profile reminders. Update your availability and profile to return to recruiter/public consideration.",
    href: "/workspace/va/profile"
  })));
  await admin.from("recruiter_activity").insert(hideIds.map((id: string) => ({
    subject_type: "va", subject_id: id, action: "auto_hidden_stale", description: "Automatically hidden after 90+ days inactive and two profile reminders", actor_id: null, metadata: {}
  })));
  return { checked: stale?.length || 0, hidden: hideIds.length };
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

async function sendWorkflowReminder(admin: ReturnType<typeof createAdminClient>, args: { subjectType: "job" | "application"; subjectId: string; recipientId: string; action: string; title: string; body: string; href: string }) {
  const repeatCutoff = daysAgo(WORKFLOW_REMINDER_REPEAT_DAYS);
  const { data: previous } = await admin.from("workflow_reminders").select("reminder_count,last_sent_at").eq("subject_type", args.subjectType).eq("subject_id", args.subjectId).eq("recipient_id", args.recipientId).eq("action", args.action).maybeSingle();
  if (Number(previous?.reminder_count || 0) >= MAX_WORKFLOW_REMINDERS || (previous?.last_sent_at && previous.last_sent_at > repeatCutoff)) return false;
  const now = new Date().toISOString();
  const { error } = await admin.from("workflow_reminders").upsert({ subject_type: args.subjectType, subject_id: args.subjectId, recipient_id: args.recipientId, action: args.action, reminder_count: Number(previous?.reminder_count || 0) + 1, last_sent_at: now, updated_at: now }, { onConflict: "subject_type,subject_id,recipient_id,action" });
  if (error) return false;
  await admin.from("notifications").insert({ user_id: args.recipientId, title: args.title, body: args.body, href: args.href });
  const { data: auth } = await admin.auth.admin.getUserById(args.recipientId);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  try { await sendTransactionalEventEmail({ to: auth.user?.email, subject: args.title, heading: args.title, body: args.body, href: `${appUrl}${args.href}`, hrefLabel: "Open workspace" }); } catch (error) { console.error("[email] Workflow reminder delivery failed", error); }
  return true;
}

async function runWorkflowReminders(admin: ReturnType<typeof createAdminClient>) {
  const graceCutoff = daysAgo(WORKFLOW_REMINDER_GRACE_DAYS);
  const [{ data: recruiters }, { data: jobs }, { data: shortlist }, { data: apps }] = await Promise.all([
    admin.from("profiles").select("id").eq("role", "recruiter"),
    admin.from("jobs").select("id,client_id,title,status,created_at,updated_at").in("status", ["pending", "published"]).lte("created_at", graceCutoff).limit(300),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status,released_at").eq("shortlist_status", "released"),
    admin.from("applications").select("id,job_id,va_id,status,updated_at").in("status", ["interview", "offered"]).lte("updated_at", graceCutoff).limit(300)
  ]);
  const shortlistByJob = new Map<string, any[]>(); for (const row of shortlist || []) { const rows = shortlistByJob.get(row.job_id) || []; rows.push(row); shortlistByJob.set(row.job_id, rows); }
  const appJobIds = new Set((apps || []).map((row: any) => row.job_id));
  let recruiterNudges = 0; let clientNudges = 0; let vaNudges = 0;
  for (const job of jobs || []) {
    const released = shortlistByJob.get(job.id) || [];
    if (!released.length && !appJobIds.has(job.id)) for (const recruiter of recruiters || []) {
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: recruiter.id, action: "needs_candidates", title: `Role needs candidates: ${job.title}`, body: "This active client role has no assigned candidates yet. Open matching to review recommended VAs.", href: `/workspace/recruiter/matching/${job.id}` })) recruiterNudges++;
    }
    const releasedAt = released.map((row: any) => row.released_at).filter(Boolean).sort()[0];
    if (job.client_id && releasedAt && releasedAt <= graceCutoff && !appJobIds.has(job.id)) {
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: job.client_id, action: "review_shortlist", title: `Your shortlist is ready: ${job.title}`, body: "Your recruiter has prepared candidates for this role. Review them and choose who should move forward.", href: `/workspace/client/jobs/${job.id}` })) clientNudges++;
    }
  }
  for (const application of apps || []) {
    if (await sendWorkflowReminder(admin, { subjectType: "application", subjectId: application.id, recipientId: application.va_id, action: "application_follow_up", title: "Your application has an update waiting", body: `Your application is still in the ${application.status} stage. Check the role and messages for any next steps.`, href: "/workspace/va/applications" })) vaNudges++;
  }
  return { recruiterNudges, clientNudges, vaNudges };
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

  const [nudgeResult, staleResult, leadNudgeResult, matchResult, workflowResult] = await Promise.all([
    runProfileNudges(admin),
    runStaleVaCleanup(admin),
    runLeadClaimNudges(admin),
    runPendingJobMatching(admin),
    runWorkflowReminders(admin)
  ]);

  return NextResponse.json({ ok: true, publishing: publishResult, nudges: nudgeResult, staleCleanup: staleResult, leadNudges: leadNudgeResult, matching: matchResult, workflowReminders: workflowResult });
}
