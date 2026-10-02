import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const SHORTLIST_PREFIX = "Shortlist review ·";
const INTERVIEW_SCHEDULING_PREFIX = "Interview scheduling ·";
const INTERVIEW_FEEDBACK_PREFIX = "Interview feedback ·";
const OFFER_PREP_PREFIX = "Prepare placement offer ·";

async function activeRecruiterForJob(
  admin: AdminClient,
  job: { recruiter_id?: string | null },
) {
  if (job.recruiter_id) {
    const { data: recruiter } = await admin
      .from("profiles")
      .select("id,role,account_status")
      .eq("id", job.recruiter_id)
      .maybeSingle();
    if (
      recruiter &&
      ["recruiter", "admin"].includes(String(recruiter.role)) &&
      recruiter.account_status === "active"
    ) {
      return recruiter.id as string;
    }
  }

  const { data: fallback } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["recruiter", "admin"])
    .eq("account_status", "active")
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (fallback?.id as string | undefined) || null;
}

async function resolveTaskPrefix(
  admin: AdminClient,
  jobId: string,
  prefix: string,
) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("recruiter_tasks")
    .update({
      status: "done",
      completed_at: now,
      updated_at: now,
      snoozed_until: null,
    })
    .eq("subject_type", "job")
    .eq("subject_id", jobId)
    .eq("status", "todo")
    .ilike("title", `${prefix}%`);
  if (error) throw error;
}

async function upsertJobTask(args: {
  admin: AdminClient;
  jobId: string;
  recruiterId: string;
  prefix: string;
  title: string;
  description: string;
  href: string;
  priority: "normal" | "high" | "urgent";
}) {
  const { data: existing } = await args.admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "job")
    .eq("subject_id", args.jobId)
    .eq("status", "todo")
    .ilike("title", `${args.prefix}%`)
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  if (existing?.id) {
    const { error } = await args.admin
      .from("recruiter_tasks")
      .update({
        title: args.title,
        description: args.description,
        assignee_id: args.recruiterId,
        href: args.href,
        priority: args.priority,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { created: false as const };
  }

  const { error } = await args.admin.from("recruiter_tasks").insert({
    title: args.title,
    description: args.description,
    assignee_id: args.recruiterId,
    subject_type: "job",
    subject_id: args.jobId,
    href: args.href,
    priority: args.priority,
    status: "todo",
    repeat_rule: "none",
    due_at: now,
  });
  if (error) throw error;
  return { created: true as const };
}

async function replaceClientNotification(args: {
  admin: AdminClient;
  clientId: string;
  type: string;
  href: string;
  title: string;
  body: string;
  priority?: "normal" | "high" | "urgent";
}) {
  const now = new Date().toISOString();
  const { error: resolveError } = await args.admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", args.clientId)
    .eq("type", args.type)
    .eq("href", args.href)
    .is("done_at", null);
  if (resolveError) throw resolveError;

  const { error } = await args.admin.from("notifications").insert({
    user_id: args.clientId,
    type: args.type,
    priority: args.priority || "normal",
    title: args.title,
    body: args.body,
    href: args.href,
  });
  if (error) throw error;
}

export async function ensureShortlistReviewAction(args: {
  admin: AdminClient;
  job: {
    id: string;
    title?: string | null;
    client_id?: string | null;
    recruiter_id?: string | null;
  };
  urgent?: boolean;
}) {
  const recruiterId = await activeRecruiterForJob(args.admin, args.job);
  if (!recruiterId) return { created: false as const, reason: "no_active_recruiter" as const };

  const roleTitle = String(args.job.title || "Client role").slice(0, 110);
  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    recruiterId,
    prefix: SHORTLIST_PREFIX,
    title: `${SHORTLIST_PREFIX}${roleTitle}`,
    description: args.urgent
      ? "The client still has released candidates without a decision after 48 hours. Follow up now while candidate availability is still current."
      : "The client has released shortlist candidates waiting for a decision. Review the role and make sure the client has what they need to choose.",
    href: `/workspace/recruiter/roles/${args.job.id}#matching`,
    priority: args.urgent ? "urgent" : "high",
  });

  if (args.job.client_id) {
    await replaceClientNotification({
      admin: args.admin,
      clientId: args.job.client_id,
      type: "shortlist_followup",
      href: `/workspace/client/candidates?role=${args.job.id}`,
      title: args.urgent
        ? `Candidate availability can change: ${roleTitle}`
        : `Your shortlist is ready: ${roleTitle}`,
      body: args.urgent
        ? "Your reviewed candidates are still waiting for feedback. Please review the shortlist while availability is current."
        : "Your recruiter prepared a reviewed shortlist. Tell us who you would like to move forward.",
      priority: args.urgent ? "high" : "normal",
    });
  }

  return { ...task, reason: args.urgent ? ("shortlist_48h" as const) : ("shortlist_24h" as const) };
}

export async function resolveShortlistReviewIfComplete(
  admin: AdminClient,
  jobId: string,
  force = false,
) {
  let complete = force;
  if (!force) {
    const { count, error } = await admin
      .from("job_shortlist_candidates")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .eq("shortlist_status", "released")
      .or("client_decision.is.null,client_decision.eq.hold");
    if (error) throw error;
    complete = Number(count || 0) === 0;
  }
  if (complete) await resolveTaskPrefix(admin, jobId, SHORTLIST_PREFIX);
  return complete;
}

