import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClaimDraftEmail, sendTransactionalEventEmail } from "@/lib/email";
import { submitToIndexNow } from "@/lib/indexnow";
import { BLOG_POSTS, blogHref } from "@/lib/blog";
import { syncPublicTalentEmbeddings } from "@/lib/talent-search";

// Daily maintenance is deliberately idempotent. Matching can create recruiter
// suggestions, reminders can nudge people, but no automation may release a VA
// to a client or make a hiring/rejection decision.
const NUDGE_GRACE_DAYS = 2;
const NUDGE_REPEAT_DAYS = 7;
const ABANDONED_VA_DAYS = 10;
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

async function runAbandonedVaCleanup(admin: ReturnType<typeof createAdminClient>) {
  const cutoff = daysAgo(ABANDONED_VA_DAYS);
  const { data: candidates } = await admin
    .from("recruiter_va_directory")
    .select("user_id,completion_score,account_created_at")
    .eq("account_status", "active")
    .lt("completion_score", 100)
    .lte("account_created_at", cutoff)
    .limit(500);

  const ids = (candidates || []).map((row: any) => row.user_id);
  if (!ids.length) return { checked: 0, deleted: 0, protected: 0 };

  const [{ data: vetting }, { data: applications }, { data: workrooms }, { data: offers }, { data: profiles }] = await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("va_id", ids).in("stage", ["approved", "bench"]),
    admin.from("applications").select("va_id").in("va_id", ids),
    admin.from("workrooms").select("va_id").in("va_id", ids),
    admin.from("placement_offers").select("va_id").in("va_id", ids),
    admin.from("profiles").select("id,role").in("id", ids)
  ]);

  const protectedIds = new Set<string>([
    ...(vetting || []).map((row: any) => row.va_id),
    ...(applications || []).map((row: any) => row.va_id),
    ...(workrooms || []).map((row: any) => row.va_id),
    ...(offers || []).map((row: any) => row.va_id),
    ...(profiles || []).filter((row: any) => row.role !== "va").map((row: any) => row.id)
  ]);

  let deleted = 0;
  let storageObjectsDeleted = 0;
  let storageCleanupFailures = 0;
  for (const userId of ids) {
    if (protectedIds.has(userId)) continue;

    // Never delete Auth if Storage cleanup is uncertain. Otherwise a transient
    // Storage failure can orphan a VA's CV/photo after the database cascades.
    let storageCleanupFailed = false;
    for (const bucket of ["avatars", "resumes"]) {
      const { data: objects, error: listError } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
      if (listError) {
        storageCleanupFailed = true;
        break;
      }
      const paths = (objects || []).filter((object) => object.name).map((object) => `${userId}/${object.name}`);
      if (paths.length) {
        const { error: storageError } = await admin.storage.from(bucket).remove(paths);
        if (storageError) {
          storageCleanupFailed = true;
          break;
        }
        storageObjectsDeleted += paths.length;
      }
    }
    if (storageCleanupFailed) {
      storageCleanupFailures++;
      continue;
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) deleted++;
  }
  return { checked: ids.length, deleted, protected: protectedIds.size, storageObjectsDeleted, storageCleanupFailures };
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

