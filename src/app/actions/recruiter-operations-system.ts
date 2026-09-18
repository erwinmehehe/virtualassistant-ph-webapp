"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { matchAssessment } from "@/lib/matching";
import { runRecruiterCopilot, type CopilotTask } from "@/lib/ai-recruiter";
import { cancelGoogleMeetDiscoveryMeeting, createGoogleMeetDiscoveryMeeting, updateGoogleMeetDiscoveryMeeting } from "@/lib/booking-operations";
import { sendTransactionalEventEmail } from "@/lib/email";
import { VETTING_SCORECARD_PASS } from "@/lib/constants";

const SCREEN_RESULTS = new Set(["client_ready", "needs_development", "role_specific", "do_not_present"]);
const INTERVIEW_DECISIONS = new Set(["proceed", "hold", "pass"]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function csv(value: FormDataEntryValue | null, max = 30) {
  return String(value || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, max);
}

function text(value: FormDataEntryValue | null, max = 2000) {
  return String(value || "").trim().slice(0, max) || null;
}

function rating(formData: FormData, name: string) {
  const value = Number(formData.get(name));
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`Rate ${name.replaceAll("_", " ")} from 1 to 5.`);
  return value;
}

async function resumeText(admin: ReturnType<typeof createAdminClient>, path?: string | null) {
  if (!path) return null;
  try {
    const { data, error } = await admin.storage.from("resumes").download(path);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    const lower = path.toLowerCase();
    if (lower.endsWith(".docx")) {
      const mammoth: any = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return String(result?.value || "").trim().slice(0, 12000) || null;
    }
    if (lower.endsWith(".pdf")) {
      const mod: any = await import("pdf-parse");
      if (typeof mod.default === "function") {
        const result = await mod.default(buffer);
        return String(result?.text || "").trim().slice(0, 12000) || null;
      }
      if (mod.PDFParse) {
        const parser = new mod.PDFParse({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === "function") await parser.destroy();
        return String(result?.text || "").trim().slice(0, 12000) || null;
      }
    }
  } catch (error) {
    console.error("[recruiter-copilot] resume extraction failed", error);
  }
  return null;
}

async function candidateEvidence(admin: ReturnType<typeof createAdminClient>, vaId: string, job?: any) {
  const [{ data: profile }, { data: va }, { data: vetting }, { data: scorecard }, { data: notes }, { data: applications }, { data: intelligence }] = await Promise.all([
    admin.from("profiles").select("id,full_name,last_active_at").eq("id", vaId).maybeSingle(),
    admin.from("va_profiles").select("*").eq("user_id", vaId).maybeSingle(),
    admin.from("va_vetting").select("stage,recruiter_notes,recruiter_interview_at,approved_at,edited_since_approval_at").eq("va_id", vaId).maybeSingle(),
    admin.from("vetting_scorecards").select("*").eq("va_id", vaId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("recruiter_notes").select("note,created_at").eq("subject_type", "va").eq("subject_id", vaId).order("created_at", { ascending: false }).limit(8),
    admin.from("applications").select("job_id,status,updated_at").eq("va_id", vaId).in("status", ["shortlisted", "interview", "offered", "hired"]),
    admin.rpc("recruiter_candidate_intelligence", { p_va_id: vaId })
  ]);
  const parsedResume = await resumeText(admin, va?.resume_path);
  const assessment = job && va ? matchAssessment(job, va) : null;
  return {
    candidate_id: vaId,
    profile: {
      headline: va?.headline,
      primary_category: va?.primary_category,
      categories: va?.categories,
      skills: va?.skills,
      tools: va?.tools,
      industries: va?.industries,
      languages: va?.languages,
      years_experience: va?.years_experience,
      weekly_hours: va?.weekly_hours,
      schedule: va?.schedule,
      overlap_hours: va?.overlap_hours,
      hourly_rate: va?.hourly_rate,
      availability_status: va?.availability_status,
      last_active_at: profile?.last_active_at
    },
    resume_text: parsedResume,
    vetting,
    latest_scorecard: scorecard,
    recruiter_notes: notes || [],
    active_client_processes: applications || [],
    history: intelligence || {},
    assessment
  };
}

export async function updateRoleHardRequirementsAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const jobId = String(formData.get("job_id") || "");
  const returnTo = safePath(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/matching/${jobId}` : `/workspace/admin/jobs/${jobId}`);
  if (!jobId) throw new Error("Role is required.");
  const minimumYearsRaw = String(formData.get("minimum_years_experience") || "").trim();
  const minimumYears = minimumYearsRaw ? Number(minimumYearsRaw) : null;
  if (minimumYears != null && (!Number.isInteger(minimumYears) || minimumYears < 0 || minimumYears > 60)) throw new Error("Minimum experience must be between 0 and 60 years.");

  const patch = {
    must_have_skills: csv(formData.get("must_have_skills")),
    nice_to_have_skills: csv(formData.get("nice_to_have_skills")),
    must_have_tools: csv(formData.get("must_have_tools")),
    required_industries: csv(formData.get("required_industries")),
    minimum_years_experience: minimumYears,
    communication_requirement: text(formData.get("communication_requirement"), 500),
    dealbreakers: csv(formData.get("dealbreakers"), 20),
    ...(profile.role === "recruiter" ? { recruiter_id: user.id } : {})
  };
  const admin = createAdminClient();
  const { data: job, error } = await admin.from("jobs").update(patch).eq("id", jobId).select("id,title").single();
  if (error || !job) throw error || new Error("Role not found.");
  await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "hard_requirements_updated", description: "Recruiter updated hard requirements and matching guardrails", actorId: user.id, metadata: patch });
  revalidatePath(returnTo);
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}requirements_saved=1`);
}

export async function submitExpandedScorecardAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const vaId = String(formData.get("va_id") || "");
  if (!vaId) throw new Error("VA is required.");
  const admin = createAdminClient();
  const { data: vetting } = await admin.from("va_vetting").select("stage,video_url").eq("va_id", vaId).single();
  if (!vetting || !["recruiter_review", "finalist", "approved", "bench"].includes(vetting.stage)) throw new Error("This VA is not ready for recruiter screening.");

  const values = {
    communication: rating(formData, "communication"),
    english: rating(formData, "english"),
    professionalism: rating(formData, "professionalism"),
    reliability: rating(formData, "reliability"),
    role_skills: rating(formData, "role_skills"),
    tool_fluency: rating(formData, "tool_fluency"),
    problem_solving: rating(formData, "problem_solving"),
    client_readiness: rating(formData, "client_readiness"),
    schedule_reliability: rating(formData, "schedule_reliability"),
    work_setup: rating(formData, "work_setup")
  };
  const screeningResult = String(formData.get("screening_result") || "");
  if (!SCREEN_RESULTS.has(screeningResult)) throw new Error("Choose a screening result.");
  const notes = text(formData.get("notes"), 5000);
  if (!notes || notes.length < 30) throw new Error("Add screening notes of at least 30 characters.");
  const total = Math.round(Object.values(values).reduce((a, b) => a + b, 0) / 50 * 100);
  if (screeningResult === "client_ready" && total < VETTING_SCORECARD_PASS) throw new Error(`Client Ready requires at least ${VETTING_SCORECARD_PASS}% overall.`);
  const recommendation = screeningResult === "client_ready" ? "finalist" : screeningResult === "do_not_present" ? "reject" : "hold";
  const now = new Date().toISOString();

  const { error } = await admin.from("vetting_scorecards").insert({
    va_id: vaId,
    reviewer_id: user.id,
    ...values,
    total_score: total,
    recommendation,
    screening_result: screeningResult,
    notes
  });
  if (error) throw error;
  await admin.from("va_vetting").upsert({
    va_id: vaId,
    recruiter_id: user.id,
    recruiter_notes: notes,
    recruiter_interview_at: now,
    stage: screeningResult === "client_ready" ? "finalist" : screeningResult === "do_not_present" ? "rejected" : "recruiter_review",
    rejected_at: screeningResult === "do_not_present" ? now : null
  }, { onConflict: "va_id" });
  await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: "screening_scorecard_saved", description: `Screening result: ${screeningResult.replaceAll("_", " ")} (${total}%)`, actorId: user.id, metadata: { total_score: total, screening_result: screeningResult } });
  revalidatePath(`/workspace/recruiter/candidates/${vaId}`);
  revalidatePath(`/workspace/recruiter/candidates/${vaId}/screening`);
  revalidatePath("/workspace/recruiter/queue");
  revalidatePath("/workspace/recruiter/today");
  redirect(`/workspace/recruiter/candidates/${vaId}/screening?saved=1`);
}

