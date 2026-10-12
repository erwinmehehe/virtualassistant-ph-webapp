"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanJobSummary, cleanJobDescription } from "@/lib/job-content-cleanup";
import { publicationMissingDetails, publicJobReviewSignals } from "@/lib/job-publication";
import { assertPublicHiringContentSafe } from "@/lib/hiring-circumvention";
import { notifyGoogleIndexingBestEffort } from "@/lib/google-indexing";

export async function reviewJobAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const id = String(formData.get("job_id"));
  const decision = String(formData.get("decision"));
  const admin = createAdminClient();
  if (decision === "approve") {
    const { data: job } = await admin.from("jobs").select("client_id,service_model,moderation_status,title,company_name,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing").eq("id", id).single();
    if (!job?.client_id) throw new Error("Link this lead-created job to a client account before publishing it.");
    if (job.moderation_status !== "clear") throw new Error("Review and clear the content hold before approving this job.");
    const missing = publicationMissingDetails(job);
    if (missing.length) throw new Error(`This brief is missing required public content: ${missing.join(", ")}.`);
    const { data: settings } = await admin.from("admin_settings").select("default_placement_fee,default_managed_markup_percent").eq("id",1).single();
    const placementFee = Number(formData.get("placement_fee") || settings?.default_placement_fee || 0);
    const managedMarkup = Number(formData.get("managed_markup_percent") || settings?.default_managed_markup_percent || 0);
    if (job.service_model === "managed_service" && managedMarkup <= 0) throw new Error("Set a managed service markup before sending terms.");
    if (job.service_model !== "managed_service" && placementFee <= 0) throw new Error("Set a placement fee before sending terms.");
    await admin.from("job_commercials").upsert({
      job_id:id,
      service_model:job.service_model || "curated_placement",
      placement_fee:job.service_model === "curated_placement" ? placementFee : null,
      managed_markup_percent:job.service_model === "managed_service" ? managedMarkup : null,
      commercial_status:"quoted"
    },{onConflict:"job_id"});
    await admin.from("jobs").update({ status: "pending", rejection_note: null }).eq("id", id);
  } else if (decision === "reject") {
    await admin.from("jobs").update({ status: "draft", rejection_note: String(formData.get("note") ?? "Please update the job and resubmit.") }).eq("id", id);
  }
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: decision === "approve" ? "job_terms_approved" : "job_returned_for_edits", targetType: "job", targetId: id });
  revalidatePath("/workspace/admin/jobs");
}

export async function convertLeadToJobAction(formData: FormData) {
  await requireRole("admin");
  const leadId = String(formData.get("lead_id"));
  const clientId = String(formData.get("client_id") ?? "") || null;
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("*").eq("id", leadId).single();
  if (!lead) throw new Error("Lead not found.");
  if (lead.job_id) {
    revalidatePath("/workspace/admin/leads");
    revalidatePath("/workspace/admin/jobs");
    return;
  }
  const { inferCategories, inferHours } = await import("@/lib/category-inference");
  const categories = inferCategories(lead.service, lead.message);
  const fallbackSummary = `Virtual Assistant support requested for ${lead.service || "business operations"}.`;
  const description = cleanJobDescription(lead.message);
  const { data: job, error } = await admin.from("jobs").insert({
    client_id: clientId,
    lead_id: lead.id,
    title: lead.service ? `${lead.service}` : "Virtual Assistant",
    company_name: lead.company || null,
    summary: cleanJobSummary(lead.message, fallbackSummary),
    description,
    responsibilities: description ? [description] : [],
    categories,
    hours_per_week: inferHours(lead.hours),
    min_hourly_rate: 5,
    timezone: lead.timezone || null,
    overlap_hours: 4,
    live_coverage_exception: /reception|dispatch|cold call|outbound|front desk/i.test(`${lead.service || ""} ${lead.message || ""}`),
    onboarding_plan: "Client onboarding and tool access to be confirmed before placement.",
    direct_feedback: true,
    engagement_length: "Long-term preferred",
    start_timing: lead.start_time || null,
    status: "pending"
  }).select("id").single();
  if (error) throw error;
  await admin.from("lead_intake").update({ status: "converted", client_id: clientId, job_id: job.id }).eq("id", leadId);
  let sourcePath = "/hire";
  try {
    if (lead.page_url) sourcePath = new URL(lead.page_url).pathname;
  } catch {
    // Keep a safe public fallback when an imported lead has a malformed URL.
  }
  await admin.from("analytics_events").insert({
    event_name: "qualified_lead",
    path: sourcePath,
    session_id: lead.session_id || null,
    metadata: { lead_id: lead.id, job_id: job.id, service: lead.service || null }
  });
  revalidatePath("/workspace/admin/leads");
  revalidatePath("/workspace/admin/jobs");
}