type ReminderSubject = "job" | "application" | "lead" | "proposal" | "va" | "training";
async function sendWorkflowReminder(admin: ReturnType<typeof createAdminClient>, args: { subjectType: ReminderSubject; subjectId: string; recipientId: string; action: string; title: string; body: string; href: string; repeatDays?: number; maxReminders?: number; email?: boolean; emailPriority?: "critical" | "standard" | "low"; emailEventType?: string; emailHrefLabel?: string }) {
  const repeatCutoff = daysAgo(args.repeatDays || WORKFLOW_REMINDER_REPEAT_DAYS);
  const { data: previous } = await admin.from("workflow_reminders").select("reminder_count,last_sent_at").eq("subject_type", args.subjectType).eq("subject_id", args.subjectId).eq("recipient_id", args.recipientId).eq("action", args.action).maybeSingle();
  const maxReminders = args.maxReminders ?? MAX_WORKFLOW_REMINDERS;
  if (Number(previous?.reminder_count || 0) >= maxReminders || (previous?.last_sent_at && previous.last_sent_at > repeatCutoff)) return false;
  const now = new Date().toISOString();
  const reminderCount = Number(previous?.reminder_count || 0) + 1;
  const { error } = await admin.from("workflow_reminders").upsert({ subject_type: args.subjectType, subject_id: args.subjectId, recipient_id: args.recipientId, action: args.action, reminder_count: reminderCount, last_sent_at: now, updated_at: now }, { onConflict: "subject_type,subject_id,recipient_id,action" });
  if (error) return false;
  await admin.from("notifications").insert({ user_id: args.recipientId, title: args.title, body: args.body, href: args.href });
  if (!args.email) return true;

  const { data: auth } = await admin.auth.admin.getUserById(args.recipientId);
  const recipientEmail = auth.user?.email?.trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  if (recipientEmail) {
    try {
      await sendTransactionalEventEmail({
        to: recipientEmail,
        subject: args.title,
        heading: args.title,
        body: args.body,
        href: `${appUrl}${args.href}`,
        hrefLabel: args.emailHrefLabel || "Open workspace",
        priority: args.emailPriority || "standard",
        idempotencyKey: `workflow-reminder-${args.subjectType}-${args.subjectId}-${args.action}-${reminderCount}`,
        eventType: args.emailEventType,
      });
    } catch (error) {
      console.error("[email] Workflow reminder delivery failed", error);
    }
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
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: job.client_id, action: "review_shortlist_24h", email: true, title: `Your shortlist is ready: ${job.title}`, body: "Your recruiter prepared a reviewed shortlist. Take a look and tell us who you would like to move forward.", href: `/workspace/client/candidates?role=${job.id}`, repeatDays: 30 })) client24h++;
    } else if (ageMs >= 48 * 60 * 60 * 1000) {
      if (await sendWorkflowReminder(admin, { subjectType: "job", subjectId: job.id, recipientId: job.client_id, action: "review_shortlist_48h", email: true, title: `Candidate availability can change: ${job.title}`, body: "Your reviewed candidates are still waiting for feedback. Please review the shortlist while availability is current.", href: `/workspace/client/candidates?role=${job.id}`, repeatDays: 30 })) client48h++;
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
      email: true,
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
        email: true,
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
        email: true,
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
    if (await sendWorkflowReminder(admin, { subjectType: "application", subjectId: application.id, recipientId: application.va_id, action: "application_follow_up", email: true, title: "Your application has an update waiting", body: `Your application is still in the ${application.status} stage. Check the role and messages for any next steps.`, href: "/workspace/va/applications" })) vaNudges++;
  }
  return { recruiterNudges, client24h, client48h, vaNudges, interviewScheduleNudges, offerNudges };
}