export async function generateRecruiterCopilotAction(args: { jobId: string; task: CopilotTask; vaIds?: string[] }) {
  await requireRole("recruiter");
  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("*").eq("id", args.jobId).single();
  if (!job) return { ok: false as const, error: "Role not found." };

  let vaIds = [...new Set((args.vaIds || []).filter(Boolean))].slice(0, args.task === "replacement_suggestions" ? 8 : 3);
  if (!vaIds.length && ["compare_candidates", "risk_check", "replacement_suggestions"].includes(args.task)) {
    const [{ data: vetted }, { data: profiles }, { data: existing }] = await Promise.all([
      admin.from("va_vetting").select("va_id").in("stage", ["approved", "bench"]),
      admin.from("va_profiles").select("*").eq("availability_status", "available"),
      admin.from("job_shortlist_candidates").select("va_id,shortlist_status,client_decision").eq("job_id", args.jobId)
    ]);
    const vettedSet = new Set((vetted || []).map((row: any) => row.va_id));
    const blocked = new Set((existing || []).filter((row: any) => row.shortlist_status === "hidden" || row.client_decision === "pass").map((row: any) => row.va_id));
    vaIds = (profiles || [])
      .filter((va: any) => vettedSet.has(va.user_id) && !blocked.has(va.user_id))
      .map((va: any) => ({ id: va.user_id, ...matchAssessment(job, va) }))
      .filter((entry: any) => entry.eligible && entry.score >= 40)
      .sort((a: any, b: any) => b.score - a.score || b.confidence - a.confidence)
      .slice(0, args.task === "replacement_suggestions" ? 8 : 3)
      .map((entry: any) => entry.id);
  }

  const candidates = [];
  for (const vaId of vaIds) candidates.push(await candidateEvidence(admin, vaId, job));
  const [{ data: shortlistFeedback }, { data: interviewFeedback }] = await Promise.all([
    admin.from("job_shortlist_candidates").select("va_id,client_decision,client_decision_note,client_decision_at").eq("job_id", args.jobId).not("client_decision", "is", null),
    admin.from("candidate_interviews").select("va_id,client_decision,client_feedback,client_feedback_reason,client_feedback_at").eq("job_id", args.jobId).not("client_decision", "is", null)
  ]);
  const feedback = [...(shortlistFeedback || []), ...(interviewFeedback || [])];
  const result = await runRecruiterCopilot({ task: args.task, job, candidates, feedback });
  if (result.ok) {
    await writeRecruiterActivity({ subjectType: "job", subjectId: args.jobId, action: `copilot_${args.task}`, description: `AI Recruiter Copilot generated ${args.task.replaceAll("_", " ")} guidance for recruiter review`, actorId: null, metadata: { candidate_ids: vaIds, model: result.model } });
  }
  return result;
}