/**
 * Emails every VA currently stuck at the very first vetting stage
 * ("profile") encouraging them to finish it. Triggered manually by an
 * admin so it can never turn into an automatic spam loop.
 */
export async function sendProfileStageNudgesAction() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: stuck } = await admin.from("va_vetting").select("va_id").eq("stage", "profile");
  const ids = (stuck || []).map((row: any) => row.va_id);
  if (!ids.length) redirect("/workspace/admin/vetting?nudges_sent=0");

  const { data: profiles } = await admin.from("profiles").select("id,full_name").in("id", ids);
  const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const { sendVettingNudgeEmail } = await import("@/lib/email");

  let sent = 0;
  for (const id of ids) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (!data.user?.email) continue;
    const result = await sendVettingNudgeEmail({ to: data.user.email, fullName: nameMap.get(id), appUrl });
    if (result.sent) sent += 1;
  }

  redirect(`/workspace/admin/vetting?nudges_sent=${sent}`);
}

/**
 * Adds every currently-approved (not yet bench) VA to the talent pool for
 * their own primary category, at default priority. Skips anyone without a
 * primary category set -- there's nothing sensible to file them under.
 */
export async function bulkAddApprovedToBenchAction() {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: approved } = await admin.from("va_vetting").select("va_id").eq("stage", "approved");
  const ids = (approved || []).map((row: any) => row.va_id);
  if (!ids.length) {
    revalidatePath("/workspace/admin/vetting");
    return { added: 0 };
  }

  const { data: profiles } = await admin.from("va_profiles").select("user_id,primary_category").in("user_id", ids);
  const eligible = (profiles || []).filter((row: any) => row.primary_category);
  if (!eligible.length) {
    revalidatePath("/workspace/admin/vetting");
    return { added: 0 };
  }

  const rows = eligible.map((row: any) => ({ va_id: row.user_id, category: row.primary_category, status: "active", priority: 3, created_by: user.id }));
  await admin.from("bench_memberships").upsert(rows, { onConflict: "va_id,category" });
  await admin.from("va_vetting").update({ stage: "bench" }).in("va_id", eligible.map((row: any) => row.user_id));

  revalidatePath("/workspace/recruiter/bench");
  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/find-talent");
  return { added: eligible.length };
}

export async function bulkAddApprovedToBenchFormAction() {
  const result = await bulkAddApprovedToBenchAction();
  redirect(`/workspace/admin/vetting?bulk_benched=${result.added}`);
}

/**
 * Auto-quotes straightforward curated placements, but never publishes them.
 * The client must explicitly accept commercial terms before publication.
 */
export async function autoQuoteStraightforwardJobsAction() {
  await requireRole("admin");
  const { autoQuoteStraightforwardJobs } = await import("@/lib/auto-publish");
  const result = await autoQuoteStraightforwardJobs();
  revalidatePath("/workspace/admin/jobs");
  return result;
}

export async function autoQuoteStraightforwardJobsFormAction() {
  const result = await autoQuoteStraightforwardJobsAction();
  const params = new URLSearchParams({
    auto_quoted: String(result.quoted),
    skipped_managed: String(result.skippedManaged),
    skipped_unlinked: String(result.skippedUnlinked)
  });
  if (result.reason) params.set("auto_quote_error", result.reason);
  redirect(`/workspace/admin/jobs?${params.toString()}`);
}

