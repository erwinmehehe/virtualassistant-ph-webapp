"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanJobSummary, cleanJobDescription } from "@/lib/job-content-cleanup";

export async function reviewJobAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const id = String(formData.get("job_id"));
  const decision = String(formData.get("decision"));
  const admin = createAdminClient();
  if (decision === "approve") {
    const { data: job } = await admin.from("jobs").select("client_id,service_model").eq("id", id).single();
    if (!job?.client_id) throw new Error("Link this lead-created job to a client account before publishing it.");
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
 * Bulk-approves every VA currently mid-pipeline (not already
 * approved/bench/rejected) who reports 2+ years of experience, skipping the
 * remaining skills test / video / recruiter review steps. This is a
 * deliberate shortcut to clear a real backlog quickly, not a permanent
 * replacement for the normal pipeline -- use sparingly.
 */
export async function bulkApproveExperiencedVAsAction() {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: pending } = await admin.from("va_vetting").select("va_id").not("stage", "in", "(approved,bench,rejected)");
  const pendingIds = (pending || []).map((row: any) => row.va_id);
  const { data: experienced } = pendingIds.length
    ? await admin.from("va_profiles").select("user_id").in("user_id", pendingIds).gte("years_experience", 2)
    : { data: [] as any[] };
  const ids = (experienced || []).map((row: any) => row.user_id);
  if (!ids.length) {
    revalidatePath("/workspace/admin/vetting");
    return { approved: 0 };
  }

  const now = new Date().toISOString();
  await admin.from("va_vetting").update({ stage: "approved", approved_at: now, admin_notes: "Bulk-approved: 2+ years experience (skipped remaining vetting steps)." }).in("va_id", ids);
  await admin.from("notifications").insert(ids.map((id: string) => ({
    user_id: id,
    title: "Your Virtual Assistant profile is approved",
    body: "Your profile has been approved based on your experience level. You can now apply to published roles and appear in client matching.",
    href: "/workspace/va/vetting"
  })));

  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/workspace/recruiter/queue");
  return { approved: ids.length };
}

export async function bulkApproveExperiencedVAsFormAction() {
  await bulkApproveExperiencedVAsAction();
  redirect("/workspace/admin/vetting?bulk_approved=1");
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