export async function scheduleCandidateInterviewAction(formData: FormData) {
  const { user } = await requireRole("client");
  const interviewId = String(formData.get("interview_id") || "");
  const scheduledIso = String(formData.get("scheduled_at_iso") || "");
  const timezone = String(formData.get("timezone") || "").trim().slice(0, 100) || "Client local time";
  const duration = Math.min(60, Math.max(15, Number(formData.get("duration_minutes") || 30)));
  const scheduledAt = new Date(scheduledIso);
  if (!interviewId || !Number.isFinite(scheduledAt.getTime())) throw new Error("Choose a valid interview time.");
  if (scheduledAt.getTime() < Date.now() + 24 * 60 * 60 * 1000) throw new Error("Please schedule candidate interviews at least 24 hours in advance.");

  const admin = createAdminClient();
  const { data: row } = await admin.from("candidate_interviews").select("*,jobs(title)").eq("id", interviewId).eq("client_id", user.id).maybeSingle();
  if (!row || row.status === "cancelled") throw new Error("Interview request not found.");

  const jobTitle = Array.isArray(row.jobs) ? row.jobs[0]?.title : row.jobs?.title;
  const [{ data: vaAuth }, { data: clientAuth }] = await Promise.all([
    admin.auth.admin.getUserById(row.va_id),
    admin.auth.admin.getUserById(user.id)
  ]);
  const attendeeEmails = [vaAuth.user?.email, clientAuth.user?.email].filter((value): value is string => Boolean(value));
  const previousEventId = String(row.calendar_event_id || "").trim() || null;
  const meet = previousEventId
    ? await updateGoogleMeetDiscoveryMeeting({
        eventId: previousEventId,
        startsAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        attendeeEmails,
      })
    : await createGoogleMeetDiscoveryMeeting({
        topic: `Candidate interview: ${jobTitle || "Virtual Assistant role"}`,
        startsAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        attendeeEmails,
      });

  const now = new Date().toISOString();
  const { error } = await admin.from("candidate_interviews").update({
    status: "scheduled",
    scheduled_at: scheduledAt.toISOString(),
    timezone,
    duration_minutes: duration,
    meeting_url: meet.joinUrl,
    calendar_event_id: meet.eventId,
    meeting_provider: "google_meet",
    zoom_meeting_id: null,
    rescheduled_at: row.scheduled_at ? now : null,
    reminder_24h_sent_at: null,
    reminder_1h_sent_at: null,
    updated_at: now
  }).eq("id", interviewId).eq("client_id", user.id);
  if (error) {
    if (!previousEventId) {
      try { await cancelGoogleMeetDiscoveryMeeting(meet.eventId); } catch { /* best-effort cleanup */ }
    }
    throw error;
  }
  if (row.application_id) await admin.from("applications").update({ status: "interview", updated_at: now }).eq("id", row.application_id);

  const when = new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(scheduledAt);
  await admin.from("notifications").insert([
    { user_id: row.va_id, title: `Interview scheduled: ${jobTitle || "client role"}`, body: `${when} UTC. Open Interviews for the Google Meet link and details.`, href: "/workspace/va/interviews", type: "interview", priority: "high" },
    { user_id: user.id, title: "Candidate interview scheduled", body: `${jobTitle || "Role"}: ${when} UTC.`, href: "/workspace/client/interviews", type: "interview", priority: "normal" }
  ]);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const body = `Your candidate interview for ${jobTitle || "the role"} is scheduled for ${when} UTC. The Google Meet link is available in your workspace and on the calendar invitation.`;
  try { await Promise.all([
    sendTransactionalEventEmail({ to: vaAuth.user?.email, subject: `Interview scheduled: ${jobTitle || "Virtual Assistant role"}`, heading: "Candidate interview scheduled", body, href: `${appUrl}/workspace/va/interviews`, hrefLabel: "Open interview" }),
    sendTransactionalEventEmail({ to: clientAuth.user?.email, subject: `Interview scheduled: ${jobTitle || "Virtual Assistant role"}`, heading: "Candidate interview scheduled", body, href: `${appUrl}/workspace/client/interviews`, hrefLabel: "Open interview" })
  ]); } catch (emailError) { console.error("[interview] confirmation email failed", emailError); }
  revalidatePath("/workspace/client/interviews");
  revalidatePath("/workspace/va/interviews");
  revalidatePath("/workspace/recruiter/today");
  redirect("/workspace/client/interviews?scheduled=1");
}

