"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { matchAssessment } from "@/lib/matching";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRowApprovable } from "@/lib/public-visibility";

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

async function requireApprovedVa(vaId: string) {
  const admin = createAdminClient();
  const { data: vetting } = await admin
    .from("recruiter_va_directory")
    .select("user_id,stage,completion_score")
    .eq("user_id", vaId)
    .maybeSingle();
  if (!vetting || !["approved", "bench"].includes(String(vetting.stage || "")) || !isRowApprovable(vetting)) {
    throw new Error("This VA is no longer eligible for client matching. Approved VAs must still have at least 60% profile completion.");
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
    admin.from("jobs").select("id,title,client_id,status").eq("id", jobId).eq("client_id", user.id).single(),
    admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id,client_decision").eq("job_id", jobId).eq("va_id", vaId).eq("shortlist_status", "released").maybeSingle()
  ]);
  if (!job || job.status !== "published") throw new Error("This role is not open for client review.");
  if (!candidateAccessUnlocked(access?.access_status)) throw new Error("Candidate access must be active before recording a shortlist decision.");
  if (!shortlist) throw new Error("This VA is not in the released shortlist.");
  if (shortlist.client_decision === decision && decision === "interested") redirectWithFlag(returnTo, "decision_saved");

  const now = new Date().toISOString();
  const { error } = await admin.from("job_shortlist_candidates").update({ client_decision: decision, client_decision_note: decisionNote, client_decision_at: now }).eq("id", shortlist.id);
  if (error) throw error;

  let interviewCreated = false;
  let interviewId: string | null = null;
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
      }).select("id").single();

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
        interviewCreated = true;
      }
    }

    if (!interviewId) throw new Error("The interview request could not be created.");
    if (interviewCreated) {
      await admin.from("notifications").insert({
        user_id: vaId,
        title: `Interview requested for ${job.title}`,
        body: "A client would like to interview you. Open Interviews for scheduling details and the next step.",
        href: "/workspace/va/interviews",
        type: "interview",
        priority: "high"
      });
    }
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
  const { data: recruiters } = await admin.from("profiles").select("id").eq("role", "recruiter");
  if (recruiters?.length) {
    const notificationTitle = decision === "interview"
      ? "Client requested an interview"
      : decision === "interested"
        ? "Client marked a VA interested"
        : decision === "hold"
          ? "Client placed a VA on hold"
          : "Client passed on a VA";
    await admin.from("notifications").insert(recruiters.map((row: any) => ({ user_id: row.id, title: notificationTitle, body: `${job.title}: client feedback was recorded${decisionNote ? ` (${decisionNote})` : ""}.`, href: `/workspace/recruiter/roles/${jobId}` })));
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
    await admin.from("notifications").insert({ user_id: job.client_id, title: `Quick feedback needed for ${job.title}`, body: "Your recruiter is waiting on your shortlist feedback. Mark each VA as interested, request an interview, place them on hold with context, or pass so we can keep your search moving.", href: `/workspace/client/candidates?role=${encodeURIComponent(jobId)}` });
    await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "client_shortlist_followup", description: "Sent client shortlist feedback reminder", actorId: user.id });
  }
  revalidatePath(returnTo);
  redirectWithFlag(returnTo, "followup_sent");
}
