"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { matchAssessment } from "@/lib/matching";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { queueInterviewSchedulingAutomation } from "@/lib/trigger-automation";
import { resolveInterviewSchedulingIfClear, resolveShortlistReviewIfComplete } from "@/lib/hiring-pipeline-automation";

const CLIENT_DECISIONS = new Set(["interested", "interview", "hold", "pass"]);
const HOLD_REASONS = new Set(["need_more_information", "comparing_candidates", "rate_concern", "schedule_timezone_concern", "team_approval", "other"]);
const PASS_REASONS = new Set(["skills", "rate", "schedule_timezone", "experience", "communication_video", "industry_fit", "availability", "other"]);
const AVAILABILITY_FRESH_DAYS = 30;

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function redirectWithFlag(path: string, flag: string) {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${flag}=1`);
}

function cleanNote(value: FormDataEntryValue | null, max = 500) {
  return String(value || "").trim().slice(0, max) || null;
}

function reasonLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}


async function resolveClientShortlistFollowups(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  jobId: string,
  force = false,
) {
  let canResolve = force;
  if (!force) {
    const { count, error } = await admin
      .from("job_shortlist_candidates")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .eq("shortlist_status", "released")
      .or("client_decision.is.null,client_decision.eq.hold");
    if (error) throw error;
    canResolve = Number(count || 0) === 0;
  }
  if (!canResolve) return;

  const now = new Date().toISOString();
  const { error } = await admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", clientId)
    .eq("type", "shortlist_followup")
    .eq("href", `/workspace/client/candidates?role=${jobId}`)
    .is("done_at", null);
  if (error) throw error;
}

async function resolveRecruiterClientReviewNotifications(
  admin: ReturnType<typeof createAdminClient>,
  jobId: string,
) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("type", "client_review")
    .like("href", `/workspace/recruiter/roles/${jobId}%`)
    .is("done_at", null);
  if (error) throw error;
}

async function resolveVaInterviewRequestNotification(
  admin: ReturnType<typeof createAdminClient>,
  vaId: string,
  jobTitle: string,
) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", vaId)
    .eq("type", "interview")
    .eq("href", "/workspace/va/interviews")
    .eq("title", `Interview requested for ${jobTitle}`)
    .is("done_at", null);
  if (error) throw error;
}

async function requireApprovedVa(vaId: string) {
  const admin = createAdminClient();
  const { data: vetting } = await admin
    .from("recruiter_va_directory")
    .select("user_id,stage")
    .eq("user_id", vaId)
    .maybeSingle();
  if (!vetting || !["approved", "bench"].includes(String(vetting.stage || ""))) {
    throw new Error("This VA is no longer approved or on the recruiter bench.");
  }
  return admin;
}

export async function saveClientRecommendationAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("recommendation_va_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/roles/${jobId}` : `/workspace/admin/jobs/${jobId}`);
  if (!jobId || !vaId) throw new Error("Role and VA are required.");
  const recommendation = cleanNote(formData.get(`recommendation_${vaId}`));
  const admin = await requireApprovedVa(vaId);
  const [{ data: job }, { data: va }, { data: existing }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).single(),
    admin.from("va_profiles").select("*").eq("user_id", vaId).single(),
    admin.from("job_shortlist_candidates").select("shortlist_status,released_at").eq("job_id", jobId).eq("va_id", vaId).maybeSingle()
  ]);
  if (!job || !va) throw new Error("Role or VA profile was not found.");
  const assessment = matchAssessment(job, va);
  const status = existing?.shortlist_status === "released" ? "released" : "proposed";
  const { error } = await admin.from("job_shortlist_candidates").upsert({
    job_id: jobId,
    va_id: vaId,
    match_score: assessment.score,
    match_confidence: assessment.confidence,
    shortlist_status: status,
    client_recommendation: recommendation,
    created_by: user.id,
    released_at: status === "released" ? existing?.released_at || new Date().toISOString() : null
  }, { onConflict: "job_id,va_id" });
  if (error) throw error;
  await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: "client_recommendation_saved", description: recommendation ? `Client-facing recommendation updated for ${job.title}` : `Client-facing recommendation cleared for ${job.title}`, actorId: user.id, metadata: { job_id: jobId } });
  revalidatePath(returnTo);
  revalidatePath(`/workspace/client/candidates`);
  redirectWithFlag(returnTo, "recommendation_saved");
}

export async function requestVaAvailabilityConfirmationAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("availability_va_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/roles/${jobId}` : `/workspace/admin/jobs/${jobId}`);
  if (!vaId) throw new Error("VA is required.");
  const admin = await requireApprovedVa(vaId);
  const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("recruiter_activity").select("id", { count: "exact", head: true }).eq("subject_type", "va").eq("subject_id", vaId).eq("action", "availability_confirmation_requested").gte("created_at", cutoff);
  if (!count) {
    await admin.from("notifications").insert({ user_id: vaId, title: "Please confirm your availability", body: "A recruiter is considering you for a client role. Please review your profile availability, weekly hours, and schedule so the team can present accurate information.", href: "/workspace/va/profile" });
    await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: "availability_confirmation_requested", description: "Asked VA to reconfirm availability", actorId: user.id, metadata: jobId ? { job_id: jobId } : {} });
  }
  revalidatePath(returnTo);
  redirectWithFlag(returnTo, "availability_requested");
}

export async function markVaAvailabilityConfirmedAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("availability_va_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/roles/${jobId}` : `/workspace/admin/jobs/${jobId}`);
  if (!vaId) throw new Error("VA is required.");
  const admin = await requireApprovedVa(vaId);
  const now = new Date().toISOString();
  const { error } = await admin.from("va_profiles").update({ availability_confirmed_at: now }).eq("user_id", vaId);
  if (error) throw error;
  await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: "availability_confirmed", description: `Availability confirmed for the next ${AVAILABILITY_FRESH_DAYS} days`, actorId: user.id, metadata: jobId ? { job_id: jobId } : {} });
  revalidatePath(returnTo);
  revalidatePath("/workspace/recruiter/talent");
  redirectWithFlag(returnTo, "availability_confirmed");
}

