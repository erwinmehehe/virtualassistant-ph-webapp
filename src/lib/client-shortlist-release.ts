import "server-only";

import { revalidatePath } from "next/cache";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { sendTransactionalEventEmail } from "@/lib/email";
import { publicationMissingDetails } from "@/lib/job-publication";
import { matchLabel } from "@/lib/matching";
import { sendVaMatchEmail } from "@/lib/match-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTalentAgencyCertified } from "@/lib/talent-operations";
import { queueShortlistReviewAutomation } from "@/lib/trigger-automation";

type AdminClient = ReturnType<typeof createAdminClient>;

export type InvitedShortlistReleaseResult = {
  state: "not_invited" | "awaiting_setup" | "needs_recruiter_review" | "already_released" | "released";
  releasedCount: number;
  emailSent?: boolean;
};

/**
 * An invitation is NOT a candidate release. Release only after the client has
 * claimed the role, approved service terms, and received paid/comped candidate
 * access. This function is safe to retry from all three handoff paths.
 *
 * Never relax the database shortlist_release_guard here: it is the final
 * protection against exposing a VA before commercial/access approval.
 */
export async function releaseInvitedShortlistWhenReady(
  admin: AdminClient,
  clientId: string,
  jobId: string,
): Promise<InvitedShortlistReleaseResult> {
  const [{ data: job, error: jobError }, { data: commercial, error: commercialError }, { data: access, error: accessError }] =
    await Promise.all([
      admin.from("jobs").select("*").eq("id", jobId).eq("client_id", clientId).maybeSingle(),
      admin.from("job_commercials").select("commercial_status").eq("job_id", jobId).maybeSingle(),
      admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle(),
    ]);

  if (jobError || commercialError || accessError) {
    throw jobError || commercialError || accessError;
  }
  if (!job ||
      job.status !== "published" ||
      job.moderation_status !== "clear" ||
      commercial?.commercial_status !== "accepted" ||
      !candidateAccessUnlocked(access?.access_status) ||
      publicationMissingDetails(job).length > 0) {
    return { state: "awaiting_setup", releasedCount: 0 };
  }

  const { data: invite, error: inviteError } = await admin
    .from("recruiter_activity")
    .select("metadata")
    .eq("subject_type", "job")
    .eq("subject_id", jobId)
    .eq("action", "client_review_invited")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (inviteError) throw inviteError;

  const invitedIds = Array.isArray(invite?.metadata?.va_ids)
    ? [...new Set((invite.metadata.va_ids as unknown[]).map(String).filter(Boolean))].slice(0, 5)
    : [];
  if (!invitedIds.length) return { state: "not_invited", releasedCount: 0 };

  const [
    { data: selected, error: selectedError },
    { data: vetting, error: vettingError },
    { data: availability, error: availabilityError },
  ] = await Promise.all([
    admin.from("job_shortlist_candidates")
      .select("va_id,shortlist_status,match_score,created_by")
      .eq("job_id", jobId).in("va_id", invitedIds),
    admin.from("recruiter_va_directory")
      .select("user_id,stage").in("user_id", invitedIds),
    admin.from("va_profiles")
      .select("user_id,availability_status,availability_confirmed_at")
      .in("user_id", invitedIds),
  ]);
  if (selectedError || vettingError || availabilityError) {
    throw selectedError || vettingError || availabilityError;
  }

  const rows = new Map((selected || []).map((row) => [String(row.va_id), row]));
  const stages = new Map((vetting || []).map((row) => [String(row.user_id), row.stage]));
  const availabilityByVa = new Map((availability || []).map((row) => [String(row.user_id), row]));
  const newlySelected = invitedIds.filter((id) => rows.get(id)?.shortlist_status === "proposed");

  if (!newlySelected.length) {
    return {
      state: invitedIds.every((id) => rows.get(id)?.shortlist_status === "released")
        ? "already_released"
        : "needs_recruiter_review",
      releasedCount: 0,
    };
  }

  // All invited candidates must still be approved, recruiter-selected,
  // 60%+ matches, and confirmed available within the standard 30-day window.
  // Never auto-release a stale or partially invalid shortlist.
  const allReady = invitedIds.every((id) => {
    const row = rows.get(id);
    if (!row || !["proposed", "released"].includes(String(row.shortlist_status))) return false;
    if (row.shortlist_status === "released") return true;
    const va = availabilityByVa.get(id);
    return Boolean(row.created_by) &&
      Number(row.match_score || 0) >= 60 &&
      isTalentAgencyCertified({
        stage: stages.get(id),
        activePool: true,
        availabilityStatus: va?.availability_status,
        availabilityConfirmedAt: va?.availability_confirmed_at,
      });
  });

  if (!allReady) {
    const { error } = await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: jobId,
      action: "client_shortlist_release_needs_review",
      description: "Client setup is complete, but invited VA readiness changed. Recruiter must check the shortlist before releasing.",
      actor_id: null,
      metadata: { va_ids: invitedIds },
    });
    if (error) console.error("[shortlist] readiness activity could not be recorded", error.message);
    return { state: "needs_recruiter_review", releasedCount: 0 };
  }

  const releasedAt = new Date().toISOString();
  const { data: released, error: releaseError } = await admin
    .from("job_shortlist_candidates")
    .update({ shortlist_status: "released", released_at: releasedAt })
    .eq("job_id", jobId)
    .eq("shortlist_status", "proposed")
    .in("va_id", newlySelected)
    .select("va_id,match_score");
  if (releaseError) {
    console.error("[shortlist] gated client shortlist release failed", { jobId, code: releaseError.code });
    throw releaseError;
  }
  if (!released?.length) return { state: "already_released", releasedCount: 0 };

  await admin.from("jobs")
    .update({ hiring_stage: "client_review", hiring_stage_entered_at: releasedAt })
    .eq("id", jobId)
    .in("hiring_stage", ["sourcing", "internal_review"]);

  await admin.from("recruiter_activity").insert({
    subject_type: "job",
    subject_id: jobId,
    action: "shortlist_released_after_setup",
    description: String(released.length) + " recruiter-selected VAs released after the client's access requirements were completed",
    actor_id: null,
    metadata: { va_ids: released.map((row) => row.va_id), client_id: clientId },
  });
  await admin.from("notifications").insert({
    user_id: clientId,
    title: "Your curated shortlist is ready to review",
    body: String(released.length) + " recruiter-reviewed VAs are available for " + String(job.title || "your role") + ".",
    href: "/workspace/client/candidates?role=" + encodeURIComponent(jobId),
    type: "shortlist_followup",
  });

  try {
    await queueShortlistReviewAutomation(jobId, releasedAt);
  } catch (error) {
    console.error("[shortlist] review reminder could not be queued", {
      jobId, error: error instanceof Error ? error.message : String(error),
    });
  }

  const [{ data: clientAuth }, { data: clientProfile }] = await Promise.all([
    admin.auth.admin.getUserById(clientId),
    admin.from("profiles").select("full_name").eq("id", clientId).maybeSingle(),
  ]);
  const recipient = clientAuth?.user?.email;
  let emailSent = false;
  let emailFailure = "missing_recipient";
  try {
    if (recipient) {
      const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
      const delivery = await sendTransactionalEventEmail({
        to: recipient,
        firstName: clientProfile?.full_name,
        subject: "Your VA shortlist is ready: " + String(job.title || "Your role"),
        heading: "Your selected VAs are ready to review",
        body: String(released.length) + " recruiter-reviewed Virtual Assistants are now available. Open your private hiring workspace to review their profiles and record your decision.",
        href: base + "/workspace/client/candidates?role=" + encodeURIComponent(jobId),
        hrefLabel: "Review VA shortlist",
        eventType: "client_shortlist_delivery",
        idempotencyKey: "client-shortlist-delivery-" + jobId + "-" + releasedAt,
        priority: "critical",
        senderName: "VirtualAssistant.com.ph Hiring Team",
      });
      emailSent = delivery.sent;
      if (!delivery.sent) emailFailure = String(delivery.reason || "provider_error");
    }
  } catch (error) {
    emailFailure = error instanceof Error ? error.message : "provider_error";
  }

  if (!emailSent) {
    console.error("[shortlist] released but email unavailable", { jobId, reason: emailFailure });
    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: jobId,
      action: "client_shortlist_delivery_failed",
      description: "The shortlist is available in the client workspace, but its email notification failed.",
      actor_id: null,
      metadata: { reason: emailFailure },
    });
  }

  await admin.from("notifications").insert(released.map((row) => ({
    user_id: row.va_id,
    title: "A client role may be a good fit",
    body: "Your recruiter selected your profile for client review. Please keep your availability current.",
    href: "/workspace/va/profile",
  })));
  await Promise.allSettled(released.filter((row) => Number(row.match_score || 0) >= 60).map(async (row) => {
    const { data: vaAuth } = await admin.auth.admin.getUserById(row.va_id);
    await sendVaMatchEmail({
      to: vaAuth?.user?.email,
      fitLabel: matchLabel(Number(row.match_score || 0)),
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
  }));

  revalidatePath("/workspace/client/jobs/" + jobId);
  revalidatePath("/workspace/client/candidates");
  revalidatePath("/workspace/recruiter/roles/" + jobId);
  return { state: "released", releasedCount: released.length, emailSent };
}
