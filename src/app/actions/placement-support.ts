"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const CLIENT_TYPES = new Set(["schedule_change", "concern", "replacement"]);
const VA_TYPES = new Set(["leave", "sick", "emergency", "late", "schedule_change", "concern"]);
const AGENCY_STATUSES = new Set(["acknowledged", "resolved", "declined"]);

function clean(value: FormDataEntryValue | null, max = 4000) {
  return String(value || "").trim().slice(0, max) || null;
}

async function getPlacement(workroomId: string) {
  const admin = createAdminClient();
  const { data: room, error } = await admin.from("workrooms").select("*").eq("id", workroomId).maybeSingle();
  if (error || !room) throw error || new Error("Placement not found.");
  const { data: job } = await admin.from("jobs").select("id,title,recruiter_id,client_id").eq("id", room.job_id).maybeSingle();
  if (!job) throw new Error("Linked role not found.");
  return { admin, room, job };
}

function revalidatePlacement(workroomId: string) {
  revalidatePath("/workspace/client/team");
  revalidatePath("/workspace/client/support");
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/va/support");
  revalidatePath("/workspace/client-success");
  revalidatePath("/workspace/client-success/support");
  revalidatePath(`/workspace/client-success/${workroomId}`);
  revalidatePath("/workspace/recruiter/today");
}

export async function submitPlacementSupportRequestAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["client", "va"]);
  const workroomId = String(formData.get("workroom_id") || "");
  const requestType = String(formData.get("request_type") || "");
  const details = clean(formData.get("details"));
  const startDate = clean(formData.get("start_date"), 10);
  const endDate = clean(formData.get("end_date"), 10);
  if (!workroomId || !details || details.length < 5) throw new Error("Add enough detail for Client Success to act on this request.");

  const source = profile.role === "client" ? "client" : "va";
  const allowed = source === "client" ? CLIENT_TYPES : VA_TYPES;
  if (!allowed.has(requestType)) throw new Error("Choose a valid support request type.");
  if (["leave", "sick", "emergency", "late", "schedule_change"].includes(requestType) && !startDate) {
    throw new Error("Add the date this schedule or attendance change starts.");
  }
  if (startDate && endDate && endDate < startDate) throw new Error("End date cannot be before the start date.");

  const { admin, room, job } = await getPlacement(workroomId);
  if (source === "client" && room.client_id !== user.id) throw new Error("This placement does not belong to your account.");
  if (source === "va" && room.va_id !== user.id) throw new Error("This placement does not belong to your account.");
  if (room.placement_stage === "ended") throw new Error("This placement has already ended.");

  const priority = requestType === "replacement" || requestType === "emergency" ? "urgent" : requestType === "concern" ? "high" : "normal";
  const { data: created, error } = await admin.from("placement_support_requests").insert({
    workroom_id: workroomId,
    requester_id: user.id,
    requester_role: source,
    request_type: requestType,
    priority,
    details,
    start_date: startDate,
    end_date: endDate
  }).select("id").single();
  if (error) throw error;

  if (room.client_success_owner_id) {
    await admin.from("notifications").insert({
      user_id: room.client_success_owner_id,
      title: `${requestType === "replacement" ? "Replacement request" : requestType === "emergency" ? "Urgent placement support" : "Placement support request"}: ${job.title}`,
      body: `${source === "client" ? "The client" : "The Virtual Assistant"} submitted a ${requestType.replaceAll("_", " ")} request. Review and acknowledge it.`,
      href: `/workspace/client-success/support?request=${created.id}`,
      type: "placement_support",
      priority
    });
  }
  await admin.rpc("recompute_placement_health", { p_workroom_id: workroomId });
  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: job.id,
    action: `placement_support_${requestType}`,
    description: `${source === "client" ? "Client" : "VA"} submitted a ${requestType.replaceAll("_", " ")} request`,
    actorId: user.id,
    metadata: { workroom_id: workroomId, support_request_id: created.id, priority }
  });
  revalidatePlacement(workroomId);
  redirect(source === "client" ? "/workspace/client/support?support_sent=1" : "/workspace/va/support?support_sent=1");
}

export async function resolvePlacementSupportRequestAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const requestId = String(formData.get("request_id") || "");
  const workroomId = String(formData.get("workroom_id") || "");
  const status = String(formData.get("status") || "");
  const resolution = clean(formData.get("resolution"));
  if (!requestId || !workroomId || !AGENCY_STATUSES.has(status)) throw new Error("Choose a valid support-request status.");
  if (["resolved", "declined"].includes(status) && (!resolution || resolution.length < 5)) throw new Error("Record the resolution before closing the request.");

  const { admin, room, job } = await getPlacement(workroomId);
  if (profile.role !== "admin" && job.recruiter_id !== user.id && room.client_success_owner_id !== user.id) {
    throw new Error("This placement is assigned to another agency owner.");
  }
  const { data: request } = await admin.from("placement_support_requests").select("*").eq("id", requestId).eq("workroom_id", workroomId).maybeSingle();
  if (!request) throw new Error("Support request not found.");

  const closed = ["resolved", "declined"].includes(status);
  const { error } = await admin.from("placement_support_requests").update({
    status,
    resolution,
    resolved_by: closed ? user.id : null,
    resolved_at: closed ? new Date().toISOString() : null
  }).eq("id", requestId);
  if (error) throw error;

  await admin.from("notifications").insert({
    user_id: request.requester_id,
    title: `Placement support ${status}`,
    body: resolution || `Client Success marked your ${String(request.request_type).replaceAll("_", " ")} request as ${status}.`,
    href: request.requester_role === "client" ? "/workspace/client/support" : "/workspace/va/support",
    type: "placement_support",
    priority: "normal"
  });
  await admin.rpc("recompute_placement_health", { p_workroom_id: workroomId });
  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: job.id,
    action: `placement_support_${status}`,
    description: `${String(request.request_type).replaceAll("_", " ")} request marked ${status}`,
    actorId: user.id,
    metadata: { workroom_id: workroomId, support_request_id: requestId, resolution }
  });
  revalidatePlacement(workroomId);
  redirect("/workspace/client-success/support?support_saved=1");
}
