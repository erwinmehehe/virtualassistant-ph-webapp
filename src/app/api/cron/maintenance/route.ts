import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendProfileCompletionReminderEmail, sendClaimDraftEmail, sendTransactionalEventEmail, sendDiscoveryReminderEmail } from "@/lib/email";
import { bookingManageUrl } from "@/lib/booking-operations";
import { formatDiscoverySlot } from "@/lib/discovery-booking";
import { submitToIndexNow } from "@/lib/indexnow";
import { BLOG_POSTS, blogHref } from "@/lib/blog";

// Daily maintenance is deliberately idempotent. Matching can create recruiter
// suggestions, reminders can nudge people, but no automation may release a VA
// to a client or make a hiring/rejection decision.
const NUDGE_GRACE_DAYS = 2;
const NUDGE_REPEAT_DAYS = 7;
const MAX_PROFILE_REMINDERS = 3;\nconst MAX_PROFILE_REMINDERS_PER_RUN = 20;\nconst MAX_NONCRITICAL_EMAILS_PER_DAY = 50;
const STALE_HIDE_DAYS = 90;
const STALE_HIDE_GRACE_AFTER_REMINDER_DAYS = 14;
const WORKFLOW_REMINDER_REPEAT_DAYS = 5;
const MAX_WORKFLOW_REMINDERS = 3;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}


/**
 * Tell Bing (and through it, ChatGPT search) about pages that changed in the
 * last day. Only genuinely changed URLs are submitted: the protocol treats
 * resubmitting a static set as spam.
 */
async function runIndexNowSubmission(admin: ReturnType<typeof createAdminClient>) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const since = daysAgo(1);

  const changed = BLOG_POSTS
    .filter((post) => (post.updatedAt || post.publishedAt) >= since)
    .map((post) => `${base}${blogHref(post)}`);

  const { data: jobs } = await admin
    .from("jobs")
    .select("id,slug,published_at")
    .eq("status", "published")
    .not("client_id", "is", null)
    .gte("published_at", since)
    .limit(200);
  for (const job of jobs || []) changed.push(`${base}/jobs/${job.slug || job.id}`);

  return submitToIndexNow(changed);
}

async function runDiscoveryBookingReminders(admin: ReturnType<typeof createAdminClient>) {
  const now = Date.now();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();
  const lower = new Date(now + 30 * 60 * 1000).toISOString();
  const { data: bookings, error } = await admin.from("lead_intake")
    .select("id,name,email,timezone,discovery_scheduled_at,discovery_meeting_url,discovery_manage_token,discovery_reminder_24h_sent_at,discovery_reminder_1h_sent_at")
    .not("discovery_scheduled_at", "is", null)
    .is("discovery_cancelled_at", null)
    .is("discovery_completed_at", null)
    .gte("discovery_scheduled_at", lower)
    .lte("discovery_scheduled_at", upper)
    .limit(300);
  if (error) throw error;

  let reminder24h = 0;
  let reminder1h = 0;
  for (const booking of bookings || []) {
    if (!booking.email || !booking.discovery_scheduled_at || !booking.discovery_manage_token) continue;
    const minutesUntil = (new Date(booking.discovery_scheduled_at).getTime() - now) / 60_000;
    const scheduledLabel = formatDiscoverySlot(booking.discovery_scheduled_at, booking.timezone || "Asia/Manila");
    const manageUrl = bookingManageUrl(booking.discovery_manage_token);
    if (minutesUntil <= 90 && minutesUntil >= 30 && !booking.discovery_reminder_1h_sent_at) {
      const result = await sendDiscoveryReminderEmail({ to: booking.email, clientName: booking.name, scheduledLabel, meetingUrl: booking.discovery_meeting_url, manageUrl, window: "1h" });
      if (result.sent) {
        await admin.from("lead_intake").update({ discovery_reminder_1h_sent_at: new Date().toISOString() }).eq("id", booking.id).is("discovery_reminder_1h_sent_at", null);
        reminder1h++;
      }
    } else if (minutesUntil <= 25 * 60 && minutesUntil >= 23 * 60 && !booking.discovery_reminder_24h_sent_at) {
      const result = await sendDiscoveryReminderEmail({ to: booking.email, clientName: booking.name, scheduledLabel, meetingUrl: booking.discovery_meeting_url, manageUrl, window: "24h" });
      if (result.sent) {
        await admin.from("lead_intake").update({ discovery_reminder_24h_sent_at: new Date().toISOString() }).eq("id", booking.id).is("discovery_reminder_24h_sent_at", null);
        reminder24h++;
      }
    }
  }
  return { checked: bookings?.length || 0, reminder24h, reminder1h };
}

