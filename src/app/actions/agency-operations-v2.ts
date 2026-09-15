"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const PLACEMENT_STAGES = new Set(["pre_start","launch","active","recovery","replacement","ended"]);
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

async function notifyClientSuccessForPulse(args: {
  admin: ReturnType<typeof createAdminClient>;
  room: any;
  job: any;
  checkin: any;
  signal: string;
  source: "client" | "va";
}) {
  if (!args.room.client_success_owner_id || !["yellow", "red"].includes(args.signal) || args.checkin.escalated_at) return;
  const serious = args.signal === "red";
  await args.admin.from("notifications").insert({
    user_id: args.room.client_success_owner_id,
    title: `${serious ? "Placement needs attention" : "Placement check-in needs review"}: ${args.job.title}`,
    body: serious
      ? `The ${args.source === "client" ? "client" : "Virtual Assistant"} reported a serious concern. Review the placement today.`
      : `The ${args.source === "client" ? "client" : "Virtual Assistant"} reported a concern. Review the context and decide whether follow-up is needed.`,
    href: `/workspace/client-success/${args.room.id}`,
    type: "placement_risk",
    priority: serious ? "urgent" : "high"
  });
  await args.admin.from("placement_checkins").update({ escalated_at: new Date().toISOString() }).eq("id", args.checkin.id).is("escalated_at", null);
}

export async function assignClientSuccessOwnerAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const ownerId = String(formData.get("client_success_owner_id") || "");
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);
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
      href: `/workspace/client-success/${workroomId}`,
      type: "placement",
      priority: "high"
    });
  }
  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "client_success_owner_assigned", description: `Client Success owner assigned to ${owner.full_name || "agency teammate"}`, actorId: user.id, metadata: { workroom_id: workroomId, client_success_owner_id: ownerId, at: now } });
  revalidatePath("/workspace/client-success");
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}csm_saved=1`);
}

export async function completeRecruiterHandoffAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const notes = cleanText(formData.get("handoff_notes"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);
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
      href: `/workspace/client-success/${workroomId}`,
      type: "placement",
      priority: "high"
    });
  }
  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "placement_handoff_completed", description: "Recruiter completed the formal Client Success handoff", actorId: user.id, metadata: { workroom_id: workroomId } });
  revalidatePath("/workspace/client-success");
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}handoff_saved=1`);
}

export async function toggleAgencyChecklistAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const checklistId = String(formData.get("checklist_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const currentlyDone = String(formData.get("done") || "0") === "1";
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);
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
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/client-success");
  redirect(returnTo);
}

export async function submitPlacementPulseAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["client", "va"]);
  const checkinId = String(formData.get("checkin_id") || "");
  const signal = String(formData.get("signal") || "");
  const note = cleanText(formData.get("note"), 2000);
  if (!checkinId || !SIGNALS.has(signal)) throw new Error("Choose how the placement is going.");

  const admin = createAdminClient();
  const { data: checkin } = await admin.from("placement_checkins").select("*").eq("id", checkinId).maybeSingle();
  if (!checkin) throw new Error("Placement check-in not found.");
  const { room, job } = await placementContext(checkin.workroom_id);
  const source = profile.role === "client" ? "client" : "va";
  if (source === "client" && room.client_id !== user.id) throw new Error("This check-in does not belong to your placement.");
  if (source === "va" && room.va_id !== user.id) throw new Error("This check-in does not belong to your placement.");

  const now = new Date().toISOString();
  const patch = source === "client"
    ? { client_signal: signal, client_note: note, client_responded_at: now }
    : { va_signal: signal, va_note: note, va_responded_at: now };
  const { error } = await admin.from("placement_checkins").update(patch).eq("id", checkinId);
  if (error) throw error;
  await notifyClientSuccessForPulse({ admin, room, job, checkin, signal, source });
  await admin.rpc("recompute_placement_health", { p_workroom_id: room.id });

  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: job.id,
    action: `placement_pulse_${source}`,
    description: `${source === "client" ? "Client" : "VA"} placement pulse: ${signal}`,
    actorId: user.id,
    metadata: { workroom_id: room.id, checkin_id: checkinId, signal }
  });

  revalidatePath("/workspace/client/team");
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/client-success");
  revalidatePath(`/workspace/client-success/${room.id}`);
  redirect(source === "client" ? "/workspace/client/team?pulse_saved=1" : "/workspace/va/workroom?pulse_saved=1");
}

