"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelGoogleMeetDiscoveryMeeting } from "@/lib/booking-operations";
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

function activeReturnPath(returnTo: string, role: string) {
  if (role !== "recruiter") return returnTo;
  const url = new URL(returnTo, "https://virtualassistant.com.ph");
  if (url.pathname !== "/workspace/recruiter/leads") return returnTo;
  const view = url.searchParams.get("view");
  if (!view || view === "recent") {
    url.searchParams.set("view", "open");
    url.searchParams.delete("page");
  }
  return `${url.pathname}${url.search}`;
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
    .select("id,crm_stage,owner_id,job_id,lost_at,discovery_scheduled_at,discovery_calendar_event_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return fail("Lead not found.");

  // The recruiter CRM is a shared team queue. Any recruiter or admin who can
  // access the CRM may close a visible lead, even when another recruiter owns it.
  // Ownership remains on the record for reporting and activity history.
  const now = new Date().toISOString();
  const leadUpdate = admin
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

  const linkedRoleUpdate = closeLinkedRole && lead.job_id
    ? admin
        .from("jobs")
        .update({ status: "closed", closed_at: now, updated_at: now })
        .eq("id", lead.job_id)
        .in("status", ["draft", "pending", "published"])
        .select("id")
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [{ error: leadError }, linkedRoleResult] = await Promise.all([leadUpdate, linkedRoleUpdate]);
  if (leadError) return fail(leadError.message || "Could not close the lead.");

  const linkedRoleClosed = Boolean(linkedRoleResult.data?.id);
  const linkedRoleCloseFailed = Boolean(linkedRoleResult.error);

  after(async () => {
    if (lead.discovery_scheduled_at && lead.discovery_calendar_event_id) {
      try {
        await cancelGoogleMeetDiscoveryMeeting(lead.discovery_calendar_event_id);
      } catch {
        // CRM state is already closed even if Google Calendar is temporarily unavailable.
      }
    }

    try {
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
          linked_role_closed: linkedRoleClosed,
          linked_role_close_failed: linkedRoleCloseFailed
        }
      });
    } catch {
      // Closing the lead should not feel blocked by non-critical activity logging.
    }
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (lead.job_id) revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);

  const destination = activeReturnPath(returnTo, profile.role);
  const params = new URLSearchParams({ crm_saved: "1", lead_closed: "1" });
  if (linkedRoleCloseFailed) params.set("role_close_warning", "1");
  redirect(`${destination}${destination.includes("?") ? "&" : "?"}${params.toString()}`);
}