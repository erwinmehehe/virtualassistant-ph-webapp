"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchScore } from "@/lib/matching";
import { sendApplicationEmail, sendApplicationStatusEmail } from "@/lib/email";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import type { ApplicationStatus } from "@/lib/types";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { recordProductEvent } from "@/lib/product-events";

function snapshot(profile: any, va: any, vettingStage?: string | null) {
  return {
    full_name: profile?.full_name,
    headline: va.headline,
    primary_category: va.primary_category,
    categories: va.categories,
    skills: va.skills,
    tools: va.tools,
    industries: va.industries,
    languages: va.languages,
    years_experience: va.years_experience,
    bio: va.bio,
    weekly_hours: va.weekly_hours,
    schedule: va.schedule,
    overlap_hours: va.overlap_hours,
    hourly_rate: va.hourly_rate,
    availability_status: va.availability_status,
    portfolio_url: va.portfolio_url,
    linkedin_url: va.linkedin_url,
    slug: va.slug,
    resume_path: va.resume_path,
    vetting_stage: vettingStage
  };
}

async function getClientApplicationWithAccess(applicationId: string, clientId: string) {
  const admin = createAdminClient();
  const { data: application } = await admin.from("applications").select("id,job_id,va_id,status,jobs!inner(client_id,title)").eq("id", applicationId).eq("jobs.client_id", clientId).single();
  if (!application) throw new Error("Application not found.");
  const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", application.job_id).maybeSingle();
  if (!candidateAccessUnlocked(access?.access_status)) throw new Error("Candidate details and hiring actions are locked until candidate access is activated for this role.");
  return { admin, application };
}

export async function applyToJobAction(formData: FormData) {
  const { user, profile } = await requireRole("va");
  const jobId = String(formData.get("job_id"));
  const coverNote = String(formData.get("cover_note") ?? "").trim();
  if (coverNote.length < 20) throw new Error("Add a short note explaining why you fit the role.");
  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: va }, { data: job }, { data: vetting }] = await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("jobs").select("*").eq("id", jobId).eq("status", "published").single(),
    admin.from("va_vetting").select("stage").eq("va_id",user.id).single()
  ]);
  if (!va || !job) throw new Error("Job or VA profile was not found.");
  if (!vetting || !["approved","bench"].includes(vetting.stage)) throw new Error("Complete VA vetting before applying to client jobs.");
  if (!job.client_id) throw new Error("This job is not ready to accept applications yet.");

  const { data: application, error } = await admin.from("applications").insert({
    job_id: jobId, va_id: user.id, cover_note: coverNote,
    match_score: matchScore(job, va), profile_snapshot: snapshot(profile, va, vetting.stage)
  }).select("id").single();
  if (error) throw error;
  await admin.from("application_status_history").insert({ application_id: application.id, from_status: null, to_status: "new", changed_by: user.id, note: "Application submitted" });
  await recordProductEvent("application_submitted", { userId: user.id, path: `/jobs/${jobId}`, metadata: { job_id: jobId } });
  const { data: conversation } = await admin.from("conversations").insert({ application_id: application.id, client_id: job.client_id, va_id: user.id }).select("id").single();
  await admin.from("notifications").insert({ user_id: job.client_id, title: `New application for ${job.title}`, body: "A vetted VA submitted an application. Candidate identity remains protected until candidate access is active.", href: `/workspace/client/jobs/${job.id}` });
  const { data: clientAuth } = await admin.auth.admin.getUserById(job.client_id);
  try {
    await sendApplicationEmail({ to: clientAuth.user?.email, applicantName: "A vetted VA", jobTitle: job.title, applicationId: application.id });
  } catch (error) {
    console.error("[email] Application notification delivery failed", error);
    // The application is already saved and should not fail because email delivery is unavailable.
  }
  revalidatePath("/workspace/va/applications");
  revalidatePath(`/jobs/${jobId}`);
  if (conversation) revalidatePath(`/workspace/va/messages?thread=${conversation.id}`);
  redirect("/workspace/va/applications?applied=1");
}