export async function confirmVaAvailabilityAction(formData: FormData) {
  const { user } = await requireRole("va");
  const admin = createAdminClient();
  const { data: va } = await admin.from("va_profiles").select("availability_status,weekly_hours,schedule,hourly_rate").eq("user_id", user.id).maybeSingle();
  if (!va) throw new Error("VA profile not found.");
  if (va.availability_status !== "available") throw new Error("Set your availability to Available now before confirming it for recruiter presentation.");
  if (!va.weekly_hours || !va.schedule || !va.hourly_rate) throw new Error("Add your weekly hours, schedule, and current rate before confirming availability.");
  const now = new Date().toISOString();
  const { error } = await admin.from("va_profiles").update({ availability_confirmed_at: now, availability_last_prompted_at: now }).eq("user_id", user.id);
  if (error) throw error;
  await writeRecruiterActivity({ subjectType: "va", subjectId: user.id, action: "availability_self_confirmed", description: "VA confirmed current availability, schedule, hours, and rate", actorId: user.id });
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/recruiter/talent");
  redirect("/workspace/va/profile?availability_confirmed=1#availability");
}

export async function recordPlacementCheckinAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const checkinId = String(formData.get("checkin_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const clientSignal = String(formData.get("client_signal") || "");
  const vaSignal = String(formData.get("va_signal") || "");
  const notes = cleanText(formData.get("notes"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);
  if (!checkinId || !workroomId) throw new Error("Check-in is required.");
  if (clientSignal && !SIGNALS.has(clientSignal)) throw new Error("Invalid client check-in status.");
  if (vaSignal && !SIGNALS.has(vaSignal)) throw new Error("Invalid VA check-in status.");
  if (!clientSignal && !vaSignal) throw new Error("Record at least the client or VA placement signal.");

  const { admin, room, job } = await placementContext(workroomId);
  assertAgencyAccess(profile.role, user.id, room, job);
  const { data: checkin } = await admin.from("placement_checkins").select("*").eq("id", checkinId).eq("workroom_id", workroomId).maybeSingle();
  if (!checkin) throw new Error("Check-in not found.");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { notes, completed_by: user.id, updated_at: now };
  if (clientSignal) {
    patch.client_signal = clientSignal;
    patch.client_note = notes;
    patch.client_responded_at = now;
  }
  if (vaSignal) {
    patch.va_signal = vaSignal;
    patch.va_note = notes;
    patch.va_responded_at = now;
  }
  const { error } = await admin.from("placement_checkins").update(patch).eq("id", checkinId);
  if (error) throw error;
  if (clientSignal) await notifyClientSuccessForPulse({ admin, room, job, checkin, signal: clientSignal, source: "client" });
  if (vaSignal) await notifyClientSuccessForPulse({ admin, room, job, checkin, signal: vaSignal, source: "va" });
  await admin.rpc("recompute_placement_health", { p_workroom_id: workroomId });

  await writeRecruiterActivity({ subjectType: "job", subjectId: job.id, action: "placement_checkin_recorded", description: `${String(checkin.checkpoint).replace("day", "Day ")} placement check-in recorded`, actorId: user.id, metadata: { workroom_id: workroomId, client_signal: clientSignal || null, va_signal: vaSignal || null } });
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/client-success");
  revalidatePath("/workspace/client/team");
  revalidatePath("/workspace/va/workroom");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}checkin_saved=1`);
}

export async function updatePlacementStageAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const stage = String(formData.get("placement_stage") || "");
  const reason = cleanText(formData.get("at_risk_reason"), 2000);
  const recoveryPlan = cleanText(formData.get("recovery_plan"), 4000);
  const returnTo = safePath(formData.get("return_to"), `/workspace/client-success/${workroomId}`);
  if (!workroomId || !PLACEMENT_STAGES.has(stage)) throw new Error("Choose a valid placement stage.");
  if (["recovery", "replacement", "ended"].includes(stage) && (!reason || reason.length < 5)) throw new Error("Record the reason for this placement stage.");
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
  await admin.rpc("recompute_placement_health", { p_workroom_id: workroomId });
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/client-success");
  revalidatePath("/workspace/client/team");
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}stage_saved=1`);
}
