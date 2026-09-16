"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelZoomDiscoveryMeeting } from "@/lib/booking-operations";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const CLOSE_REASONS = new Set([
  "Spam",
  "Duplicate inquiry",
  "No response",
  "Not a fit",
  "Budget",
  "Timing",
  "Hired elsewhere",
  "Other"
]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function closeLeadAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const rawReason = String(formData.get("reason") || "").trim();
  const closeLinkedRole = String(formData.get("close_linked_role") || "") === "1";
  const returnTo = safePath(
    formData.get("return_to"),
    profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/leads"
  );
  const fail = (message: string) =>
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}crm_error=${encodeURIComponent(message)}`);

  if (!leadId) return fail("Lead not found.");
  if (!CLOSE_REASONS.has(rawReason)) return fail("Choose a valid close reason.");

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("lead_intake")
    .select("id,crm_stage,job_id,lost_at,discovery_scheduled_at,discovery_zoom_meeting_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return fail("Lead not found.");

  const now = new Date().toISOString();
  const { error } = await admin
    .from("lead_intake")
    .update({
      crm_stage: "lost",
      status: "archived",
      lost_reason: rawReason,
      next_follow_up_at: null,
      stage_updated_at: now,
      lost_at: lead.lost_at || now,
      won_at: null,
      discovery_cancelled_at: lead.discovery_scheduled_at ? now : undefined,
      discovery_scheduled_at: lead.discovery_scheduled_at ? null : undefined,
      discovery_meeting_url: lead.discovery_scheduled_at ? null : undefined
    })
    .eq("id", leadId);
  if (error) return fail(error.message || "Could not close the lead.");

  let linkedRoleClosed = false;
  if (closeLinkedRole && lead.job_id) {
    const { data: job } = await admin.from("jobs").select("id,status").eq("id", lead.job_id).maybeSingle();
    if (job && ["pending", "published"].includes(String(job.status))) {
      const { error: roleError } = await admin
        .from("jobs")
        .update({ status: "closed", closed_at: now, updated_at: now })
        .eq("id", lead.job_id);
      if (roleError) return fail(roleError.message || "Lead closed, but the linked role could not be closed.");
      linkedRoleClosed = true;
    }
  }

  if (lead.discovery_scheduled_at && lead.discovery_zoom_meeting_id) {
    try {
      await cancelZoomDiscoveryMeeting(lead.discovery_zoom_meeting_id);
    } catch {
      // The CRM close remains the source of truth if Zoom is unavailable.
    }
  }

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "lead_closed",
    description: `Lead closed: ${rawReason}`,
    actorId: user.id,
    metadata: {
      previous_stage: lead.crm_stage || null,
      close_reason: rawReason,
      job_id: lead.job_id || null,
      linked_role_closed: linkedRoleClosed
    }
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  revalidatePath("/workspace/recruiter/matching");
  if (lead.job_id) revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);

  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}crm_saved=1&lead_closed=1`);
}
