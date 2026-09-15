"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked, type CandidateAccessStatus } from "@/lib/candidate-access";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { recordProductEvent } from "@/lib/product-events";
import { sendVaMatchEmail } from "@/lib/match-email";

const ACCESS_STATUSES: CandidateAccessStatus[] = ["locked", "requested", "quoted", "invoiced", "paid", "comped"];
const CLIENT_INVITE_COOLDOWN_HOURS = 20;

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function notifyAdmins(title: string, body: string, href: string) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (!admins?.length) return;
  await admin.from("notifications").insert(admins.map((row: any) => ({ user_id: row.id, title, body, href })));
}

export async function requestCandidateAccessAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/client/jobs/${jobId}`);
  if (!jobId) throw new Error("Job is required.");

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id,title,client_id").eq("id", jobId).eq("client_id", user.id).single();
  if (!job) throw new Error("Job not found.");

  const { data: current } = await admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle();
  if (!candidateAccessUnlocked(current?.access_status) && !["quoted", "invoiced"].includes(current?.access_status || "")) {
    const now = new Date().toISOString();
    await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "requested",
      requested_at: now
    }, { onConflict: "job_id" });
    await notifyAdmins("Candidate access requested", `A client requested access to applicant and shortlist details for ${job.title}.`, `/workspace/admin/jobs/${jobId}`);
    await recordProductEvent("candidate_unlock_initiated", { userId: user.id, path: returnTo, metadata: { job_id: jobId } });
  }

  revalidatePath(returnTo);
  revalidatePath("/workspace/admin/jobs");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}access_requested=1`);
}

export async function updateCandidateAccessAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = String(formData.get("job_id") || "");
  const status = String(formData.get("access_status") || "locked") as CandidateAccessStatus;
  const feeRaw = String(formData.get("access_fee") || "").trim();
  const fee = feeRaw ? Number(feeRaw) : null;
  const paymentReference = String(formData.get("payment_reference") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!jobId || !ACCESS_STATUSES.includes(status)) throw new Error("Invalid candidate access update.");
  if (fee != null && (!Number.isFinite(fee) || fee < 0 || fee > 100000)) throw new Error("Enter a valid candidate access fee.");
  if (["quoted", "invoiced", "paid"].includes(status) && (fee == null || fee <= 0)) throw new Error("Set a candidate access fee before using a paid access status.");

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id,title,client_id").eq("id", jobId).single();
  if (!job) throw new Error("Job not found.");
  const active = candidateAccessUnlocked(status);
  const payload: Record<string, unknown> = {
    job_id: jobId,
    access_status: status,
    access_fee: status === "comped" && fee == null ? 0 : fee,
    currency: "USD",
    payment_reference: paymentReference,
    notes,
    unlocked_at: active ? new Date().toISOString() : null,
    unlocked_by: active ? user.id : null
  };
  if (status === "requested") payload.requested_at = new Date().toISOString();
  const { error } = await admin.from("job_candidate_access").upsert(payload, { onConflict: "job_id" });
  if (error) throw error;

  if (job.client_id) {
    const copy = active
      ? "Candidate details are now unlocked. You can review released shortlist profiles, applicants, resumes, and conversations."
      : status === "quoted"
        ? `Candidate access has been quoted at USD ${fee?.toFixed(2)}.`
        : status === "invoiced"
          ? `Candidate access is awaiting payment${paymentReference ? ` (${paymentReference})` : ""}.`
          : "Candidate access status was updated by the hiring team.";
    await admin.from("notifications").insert({ user_id: job.client_id, title: active ? "Candidate access unlocked" : "Candidate access updated", body: copy, href: `/workspace/client/jobs/${jobId}` });
  }

  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath("/workspace/client/candidates");
  revalidatePath("/workspace/client/messages");
}

