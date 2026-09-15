"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const PLACEMENT_STAGES = new Set(["onboarding","healthy","watch","at_risk","recovery","replacement","ended"]);
const SIGNALS = new Set(["green","yellow","red"]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function cleanText(value: FormDataEntryValue | null, max = 4000) {
  return String(value || "").trim().slice(0, max) || null;
}

async function placementContext(workroomId: string) {
  const admin = createAdminClient();
  const { data: room, error } = await admin.from("workrooms").select("*").eq("id", workroomId).maybeSingle();
  if (error || !room) throw error || new Error("Placement not found.");
  const { data: job } = await admin.from("jobs").select("id,title,recruiter_id,client_id").eq("id", room.job_id).maybeSingle();
  if (!job) throw new Error("Linked role not found.");
  return { admin, room, job };
}

function assertAgencyAccess(profileRole: string, userId: string, room: any, job: any) {
  if (profileRole === "admin") return;
  if (job.recruiter_id === userId || room.client_success_owner_id === userId) return;
  throw new Error("This placement is assigned to another agency owner.");
}

async function completeAgencyChecklistByTitle(admin: ReturnType<typeof createAdminClient>, workroomId: string, title: string, userId: string) {
  await admin.from("workroom_checklist").update({ completed_at: new Date().toISOString(), completed_by: userId })
    .eq("workroom_id", workroomId).eq("owner_role", "agency").eq("title", title);
  await admin.rpc("recompute_placement_readiness", { p_workroom_id: workroomId });
}

export async function assignClientSuccessOwnerAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const ownerId = String(formData.get("client_success_owner_id") || "");
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/placements/${workroomId}`);
  if (!workroomId || !ownerId) throw new Error("Choose a Client Success owner.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  const { data: owner } = await admin.from("profiles").select("id,full_name,role,account_status").eq("id", ownerId).maybeSingle();
  if (!owner || !["recruiter", "admin"].includes(String(owner.role)) || owner.account_status !== "active") throw new Error("Choose an active agency team member.");

  const now = new Date().toISOString();
  const { error } = await admin.from("workrooms").update({ client_success_owner_id: ownerId }).eq("id", workroomId);
  if (error) throw error;
  await completeAgencyChecklistByTitle(admin, workroomId, "Assign Client Success owner", user.id);
  if (ownerId !== user.id) {
    await admin.from("notifications").insert({
      user_id: ownerId,
      title: `Client Success ownership: ${job.title}`,
      body: "A placement has been assigned to you. Review the handoff and readiness checklist before Day 1.",
      href: `/workspace/recruiter/placements/${workroomId}`,
      type: "placement",
      priority: "high"
    });
  }
  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "client_success_owner_assigned", description: `Client Success owner assigned to ${owner.full_name || "agency teammate"}`, actorId: user.id, metadata: { workroom_id: workroomId, client_success_owner_id: ownerId, at: now } });
  revalidatePath("/workspace/recruiter/placements");
  revalidatePath(`/workspace/recruiter/placements/${workroomId}`);
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}csm_saved=1`);
}

export async function completeRecruiterHandoffAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const notes = cleanText(formData.get("handoff_notes"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/placements/${workroomId}`);
  if (!workroomId || !notes || notes.length < 20) throw new Error("Add a useful handoff note of at least 20 characters.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  if (!room.client_success_owner_id) throw new Error("Assign a Client Success owner before completing the handoff.");

  const now = new Date().toISOString();
  const { error } = await admin.from("workrooms").update({ handoff_completed_at: now, handoff_completed_by: user.id, handoff_notes: notes }).eq("id", workroomId);
  if (error) throw error;
  await completeAgencyChecklistByTitle(admin, workroomId, "Complete recruiter to Client Success handoff", user.id);
  if (room.client_success_owner_id !== user.id) {
    await admin.from("notifications").insert({
      user_id: room.client_success_owner_id,
      title: `Recruiter handoff complete: ${job.title}`,
      body: "The recruiting handoff is ready. Review placement readiness and any remaining client or VA setup items.",
      href: `/workspace/recruiter/placements/${workroomId}`,
      type: "placement",
      priority: "high"
    });
  }
  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "placement_handoff_completed", description: "Recruiter completed the formal Client Success handoff", actorId: user.id, metadata: { workroom_id: workroomId } });
  revalidatePath("/workspace/recruiter/placements");
  revalidatePath(`/workspace/recruiter/placements/${workroomId}`);
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}handoff_saved=1`);
}