export async function clientShortlistDecisionAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("va_id") || "");
  const decision = String(formData.get("decision") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/client/candidates?role=${encodeURIComponent(jobId)}`);
  if (!jobId || !vaId || !CLIENT_DECISIONS.has(decision)) throw new Error("Invalid shortlist decision.");

  const holdReason = String(formData.get("hold_reason") || "");
  const passReason = String(formData.get("pass_reason") || "");
  const otherNote = cleanNote(formData.get("decision_note"), 300);
  if (decision === "hold" && holdReason && !HOLD_REASONS.has(holdReason)) throw new Error("Invalid hold reason.");
  if (decision === "pass" && passReason && !PASS_REASONS.has(passReason)) throw new Error("Invalid pass reason.");
  const decisionNote = decision === "hold"
    ? [holdReason ? reasonLabel(holdReason) : null, otherNote].filter(Boolean).join(": ").slice(0, 500) || null
    : decision === "pass"
      ? [passReason ? reasonLabel(passReason) : null, otherNote].filter(Boolean).join(": ").slice(0, 500) || null
      : otherNote;

  const admin = createAdminClient();
  const [{ data: job }, { data: access }, { data: shortlist }] = await Promise.all([
    admin.from("jobs").select("id,title,client_id,recruiter_id,status,hiring_stage").eq("id", jobId).eq("client_id", user.id).single(),
    admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id,client_decision,client_decision_note").eq("job_id", jobId).eq("va_id", vaId).eq("shortlist_status", "released").maybeSingle()
  ]);
  if (!job || job.status !== "published") throw new Error("This role is not open for client review.");
  if (!candidateAccessUnlocked(access?.access_status)) throw new Error("Candidate access must be active before recording a shortlist decision.");
  if (!shortlist) throw new Error("This VA is not in the released shortlist.");
  if (shortlist.client_decision === decision && (shortlist.client_decision_note || null) === decisionNote) redirectWithFlag(returnTo, "decision_saved");

  const now = new Date().toISOString();
  const { error } = await admin.from("job_shortlist_candidates").update({ client_decision: decision, client_decision_note: decisionNote, client_decision_at: now }).eq("id", shortlist.id);
  if (error) throw error;

  let interviewCreated = false;
  let interviewId: string | null = null;
  let interviewRequestedAt: string | null = null;
  if (decision === "interview") {
    const { data: existingInterview, error: existingInterviewError } = await admin
      .from("candidate_interviews")
      .select("id,status")
      .eq("job_id", jobId)
      .eq("va_id", vaId)
      .neq("status", "cancelled")
      .maybeSingle();
    if (existingInterviewError) throw existingInterviewError;

    interviewId = existingInterview?.id || null;
    if (!existingInterview) {
      const { data: createdInterview, error: interviewError } = await admin.from("candidate_interviews").insert({
        job_id: jobId,
        va_id: vaId,
        client_id: user.id,
        shortlist_candidate_id: shortlist.id,
        status: "requested"
      }).select("id,created_at").single();

      if (interviewError?.code === "23505") {
        const { data: concurrentInterview, error: concurrentError } = await admin
          .from("candidate_interviews")
          .select("id")
          .eq("job_id", jobId)
          .eq("va_id", vaId)
          .neq("status", "cancelled")
          .maybeSingle();
        if (concurrentError) throw concurrentError;
        interviewId = concurrentInterview?.id || null;
      } else if (interviewError) {
        throw interviewError;
      } else {
        interviewId = createdInterview?.id || null;
        interviewRequestedAt = createdInterview?.created_at || null;
        interviewCreated = true;
      }
    }

    if (!interviewId) throw new Error("The interview request could not be created.");
    if (interviewCreated) {
      await resolveVaInterviewRequestNotification(admin, vaId, job.title);
      await admin.from("notifications").insert({
        user_id: vaId,
        title: `Interview requested for ${job.title}`,
        body: "A client would like to interview you. Open Interviews for scheduling details and the next step.",
        href: "/workspace/va/interviews",
        type: "interview",
        priority: "high"
      });
    }
    await admin.from("jobs").update({ hiring_stage: "interviewing", hiring_stage_entered_at: now }).eq("id", jobId).in("hiring_stage", ["client_review", "internal_review"]);

    if (interviewCreated && interviewId && interviewRequestedAt) {
      try {
        await queueInterviewSchedulingAutomation(interviewId, interviewRequestedAt);
      } catch (automationError) {
        console.error("[automation] interview scheduling queue failed", {
          interviewId,
          jobId,
          error: automationError instanceof Error ? automationError.message : String(automationError),
        });
      }
    }
  } else if (shortlist.client_decision === "interview") {
    await admin
      .from("candidate_interviews")
      .update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .eq("job_id", jobId)
      .eq("va_id", vaId)
      .eq("status", "requested")
      .is("scheduled_at", null);
    await resolveVaInterviewRequestNotification(admin, vaId, job.title);
    try {
      await resolveInterviewSchedulingIfClear(admin, jobId);
    } catch (automationError) {
      console.error("[automation] interview scheduling cleanup failed", {
        jobId,
        error: automationError instanceof Error ? automationError.message : String(automationError),
      });
    }
  }

  await recordProductEvent("client_shortlist_decision", {
    userId: user.id,
    path: returnTo,
    metadata: { job_id: jobId, va_id: vaId, decision, interview_id: interviewId },
  });
  if (decision === "interview") {
    await recordProductEvent("interview_requested", {
      userId: user.id,
      path: returnTo,
      metadata: { job_id: jobId, va_id: vaId, interview_id: interviewId, created: interviewCreated },
    });
  }

  const label = decision === "interested"
    ? "marked a VA interested"
    : decision === "interview"
      ? "requested an interview"
      : decision === "hold"
        ? "placed a shortlist candidate on hold"
        : "passed on a shortlist candidate";
  try {
    await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: `client_shortlist_${decision}`, description: `Client ${label}`, actorId: user.id, metadata: { va_id: vaId, reason: decisionNote, interview_created: interviewCreated, interview_id: interviewId } });
    await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: `client_shortlist_${decision}`, description: `Client ${label} for ${job.title}`, actorId: user.id, metadata: { job_id: jobId, reason: decisionNote, interview_id: interviewId } });
  } catch {}
  await resolveClientShortlistFollowups(admin, user.id, jobId);
  try {
    await resolveShortlistReviewIfComplete(admin, jobId);
  } catch (automationError) {
    console.error("[automation] shortlist review cleanup failed", {
      jobId,
      error: automationError instanceof Error ? automationError.message : String(automationError),
    });
  }

  const notificationTitle = decision === "interview"
    ? "Client requested an interview"
    : decision === "interested"
      ? "Client marked a VA interested"
      : decision === "hold"
        ? "Client placed a VA on hold"
        : "Client passed on a VA";
  await resolveRecruiterClientReviewNotifications(admin, jobId);
  await resolveRecruiterClientReviewNotifications(admin, jobId);
  const recipientIds = new Set<string>();
  if (job.recruiter_id) recipientIds.add(String(job.recruiter_id));
  if (!recipientIds.size) {
    const { data: recruiters } = await admin.from("profiles").select("id").eq("role", "recruiter");
    for (const row of recruiters || []) recipientIds.add(String(row.id));
  }
  if (recipientIds.size) {
    await admin.from("notifications").insert([...recipientIds].map((id) => ({
      user_id: id,
      title: notificationTitle,
      body: `${job.title}: client feedback was recorded${decisionNote ? ` (${decisionNote})` : ""}.`,
      href: `/workspace/recruiter/roles/${jobId}`,
      type: "client_review",
      priority: decision === "interview" ? "high" : "normal"
    })));
  }

  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath("/workspace/client/candidates");
  revalidatePath("/workspace/client/interviews");
  revalidatePath("/workspace/va/interviews");
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath("/workspace/recruiter/matching");
  if (decision === "interview") redirect("/workspace/client/interviews?requested=1");
  redirectWithFlag(returnTo, "decision_saved");
}

export async function clientRequestMoreOptionsAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "");
  const note = cleanNote(formData.get("decision_note"), 300);
  const returnTo = safeReturnTo(
    formData.get("return_to"),
    `/workspace/client/candidates?role=${encodeURIComponent(jobId)}#recruiter-shortlist`
  );
  if (!jobId) throw new Error("Role is required.");

  const admin = createAdminClient();
  const [{ data: job }, { data: access }, { count: releasedCount }, { data: latestRequest }] = await Promise.all([
    admin
      .from("jobs")
      .select("id,title,client_id,recruiter_id,status,hiring_stage")
      .eq("id", jobId)
      .eq("client_id", user.id)
      .maybeSingle(),
    admin
      .from("job_candidate_access")
      .select("access_status")
      .eq("job_id", jobId)
      .maybeSingle(),
    admin
      .from("job_shortlist_candidates")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .eq("shortlist_status", "released"),
    admin
      .from("recruiter_activity")
      .select("id,created_at")
      .eq("subject_type", "job")
      .eq("subject_id", jobId)
      .eq("actor_id", user.id)
      .eq("action", "client_more_options_requested")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!job || job.status !== "published") throw new Error("This role is not open for client review.");
  if (!candidateAccessUnlocked(access?.access_status)) throw new Error("Candidate access must be active before requesting more options.");
  if (!releasedCount) throw new Error("There is no released shortlist to request replacements for.");

  const recentCutoff = Date.now() - 5 * 60 * 1000;
  if (latestRequest?.created_at && new Date(latestRequest.created_at).getTime() >= recentCutoff) {
    redirectWithFlag(returnTo, "more_options_requested");
  }

  const now = new Date().toISOString();
  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: jobId,
    action: "client_more_options_requested",
    description: note ? `Client requested more options: ${note}` : "Client requested more candidate options",
    actorId: user.id,
    metadata: { note },
  });

  if (["client_review", "internal_review"].includes(String(job.hiring_stage || ""))) {
    await admin
      .from("jobs")
      .update({ hiring_stage: "sourcing", hiring_stage_entered_at: now, updated_at: now })
      .eq("id", jobId)
      .eq("client_id", user.id);
  }

  const recipientIds = new Set<string>();
  if (job.recruiter_id) recipientIds.add(String(job.recruiter_id));
  if (!recipientIds.size) {
    const { data: recruiters } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "recruiter")
      .eq("account_status", "active");
    for (const row of recruiters || []) recipientIds.add(String(row.id));
  }

  if (recipientIds.size) {
    await admin.from("notifications").insert([...recipientIds].map((id) => ({
      user_id: id,
      title: "Client needs more candidate options",
      body: `${job.title}: the client asked for more options${note ? ` (${note})` : ""}.`,
      href: `/workspace/recruiter/roles/${jobId}#matching`,
      type: "client_review",
      priority: "high",
    })));
  }

  await recordProductEvent("client_more_options_requested", {
    userId: user.id,
    path: returnTo,
    metadata: { job_id: jobId, note: note || null },
  });

  await resolveClientShortlistFollowups(admin, user.id, jobId, true);
  try {
    await resolveShortlistReviewIfComplete(admin, jobId, true);
  } catch (automationError) {
    console.error("[automation] shortlist review force cleanup failed", {
      jobId,
      error: automationError instanceof Error ? automationError.message : String(automationError),
    });
  }

  revalidatePath("/workspace/client/candidates");
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath("/workspace/recruiter/roles");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/recruiter/today");
  redirectWithFlag(returnTo, "more_options_requested");
}

