"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { slugifyJobTitle } from "@/lib/public-routing";
import { recordProductEvent } from "@/lib/product-events";
import { publicationMissingDetails } from "@/lib/job-publication";

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
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const responsibilities = lines(formData.get("responsibilities"));
  const requiredSkills = csv(formData.get("required_skills"));
  const requiredTools = csv(formData.get("required_tools"));
  const categories = csv(formData.get("categories")).slice(0, 3);
  const hoursPerWeek = n(formData.get("hours_per_week"));
  const timezone = String(formData.get("timezone") ?? "").trim();
  const startTiming = String(formData.get("start_timing") ?? "").trim();
  const serviceModel = String(formData.get("service_model") ?? "curated_placement") === "managed_service"
    ? "managed_service"
    : "curated_placement";

  const admin = createAdminClient();
  const { data: clientProfile } = await admin
    .from("client_profiles")
    .select("can_self_publish_jobs")
    .eq("user_id", user.id)
    .maybeSingle();

  const canSelfPublish = Boolean(clientProfile?.can_self_publish_jobs) && serviceModel === "curated_placement";
  if (canSelfPublish && submitMode !== "draft") {
    const selfPublishMissing = publicationMissingDetails({
      title,
      summary,
      responsibilities,
      required_skills: requiredSkills,
      hours_per_week: hoursPerWeek,
      timezone,
      min_hourly_rate: minRate,
      start_timing: startTiming,
    });
    if (selfPublishMissing.length) {
      throw new Error(`Complete the public job before publishing: ${selfPublishMissing.join(", ")}.`);
    }
  }

  const selfPublish = canSelfPublish && submitMode !== "draft";
  const payload = {
    client_id: user.id,
    requested_va_id: requestedVaId,
    title,
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    summary: summary || null,
    description: description || null,
    responsibilities,
    required_skills: requiredSkills,
    required_tools: requiredTools,
    categories,
    hours_per_week: hoursPerWeek,
    min_hourly_rate: minRate,
    max_hourly_rate: maxRate,
    timezone: timezone || null,
    overlap_hours: overlap,
    live_coverage_exception: exception,
    schedule_notes: String(formData.get("schedule_notes") ?? "").trim() || null,
    onboarding_plan: String(formData.get("onboarding_plan") ?? "").trim() || null,
    direct_feedback: formData.get("direct_feedback") !== "off",
    engagement_length: String(formData.get("engagement_length") ?? "").trim() || null,
    experience_level: ["entry","intermediate","senior","expert"].includes(String(formData.get("experience_level") ?? "")) ? String(formData.get("experience_level")) : "intermediate",
    start_timing: startTiming || null,
    service_model: serviceModel,
    status: submitMode === "draft" ? "draft" : selfPublish ? "published" : "pending",
    ...(submitMode === "draft"
      ? {}
      : { published_at: selfPublish ? new Date().toISOString() : null })
  };

  const jobId = String(formData.get("job_id") ?? "").trim();
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
    if (error) {
      // The database enforces one open role per client + normalized title.
      // If two submits race, reuse the role that won instead of surfacing a
      // generic database error or creating another copy.
      if (error.code === "23505") {
        const { data: openJobs } = await admin
          .from("jobs")
          .select("id,status,title")
          .eq("client_id", user.id)
          .in("status", ["draft", "pending", "published"])
          .limit(100);
        const normalizedTitle = title.trim().toLowerCase();
        const existing = (openJobs || []).find((job) => String(job.title || "").trim().toLowerCase() === normalizedTitle);
        if (existing) {
          savedId = existing.id;
          savedStatus = existing.status;
          previousStatus = existing.status;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      savedId = data.id;
    }
  }

  // Notify only when a private brief is first submitted for team review.
  // Admin-approved self-publishing clients skip this review notification for
  // complete curated-placement roles because those roles are already public.
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
  revalidatePath("/jobs");
  if (savedStatus === "published") revalidatePath(`/jobs/${savedId}`);
  redirect(`/workspace/client/jobs/${savedId}?saved=1`);
}


export async function saveClientRoleReadinessDetailsAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Role is required.");

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id,status,slug,recruiter_id,client_id,title,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing")
    .eq("id", jobId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!job) throw new Error("Role not found.");

  const missing = new Set(publicationMissingDetails(job));
  if (!missing.size) redirect(`/workspace/client/jobs/${jobId}?role_details_complete=1#role-readiness`);

  const patch: Record<string, unknown> = {};
  if (missing.has("title")) {
    const value = String(formData.get("title") || "").trim();
    if (value.length < 3 || value.length > 140) throw new Error("Enter a valid role title.");
    patch.title = value;
  }
  if (missing.has("summary")) {
    const value = String(formData.get("summary") || "").trim();
    if (value.length < 20 || value.length > 1200) throw new Error("Role summary must be at least 20 characters.");
    patch.summary = value;
  }
  if (missing.has("responsibilities")) {
    const value = lines(formData.get("responsibilities"));
    if (!value.length) throw new Error("Add at least one responsibility.");
    patch.responsibilities = value;
  }
  if (missing.has("skills")) {
    const value = csv(formData.get("required_skills"));
    if (value.length < 2) throw new Error("Add at least two required skills.");
    patch.required_skills = value;
  }
  if (missing.has("hours")) {
    const value = Number(formData.get("hours_per_week"));
    if (!Number.isInteger(value) || value < 1 || value > 168) throw new Error("Hours per week must be between 1 and 168.");
    patch.hours_per_week = value;
  }
  if (missing.has("timezone")) {
    const value = String(formData.get("timezone") || "").trim();
    if (!value || value.length > 100) throw new Error("Enter your timezone or working region.");
    patch.timezone = value;
  }
  if (missing.has("budget")) {
    const value = Number(formData.get("min_hourly_rate"));
    if (!Number.isFinite(value) || value < MIN_HOURLY_RATE) throw new Error(`VA budget must be at least USD ${MIN_HOURLY_RATE}/hour.`);
    patch.min_hourly_rate = value;
  }
  if (missing.has("start timing")) {
    const value = String(formData.get("start_timing") || "").trim();
    if (!value || value.length > 100) throw new Error("Enter your preferred start timing.");
    patch.start_timing = value;
  }

  const candidate = { ...job, ...patch };
  const stillMissing = publicationMissingDetails(candidate);
  if (stillMissing.length) throw new Error(`Complete the remaining hiring details: ${stillMissing.join(", ")}.`);

  const admin = createAdminClient();
  const { error } = await admin.from("jobs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", jobId).eq("client_id", user.id);
  if (error) throw error;

  if (job.recruiter_id) {
    await admin.from("notifications").insert({
      user_id: job.recruiter_id,
      title: "Client completed role details",
      body: `The client completed the missing hiring details for “${String((patch.title || job.title) ?? "Virtual Assistant role")}”.`,
      href: `/workspace/recruiter/roles/${jobId}`,
    });
  }

  await recordProductEvent("job_updated", {
    userId: user.id,
    path: `/workspace/client/jobs/${jobId}`,
    metadata: { job_id: jobId, source: "client_role_readiness" },
  });

  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath("/workspace/recruiter/roles");
  revalidatePath("/workspace/admin/jobs");
  if (job.status === "published") {
    revalidatePath("/jobs");
    if (job.slug) revalidatePath(`/jobs/${job.slug}`);
  }

  redirect(`/workspace/client/jobs/${jobId}?role_details_saved=1#role-readiness`);
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
  revalidatePath(`/workspace/client/jobs/${id}`);
  revalidatePath("/workspace/client");
}

export async function acceptCommercialTermsAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") ?? "");
  if (formData.get("fee_ack") !== "on") throw new Error("Please confirm that the service fee is separate from VA compensation.");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,status,client_id,title,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing").eq("id",jobId).eq("client_id",user.id).single();
  if (!job) throw new Error("Job not found.");
  if (job.min_hourly_rate == null || Number(job.min_hourly_rate) < MIN_HOURLY_RATE) throw new Error(`Raise the VA budget to at least USD ${MIN_HOURLY_RATE}/hour before publishing.`);
  const missing = publicationMissingDetails(job);
  if (missing.length) throw new Error(`Complete the role before publishing: ${missing.join(", ")}.`);
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
