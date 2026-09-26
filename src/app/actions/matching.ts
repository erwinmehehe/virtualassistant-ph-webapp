"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked, type CandidateAccessStatus } from "@/lib/candidate-access";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { recordProductEvent } from "@/lib/product-events";
import { isRowApprovable } from "@/lib/public-visibility";
import { publicationMissingDetails } from "@/lib/job-publication";

const ACCESS_STATUSES: CandidateAccessStatus[] = ["locked", "requested", "quoted", "invoiced", "paid", "comped"];
const CLIENT_INVITE_COOLDOWN_HOURS = 20;
const AVAILABILITY_REMINDER_COOLDOWN_HOURS = 20;

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function cleanClientRecommendation(value: FormDataEntryValue | null) {
  return String(value || "").trim().slice(0, 500) || null;
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
      ? "Candidate details are now unlocked. You can review released shortlist profiles, applicants, and resumes."
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
}

export async function saveJobShortlistAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const mode = String(formData.get("mode") || "save");
  const selected = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))].slice(0, 50);
  const requestedOrder = String(formData.get("shortlist_order") || "").split(",").map((value) => value.trim()).filter(Boolean);
  const selectedSet = new Set(selected);
  const orderedSelected = [
    ...requestedOrder.filter((id, index) => selectedSet.has(id) && requestedOrder.indexOf(id) === index),
    ...selected.filter((id) => !requestedOrder.includes(id))
  ];
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/roles/${jobId}` : `/workspace/admin/jobs/${jobId}`);

  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_error=${encodeURIComponent(message)}`);

  if (!jobId) return fail("Job is required.");
  if (!selected.length) return fail("Select at least one VA before saving or sending a shortlist.");
  if (["release", "invite"].includes(mode) && selected.length > 5) return fail("Client shortlists are limited to five VAs. Narrow the selection before sending.");
  if (!["save", "release", "invite"].includes(mode)) return fail("Invalid shortlist action.");

  const admin = createAdminClient();
  const [{ data: job }, { data: vetting }, { data: commercial }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).single(),
    admin.from("recruiter_va_directory").select("user_id,stage,completion_score").in("user_id", selected).in("stage", ["approved", "bench"]),
    admin.from("job_commercials").select("commercial_status").eq("job_id", jobId).maybeSingle()
  ]);
  if (!job) return fail("Job not found.");
  if (mode === "release") {
    const missingRoleDetails = publicationMissingDetails(job);
    if (missingRoleDetails.length) return fail(`Complete the role brief before sending candidates to the client: ${missingRoleDetails.join(", ")}.`);
  }
  const approvedIds = new Set((vetting || []).filter(isRowApprovable).map((row: any) => row.user_id));
  if (approvedIds.size !== selected.length) return fail("One or more selected VAs are no longer eligible for client matching. Approved VAs must still have at least 60% profile completion.");
  if (mode === "release" && !job.client_id) return fail("This role has no linked client account yet. Use Save + invite client to review instead.");
  if (mode === "release" && job.status !== "published") return fail("Publish the role before sending candidates to the client.");
  if (mode === "release" && commercial?.commercial_status !== "accepted") return fail("Client-approved service terms are required before sending candidates.");

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
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status,shortlist_order").eq("job_id", jobId)
  ]);
  const vaMap = new Map((vas || []).map((va: any) => [va.user_id, va]));
  const existingMap = new Map((existing || []).map((row: any) => [row.va_id, row.shortlist_status]));
  const existingOrderMap = new Map((existing || []).map((row: any) => [row.va_id, Number(row.shortlist_order || 0)]));
  const releasedMaxOrder = (existing || []).filter((row: any) => row.shortlist_status === "released").reduce((max: number, row: any) => Math.max(max, Number(row.shortlist_order || 0)), 0);
  const now = new Date().toISOString();
  if (mode !== "release") {
    const deselectedProposed = (existing || []).filter((row: any) => row.shortlist_status === "proposed" && !selected.includes(row.va_id)).map((row: any) => row.va_id);
    if (deselectedProposed.length) await admin.from("job_shortlist_candidates").update({ shortlist_status: "hidden", released_at: null }).eq("job_id", jobId).in("va_id", deselectedProposed);
  }
  const rows = orderedSelected.map((vaId, index) => {
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
      shortlist_order: status === "released" ? (prior === "released" ? existingOrderMap.get(vaId) || index + 1 : releasedMaxOrder + index + 1) : index + 1,
      client_recommendation: cleanClientRecommendation(formData.get(`recommendation_${vaId}`)),
      created_by: user.id,
      released_at: status === "released" ? now : null
    };
  });
  const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
  if (error) {
    const message = String(error.message || "");
    if (message.includes("Agency Certified")) {
      console.info("[shortlist] blocked by release-readiness guardrail");
      return fail("A selected VA is not currently client-release ready. Confirm active talent-pool membership and verified work setup first.");
    }
    if (message.includes("Client review is not ready yet")) {
      console.info("[shortlist] blocked by client-review guardrail");
      return fail("Client review is not ready yet. Confirm the linked client, accepted service terms, and candidate access before sending.");
    }
    console.error("saveJobShortlistAction upsert failed:", error);
    return fail("Could not save the shortlist. Please try again.");
  }

  const { writeRecruiterActivity } = await import("@/lib/recruiter-activity");

  let inviteEmailUnavailable = false;

  if (mode === "invite" && inviteLead) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const nextPath = `/workspace/client/jobs/${jobId}`;
    const params = new URLSearchParams({ lead: inviteLead.id, next: nextPath });
    const claimUrl = `${appUrl}/auth/join/client?${params.toString()}`;
    const firstName = String(inviteLead.name || "there").trim().split(/\s+/)[0] || "there";
    const { sendTransactionalEventEmail } = await import("@/lib/email");
    const delivery = await sendTransactionalEventEmail({
      to: inviteLead.email,
      firstName,
      subject: `Your VA shortlist is ready to review: ${job.title}`,
      heading: "Your recruiter has a shortlist ready",
      body: `We reviewed Virtual Assistants for ${job.title} and selected ${selected.length} candidate${selected.length === 1 ? "" : "s"} for your review. Create or link your Client account using this same email address to open the private shortlist. The selected candidates will become available for client review automatically after your account is linked.`,
      href: claimUrl,
      hrefLabel: "Review my shortlist",
      senderName: "VirtualAssistant.com.ph Hiring Team",
      teamLabel: "Hiring team",
      footerText: "You are receiving this because you contacted VirtualAssistant.com.ph about hiring support.",
      eventType: "client_shortlist_invite",
      idempotencyKey: `client-shortlist-invite-${jobId}-${inviteLead.id}-${now.slice(0, 10)}`,
      priority: "critical"
    });

    if (delivery.sent) {
      await writeRecruiterActivity({
        subjectType: "job",
        subjectId: jobId,
        action: "client_review_invited",
        description: `Client invited to claim their account and review ${selected.length} selected VA${selected.length === 1 ? "" : "s"}`,
        actorId: user.id,
        metadata: { va_ids: selected, lead_id: inviteLead.id }
      });
    } else {
      inviteEmailUnavailable = true;
      await writeRecruiterActivity({
        subjectType: "job",
        subjectId: jobId,
        action: "client_review_invite_email_unavailable",
        description: "Shortlist saved internally, but the client invite email is temporarily unavailable; use the manual client account link instead",
        actorId: user.id,
        metadata: { va_ids: selected, lead_id: inviteLead.id, email_reason: delivery.reason || "email_unavailable" }
      });
    }

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
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  if (inviteEmailUnavailable) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_saved=1&client_invite_email_unavailable=1`);
  }
  const resultParam = mode === "release" ? "shortlist_released" : mode === "invite" ? "client_invited" : "shortlist_saved";
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${resultParam}=1`);
}