export async function saveJobAction(formData: FormData) {
  const { user } = await requireRole("va");
  const jobId = String(formData.get("job_id"));
  const returnTo = String(formData.get("return_to") || "");
  const supabase = await createClient();
  const { data } = await supabase.from("saved_jobs").select("job_id").eq("va_id", user.id).eq("job_id", jobId).maybeSingle();
  if (data) await supabase.from("saved_jobs").delete().eq("va_id", user.id).eq("job_id", jobId);
  else await supabase.from("saved_jobs").insert({ va_id: user.id, job_id: jobId });
  revalidatePath("/workspace/va/saved"); revalidatePath("/workspace/va/jobs"); revalidatePath(`/jobs/${jobId}`);
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}saved=${data?"0":"1"}`);
}

export async function withdrawApplicationAction(formData: FormData) {
  const { user } = await requireRole("va");
  const id = String(formData.get("application_id"));
  const supabase = await createClient();
  const { data: application } = await supabase.from("applications").select("id,status").eq("id", id).eq("va_id", user.id).single();
  if (!application) throw new Error("Application not found.");
  const admin = createAdminClient();
  const { error: updateError } = await admin.from("applications").update({ status: "withdrawn" }).eq("id", id).eq("va_id", user.id);
  if (updateError) throw updateError;
  await admin.from("application_status_history").insert({ application_id: id, from_status: application.status, to_status: "withdrawn", changed_by: user.id, note: "Application withdrawn by VA" });
  revalidatePath("/workspace/va/applications");
}

export async function updateApplicationStatusAction(formData: FormData) {
  const { user } = await requireRole("client");
  const id = String(formData.get("application_id"));
  const status = String(formData.get("status")) as ApplicationStatus;
  const returnTo = String(formData.get("return_to") || "");
  const allowed: ApplicationStatus[] = ["new", "reviewing", "shortlisted", "interview", "offered", "rejected"];
  if (!allowed.includes(status)) throw new Error("Use the separate Hire candidate confirmation to complete a hire.");
  const { admin, application } = await getClientApplicationWithAccess(id, user.id);
  if (application.status === status) {
    if (returnTo.startsWith("/") && !returnTo.startsWith("//")) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status_updated=1`);
    return;
  }
  const { error: updateError } = await admin.from("applications").update({ status }).eq("id", id);
  if (updateError) throw updateError;
  await admin.from("application_status_history").insert({ application_id: id, from_status: application.status, to_status: status, changed_by: user.id });
  try { const { writeRecruiterActivity } = await import("@/lib/recruiter-activity"); await writeRecruiterActivity({ subjectType: "job", subjectId: application.job_id, action: `application_${status}`, description: `Candidate moved to ${status}`, actorId: user.id, metadata: { application_id: id, va_id: application.va_id } }); await writeRecruiterActivity({ subjectType: "va", subjectId: application.va_id, action: `application_${status}`, description: `Application moved to ${status}`, actorId: user.id, metadata: { application_id: id, job_id: application.job_id } }); } catch {}
  if (["shortlisted","interview","offered","rejected"].includes(status)) await recordProductEvent(`application_${status}`, { userId: user.id, path: `/workspace/client/jobs/${application.job_id}`, metadata: { application_id: id, job_id: application.job_id } });
  const jobTitle = Array.isArray(application.jobs) ? application.jobs[0]?.title : (application.jobs as any)?.title;
  await admin.from("notifications").insert({ user_id: application.va_id, title: `Application moved to ${status}`, body: `Your application for ${jobTitle || "this role"} is now ${status}.`, href: "/workspace/va/applications" });
  const { data: vaAuth } = await admin.auth.admin.getUserById(application.va_id);
  try {
    await sendApplicationStatusEmail({ to: vaAuth.user?.email, jobTitle: jobTitle || "your role", status, appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph" });
  } catch (error) {
    console.error("[email] Application status notification delivery failed", error);
  }
  revalidatePath(`/workspace/client/jobs/${application.job_id}`); revalidatePath(`/workspace/client/candidates/${application.id}`); revalidatePath("/workspace/client/candidates");
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status_updated=1`);
}

export async function hireCandidateAction(formData: FormData) {
  const { user } = await requireRole("client");
  const applicationId = String(formData.get("application_id") || "");
  const agreedRate = Number(formData.get("agreed_hourly_rate"));
  const startDate = String(formData.get("start_date") || "");
  const agreedSchedule = String(formData.get("agreed_schedule") || "").trim();
  const acknowledgement = formData.get("confirm_hire") === "on";
  if (!Number.isFinite(agreedRate) || agreedRate < MIN_HOURLY_RATE || agreedRate > 1000) throw new Error(`Final hourly rate must be at least USD ${MIN_HOURLY_RATE}.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("Choose a start date.");
  const todayManila = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (startDate < todayManila) throw new Error("Start date cannot be in the past.");
  if (agreedSchedule.length < 3 || agreedSchedule.length > 500) throw new Error("Confirm the expected working schedule.");
  if (!acknowledgement) throw new Error("Confirm that the final rate, start date, and schedule have been agreed with the candidate.");

  const { admin, application } = await getClientApplicationWithAccess(applicationId, user.id);
  if (["hired","rejected","withdrawn"].includes(application.status)) throw new Error("This application cannot be hired from its current status.");
  const { error: hireError } = await admin.rpc("confirm_hire_transaction", {
    p_application_id: application.id,
    p_client_id: user.id,
    p_va_id: application.va_id,
    p_job_id: application.job_id,
    p_agreed_rate: agreedRate,
    p_start_date: startDate,
    p_schedule: agreedSchedule
  });
  if (hireError) throw hireError;
  const jobTitle = Array.isArray(application.jobs) ? application.jobs[0]?.title : (application.jobs as any)?.title;
  await admin.from("notifications").insert({ user_id: application.va_id, title: `You were hired for ${jobTitle || "a role"}`, body: `Start date: ${startDate}. Open your workroom for onboarding details.`, href: "/workspace/va/workroom" });
  try { const { writeRecruiterActivity } = await import("@/lib/recruiter-activity"); await writeRecruiterActivity({ subjectType: "job", subjectId: application.job_id, action: "hired", description: `Candidate hired for ${jobTitle || "role"}`, actorId: user.id, metadata: { application_id: application.id, va_id: application.va_id } }); await writeRecruiterActivity({ subjectType: "va", subjectId: application.va_id, action: "hired", description: `Hired for ${jobTitle || "role"}`, actorId: user.id, metadata: { application_id: application.id, job_id: application.job_id } }); } catch {}
  revalidatePath(`/workspace/client/jobs/${application.job_id}`); revalidatePath(`/workspace/client/candidates/${application.id}`); revalidatePath("/workspace/client/candidates"); revalidatePath("/workspace/client/workroom");
  redirect(`/workspace/client/candidates/${application.id}?hired=1`);
}

export async function inviteVaAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id")); const vaId = String(formData.get("va_id")); const note = String(formData.get("note") ?? "").trim();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,title,client_id,status").eq("id",jobId).eq("client_id",user.id).single();
  if (!job) throw new Error("Job not found.");
  if (job.status !== "published") throw new Error("Publish the role before inviting candidates.");
  const admin = createAdminClient();
  const [{ data: publicVa }, { data: released }, { data: access }, { data: vetting }] = await Promise.all([
    supabase.from("public_va_directory").select("user_id").eq("user_id",vaId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("va_id").eq("job_id",jobId).eq("va_id",vaId).eq("shortlist_status","released").maybeSingle(),
    admin.from("job_candidate_access").select("access_status").eq("job_id",jobId).maybeSingle(),
    admin.from("va_vetting").select("stage").eq("va_id",vaId).maybeSingle()
  ]);
  const curatedAccess = Boolean(released && candidateAccessUnlocked(access?.access_status) && vetting && ["approved","bench"].includes(vetting.stage));
  if (!publicVa && !curatedAccess) throw new Error("This VA is not available for a client invitation. Curated private-pool candidates require released shortlist access.");
  const { error } = await admin.from("job_invites").upsert({ job_id: jobId, va_id: vaId, client_id: user.id, note: note || null, status: "pending" }, { onConflict: "job_id,va_id" });
  if (error) throw error;
  await admin.from("notifications").insert({ user_id: vaId, title: `You were invited to ${job.title}`, body: note || "A client invited you to review this role.", href: "/workspace/va/applications" });
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  redirect(`/workspace/client/jobs/${jobId}?invited=1`);
}