async function runProfileNudges(admin: ReturnType<typeof createAdminClient>) {
  const graceCutoff = daysAgo(NUDGE_GRACE_DAYS);
  const repeatCutoff = daysAgo(NUDGE_REPEAT_DAYS);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
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
    if (!data.user?.email) continue;\n    if (!data.user.email_confirmed_at) { skippedUnverified++; continue; }
    let result;
    try {
      result = await sendProfileCompletionReminderEmail({
        to: data.user.email,
        fullName: row.full_name,
        score: Number(row.completion_score || 0),
        missing: Array.isArray(row.missing_items) ? row.missing_items : [],
        appUrl
      });
    } catch {
      continue;
    }
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
  return { checked: candidates?.length || 0, sent, skippedUnverified, skippedCapacity };
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
    const lead: any = leadMap.get(job.lead_id);
    if (!lead?.email || (lead.nudged_at && lead.nudged_at > repeatCutoff)) continue;
    const result = await sendClaimDraftEmail({ to: lead.email, name: lead.name, jobTitle: job.title, leadId: lead.id, appUrl });
    if (result.sent) {
      await admin.from("lead_intake").update({ nudged_at: new Date().toISOString() }).eq("id", lead.id);
      sent += 1;
    }
  }
  return { checked: jobs?.length || 0, sent };
}

async function runPendingJobMatching(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin.rpc("refresh_all_match_suggestions");
  if (error) throw error;
  return { jobsMatched: null, candidatesProposed: Number(data || 0), candidatesReleased: 0 };
}

type ReminderSubject = "job" | "application" | "lead" | "proposal" | "va";
async function sendWorkflowReminder(admin: ReturnType<typeof createAdminClient>, args: { subjectType: ReminderSubject; subjectId: string; recipientId: string; action: string; title: string; body: string; href: string; repeatDays?: number }) {
  const repeatCutoff = daysAgo(args.repeatDays || WORKFLOW_REMINDER_REPEAT_DAYS);
  const { data: previous } = await admin.from("workflow_reminders").select("reminder_count,last_sent_at").eq("subject_type", args.subjectType).eq("subject_id", args.subjectId).eq("recipient_id", args.recipientId).eq("action", args.action).maybeSingle();
  if (Number(previous?.reminder_count || 0) >= MAX_WORKFLOW_REMINDERS || (previous?.last_sent_at && previous.last_sent_at > repeatCutoff)) return false;
  const now = new Date().toISOString();
  const { error } = await admin.from("workflow_reminders").upsert({ subject_type: args.subjectType, subject_id: args.subjectId, recipient_id: args.recipientId, action: args.action, reminder_count: Number(previous?.reminder_count || 0) + 1, last_sent_at: now, updated_at: now }, { onConflict: "subject_type,subject_id,recipient_id,action" });
  if (error) return false;
  await admin.from("notifications").insert({ user_id: args.recipientId, title: args.title, body: args.body, href: args.href });
  const { data: auth } = await admin.auth.admin.getUserById(args.recipientId);
  const recipientEmail = auth.user?.email?.trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  if (recipientEmail) {
    try { await sendTransactionalEventEmail({ to: recipientEmail, subject: args.title, heading: args.title, body: args.body, href: `${appUrl}${args.href}`, hrefLabel: "Open workspace" }); } catch (error) { console.error("[email] Workflow reminder delivery failed", error); }
  }
  return true;
}