export async function toggleAgencyChecklistAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const checklistId = String(formData.get("checklist_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const currentlyDone = String(formData.get("done") || "0") === "1";
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/placements/${workroomId}`);
  if (!checklistId || !workroomId) throw new Error("Checklist item is required.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  const { data: item } = await admin.from("workroom_checklist").select("id,owner_role,title,workroom_id").eq("id", checklistId).eq("workroom_id", workroomId).maybeSingle();
  if (!item || item.owner_role !== "agency") throw new Error("Only agency-owned readiness items can be changed here.");

  const patch = currentlyDone ? { completed_at: null, completed_by: null } : { completed_at: new Date().toISOString(), completed_by: user.id };
  const { error } = await admin.from("workroom_checklist").update(patch).eq("id", checklistId);
  if (error) throw error;
  await admin.rpc("recompute_placement_readiness", { p_workroom_id: workroomId });
  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: currentlyDone ? "placement_readiness_reopened" : "placement_readiness_completed", description: `${item.title}: ${currentlyDone ? "reopened" : "completed"}`, actorId: user.id, metadata: { workroom_id: workroomId, checklist_id: checklistId } });
  revalidatePath(`/workspace/recruiter/placements/${workroomId}`);
  revalidatePath("/workspace/recruiter/placements");
  redirect(returnTo);
}

export async function recordPlacementCheckinAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const checkinId = String(formData.get("checkin_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const clientSignal = String(formData.get("client_signal") || "");
  const vaSignal = String(formData.get("va_signal") || "");
  const notes = cleanText(formData.get("notes"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/placements/${workroomId}`);
  if (!checkinId || !workroomId) throw new Error("Check-in is required.");
  if (clientSignal && !SIGNALS.has(clientSignal)) throw new Error("Invalid client check-in status.");
  if (vaSignal && !SIGNALS.has(vaSignal)) throw new Error("Invalid VA check-in status.");
  if (!clientSignal && !vaSignal) throw new Error("Record at least the client or VA placement signal.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  const { data: checkin } = await admin.from("placement_checkins").select("*").eq("id", checkinId).eq("workroom_id", workroomId).maybeSingle();
  if (!checkin) throw new Error("Check-in not found.");

  const now = new Date().toISOString();
  const { error } = await admin.from("placement_checkins").update({
    status: "completed",
    client_signal: clientSignal || null,
    va_signal: vaSignal || null,
    notes,
    completed_by: user.id,
    completed_at: now,
    updated_at: now
  }).eq("id", checkinId);
  if (error) throw error;

  const signals = [clientSignal, vaSignal].filter(Boolean);
  let nextStage = room.placement_stage;
  if (signals.includes("red")) nextStage = "at_risk";
  else if (signals.includes("yellow")) nextStage = "watch";
  else if (room.placement_ready_at && ["onboarding", "watch", "healthy"].includes(room.placement_stage)) nextStage = "healthy";

  if (nextStage !== room.placement_stage) {
    await admin.from("workrooms").update({
      placement_stage: nextStage,
      placement_stage_entered_at: now,
      at_risk_reason: nextStage === "at_risk" ? (room.at_risk_reason || `${String(checkin.checkpoint).replace("day", "Day ")} check-in reported a serious concern.`) : room.at_risk_reason
    }).eq("id", workroomId);
  }

  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "placement_checkin_completed", description: `${String(checkin.checkpoint).replace("day", "Day ")} placement check-in completed`, actorId: user.id, metadata: { workroom_id: workroomId, client_signal: clientSignal || null, va_signal: vaSignal || null, placement_stage: nextStage } });
  revalidatePath(`/workspace/recruiter/placements/${workroomId}`);
  revalidatePath("/workspace/recruiter/placements");
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}checkin_saved=1`);
}

export async function updatePlacementStageAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const stage = String(formData.get("placement_stage") || "");
  const reason = cleanText(formData.get("at_risk_reason"), 2000);
  const recoveryPlan = cleanText(formData.get("recovery_plan"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/placements/${workroomId}`);
  if (!workroomId || !PLACEMENT_STAGES.has(stage)) throw new Error("Choose a valid placement status.");
  if (["at_risk", "recovery", "replacement", "ended"].includes(stage) && (!reason || reason.length < 5)) throw new Error("Record the reason for this placement status.");
  if (stage === "recovery" && (!recoveryPlan || recoveryPlan.length < 10)) throw new Error("Add a concrete recovery plan.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  const now = new Date().toISOString();
  const { error } = await admin.from("workrooms").update({
    placement_stage: stage,
    placement_stage_entered_at: stage === room.placement_stage ? room.placement_stage_entered_at : now,
    at_risk_reason: reason,
    recovery_plan: recoveryPlan,
    ended_at: stage === "ended" ? now : null,
    status: stage === "ended" ? "completed" : room.status
  }).eq("id", workroomId);
  if (error) throw error;

  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: `placement_${stage}`, description: `Placement moved to ${stage.replaceAll("_", " ")}`, actorId: user.id, metadata: { workroom_id: workroomId, reason, recovery_plan: recoveryPlan } });
  revalidatePath(`/workspace/recruiter/placements/${workroomId}`);
  revalidatePath("/workspace/recruiter/placements");
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}stage_saved=1`);
}