export async function saveJobShortlistAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const mode = String(formData.get("mode") || "save");
  const selected = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))].slice(0, 50);
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/matching/${jobId}` : `/workspace/admin/jobs/${jobId}`);

  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_error=${encodeURIComponent(message)}`);

  if (!jobId) return fail("Job is required.");
  if (!selected.length) return fail("Select at least one VA before saving or sending a shortlist.");
  if (!["save", "release", "invite"].includes(mode)) return fail("Invalid shortlist action.");

  const admin = createAdminClient();
  const [{ data: job }, { data: vetting }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).single(),
    admin.from("va_vetting").select("va_id,stage").in("va_id", selected).in("stage", ["approved", "bench"])
  ]);
  if (!job) return fail("Job not found.");
  const approvedIds = new Set((vetting || []).map((row: any) => row.va_id));
  if (approvedIds.size !== selected.length) return fail("One or more selected VAs are no longer approved for matching.");
  if (mode === "release" && !job.client_id) return fail("This role has no linked client account yet. Use Save + invite client to review instead.");

  let inviteLead: { id: string; name?: string | null; email: string } | null = null;
  if (mode === "invite") {
    if (job.client_id) return fail("This client account is already linked. Use Send selected for client review instead.");
    if (!job.lead_id) return fail("No client lead is attached to this role, so an invite cannot be sent.");
    const { data: lead } = await admin.from("lead_intake").select("id,name,email,client_id").eq("id", job.lead_id).maybeSingle();
    if (!lead?.email) return fail("No client email is attached to this lead. Add a valid client email before inviting them.");
    if (lead.client_id) return fail("This lead is already linked to a client account. Refresh the page and send the shortlist normally.");
    const cooldownCutoff = new Date(Date.now() - CLIENT_INVITE_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentInvite } = await admin.from("recruiter_activity")
      .select("id")
      .eq("subject_type", "job")
      .eq("subject_id", jobId)
      .eq("action", "client_review_invited")
      .gte("created_at", cooldownCutoff)
      .limit(1)
      .maybeSingle();
    if (recentInvite) return fail("A client-review invite was already sent for this role in the last 20 hours.");
    inviteLead = { id: lead.id, name: lead.name, email: lead.email };
  }

  const [{ data: vas }, { data: existing }] = await Promise.all([
    admin.from("va_profiles").select("*").in("user_id", selected),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", jobId)
  ]);
  const vaMap = new Map((vas || []).map((va: any) => [va.user_id, va]));
  const existingMap = new Map((existing || []).map((row: any) => [row.va_id, row.shortlist_status]));
  const now = new Date().toISOString();
  if (mode !== "release") {
    const deselectedProposed = (existing || []).filter((row: any) => row.shortlist_status === "proposed" && !selected.includes(row.va_id)).map((row: any) => row.va_id);
    if (deselectedProposed.length) await admin.from("job_shortlist_candidates").update({ shortlist_status: "hidden", released_at: null }).eq("job_id", jobId).in("va_id", deselectedProposed);
  }
  const rows = selected.map((vaId) => {
    const va = vaMap.get(vaId) as any;
    if (!va) return fail("A selected VA profile could not be loaded. Refresh and try again.");
    const assessment = matchAssessment(job, va);
    const prior = existingMap.get(vaId);
    const status = mode === "release" ? "released" : prior === "released" ? "released" : "proposed";
    return {
      job_id: jobId,
      va_id: vaId,
      match_score: assessment.score,
      match_confidence: assessment.confidence,
      shortlist_status: status,
      created_by: user.id,
      released_at: status === "released" ? now : null
    };
  });
  const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
  if (error) {
    console.error("saveJobShortlistAction upsert failed:", error);
    return fail("Could not save the shortlist. Please try again.");
  }

  const { writeRecruiterActivity } = await import("@/lib/recruiter-activity");

  if (mode === "invite" && inviteLead) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const nextPath = `/workspace/client/jobs/${jobId}`;
    const params = new URLSearchParams({ lead: inviteLead.id, next: nextPath });
    const claimUrl = `${appUrl}/auth/join/client?${params.toString()}`;
    const firstName = String(inviteLead.name || "there").trim().split(/\s+/)[0] || "there";
    const { sendTransactionalEventEmail } = await import("@/lib/email");
    const delivery = await sendTransactionalEventEmail({
      to: inviteLead.email,
      subject: `Your VA shortlist is ready to review: ${job.title}`,
      heading: "Your recruiter has a shortlist ready",
      body: `Hi ${firstName}, we reviewed Virtual Assistants for ${job.title} and selected ${selected.length} candidate${selected.length === 1 ? "" : "s"} for your review. Create or link your Client account using this same email address to open the private shortlist. The selected candidates will become available for client review automatically after your account is linked.`,
      href: claimUrl,
      hrefLabel: "Review my shortlist"
    });
    if (!delivery.sent) return fail("The shortlist was saved internally, but the client invite email could not be sent. Check the email configuration and try again.");

    await writeRecruiterActivity({
      subjectType: "job",
      subjectId: jobId,
      action: "client_review_invited",
      description: `Client invited to claim their account and review ${selected.length} selected VA${selected.length === 1 ? "" : "s"}`,
      actorId: user.id,
      metadata: { va_ids: selected, lead_id: inviteLead.id }
    });
    await Promise.all(selected.map((vaId) => writeRecruiterActivity({
      subjectType: "va",
      subjectId: vaId,
      action: "assigned_to_role",
      description: `Selected for ${job.title}; waiting for the client account to be linked`,
      actorId: user.id,
      metadata: { job_id: jobId }
    })));
  } else {
    await writeRecruiterActivity({
      subjectType: "job",
      subjectId: jobId,
      action: mode === "release" ? "shortlist_released" : "candidates_assigned",
      description: `${selected.length} VA${selected.length === 1 ? "" : "s"} ${mode === "release" ? "released to the client" : "assigned internally"}`,
      actorId: user.id,
      metadata: { va_ids: selected }
    });
    await Promise.all(selected.map((vaId) => writeRecruiterActivity({
      subjectType: "va",
      subjectId: vaId,
      action: mode === "release" ? "released_to_client" : "assigned_to_role",
      description: `${mode === "release" ? "Released" : "Assigned"} to ${job.title}`,
      actorId: user.id,
      metadata: { job_id: jobId }
    })));
  }

  const newlyReleasedGoodMatches = mode === "release"
    ? rows.filter((row) => row.match_score >= 60 && existingMap.get(row.va_id) !== "released")
    : [];
  if (newlyReleasedGoodMatches.length) {
    await admin.from("notifications").insert(newlyReleasedGoodMatches.map((row) => ({
      user_id: row.va_id,
      title: "A client role may be a good fit",
      body: `Your recruiter shortlisted your profile as a ${matchLabel(row.match_score)} for client review. Keep your availability and profile current while the client reviews the shortlist.`,
      href: "/workspace/va/profile"
    })));
    await Promise.all(newlyReleasedGoodMatches.map(async (row) => {
      const { data: authUser } = await admin.auth.admin.getUserById(row.va_id);
      try {
        await sendVaMatchEmail({
          to: authUser.user?.email,
          fitLabel: matchLabel(row.match_score),
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        });
      } catch (emailError) {
        console.error("[email] VA match alert delivery failed", emailError);
      }
    }));
  }

  if (mode === "release" && job.client_id) {
    const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle();
    const unlocked = candidateAccessUnlocked(access?.access_status);
    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your curated shortlist is ready",
      body: unlocked
        ? `${selected.length} matched VA profile${selected.length === 1 ? " is" : "s are"} ready to review.`
        : `${selected.length} matched VA${selected.length === 1 ? " is" : "s are"} ready. Candidate identities stay protected until candidate access is activated.`,
      href: `/workspace/client/jobs/${jobId}`
    });
  }

  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  const resultParam = mode === "release" ? "shortlist_released" : mode === "invite" ? "client_invited" : "shortlist_saved";
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${resultParam}=1`);
}

export async function hideShortlistCandidateAction(formData: FormData) {
  await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("remove_va_id") || formData.get("va_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/admin/jobs/${jobId}`);
  if (!jobId || !vaId) throw new Error("Candidate and job are required.");
  const { error } = await createAdminClient().from("job_shortlist_candidates").update({ shortlist_status: "hidden", released_at: null }).eq("job_id", jobId).eq("va_id", vaId);
  if (error) throw error;
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  redirect(returnTo);
}