async function runWorkflowReminders(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: recruiters }, { data: jobs }, { data: shortlist }, { data: apps }, { data: interviews }, { data: offers }] = await Promise.all([
    admin.from("profiles").select("id").eq("role", "recruiter"),
    admin.from("jobs").select("id,client_id,title,status,created_at,recruiter_id").in("status", ["pending", "published"]).gte("created_at", daysAgo(30)).limit(300),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status,released_at,client_decision").eq("shortlist_status", "released"),
    admin.from("applications").select("id,job_id,va_id,status,updated_at").in("status", ["interview", "offered"]).gte("updated_at", daysAgo(30)).limit(300),
    admin.from("candidate_interviews").select("id,job_id,va_id,client_id,application_id,status,created_at,scheduled_at").in("status", ["requested", "scheduled", "completed"]).gte("created_at", daysAgo(30)).limit(300),
    admin.from("placement_offers").select("id,job_id,va_id,client_id,application_id,status,created_at,va_accepted_at").in("status", ["pending_va", "pending_client", "accepted"]).gte("created_at", daysAgo(30)).limit(300)
  ]);
  const shortlistByJob = new Map<string, any[]>();
  for (const row of shortlist || []) { const rows = shortlistByJob.get(row.job_id) || []; rows.push(row); shortlistByJob.set(row.job_id, rows); }
  const appJobIds = new Set((apps || []).map((row: any) => row.job_id));
  const canonicalApplicationIds = new Set([...(interviews || []), ...(offers || [])].map((row: any) => row.application_id).filter(Boolean));
  const interviewPairs = new Set((interviews || []).map((row: any) => `${row.job_id}:${row.va_id}`));
  const offerPairs = new Set((offers || []).map((row: any) => `${row.job_id}:${row.va_id}`));
  const jobMap = new Map((jobs || []).map((row: any) => [row.id, row]));
  let recruiterNudges = 0; let client24h = 0; let client48h = 0; let vaNudges = 0; let interviewScheduleNudges = 0; let offerNudges = 0;

  for (const job of jobs || []) {
    const released = shortlistByJob.get(job.id) || [];
    if (!released.length && !appJobIds.has(job.id) && new Date(job.created_at).getTime() <= Date.now() - 24 * 60 * 60 * 1000) {
      const recipients = job.recruiter_id ? [job.recruiter_id] : (recruiters || []).map((r: any) => r.id);
      for (const recipientId of recipients) {
        if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId, action: "needs_candidates", title: `Role needs candidates: ${job.title}`, body: "This active client role has no recruiter-approved shortlist yet. Review the automatic suggestions and decide who should move forward.", href: `/workspace/recruiter/matching/${job.id}`, repeatDays: 1 })) recruiterNudges++;
      }
    }
    if (!job.client_id || !released.length || released.some((row: any) => row.client_decision)) continue;
    const releasedAt = released.map((row: any) => row.released_at).filter(Boolean).sort()[0];
    if (!releasedAt) continue;
    const ageMs = Date.now() - new Date(releasedAt).getTime();
    if (ageMs >= 24 * 60 * 60 * 1000 && ageMs < 48 * 60 * 60 * 1000) {
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: job.client_id, action: "review_shortlist_24h", title: `Your shortlist is ready: ${job.title}`, body: "Your recruiter prepared a reviewed shortlist. Take a look and tell us who you would like to move forward.", href: `/workspace/client/candidates?role=${job.id}`, repeatDays: 30 })) client24h++;
    } else if (ageMs >= 48 * 60 * 60 * 1000) {
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: job.client_id, action: "review_shortlist_48h", title: `Candidate availability can change: ${job.title}`, body: "Your reviewed candidates are still waiting for feedback. Please review the shortlist while availability is current.", href: `/workspace/client/candidates?role=${job.id}`, repeatDays: 30 })) client48h++;
    }
  }

  for (const interview of interviews || []) {
    if (interview.status !== "requested" || new Date(interview.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000) continue;
    const job: any = jobMap.get(interview.job_id);
    if (await sendWorkflowReminder(admin, {
      subjectType: "job",
      subjectId: interview.job_id,
      recipientId: interview.client_id,
      action: `schedule_interview_${interview.id}`,
      title: `Schedule the requested interview${job?.title ? `: ${job.title}` : ""}`,
      body: "You requested an interview but have not chosen a time yet. Open Interviews to schedule it so the VA can prepare.",
      href: "/workspace/client/interviews",
      repeatDays: 1
    })) interviewScheduleNudges++;
  }

  for (const offer of offers || []) {
    const job: any = jobMap.get(offer.job_id);
    if (offer.status === "pending_va" && new Date(offer.created_at).getTime() <= Date.now() - 24 * 60 * 60 * 1000) {
      if (await sendWorkflowReminder(admin, {
        subjectType: "job",
        subjectId: offer.job_id,
        recipientId: offer.va_id,
        action: `placement_offer_va_${offer.id}`,
        title: `Placement offer waiting${job?.title ? `: ${job.title}` : ""}`,
        body: "A placement offer is waiting for your review. Open Offers to review the final rate, hours, schedule, and start date.",
        href: "/workspace/va/offers",
        repeatDays: 2
      })) offerNudges++;
    }
    if (offer.status === "pending_client" && offer.va_accepted_at && new Date(offer.va_accepted_at).getTime() <= Date.now() - 24 * 60 * 60 * 1000) {
      if (await sendWorkflowReminder(admin, {
        subjectType: "job",
        subjectId: offer.job_id,
        recipientId: offer.client_id,
        action: `placement_offer_client_${offer.id}`,
        title: `Confirm the placement${job?.title ? `: ${job.title}` : ""}`,
        body: "The VA accepted the placement offer. Open Offers to confirm the final placement and start onboarding.",
        href: "/workspace/client/offers",
        repeatDays: 2
      })) offerNudges++;
    }
  }

  for (const application of apps || []) {
    if (new Date(application.updated_at).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000) continue;
    const pair = `${application.job_id}:${application.va_id}`;
    const managedByCanonicalFlow = canonicalApplicationIds.has(application.id)
      || (application.status === "interview" && interviewPairs.has(pair))
      || (application.status === "offered" && offerPairs.has(pair));
    if (managedByCanonicalFlow) continue;
    if (await sendWorkflowReminder(admin, { subjectType: "application", subjectId: application.id, recipientId: application.va_id, action: "application_follow_up", title: "Your application has an update waiting", body: `Your application is still in the ${application.status} stage. Check the role and messages for any next steps.`, href: "/workspace/va/applications" })) vaNudges++;
  }
  return { recruiterNudges, client24h, client48h, vaNudges, interviewScheduleNudges, offerNudges };
}

