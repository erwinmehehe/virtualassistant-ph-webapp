"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStaffClientFollowupEmail } from "@/lib/email";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { legacyLeadStatus } from "@/lib/lead-crm";

const ACTIONS = new Set(["send_followup", "follow_up_later"]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function recruiterCleanupLeadAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const action = String(formData.get("cleanup_action") || "").trim();
  const returnTo = safePath(formData.get("return_to"), profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/today");
  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}cleanup_error=${encodeURIComponent(message)}`);

  if (!leadId || !ACTIONS.has(action)) return fail("Choose a valid cleanup action.");

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin.from("lead_intake")
    .select("id,name,email,service,crm_stage,owner_id,job_id,first_contact_at")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError) return fail(leadError.message || "Could not load this lead.");
  if (!lead) return fail("Lead not found.");
  if (profile.role === "recruiter" && lead.owner_id && lead.owner_id !== user.id) return fail("This lead belongs to another recruiter.");
  if (["won", "lost"].includes(String(lead.crm_stage || "new"))) return fail("This lead is already closed.");

  const now = new Date();
  const nowIso = now.toISOString();
  const ownerId = lead.owner_id || user.id;

  if (action === "send_followup") {
    if (!lead.email) return fail("This lead has no email address.");
    const serviceContext = lead.service ? ` about ${lead.service}` : "";
    const isFirstContact = !lead.first_contact_at;
    const subject = isFirstContact ? "Your Virtual Assistant hiring request" : "Following up on your Virtual Assistant hiring request";
    const message = isFirstContact
      ? `Thanks for reaching out to VirtualAssistant.com.ph${serviceContext}. I’m following up so we can understand the role, schedule, and priorities and move your search forward. Reply here with any details you want us to consider, or book a discovery call when convenient.`
      : `I’m following up on your Virtual Assistant hiring request${serviceContext}. If the role is still active, reply here with any updates or questions and we’ll move the next step forward. If your plans changed, just let us know and we’ll update the search.`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const href = lead.job_id ? `${appUrl}/workspace/client/jobs/${lead.job_id}` : `${appUrl}/book-client-call`;
    const result = await sendStaffClientFollowupEmail({
      to: lead.email,
      subject,
      message,
      senderName: profile.full_name || "VirtualAssistant.com.ph hiring team",
      href
    });
    if (!result.sent) return fail("Client follow-up could not be sent. Check the email configuration and recipient address.");

    const patch: Record<string, unknown> = {
      owner_id: ownerId,
      last_contact_at: nowIso,
      next_follow_up_at: new Date(now.getTime() + 2 * 86400000).toISOString()
    };
    if (!lead.first_contact_at) patch.first_contact_at = nowIso;
    if ((lead.crm_stage || "new") === "new") {
      patch.crm_stage = "contacted";
      patch.status = legacyLeadStatus("contacted");
      patch.stage_updated_at = nowIso;
    }
    const { error } = await admin.from("lead_intake").update(patch).eq("id", leadId);
    if (error) return fail(error.message || "The email sent, but the CRM could not be updated.");

    await writeRecruiterActivity({
      subjectType: "lead",
      subjectId: leadId,
      action: "lead_cleanup_followup_sent",
      description: `Cleanup follow-up sent${lead.name ? ` to ${lead.name}` : ""}`,
      actorId: user.id,
      metadata: { job_id: lead.job_id || null, next_follow_up_at: patch.next_follow_up_at }
    });
  } else {
    const nextFollowUpAt = new Date(now.getTime() + 3 * 86400000).toISOString();
    const { error } = await admin.from("lead_intake").update({ owner_id: ownerId, next_follow_up_at: nextFollowUpAt }).eq("id", leadId);
    if (error) return fail(error.message || "Could not reschedule this lead.");
    await writeRecruiterActivity({
      subjectType: "lead",
      subjectId: leadId,
      action: "lead_cleanup_followup_later",
      description: "Lead follow-up moved 3 days forward",
      actorId: user.id,
      metadata: { next_follow_up_at: nextFollowUpAt }
    });
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}cleanup_saved=${encodeURIComponent(action)}`);
}