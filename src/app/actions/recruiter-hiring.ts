"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensurePendingRoleForLead, jobTitleForCategory } from "@/lib/lead-role";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value || "").trim();
  return path.startsWith("/workspace/recruiter/leads") && !path.startsWith("//")
    ? path
    : "/workspace/recruiter/leads";
}

function withError(path: string, message: string) {
  return `${path}${path.includes("?") ? "&" : "?"}role_error=${encodeURIComponent(message)}`;
}

export async function createRoleFromLeadAndMatchAction(formData: FormData): Promise<never> {
  const { user } = await requireRole("recruiter");
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safeReturnPath(formData.get("return_to"));
  if (!leadId) redirect(withError(returnTo, "Choose a hiring enquiry first."));

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,lead_type,job_id,client_id,owner_id,service,company,hours,budget,start_time,timezone,message")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) redirect(withError(returnTo, leadError.message || "Could not load this hiring enquiry."));
  if (!lead || lead.lead_type !== "client_hiring") {
    redirect(withError(returnTo, "This record is not a client hiring enquiry."));
  }

  let jobId: string;
  try {
    jobId = await ensurePendingRoleForLead({
      admin,
      leadId: lead.id,
      clientId: lead.client_id || null,
      title: jobTitleForCategory(String(lead.service || "")),
      service: lead.service || null,
      company: lead.company || null,
      hours: lead.hours || null,
      budget: lead.budget || null,
      startTime: lead.start_time || null,
      timezone: lead.timezone || null,
      message: lead.message || null,
      recruiterId: user.id,
      ownerId: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the recruiting role.";
    redirect(withError(returnTo, message));
  }

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: lead.id,
    action: "role_prepared_from_lead",
    description: "Prepared the linked recruiting role and opened matching from the Hiring inbox",
    actorId: user.id,
    metadata: { lead_id: lead.id, job_id: jobId, source: "hiring_inbox" },
  });

  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/recruiter/roles");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  redirect(`/workspace/recruiter/roles/${jobId}#matching`);
}