export async function clientShortlistMessageAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("va_id") || "");
  const message = String(formData.get("message") || "").trim().slice(0, 500);
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/client/candidates?role=${encodeURIComponent(jobId)}`);
  if (!jobId || !vaId || message.length < 2) throw new Error("Add a short message for your recruiter.");

  const admin = createAdminClient();
  const [{ data: job }, { data: shortlist }] = await Promise.all([
    admin.from("jobs").select("id,title,client_id,recruiter_id,status").eq("id", jobId).eq("client_id", user.id).single(),
    admin.from("job_shortlist_candidates").select("id").eq("job_id", jobId).eq("va_id", vaId).eq("shortlist_status", "released").maybeSingle(),
  ]);
  if (!job || job.status !== "published") throw new Error("This role is not open for client review.");
  if (!shortlist) throw new Error("This VA is not in the released shortlist.");

  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: jobId,
    action: "client_shortlist_message",
    description: message,
    actorId: user.id,
    metadata: { va_id: vaId },
  });
  await writeRecruiterActivity({
    subjectType: "va",
    subjectId: vaId,
    action: "client_shortlist_message",
    description: message,
    actorId: user.id,
    metadata: { job_id: jobId },
  });

  const recipientIds = new Set<string>();
  if (job.recruiter_id) recipientIds.add(String(job.recruiter_id));
  if (!recipientIds.size) {
    const { data: recruiters } = await admin.from("profiles").select("id").eq("role", "recruiter");
    for (const row of recruiters || []) recipientIds.add(String(row.id));
  }
  if (recipientIds.size) {
    await admin.from("notifications").insert([...recipientIds].map((id) => ({
      user_id: id,
      title: "Client sent shortlist feedback",
      body: `${job.title}: ${message}`,
      href: `/workspace/recruiter/roles/${jobId}`,
      type: "client",
      priority: "normal",
    })));
  }

  await recordProductEvent("client_shortlist_message", {
    userId: user.id,
    path: returnTo,
    metadata: { job_id: jobId, va_id: vaId },
  });

  revalidatePath("/workspace/client/candidates");
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  redirectWithFlag(returnTo, "message_sent");
}

export async function sendClientShortlistFollowupAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), "/workspace/recruiter/matching?view=waiting_client");
  if (!jobId) throw new Error("Role is required.");
  const admin = createAdminClient();
  const [{ data: job }, { count: releasedCount }] = await Promise.all([
    admin.from("jobs").select("id,title,client_id,status").eq("id", jobId).single(),
    admin.from("job_shortlist_candidates").select("id", { count: "exact", head: true }).eq("job_id", jobId).eq("shortlist_status", "released")
  ]);
  if (!job?.client_id || !releasedCount) throw new Error("This role does not have a released client shortlist.");
  if (job.status === "closed") throw new Error("This role is already closed.");
  const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("recruiter_activity").select("id", { count: "exact", head: true }).eq("subject_type", "job").eq("subject_id", jobId).eq("action", "client_shortlist_followup").gte("created_at", cutoff);
  if (!count) {
    await admin.from("notifications").insert({ user_id: job.client_id, title: `Quick feedback needed for ${job.title}`, body: "Your recruiter is waiting on your shortlist feedback. Mark each VA as Interested, Interview, or Pass, or ask for more options so we can keep your search moving.", href: `/workspace/client/candidates?role=${encodeURIComponent(jobId)}` });
    await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "client_shortlist_followup", description: "Sent client shortlist feedback reminder", actorId: user.id });
  }
  revalidatePath(returnTo);
  redirectWithFlag(returnTo, "followup_sent");
}
