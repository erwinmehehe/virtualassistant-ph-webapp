"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const REPLACEMENT_REASONS = new Set([
  "performance",
  "attendance_reliability",
  "skills_fit",
  "communication",
  "schedule_timezone",
  "role_changed",
  "working_style",
  "va_unavailable",
  "other",
]);
const GUARANTEE_STATUSES = new Set(["not_reviewed", "eligible", "not_eligible", "approved", "declined"]);
const RENEWAL_STATUSES = new Set(["not_set", "upcoming", "renewed", "not_renewing"]);
const END_REASONS = new Set([
  "completed",
  "client_cancelled",
  "va_resigned",
  "performance",
  "attendance_reliability",
  "budget",
  "role_changed",
  "business_change",
  "replacement",
  "other",
]);

function clean(value: FormDataEntryValue | null, max = 4000) {
  return String(value || "").trim().slice(0, max) || null;
}

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function agencyPlacementContext(workroomId: string) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const admin = createAdminClient();
  const { data: room, error } = await admin.from("workrooms").select("*").eq("id", workroomId).maybeSingle();
  if (error || !room) throw error || new Error("Placement not found.");
  const { data: job } = await admin.from("jobs").select("id,title,recruiter_id").eq("id", room.job_id).maybeSingle();
  if (!job) throw new Error("Linked role not found.");
  if (profile.role !== "admin" && job.recruiter_id !== user.id && room.client_success_owner_id !== user.id) {
    throw new Error("This placement is assigned to another agency owner.");
  }
  return { admin, room, job, user };
}

function revalidatePlacement(workroomId: string) {
  revalidatePath("/workspace/client-success");
  revalidatePath("/workspace/client-success/support");
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/client/team");
  revalidatePath("/workspace/client/support");
  revalidatePath("/workspace/recruiter/today");
}

export async function saveReplacementWorkflowAction(formData: FormData) {
  const requestId = String(formData.get("request_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const replacementReason = String(formData.get("replacement_reason") || "");
  const slaDueOn = String(formData.get("replacement_sla_due_on") || "");
  const guaranteeStatus = String(formData.get("guarantee_status") || "not_reviewed");
  const guaranteeNotes = clean(formData.get("guarantee_notes"), 2000);
  const returnTo = safePath(formData.get("return_to"), "/workspace/client-success/support");

  if (!requestId || !workroomId) throw new Error("Replacement request is required.");
  if (!REPLACEMENT_REASONS.has(replacementReason)) throw new Error("Choose a replacement reason.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slaDueOn)) throw new Error("Set the replacement SLA due date.");
  if (!GUARANTEE_STATUSES.has(guaranteeStatus)) throw new Error("Choose a valid guarantee review status.");

  const { admin, room, job, user } = await agencyPlacementContext(workroomId);
  const { data: request } = await admin
    .from("placement_support_requests")
    .select("id,request_type,status")
    .eq("id", requestId)
    .eq("workroom_id", workroomId)
    .maybeSingle();
  if (!request || request.request_type !== "replacement") throw new Error("Replacement request not found.");
  if (["resolved", "declined"].includes(request.status)) throw new Error("This replacement request is already closed.");

  const { error } = await admin.from("placement_support_requests").update({
    replacement_reason: replacementReason,
    replacement_sla_due_on: slaDueOn,
    guarantee_status: guaranteeStatus,
    guarantee_notes: guaranteeNotes,
  }).eq("id", requestId);
  if (error) throw error;

  if (room.placement_stage !== "ended" && room.placement_stage !== "replacement") {
    await admin.from("workrooms").update({
      placement_stage: "replacement",
      placement_stage_entered_at: new Date().toISOString(),
      at_risk_reason: room.at_risk_reason || `Replacement workflow: ${replacementReason.replaceAll("_", " ")}`,
    }).eq("id", workroomId);
  }

  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: job.id,
    action: "replacement_plan_saved",
    description: "Replacement reason, SLA, and guarantee review were recorded",
    actorId: user.id,
    metadata: {
      workroom_id: workroomId,
      support_request_id: requestId,
      replacement_reason: replacementReason,
      replacement_sla_due_on: slaDueOn,
      guarantee_status: guaranteeStatus,
    },
  });

  revalidatePlacement(workroomId);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}replacement_saved=1`);
}

export async function savePlacementRetentionAction(formData: FormData) {
  const workroomId = String(formData.get("workroom_id") || "");
  const renewalDate = clean(formData.get("renewal_date"), 10);
  const renewalStatus = String(formData.get("renewal_status") || "not_set");
  const endReasonRaw = String(formData.get("end_reason") || "");
  const endReason = endReasonRaw || null;
  const offboardingNotes = clean(formData.get("offboarding_notes"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);

  if (!workroomId || !RENEWAL_STATUSES.has(renewalStatus)) throw new Error("Choose a valid renewal status.");
  if (renewalStatus === "upcoming" && !renewalDate) throw new Error("Set the renewal date for an upcoming renewal.");
  if (endReason && !END_REASONS.has(endReason)) throw new Error("Choose a valid placement end reason.");

  const { admin, room, job, user } = await agencyPlacementContext(workroomId);
  if (room.placement_stage === "ended" && !endReason) throw new Error("Record why the placement ended.");

  const { error } = await admin.from("workrooms").update({
    renewal_date: renewalDate,
    renewal_status: renewalStatus,
    end_reason: endReason,
    offboarding_notes: offboardingNotes,
  }).eq("id", workroomId);
  if (error) throw error;

  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: job.id,
    action: "placement_retention_updated",
    description: "Placement renewal and offboarding details were updated",
    actorId: user.id,
    metadata: {
      workroom_id: workroomId,
      renewal_date: renewalDate,
      renewal_status: renewalStatus,
      end_reason: endReason,
    },
  });

  revalidatePlacement(workroomId);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}retention_saved=1`);
}