export async function cancelCandidateInterviewAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["client", "va", "recruiter", "admin"]);
  const interviewId = String(formData.get("interview_id") || "");
  const returnTo = safePath(formData.get("return_to"), profile.role === "va" ? "/workspace/va/interviews" : profile.role === "client" ? "/workspace/client/interviews" : "/workspace/recruiter/today");
  const admin = createAdminClient();
  const { data: row } = await admin.from("candidate_interviews").select("*").eq("id", interviewId).maybeSingle();
  if (!row) throw new Error("Interview not found.");
  if (profile.role === "client" && row.client_id !== user.id) throw new Error("Interview not found.");
  if (profile.role === "va" && row.va_id !== user.id) throw new Error("Interview not found.");
  if (row.calendar_event_id) { try { await cancelGoogleMeetDiscoveryMeeting(row.calendar_event_id); } catch {} }
  await admin.from("candidate_interviews").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", interviewId);
  const notify = profile.role === "va" ? row.client_id : row.va_id;
  await admin.from("notifications").insert({ user_id: notify, title: "Candidate interview cancelled", body: "The scheduled candidate interview was cancelled. Recruiter follow-up may be needed to choose another time.", href: profile.role === "va" ? "/workspace/client/interviews" : "/workspace/va/interviews", type: "interview", priority: "high" });
  revalidatePath("/workspace/client/interviews"); revalidatePath("/workspace/va/interviews"); revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}cancelled=1`);
}

export async function submitCandidateInterviewFeedbackAction(formData: FormData) {
  const { user } = await requireRole("client");
  const interviewId = String(formData.get("interview_id") || "");
  const decision = String(formData.get("decision") || "");
  if (!INTERVIEW_DECISIONS.has(decision)) throw new Error("Choose Proceed, Hold, or Pass.");
  const feedback = text(formData.get("feedback"), 3000);
  const reason = text(formData.get("feedback_reason"), 300);
  const admin = createAdminClient();
  const { data: row } = await admin.from("candidate_interviews").select("*,jobs(title)").eq("id", interviewId).eq("client_id", user.id).maybeSingle();
  if (!row) throw new Error("Interview not found.");
  const now = new Date().toISOString();
  await admin.from("candidate_interviews").update({ status: "completed", completed_at: row.completed_at || now, client_decision: decision, client_feedback: feedback, client_feedback_reason: reason, client_feedback_at: now, updated_at: now }).eq("id", interviewId);
  if (row.shortlist_candidate_id && decision === "pass") await admin.from("job_shortlist_candidates").update({ client_decision: "pass", client_decision_note: [reason, feedback].filter(Boolean).join(": ").slice(0, 500), client_decision_at: now }).eq("id", row.shortlist_candidate_id);
  if (decision === "proceed") {
    const { data: recruiters } = await admin.from("profiles").select("id").eq("role", "recruiter");
    if (recruiters?.length) await admin.from("notifications").insert(recruiters.map((r: any) => ({ user_id: r.id, title: "Client wants to proceed after interview", body: `${Array.isArray(row.jobs) ? row.jobs[0]?.title : row.jobs?.title || "Role"}: prepare the offer and confirm final terms.`, href: `/workspace/recruiter/matching/${row.job_id}`, type: "interview", priority: "high" })));
  }
  await writeRecruiterActivity({ subjectType: "job", subjectId: row.job_id, action: `interview_${decision}`, description: `Client interview decision: ${decision}`, actorId: user.id, metadata: { va_id: row.va_id, feedback, reason } });
  revalidatePath("/workspace/client/interviews"); revalidatePath("/workspace/recruiter/today"); revalidatePath(`/workspace/recruiter/matching/${row.job_id}`);
  redirect("/workspace/client/interviews?feedback_saved=1");
}

export async function createPlacementOfferAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("va_id") || "");
  const hourlyRate = Number(formData.get("hourly_rate"));
  const weeklyHours = Number(formData.get("weekly_hours"));
  const startDate = String(formData.get("start_date") || "");
  const schedule = String(formData.get("schedule") || "").trim().slice(0, 500);
  const timezone = String(formData.get("timezone") || "").trim().slice(0, 100) || null;
  const serviceType = String(formData.get("service_type") || "curated_placement") === "managed_service" ? "managed_service" : "curated_placement";
  const notes = text(formData.get("notes"), 2000);
  if (!jobId || !vaId || !Number.isFinite(hourlyRate) || hourlyRate < 5 || !Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || schedule.length < 3) throw new Error("Complete the final rate, weekly hours, schedule, and start date.");
  const admin = createAdminClient();
  const [{ data: job }, { data: vetted }, { data: shortlist }, { data: application }] = await Promise.all([
    admin.from("jobs").select("id,title,client_id,status").eq("id", jobId).single(),
    admin.from("va_vetting").select("stage").eq("va_id", vaId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id,client_decision").eq("job_id", jobId).eq("va_id", vaId).eq("shortlist_status", "released").maybeSingle(),
    admin.from("applications").select("id,status").eq("job_id", jobId).eq("va_id", vaId).maybeSingle()
  ]);
  if (!job?.client_id || job.status === "closed") throw new Error("This role is not ready for an offer.");
  if (!vetted || !["approved", "bench"].includes(vetted.stage)) throw new Error("Only vetted VAs can receive placement offers.");
  if (!application && (!shortlist || !["interested", "interview"].includes(String(shortlist.client_decision)))) throw new Error("Get client interest or an interview decision before preparing an offer.");

  const { data: existing } = await admin.from("placement_offers").select("id,status").eq("job_id", jobId).eq("va_id", vaId).in("status", ["pending_va", "pending_client", "accepted"]).maybeSingle();
  let offerId = existing?.id;
  const payload = { job_id: jobId, va_id: vaId, client_id: job.client_id, application_id: application?.id || null, created_by: user.id, status: "pending_va", hourly_rate: hourlyRate, weekly_hours: weeklyHours, timezone, schedule, start_date: startDate, service_type: serviceType, notes, va_accepted_at: null, client_confirmed_at: null, declined_at: null, updated_at: new Date().toISOString() };
  if (existing) {
    const { error } = await admin.from("placement_offers").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { data: created, error } = await admin.from("placement_offers").insert(payload).select("id").single();
    if (error) throw error;
    offerId = created.id;
  }
  if (application?.id && application.status !== "offered") await admin.from("applications").update({ status: "offered", updated_at: new Date().toISOString() }).eq("id", application.id);
  await admin.from("notifications").insert({ user_id: vaId, title: `Placement offer: ${job.title}`, body: `Review the final rate, hours, schedule, and start date before accepting.`, href: "/workspace/va/offers", type: "offer", priority: "high" });
  const { data: vaAuth } = await admin.auth.admin.getUserById(vaId);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  try { await sendTransactionalEventEmail({ to: vaAuth.user?.email, subject: `Placement offer: ${job.title}`, heading: "You have a placement offer", body: `Final terms: USD ${hourlyRate}/hr, ${weeklyHours} hrs/week, start ${startDate}. Review and accept the offer in your workspace.`, href: `${appUrl}/workspace/va/offers`, hrefLabel: "Review offer" }); } catch {}
  await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "placement_offer_sent", description: "Placement offer sent to VA for acceptance", actorId: user.id, metadata: { va_id: vaId, offer_id: offerId, hourly_rate: hourlyRate, weekly_hours: weeklyHours, start_date: startDate } });
  revalidatePath(`/workspace/recruiter/matching/${jobId}`); revalidatePath("/workspace/recruiter/today"); revalidatePath("/workspace/va/offers");
  redirect(`/workspace/recruiter/matching/${jobId}?offer_sent=1`);
}

export async function respondPlacementOfferAction(formData: FormData) {
  const { user } = await requireRole("va");
  const offerId = String(formData.get("offer_id") || "");
  const decision = String(formData.get("decision") || "");
  if (!offerId || !["accept", "decline"].includes(decision)) throw new Error("Invalid offer decision.");
  const admin = createAdminClient();
  const { data: offer } = await admin.from("placement_offers").select("*,jobs(title)").eq("id", offerId).eq("va_id", user.id).maybeSingle();
  if (!offer || offer.status !== "pending_va") throw new Error("This offer is no longer waiting for your response.");
  const now = new Date().toISOString();
  const jobTitle = Array.isArray(offer.jobs) ? offer.jobs[0]?.title : offer.jobs?.title;
  if (decision === "decline") {
    await admin.from("placement_offers").update({ status: "declined", declined_at: now, updated_at: now }).eq("id", offerId);
    const { data: recruiters } = await admin.from("profiles").select("id").eq("role", "recruiter");
    if (recruiters?.length) await admin.from("notifications").insert(recruiters.map((r: any) => ({ user_id: r.id, title: "VA declined placement offer", body: `${jobTitle || "Role"}: prepare another candidate or revise terms.`, href: `/workspace/recruiter/matching/${offer.job_id}`, type: "offer", priority: "high" })));
  } else {
    await admin.from("placement_offers").update({ status: "pending_client", va_accepted_at: now, updated_at: now }).eq("id", offerId);
    await admin.from("notifications").insert({ user_id: offer.client_id, title: `VA accepted the offer: ${jobTitle || "role"}`, body: "Confirm the final placement to activate the workroom and onboarding.", href: "/workspace/client/offers", type: "offer", priority: "high" });
    const { data: clientAuth } = await admin.auth.admin.getUserById(offer.client_id);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    try { await sendTransactionalEventEmail({ to: clientAuth.user?.email, subject: `VA accepted your offer: ${jobTitle || "role"}`, heading: "Your VA accepted the placement terms", body: "Confirm the placement in your client workspace to activate onboarding and the workroom.", href: `${appUrl}/workspace/client/offers`, hrefLabel: "Confirm placement" }); } catch {}
  }
  revalidatePath("/workspace/va/offers"); revalidatePath("/workspace/client/offers"); revalidatePath("/workspace/recruiter/today");
  redirect(`/workspace/va/offers?${decision === "accept" ? "accepted" : "declined"}=1`);
}

export async function confirmPlacementOfferAction(formData: FormData) {
  const { user } = await requireRole("client");
  const offerId = String(formData.get("offer_id") || "");
  const admin = createAdminClient();
  const { data: offer } = await admin.from("placement_offers").select("*,jobs(title)").eq("id", offerId).eq("client_id", user.id).maybeSingle();
  if (!offer || offer.status !== "pending_client") throw new Error("This placement is not waiting for client confirmation.");
  let applicationId = offer.application_id;
  if (!applicationId) {
    const { data: existing } = await admin.from("applications").select("id,status").eq("job_id", offer.job_id).eq("va_id", offer.va_id).maybeSingle();
    if (existing) applicationId = existing.id;
    else {
      const { data: created, error } = await admin.from("applications").insert({ job_id: offer.job_id, va_id: offer.va_id, status: "offered", profile_snapshot: { source: "curated_shortlist" } }).select("id").single();
      if (error) throw error;
      applicationId = created.id;
      await admin.from("application_status_history").insert({ application_id: applicationId, from_status: null, to_status: "offered", changed_by: user.id, note: "Created from recruiter-curated placement offer" });
    }
    await admin.from("placement_offers").update({ application_id: applicationId }).eq("id", offerId);
  }
  const { error: hireError } = await admin.rpc("confirm_hire_transaction", { p_application_id: applicationId, p_client_id: user.id, p_va_id: offer.va_id, p_job_id: offer.job_id, p_agreed_rate: offer.hourly_rate, p_start_date: offer.start_date, p_schedule: offer.schedule });
  if (hireError) throw hireError;
  const now = new Date().toISOString();
  await Promise.all([
    admin.from("placement_offers").update({ status: "accepted", client_confirmed_at: now, updated_at: now }).eq("id", offerId),
    admin.from("jobs").update({ status: "closed", closed_at: now }).eq("id", offer.job_id)
  ]);
  await admin.from("notifications").insert({ user_id: offer.va_id, title: `Placement confirmed: ${Array.isArray(offer.jobs) ? offer.jobs[0]?.title : offer.jobs?.title || "role"}`, body: "The client confirmed your placement. Your onboarding workroom is now active.", href: "/workspace/va/workroom", type: "offer", priority: "high" });
  await writeRecruiterActivity({ subjectType: "job", subjectId: offer.job_id, action: "placement_confirmed", description: "VA accepted and client confirmed final placement terms", actorId: user.id, metadata: { va_id: offer.va_id, offer_id: offerId, application_id: applicationId } });
  revalidatePath("/workspace/client/offers"); revalidatePath("/workspace/client/workroom"); revalidatePath("/workspace/va/workroom"); revalidatePath("/workspace/recruiter/today");
  redirect("/workspace/client/offers?confirmed=1");
}