export async function ensureInterviewSchedulingAction(args: {
  admin: AdminClient;
  job: {
    id: string;
    title?: string | null;
    client_id?: string | null;
    recruiter_id?: string | null;
  };
  urgent?: boolean;
}) {
  const recruiterId = await activeRecruiterForJob(args.admin, args.job);
  if (!recruiterId) return { created: false as const, reason: "no_active_recruiter" as const };
  const roleTitle = String(args.job.title || "Client role").slice(0, 110);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    recruiterId,
    prefix: INTERVIEW_SCHEDULING_PREFIX,
    title: `${INTERVIEW_SCHEDULING_PREFIX}${roleTitle}`,
    description: args.urgent
      ? "An interview requested by the client is still unscheduled after 24 hours. Coordinate a time now so the candidate does not go cold."
      : "The client requested an interview but no time is scheduled yet. Help coordinate the interview while interest is fresh.",
    href: `/workspace/recruiter/roles/${args.job.id}#interviews`,
    priority: args.urgent ? "urgent" : "high",
  });

  if (args.job.client_id) {
    await replaceClientNotification({
      admin: args.admin,
      clientId: args.job.client_id,
      type: "interview",
      href: "/workspace/client/interviews",
      title: args.urgent
        ? `Interview still needs a time: ${roleTitle}`
        : `Choose an interview time: ${roleTitle}`,
      body: "You requested an interview but have not chosen a time yet. Open Interviews to schedule it so the VA can prepare.",
      priority: args.urgent ? "high" : "normal",
    });
  }

  return { ...task, reason: args.urgent ? ("scheduling_24h" as const) : ("scheduling_4h" as const) };
}

export async function resolveInterviewSchedulingIfClear(
  admin: AdminClient,
  jobId: string,
) {
  const { count, error } = await admin
    .from("candidate_interviews")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("status", "requested")
    .is("scheduled_at", null);
  if (error) throw error;
  const clear = Number(count || 0) === 0;
  if (clear) await resolveTaskPrefix(admin, jobId, INTERVIEW_SCHEDULING_PREFIX);
  return clear;
}

export async function ensureInterviewFeedbackAction(args: {
  admin: AdminClient;
  job: {
    id: string;
    title?: string | null;
    client_id?: string | null;
    recruiter_id?: string | null;
  };
  urgent?: boolean;
}) {
  const recruiterId = await activeRecruiterForJob(args.admin, args.job);
  if (!recruiterId) return { created: false as const, reason: "no_active_recruiter" as const };
  const roleTitle = String(args.job.title || "Client role").slice(0, 110);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    recruiterId,
    prefix: INTERVIEW_FEEDBACK_PREFIX,
    title: `${INTERVIEW_FEEDBACK_PREFIX}${roleTitle}`,
    description: args.urgent
      ? "The interview finished more than a day ago and client feedback is still missing. Follow up now and record Proceed, Hold, or Pass."
      : "The interview has finished but the client has not recorded feedback yet. Follow up while the conversation is still fresh.",
    href: `/workspace/recruiter/roles/${args.job.id}#interviews`,
    priority: args.urgent ? "urgent" : "high",
  });

  if (args.job.client_id) {
    await replaceClientNotification({
      admin: args.admin,
      clientId: args.job.client_id,
      type: "interview",
      href: "/workspace/client/interviews",
      title: args.urgent
        ? `Interview feedback still needed: ${roleTitle}`
        : `How did the interview go? ${roleTitle}`,
      body: "Record Proceed, Hold, or Pass so your recruiter can move the hiring process forward.",
      priority: args.urgent ? "high" : "normal",
    });
  }

  return { ...task, reason: args.urgent ? ("feedback_24h" as const) : ("feedback_2h" as const) };
}

export async function resolveInterviewFeedbackIfClear(
  admin: AdminClient,
  jobId: string,
) {
  const now = new Date().toISOString();
  const { count, error } = await admin
    .from("candidate_interviews")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("status", "scheduled")
    .is("client_feedback_at", null)
    .lte("scheduled_at", now);
  if (error) throw error;
  const clear = Number(count || 0) === 0;
  if (clear) await resolveTaskPrefix(admin, jobId, INTERVIEW_FEEDBACK_PREFIX);
  return clear;
}

export async function ensureOfferPrepAction(args: {
  admin: AdminClient;
  job: {
    id: string;
    title?: string | null;
    recruiter_id?: string | null;
  };
}) {
  const { data: activeOffer } = await args.admin
    .from("placement_offers")
    .select("id")
    .eq("job_id", args.job.id)
    .in("status", ["pending_va", "pending_client", "accepted"])
    .limit(1)
    .maybeSingle();

  if (activeOffer?.id) {
    await resolveTaskPrefix(args.admin, args.job.id, OFFER_PREP_PREFIX);
    return { created: false as const, reason: "offer_exists" as const };
  }

  const recruiterId = await activeRecruiterForJob(args.admin, args.job);
  if (!recruiterId) return { created: false as const, reason: "no_active_recruiter" as const };
  const roleTitle = String(args.job.title || "Client role").slice(0, 110);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    recruiterId,
    prefix: OFFER_PREP_PREFIX,
    title: `${OFFER_PREP_PREFIX}${roleTitle}`,
    description: "The client chose Proceed after the interview. Confirm final rate, hours, schedule, and start date, then send the placement offer to the VA.",
    href: `/workspace/recruiter/roles/${args.job.id}#interviews`,
    priority: "high",
  });

  return { ...task, reason: "prepare_offer" as const };
}

export async function resolveOfferPrepTask(
  admin: AdminClient,
  jobId: string,
) {
  await resolveTaskPrefix(admin, jobId, OFFER_PREP_PREFIX);
}