async function runTalentHealthNudges(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin.rpc("recruiter_talent_health");
  if (error) throw error;
  const stale = (Array.isArray(data) ? data : []).filter((row: any) => row.health === "Stale").slice(0, 200);
  let sent = 0;
  for (const row of stale) {
    if (await sendWorkflowReminder(admin, {
      subjectType: "va",
      subjectId: row.va_id,
      recipientId: row.va_id,
      action: "monthly_profile_update",
      title: "Please refresh your VA profile",
      body: "Your vetted profile has not been updated recently. Confirm your current skills, rate, hours, and availability so recruiters can match you accurately.",
      href: "/workspace/va/profile",
      repeatDays: 30
    })) sent++;
  }
  return { staleChecked: stale.length, sent };
}

async function runSalesCrmReminders(admin: ReturnType<typeof createAdminClient>) {
  const now = new Date().toISOString();
  const proposalCutoff = daysAgo(2);
  const [{ data: staff }, { data: leads }, { data: proposals }] = await Promise.all([
    admin.from("profiles").select("id").in("role", ["recruiter", "admin"]).eq("account_status", "active"),
    admin.from("lead_intake").select("id,name,company,crm_stage,owner_id,next_follow_up_at").in("crm_stage", ["new","contacted","discovery_booked","qualified","shortlist_sent","nurture"]).not("next_follow_up_at", "is", null).lte("next_follow_up_at", now).gte("next_follow_up_at", daysAgo(14)).limit(300),
    admin.from("lead_proposals").select("id,lead_id,role_title,status,sent_at,viewed_at").eq("status", "sent").not("sent_at", "is", null).lte("sent_at", proposalCutoff).gte("sent_at", daysAgo(30)).limit(300)
  ]);
  const staffIds = (staff || []).map((row: any) => row.id);
  const leadIds = [...new Set((proposals || []).map((row: any) => row.lead_id))];
  const { data: proposalLeads } = leadIds.length ? await admin.from("lead_intake").select("id,name,company,owner_id").in("id", leadIds) : { data: [] as any[] };
  const proposalLeadMap = new Map((proposalLeads || []).map((row: any) => [row.id, row]));

  let leadReminders = 0;
  for (const lead of leads || []) {
    const recipients = lead.owner_id ? [lead.owner_id] : staffIds;
    for (const recipientId of recipients) {
      if (await sendWorkflowReminder(admin, { subjectType: "lead", subjectId: lead.id, recipientId, action: "sales_follow_up_due", title: `Sales follow-up due: ${lead.company || lead.name || "client lead"}`, body: `This ${String(lead.crm_stage || "open").replaceAll("_", " ")} opportunity is due for follow-up now.`, href: "/workspace/recruiter/leads?view=attention", repeatDays: 1 })) leadReminders++;
    }
  }

  let proposalReminders = 0;
  for (const proposal of proposals || []) {
    const lead: any = proposalLeadMap.get(proposal.lead_id);
    const recipients = lead?.owner_id ? [lead.owner_id] : staffIds;
    for (const recipientId of recipients) {
      if (await sendWorkflowReminder(admin, {
        subjectType: "proposal", subjectId: proposal.id, recipientId,
        action: proposal.viewed_at ? "viewed_proposal_open" : "proposal_not_viewed",
        title: proposal.viewed_at ? `Viewed proposal still open: ${proposal.role_title}` : `Proposal not viewed: ${proposal.role_title}`,
        body: proposal.viewed_at ? `${lead?.company || lead?.name || "The client"} viewed the proposal but has not responded. Follow up while intent is still warm.` : `${lead?.company || lead?.name || "The client"} has not viewed the proposal sent at least two days ago.`,
        href: "/workspace/recruiter/leads?view=qualified", repeatDays: 2
      })) proposalReminders++;
    }
  }
  return { leadReminders, proposalReminders };
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { autoQuoteStraightforwardJobs } = await import("@/lib/auto-publish");
  const quoteResult = await autoQuoteStraightforwardJobs();
  const [nudgeResult, staleResult, leadNudgeResult, matchResult, workflowResult, talentHealthResult, salesReminderResult, discoveryReminderResult, indexNowResult] = await Promise.all([
    runProfileNudges(admin),
    runStaleVaCleanup(admin),
    runLeadClaimNudges(admin),
    runPendingJobMatching(admin),
    runWorkflowReminders(admin),
    runTalentHealthNudges(admin),
    runSalesCrmReminders(admin),
    runDiscoveryBookingReminders(admin),
    runIndexNowSubmission(admin)
  ]);

  return NextResponse.json({ ok: true, quoting: quoteResult, nudges: nudgeResult, staleCleanup: staleResult, leadNudges: leadNudgeResult, matching: matchResult, workflowReminders: workflowResult, talentHealth: talentHealthResult, salesReminders: salesReminderResult, discoveryReminders: discoveryReminderResult, indexNow: indexNowResult });
}