export async function sendSystemTestEmailAction() {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(user.id);
  const email = data.user?.email;
  if (!email) throw new Error("Your admin account does not have an email address.");
  const { sendSystemTestEmail } = await import("@/lib/email");
  await sendSystemTestEmail(email);
  revalidatePath("/workspace/admin/system");
  redirect("/workspace/admin/system?email_test=sent");
}


export async function setClientJobSelfPublishAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const clientId = String(formData.get("client_id") || "").trim();
  const enabled = String(formData.get("enabled") || "") === "1";
  const requestedReturnTo = String(formData.get("return_to") || "/workspace/admin/jobs").trim();
  const returnTo = requestedReturnTo.startsWith("/workspace/admin/")
    ? requestedReturnTo
    : "/workspace/admin/jobs";

  if (!clientId) throw new Error("Client account is required.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("client_profiles")
    .upsert({ user_id: clientId, can_self_publish_jobs: enabled }, { onConflict: "user_id" });

  if (error) throw error;

  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({
    actorId: user.id,
    action: enabled ? "client_job_self_publish_enabled" : "client_job_self_publish_disabled",
    targetType: "client",
    targetId: clientId,
  });

  revalidatePath("/workspace/admin/jobs");
  revalidatePath(returnTo);
}

export async function setClientCompanyVerificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const clientId = String(formData.get("client_id") || "");
  const verified = String(formData.get("verified") || "") === "1";
  if (!clientId) throw new Error("Client account is required.");
  const admin = createAdminClient();
  const { error } = await admin.from("client_profiles").update({ verified_at: verified ? new Date().toISOString() : null }).eq("user_id", clientId);
  if (error) throw error;
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: verified ? "client_company_verified" : "client_company_unverified", targetType: "client", targetId: clientId });
  revalidatePath("/workspace/admin/users");
  revalidatePath("/jobs");
}

/** Immediate, audited removal from public listings without deleting applicants. */
export async function unpublishJobForReviewAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Missing job.");
  const admin = createAdminClient();
  const { data: job, error: readError } = await admin.from("jobs")
    .select("id,status,slug").eq("id", jobId).maybeSingle();
  if (readError) throw readError;
  if (!job || job.status !== "published") throw new Error("Only a published role can be unpublished.");

  const { data: held, error } = await admin.from("jobs").update({
    status: "pending",
    moderation_status: "review",
    published_at: null,
    rejection_note: "Unpublished for staff content review.",
  }).eq("id", jobId).eq("status", "published").select("id,slug").maybeSingle();
  if (error) throw error;
  if (!held) throw new Error("The role changed while it was being unpublished. Refresh and try again.");

  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "job_unpublished_for_review", targetType: "job", targetId: jobId });
  await notifyGoogleIndexingBestEffort(`/jobs/${held.slug || held.id}`, "URL_DELETED");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${held.slug || held.id}`);
  revalidatePath("/workspace/admin/jobs");
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
}

/** An admin clears the content hold only after reviewing the actual job. */
export async function clearJobContentReviewAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Missing job.");
  const admin = createAdminClient();
  const { data: job, error: readError } = await admin.from("jobs")
    .select("id,moderation_status,title,company_name,summary,description,responsibilities,required_skills,required_tools,min_hourly_rate,schedule_notes,onboarding_plan")
    .eq("id", jobId).maybeSingle();
  if (readError) throw readError;
  if (!job || job.moderation_status !== "review") throw new Error("This job is not awaiting content review.");
  const missing = publicationMissingDetails(job);
  if (missing.length) throw new Error(`Complete the role before clearing the hold: ${missing.join(", ")}.`);
  const parts = [job.title,job.company_name,job.summary,job.description,job.responsibilities,job.required_skills,job.required_tools,job.schedule_notes,job.onboarding_plan];
  assertPublicHiringContentSafe(parts);
  if (publicJobReviewSignals(parts).length) throw new Error("Remove promotional language and external links before clearing the hold.");
  const { error } = await admin.from("jobs").update({
    moderation_status: "clear",
    rejection_note: null,
  }).eq("id", jobId).eq("moderation_status", "review");
  if (error) throw error;
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "job_content_review_cleared", targetType: "job", targetId: jobId });
  revalidatePath("/workspace/admin/jobs");
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
}
