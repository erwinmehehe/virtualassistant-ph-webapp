"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { legacyLeadStatus, type LeadCrmStage } from "@/lib/lead-crm";

const BOARD_STAGES = new Set<LeadCrmStage>([
  "new",
  "contacted",
  "discovery_booked",
  "qualified",
  "terms_sent",
  "nurture",
  "won"
]);

export async function moveLeadStageAction(leadIdRaw: string, stageRaw: string) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(leadIdRaw || "").trim();
  const stage = String(stageRaw || "").trim() as LeadCrmStage;

  if (!leadId || !BOARD_STAGES.has(stage)) {
    return { ok: false, error: "Choose a valid pipeline stage." };
  }

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,lead_type,crm_stage,won_at")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead || lead.lead_type !== "client_hiring") {
    return { ok: false, error: "Lead not found." };
  }

  const previousStage = String(lead.crm_stage || "new");
  if (previousStage === stage) return { ok: true };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    crm_stage: stage,
    status: legacyLeadStatus(stage),
    stage_updated_at: now,
    won_at: stage === "won" ? (lead.won_at || now) : null,
    lost_at: null
  };
  if (stage === "won") patch.next_follow_up_at = null;

  const { error } = await admin.from("lead_intake").update(patch).eq("id", leadId);
  if (error) return { ok: false, error: error.message || "Could not move the lead." };

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: `lead_stage_${stage}`,
    description: `Sales stage changed from ${previousStage.replaceAll("_", " ")} to ${stage.replaceAll("_", " ")} from the pipeline board`,
    actorId: user.id,
    metadata: { previous_stage: previousStage, crm_stage: stage, source: "pipeline_board" }
  });

  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/recruiter/leads/board");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/admin/leads");
  revalidatePath("/workspace/admin/sales");

  return { ok: true };
}
