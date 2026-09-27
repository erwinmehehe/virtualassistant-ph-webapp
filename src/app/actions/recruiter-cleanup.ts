"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { legacyLeadStatus } from "@/lib/lead-crm";

const ACTIONS = new Set(["follow_up_later"]);

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

  {
    const nextFollowUpAt = new Date(now.getTime() + 3 * 86400000).toISOString();
    const { error } = await admin.from("lead_intake").update({ owner_id: ownerId, next_follow_up_at: nextFollowUpAt }).eq("id", leadId);
    if (error) return fail(error.message || "Could not reschedule this lead.");
    await writeRecruiterActivity({
      subjectType: "lead",
      subjectId: leadId,
      action: "lead_cleanup_followup_later",
      description: "Lead review moved 3 days forward",
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