export async function respondToInviteAction(formData: FormData) {
  const { user } = await requireRole("va");
  const inviteId = String(formData.get("invite_id")); const decision = String(formData.get("decision"));
  if (!["accepted","declined"].includes(decision)) throw new Error("Invalid decision.");
  const supabase = await createClient(); const admin = createAdminClient();
  const { data: vetting } = await admin.from("va_vetting").select("stage").eq("va_id",user.id).single();
  if (decision === "accepted" && (!vetting || !["approved","bench"].includes(vetting.stage))) throw new Error("Complete VA vetting before accepting a client invitation.");
  const { data: invite } = await supabase.from("job_invites").select("*").eq("id",inviteId).eq("va_id",user.id).single();
  if (!invite) throw new Error("Invitation not found.");
  if (decision === "accepted") {
    const { data: invitedJob } = await supabase.from("jobs").select("id,status").eq("id", invite.job_id).single();
    if (!invitedJob || invitedJob.status !== "published") throw new Error("This role is no longer open for applications.");
  }
  await admin.from("job_invites").update({ status: decision }).eq("id",inviteId);
  if (decision === "accepted") {
    const { data: existing } = await supabase.from("applications").select("id").eq("job_id",invite.job_id).eq("va_id",user.id).maybeSingle();
    if (!existing) {
      const [{ data: profile }, { data: va }, { data: job }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id",user.id).single(), supabase.from("va_profiles").select("*").eq("user_id",user.id).single(), supabase.from("jobs").select("*").eq("id",invite.job_id).single()
      ]);
      if (va && job) {
        const { data: app } = await admin.from("applications").insert({ job_id: invite.job_id, va_id: user.id, status: "new", cover_note: "Accepted client invitation.", match_score: matchScore(job, va), profile_snapshot: snapshot(profile, va, vetting?.stage) }).select("id").single();
        if (app) {
          await admin.from("application_status_history").insert({ application_id: app.id, from_status: null, to_status: "new", changed_by: user.id, note: "Client invitation accepted" });
          await admin.from("conversations").insert({ application_id: app.id, client_id: invite.client_id, va_id: user.id });
        }
      }
    }
  }
  revalidatePath("/workspace/va/applications");
  redirect(`/workspace/va/applications?invite=${decision}`);
}