async function runTrainingResumeNudges(admin: ReturnType<typeof createAdminClient>) {
  const inactivityCutoff = daysAgo(3);
  const { data: enrollmentData } = await admin
    .from("training_enrollments")
    .select("id,user_id,course_id,started_at")
    .is("completed_at", null)
    .lte("started_at", inactivityCutoff)
    .limit(500);

  const enrollments = enrollmentData || [];
  if (!enrollments.length) return { checked: 0, eligible: 0, sent: 0 };

  const courseIds = [...new Set(enrollments.map((row: any) => row.course_id))];
  const userIds = [...new Set(enrollments.map((row: any) => row.user_id))];
  const [{ data: courseData }, { data: moduleData }, { data: assessmentData }] = await Promise.all([
    admin.from("training_courses").select("id,slug,title,status").in("id", courseIds),
    admin.from("training_modules").select("id,course_id,position").in("course_id", courseIds).order("position"),
    admin.from("training_assessments").select("id,course_id,title,position").in("course_id", courseIds).eq("is_published", true).order("position"),
  ]);

  const courses = (courseData || []).filter((course: any) => course.status === "published");
  const courseMap = new Map(courses.map((course: any) => [course.id, course]));
  const modules = moduleData || [];
  const moduleIds = modules.map((row: any) => row.id);
  const moduleMap = new Map(modules.map((row: any) => [row.id, row]));
  const { data: lessonData } = moduleIds.length
    ? await admin
        .from("training_lessons")
        .select("id,module_id,title,position")
        .in("module_id", moduleIds)
        .eq("is_published", true)
    : { data: [] as any[] };

  const lessons = (lessonData || []).sort((a: any, b: any) => {
    const am = moduleMap.get(a.module_id) as any;
    const bm = moduleMap.get(b.module_id) as any;
    return Number(am?.position || 0) - Number(bm?.position || 0) || Number(a.position || 0) - Number(b.position || 0);
  });
  const lessonIds = lessons.map((row: any) => row.id);
  const [{ data: progressData }, { data: engagementData }] = await Promise.all([
    lessonIds.length
      ? admin.from("training_lesson_progress").select("user_id,lesson_id,completed_at").in("user_id", userIds).in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    lessonIds.length
      ? admin.from("training_lesson_engagement").select("user_id,lesson_id,last_activity_at,updated_at").in("user_id", userIds).in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const completedByUser = new Map<string, Set<string>>();
  const latestActivityByUser = new Map<string, number>();
  for (const row of progressData || []) {
    const set = completedByUser.get(row.user_id) || new Set<string>();
    set.add(row.lesson_id);
    completedByUser.set(row.user_id, set);
    const timestamp = new Date(row.completed_at).getTime();
    latestActivityByUser.set(row.user_id, Math.max(latestActivityByUser.get(row.user_id) || 0, timestamp));
  }
  for (const row of engagementData || []) {
    const timestamp = new Date(row.last_activity_at || row.updated_at).getTime();
    latestActivityByUser.set(row.user_id, Math.max(latestActivityByUser.get(row.user_id) || 0, timestamp));
  }

  const lessonsByCourse = new Map<string, any[]>();
  for (const lesson of lessons) {
    const module = moduleMap.get(lesson.module_id) as any;
    if (!module?.course_id) continue;
    const list = lessonsByCourse.get(module.course_id) || [];
    list.push(lesson);
    lessonsByCourse.set(module.course_id, list);
  }
  const assessmentsByCourse = new Map<string, any[]>();
  for (const assessment of assessmentData || []) {
    const list = assessmentsByCourse.get(assessment.course_id) || [];
    list.push(assessment);
    assessmentsByCourse.set(assessment.course_id, list);
  }

  let eligible = 0;
  let sent = 0;
  for (const enrollment of enrollments as any[]) {
    const course: any = courseMap.get(enrollment.course_id);
    if (!course) continue;

    const latestActivity = Math.max(
      new Date(enrollment.started_at).getTime(),
      latestActivityByUser.get(enrollment.user_id) || 0,
    );
    if (!Number.isFinite(latestActivity) || latestActivity > Date.now() - 3 * 24 * 60 * 60 * 1000) continue;

    const courseLessons = lessonsByCourse.get(enrollment.course_id) || [];
    if (!courseLessons.length) continue;
    const completed = completedByUser.get(enrollment.user_id) || new Set<string>();
    const nextLesson = courseLessons.find((lesson: any) => !completed.has(lesson.id)) || null;
    const nextAssessment = (assessmentsByCourse.get(enrollment.course_id) || [])[0] || null;
    if (!nextLesson && !nextAssessment) continue;

    const href = nextLesson
      ? `/workspace/training/courses/${course.slug}/lessons/${nextLesson.id}`
      : `/workspace/training/courses/${course.slug}/assessments/${nextAssessment.id}`;
    const title = nextLesson
      ? `Continue ${course.title}`
      : `Your ${course.title} final check is ready`;
    const body = nextLesson
      ? completed.size
        ? `You're ${completed.size} of ${courseLessons.length} lessons complete. Continue with "${nextLesson.title}" when you're ready.`
        : `Your course is saved. Start with "${nextLesson.title}" when you're ready.`
      : "You finished every lesson. Complete the final check to finish the course and issue your certificate.";

    eligible += 1;
    if (await sendWorkflowReminder(admin, {
      subjectType: "training",
      subjectId: enrollment.course_id,
      recipientId: enrollment.user_id,
      action: "resume_training",
      title,
      body,
      href,
      repeatDays: 7,
      maxReminders: 2,
      email: true,
      emailPriority: "low",
      emailEventType: "product_training_resume_reminder",
      emailHrefLabel: "Resume training",
    })) sent += 1;
  }

  return { checked: enrollments.length, eligible, sent };
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
      email: true,
      emailPriority: "low",
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

async function runMaintenanceTask<T>(name: string, task: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[maintenance] ${name} failed`, error);
    return { error: message };
  }
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { autoQuoteStraightforwardJobs } = await import("@/lib/auto-publish");
  const [quoteResult, staleResult, leadNudgeResult, matchResult, workflowResult, trainingResumeResult, talentHealthResult, salesReminderResult, talentEmbeddingResult, indexNowResult] = await Promise.all([
    runMaintenanceTask("quoting", () => autoQuoteStraightforwardJobs()),
    runMaintenanceTask("abandoned VA cleanup", () => runAbandonedVaCleanup(admin)),
    runMaintenanceTask("lead claim nudges", () => runLeadClaimNudges(admin)),
    runMaintenanceTask("pending job matching", () => runPendingJobMatching(admin)),
    runMaintenanceTask("workflow reminders", () => runWorkflowReminders(admin)),
    runMaintenanceTask("training resume nudges", () => runTrainingResumeNudges(admin)),
    runMaintenanceTask("talent health", () => runTalentHealthNudges(admin)),
    runMaintenanceTask("sales CRM reminders", () => runSalesCrmReminders(admin)),
    runMaintenanceTask("talent embeddings", () => syncPublicTalentEmbeddings(25)),
    runMaintenanceTask("IndexNow", () => runIndexNowSubmission(admin))
  ]);
  return NextResponse.json({ ok: true, quoting: quoteResult, abandonedVaCleanup: staleResult, leadNudges: leadNudgeResult, matching: matchResult, workflowReminders: workflowResult, trainingResumeNudges: trainingResumeResult, talentHealth: talentHealthResult, salesReminders: salesReminderResult, talentEmbeddings: talentEmbeddingResult, indexNow: indexNowResult });
}
