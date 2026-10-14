"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { normalizeTimeZone } from "@/lib/timezones";
import { slugifyJobTitle } from "@/lib/public-routing";
import { recordProductEvent } from "@/lib/product-events";
import { clientCanSelfPublishJob, isPublishableCompanyName, publicJobReviewSignals, publicationMissingDetails, resolveClientJobSubmitStatus } from "@/lib/job-publication";
import { assertPublicHiringContentSafe, hiringCircumventionSignals } from "@/lib/hiring-circumvention";
import { notifyGoogleIndexingBestEffort } from "@/lib/google-indexing";

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

  const companyName = String(formData.get("company_name") ?? "").trim();
  const maxRate = n(formData.get("max_hourly_rate"));
  if (minRate != null && minRate < MIN_HOURLY_RATE) throw new Error(`Budget must be at least USD ${MIN_HOURLY_RATE} per hour.`);
  if (maxRate != null && maxRate < MIN_HOURLY_RATE) throw new Error(`Maximum budget must be at least USD ${MIN_HOURLY_RATE} per hour.`);
  if (minRate != null && maxRate != null && maxRate < minRate) throw new Error("Maximum budget must be at least the minimum budget.");

  if (submitMode !== "draft") {
    if (!String(formData.get("title") ?? "").trim()) throw new Error("Job title is required.");
    if (!isPublishableCompanyName(companyName)) throw new Error("Enter the real company name that will appear on the public job post.");
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
  const submittedTimeZone = String(formData.get("timezone") ?? "").trim();
  const timezone = normalizeTimeZone(submittedTimeZone) || (submitMode === "draft" ? submittedTimeZone : "");
  if (submitMode !== "draft" && !timezone) throw new Error("Choose a valid working timezone (City/Region) before publishing.");
  const startTiming = String(formData.get("start_timing") ?? "").trim();
  const serviceModel = String(formData.get("service_model") ?? "curated_placement") === "managed_service"
    ? "managed_service"
    : "curated_placement";

  const publicationRollout = process.env.ENABLE_VERIFIED_CLIENT_AUTO_PUBLISH === "true";
  const contentParts = [
    title, companyName, summary, description, responsibilities, requiredSkills,
    requiredTools, String(formData.get("schedule_notes") ?? ""),
    String(formData.get("onboarding_plan") ?? ""),
  ];
  const reviewSignals = [
    ...hiringCircumventionSignals(contentParts),
    ...publicJobReviewSignals(contentParts),
  ];
  // Under the rollout, suspicious posts are saved for staff review but never
  // publicly indexed. With the rollout off, preserve the existing strict
  // submit rejection for contact/payment circumvention.
  const needsModeration = publicationRollout && submitMode !== "draft" && reviewSignals.length > 0;
  if (submitMode !== "draft" && !needsModeration) {
    assertPublicHiringContentSafe(contentParts);
  }

  const admin = createAdminClient();
  const { data: clientProfile } = await admin
    .from("client_profiles")
    .select("can_self_publish_jobs,verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Legacy approved publishers are unaffected. All other verified clients
  // are eligible only when the explicitly default-off rollout switch is set.
  // Keep commercial and candidate-access approvals separate from publication.
  const legacyApproved = Boolean(clientProfile?.can_self_publish_jobs && clientProfile?.verified_at) && serviceModel === "curated_placement";
  const canSelfPublish = clientCanSelfPublishJob({
    serviceModel,
    legacyApproved,
    emailVerified: Boolean(user.email_confirmed_at),
    verifiedClientRollout: publicationRollout,
  });
  if (canSelfPublish && submitMode !== "draft") {
    const selfPublishMissing = publicationMissingDetails({
      title,
      company_name: companyName,
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

  const initialStatus = resolveClientJobSubmitStatus({
    submitMode, canSelfPublish, needsModeration,
  });
  const selfPublish = initialStatus === "published";
  const payload = {
    client_id: user.id,
    requested_va_id: requestedVaId,
    title,
    company_name: companyName || null,
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
    status: initialStatus,
    moderation_status: needsModeration ? "review" : "clear",
    ...(needsModeration ? { rejection_note: `Held for content review: ${reviewSignals.join(", ")}.` } : {}),
    ...(submitMode === "draft"
      ? {}
      : { published_at: selfPublish ? new Date().toISOString() : null })
  };

  const jobId = String(formData.get("job_id") ?? "").trim();
  let savedId = jobId;
  let previousStatus: string | null = null;
  let savedStatus = payload.status;
  if (jobId) {
    const { data: ownedJob } = await supabase.from("jobs").select("id,status,slug,title,published_at,moderation_status,rejection_note").eq("id", jobId).eq("client_id", user.id).single();
    if (!ownedJob) throw new Error("Job not found.");
    previousStatus = ownedJob.status;
    const shouldRefreshSlug = ["draft", "pending"].includes(ownedJob.status) && ownedJob.title !== title;
    // Staff content holds cannot be removed by a client editing or resubmitting.
    const needsStaffReview = needsModeration || ownedJob.moderation_status !== "clear";
    const statusAfterEdit = resolveClientJobSubmitStatus({
      submitMode, canSelfPublish, needsModeration,
      previousStatus: ownedJob.status,
      staffHold: ownedJob.moderation_status !== "clear",
    });
    const preservePublished = submitMode !== "draft" && ownedJob.status === "published" && !needsStaffReview;
    const statusAwarePayload = needsStaffReview
      ? {
          ...payload,
          status: statusAfterEdit,
          moderation_status: "review",
          published_at: null,
          rejection_note: needsModeration
            ? `Held for content review: ${reviewSignals.join(", ")}.`
            : (ownedJob.rejection_note || "Staff review required before publication."),
        }
      : preservePublished
        ? { ...payload, status: statusAfterEdit, published_at: ownedJob.published_at || new Date().toISOString() }
        : payload;
    savedStatus = statusAwarePayload.status;
    const updatePayload = shouldRefreshSlug ? { ...statusAwarePayload, slug: await uniqueJobSlug(admin, title, jobId) } : statusAwarePayload;
    const { data, error } = await admin.from("jobs").update(updatePayload)
      .eq("id", jobId).eq("client_id", user.id)
      // Staff can hold a role while a client is editing. Do not overwrite that
      // hold with a stale, previously-clear read.
      .eq("moderation_status", ownedJob.moderation_status)
      .select("id").single();
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
  // Complete and eligible curated-placement roles may already be public;
  // managed-service roles still enter the staffed review path.
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

  let publicJobForIndexing: { id: string; slug: string | null } | null = null;
  if (savedStatus === "published") {
    const { data } = await admin.from("jobs").select("id,slug").eq("id", savedId).maybeSingle();
    publicJobForIndexing = data;
    if (publicJobForIndexing) {
      await notifyGoogleIndexingBestEffort(`/jobs/${publicJobForIndexing.slug || publicJobForIndexing.id}`, "URL_UPDATED");
    }
  }
  else if (previousStatus === "published") {
    // Editing an unsafe live post withdraws it from public search immediately.
    const { data: withdrawn } = await admin.from("jobs").select("id,slug").eq("id", savedId).maybeSingle();
    if (withdrawn) {
      await notifyGoogleIndexingBestEffort(`/jobs/${withdrawn.slug || withdrawn.id}`, "URL_DELETED");
      revalidatePath(`/jobs/${withdrawn.slug || withdrawn.id}`);
    }
  }

  revalidatePath("/workspace/client");
  revalidatePath("/workspace/client/jobs");
  revalidatePath("/jobs");
  if (publicJobForIndexing) revalidatePath(`/jobs/${publicJobForIndexing.slug || publicJobForIndexing.id}`);
  redirect(`/workspace/client/jobs/${savedId}?saved=1`);
}


export async function closeJobAction(formData: FormData) {
  const { user } = await requireRole("client");
  const id = String(formData.get("job_id"));
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,title,slug").eq("id", id).eq("client_id", user.id).single();
  if (!job) throw new Error("Job not found.");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("jobs").update({ status: "closed", closed_at: now, updated_at: now }).eq("id", id).eq("client_id", user.id);
  if (error) throw error;
  revalidatePath(`/workspace/client/jobs/${id}`);
  revalidatePath("/workspace/client");
  revalidatePath("/workspace/client/jobs");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${job.slug || id}`);
  await notifyGoogleIndexingBestEffort(`/jobs/${job.slug || job.id}`, "URL_DELETED");
}

export async function acceptCommercialTermsAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") ?? "");
  if (formData.get("fee_ack") !== "on") throw new Error("Please confirm that the service fee is separate from VA compensation.");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id,status,published_at,client_id,title,company_name,summary,description,responsibilities,required_skills,required_tools,hours_per_week,timezone,min_hourly_rate,start_timing,schedule_notes,onboarding_plan,moderation_status").eq("id",jobId).eq("client_id",user.id).single();
  if (!job) throw new Error("Job not found.");
  if (!["pending", "published"].includes(job.status)) throw new Error("Only an open role can accept service terms.");
  if (job.moderation_status !== "clear") throw new Error("This job is held for content review. Contact your recruiter before proceeding.");
  if (job.min_hourly_rate == null || Number(job.min_hourly_rate) < MIN_HOURLY_RATE) throw new Error(`Raise the VA budget to at least USD ${MIN_HOURLY_RATE}/hour before publishing.`);
  assertPublicHiringContentSafe([job.title, job.company_name, job.summary, job.description, job.responsibilities, job.required_skills, job.required_tools, job.schedule_notes, job.onboarding_plan]);
  const missing = publicationMissingDetails(job);
  if (missing.length) throw new Error(`This brief is missing required public content: ${missing.join(", ")}.`);
  const { data: commercial } = await supabase.from("job_commercials").select("commercial_status").eq("job_id",jobId).single();
  if (!commercial || commercial.commercial_status !== "quoted") throw new Error("The service fee is not ready for acceptance.");
  const admin = createAdminClient();
  // A job may already be public under verified self-publishing. Accepting
  // commercial terms for it must not reset its publication date/expiry.
  // Recheck the live moderation status so a staff hold always wins.
  const acceptedAt = new Date().toISOString();
  const alreadyPublished = job.status === "published";
  const publishedAt = job.published_at || acceptedAt;
  const { data: publishedJob, error: publishError } = await admin.from("jobs")
    .update(alreadyPublished ? { updated_at: acceptedAt } : {status:"published",published_at:acceptedAt})
    .eq("id",jobId).eq("client_id",user.id)
    .eq("status", job.status).eq("moderation_status", "clear")
    .select("id,client_id,title,slug,categories,required_skills,required_tools,hours_per_week,overlap_hours")
    .maybeSingle();
  if (publishError) throw publishError;
  if (!publishedJob) throw new Error("The role changed or was held for review. Refresh the page before continuing.");
  const { error: acceptanceError } = await admin.from("job_commercials")
    .update({commercial_status:"accepted"}).eq("job_id",jobId).eq("commercial_status","quoted");
  if (acceptanceError) throw acceptanceError;
  // Keep existing first-placement access behavior only for the legacy
  // pending→published route. An already-public job must not silently replace
  // its separately priced candidate-access status with a free access record.
  if (publishedJob && !alreadyPublished) {
    await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "comped",
      access_fee: 0,
      currency: "USD",
      unlocked_at: publishedAt
    }, { onConflict: "job_id" });
  }

  if (publishedJob) {
    if (!alreadyPublished) await notifyGoogleIndexingBestEffort(`/jobs/${publishedJob.slug || publishedJob.id}`, "URL_UPDATED");
    if (!alreadyPublished) await recordProductEvent("job_published", { userId: user.id, path: `/workspace/client/jobs/${jobId}`, metadata: { job_id: jobId } });
    try {
      const { autoReleaseTopMatches } = await import("@/lib/auto-matching");
      await autoReleaseTopMatches(publishedJob);
    } catch {
      // Auto-matching is a convenience layer -- staff can still curate a
      // shortlist manually, so a failure here must never block publishing.
    }
  }

  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath("/workspace/client/jobs");
  revalidatePath("/workspace/client");
  revalidatePath("/jobs");
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
}
