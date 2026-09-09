"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { slugifyJobTitle } from "@/lib/public-routing";
import { recordProductEvent } from "@/lib/product-events";

function csv(value: FormDataEntryValue | null) {
  return String(value ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n/).map((x) => x.replace(/^[-*]\s*/, "").trim()).filter(Boolean).slice(0, 30);
}

function n(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function uniqueJobSlug(admin: ReturnType<typeof createAdminClient>, title: string, excludeId?: string) {
  const base = slugifyJobTitle(title);
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    let query = admin.from("jobs").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createJobAction(formData: FormData) {
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const submitMode = String(formData.get("submit_mode") ?? "submit");
  const minRate = n(formData.get("min_hourly_rate"));
  const overlap = n(formData.get("overlap_hours")) ?? 0;
  const exception = formData.get("live_coverage_exception") === "on";
  const requestedVaRaw = String(formData.get("requested_va_id") ?? "").trim();

  const maxRate = n(formData.get("max_hourly_rate"));
  if (minRate != null && minRate < MIN_HOURLY_RATE) throw new Error(`Budget must be at least USD ${MIN_HOURLY_RATE} per hour.`);
  if (maxRate != null && maxRate < MIN_HOURLY_RATE) throw new Error(`Maximum budget must be at least USD ${MIN_HOURLY_RATE} per hour.`);
  if (minRate != null && maxRate != null && maxRate < minRate) throw new Error("Maximum budget must be at least the minimum budget.");

  if (submitMode !== "draft") {
    if (!String(formData.get("title") ?? "").trim()) throw new Error("Job title is required.");
    if (minRate == null) throw new Error(`Budget must be at least USD ${MIN_HOURLY_RATE} per hour.`);
    if (overlap > 4 && !exception) throw new Error("Live overlap above 4 hours requires a time-dependent role exception.");
  }

  let requestedVaId: string | null = null;
  if (requestedVaRaw) {
    const { data: requestedVa } = await supabase.from("public_va_directory").select("user_id").eq("user_id", requestedVaRaw).maybeSingle();
    if (requestedVa) requestedVaId = requestedVa.user_id;
  }

  const title = String(formData.get("title") ?? "Untitled job").trim() || "Untitled job";

  const payload = {
    client_id: user.id,
    requested_va_id: requestedVaId,
    title,
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    summary: String(formData.get("summary") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    responsibilities: lines(formData.get("responsibilities")),
    required_skills: csv(formData.get("required_skills")),
    required_tools: csv(formData.get("required_tools")),
    categories: csv(formData.get("categories")).slice(0, 3),
    hours_per_week: n(formData.get("hours_per_week")),
    min_hourly_rate: minRate,
    max_hourly_rate: maxRate,
    timezone: String(formData.get("timezone") ?? "").trim() || null,
    overlap_hours: overlap,
    live_coverage_exception: exception,
    schedule_notes: String(formData.get("schedule_notes") ?? "").trim() || null,
    onboarding_plan: String(formData.get("onboarding_plan") ?? "").trim() || null,
    direct_feedback: formData.get("direct_feedback") !== "off",
    engagement_length: String(formData.get("engagement_length") ?? "").trim() || null,
    experience_level: ["entry","intermediate","senior","expert"].includes(String(formData.get("experience_level") ?? "")) ? String(formData.get("experience_level")) : "intermediate",
    start_timing: String(formData.get("start_timing") ?? "").trim() || null,
    service_model: String(formData.get("service_model") ?? "curated_placement") === "managed_service" ? "managed_service" : "curated_placement",
    status: submitMode === "draft" ? "draft" : "pending",
    ...(submitMode === "draft" ? {} : { published_at: null })
  };

  const jobId = String(formData.get("job_id") ?? "").trim();
  const admin = createAdminClient();
  let savedId = jobId;
  let previousStatus: string | null = null;
  let savedStatus = payload.status;
  if (jobId) {
    const { data: ownedJob } = await supabase.from("jobs").select("id,status,slug,title,published_at").eq("id", jobId).eq("client_id", user.id).single();
    if (!ownedJob) throw new Error("Job not found.");
    previousStatus = ownedJob.status;
    const shouldRefreshSlug = ["draft", "pending"].includes(ownedJob.status) && ownedJob.title !== title;
    const preservePublished = submitMode !== "draft" && ownedJob.status === "published";
    const statusAwarePayload = preservePublished
      ? { ...payload, status: "published", published_at: ownedJob.published_at || new Date().toISOString() }
      : payload;
    savedStatus = statusAwarePayload.status;
    const updatePayload = shouldRefreshSlug ? { ...statusAwarePayload, slug: await uniqueJobSlug(admin, title, jobId) } : statusAwarePayload;
    const { data, error } = await admin.from("jobs").update(updatePayload).eq("id", jobId).eq("client_id", user.id).select("id").single();
    if (error) throw error;
    savedId = data.id;
  } else {
    const slug = await uniqueJobSlug(admin, title);
    const { data, error } = await admin.from("jobs").insert({ ...payload, slug }).select("id").single();
    if (error) throw error;
    savedId = data.id;
  }

  // Notify only when a private brief is first submitted for team review.
  // Publishing happens later, after commercial terms are accepted.
  await recordProductEvent(jobId ? "job_updated" : "job_created", { userId: user.id, path: `/workspace/client/jobs/${savedId}`, metadata: { job_id: savedId, status: savedStatus, submit_mode: submitMode } });

  if (savedStatus === "pending" && previousStatus !== "pending") {
    try {
      const { data: clientProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const admins = await admin.from("profiles").select("id").eq("role", "admin");
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
      const { sendJobSubmittedForReviewEmail } = await import("@/lib/email");
      await sendJobSubmittedForReviewEmail({ jobId: savedId, jobTitle: title, clientName: clientProfile?.full_name, appUrl });
      if (admins.data?.length) {
        await admin.from("notifications").insert(admins.data.map((a) => ({
          user_id: a.id,
          title: "New hiring brief submitted",
          body: `${clientProfile?.full_name || "A client"} submitted "${title}" for review. Confirm the brief and commercial terms before it goes live.`,
          href: `/workspace/admin/jobs/${savedId}`
        })));
      }
    } catch {
      // Notification failure must never block the client's job submission.
    }
  }

  revalidatePath("/workspace/client");
  revalidatePath("/workspace/client/jobs");
  redirect(`/workspace/client/jobs/${savedId}?saved=1`);
}

export async function closeJobAction(formData: FormData) {
  const { user } = await requireRole("client");
  const id = String(formData.get("job_id"));
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,title").eq("id", id).eq("client_id", user.id).single();
  if (!job) throw new Error("Job not found.");
  const admin = createAdminClient();
  const { error } = await admin.from("jobs").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", id).eq("client_id", user.id);
  if (error) throw error;
  try { const authUser=await admin.auth.admin.getUserById(user.id); const {sendTransactionalEventEmail}=await import("@/lib/email"); await sendTransactionalEventEmail({to:authUser.data.user?.email,subject:`Job closed: ${job.title}`,heading:"Your job is now closed",body:`${job.title} is no longer accepting applications.`,href:`${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/jobs/${id}`,hrefLabel:"View job"}); } catch {}
  revalidatePath(`/workspace/client/jobs/${id}`);
  revalidatePath("/workspace/client");
}

export async function acceptCommercialTermsAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") ?? "");
  if (formData.get("fee_ack") !== "on") throw new Error("Please confirm that the service fee is separate from VA compensation.");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,status,client_id,min_hourly_rate").eq("id",jobId).eq("client_id",user.id).single();
  if (!job) throw new Error("Job not found.");
  if (job.min_hourly_rate == null || Number(job.min_hourly_rate) < MIN_HOURLY_RATE) throw new Error(`Raise the VA budget to at least USD ${MIN_HOURLY_RATE}/hour before publishing.`);
  const { data: commercial } = await supabase.from("job_commercials").select("commercial_status").eq("job_id",jobId).single();
  if (!commercial || commercial.commercial_status !== "quoted") throw new Error("The service fee is not ready for acceptance.");
  const admin = createAdminClient();
  await admin.from("job_commercials").update({commercial_status:"accepted"}).eq("job_id",jobId);
  const publishedAt = new Date().toISOString();
  const { data: publishedJob } = await admin.from("jobs").update({status:"published",published_at:publishedAt}).eq("id",jobId).eq("client_id",user.id).select("id,client_id,title,categories,required_skills,required_tools,hours_per_week,overlap_hours").single();
  if (publishedJob) {
    await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "comped",
      access_fee: 0,
      currency: "USD",
      unlocked_at: publishedAt
    }, { onConflict: "job_id" });
  }

  if (publishedJob) {
    await recordProductEvent("job_published", { userId: user.id, path: `/workspace/client/jobs/${jobId}`, metadata: { job_id: jobId } });
    try { const auth = await admin.auth.admin.getUserById(user.id); const { sendTransactionalEventEmail } = await import("@/lib/email"); await sendTransactionalEventEmail({ to: auth.data.user?.email, subject: `Job published: ${publishedJob.title}`, heading: "Your hiring request is live", body: "We have confirmed the role and your candidate access is active. Our recruiting team can now shortlist vetted VAs while the role receives applications.", href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/jobs/${jobId}`, hrefLabel: "View hiring progress" }); } catch {}
    try {
      const { autoReleaseTopMatches } = await import("@/lib/auto-matching");
      await autoReleaseTopMatches(publishedJob);
    } catch {
      // Auto-matching is a convenience layer -- staff can still curate a
      // shortlist manually, so a failure here must never block publishing.
    }
  }

  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath("/workspace/client/jobs");
  revalidatePath("/workspace/client");
  revalidatePath("/jobs");
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
}