export async function remindVaAvailabilityAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("availability_va_id") || "");
  const returnTo = safeReturnTo(
    formData.get("return_to"),
    profile.role === "recruiter" ? `/workspace/recruiter/roles/${jobId}` : `/workspace/admin/jobs/${jobId}`,
  );
  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_error=${encodeURIComponent(message)}`);

  if (!jobId || !vaId) return fail("Choose a VA before sending an availability reminder.");

  const admin = createAdminClient();
  const [{ data: job }, { data: vaProfile }] = await Promise.all([
    admin.from("jobs").select("id,title,recruiter_id").eq("id", jobId).maybeSingle(),
    admin.from("profiles").select("id,role,account_status").eq("id", vaId).maybeSingle(),
  ]);
  if (!job) return fail("Role not found.");
  if (!vaProfile || vaProfile.role !== "va" || vaProfile.account_status !== "active") {
    return fail("This VA account is not active, so an availability reminder cannot be sent.");
  }

  const cutoff = new Date(Date.now() - AVAILABILITY_REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", vaId)
    .eq("title", "Confirm your current availability")
    .gte("created_at", cutoff)
    .limit(1)
    .maybeSingle();

  if (!recent) {
    const { error } = await admin.from("notifications").insert({
      user_id: vaId,
      title: "Confirm your current availability",
      body: `A recruiter is reviewing you for ${job.title || "a client role"}. Confirm your current hours, schedule, availability status, and rate before your profile can be released to the client.`,
      href: "/workspace/va/profile#availability",
    });
    if (error) return fail("The availability reminder could not be sent. Please try again.");
    const { writeRecruiterActivity } = await import("@/lib/recruiter-activity");
    await writeRecruiterActivity({
      subjectType: "va",
      subjectId: vaId,
      action: "availability_reminder_sent",
      description: `Recruiter requested a fresh availability confirmation for ${job.title || "a client role"}`,
      actorId: user.id,
      metadata: { job_id: jobId },
    });
  }

  revalidatePath(returnTo);
  revalidatePath("/workspace/va/profile");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}availability_reminded=1`);
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
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  redirect(returnTo);
}
