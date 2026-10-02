import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const OFFER_CONFIRM_PREFIX = "Client confirmation ·";
const HANDOFF_PREFIX = "Placement handoff ·";
const READINESS_PREFIX = "Launch readiness ·";

async function activeRecruiter(
  admin: AdminClient,
  recruiterId?: string | null,
) {
  if (recruiterId) {
    const { data } = await admin
      .from("profiles")
      .select("id,role,account_status")
      .eq("id", recruiterId)
      .maybeSingle();
    if (
      data &&
      ["recruiter", "admin"].includes(String(data.role)) &&
      data.account_status === "active"
    ) {
      return data.id as string;
    }
  }

  const { data: fallback } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["recruiter", "admin"])
    .eq("account_status", "active")
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (fallback?.id as string | undefined) || null;
}

async function activeClientSuccessOwner(
  admin: AdminClient,
  ownerId?: string | null,
) {
  if (ownerId) {
    const { data } = await admin
      .from("profiles")
      .select("id,role,account_status")
      .eq("id", ownerId)
      .maybeSingle();
    if (
      data &&
      ["recruiter", "admin"].includes(String(data.role)) &&
      data.account_status === "active"
    ) {
      return data.id as string;
    }
  }

  const { data: adminFallback } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("account_status", "active")
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (adminFallback?.id as string | undefined) || null;
}

async function resolveTaskPrefix(
  admin: AdminClient,
  jobId: string,
  prefix: string,
) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("recruiter_tasks")
    .update({
      status: "done",
      completed_at: now,
      updated_at: now,
      snoozed_until: null,
    })
    .eq("subject_type", "job")
    .eq("subject_id", jobId)
    .eq("status", "todo")
    .ilike("title", `${prefix}%`);
  if (error) throw error;
}

async function upsertJobTask(args: {
  admin: AdminClient;
  jobId: string;
  assigneeId: string;
  prefix: string;
  title: string;
  description: string;
  href: string;
  priority: "normal" | "high" | "urgent";
}) {
  const { data: existing } = await args.admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "job")
    .eq("subject_id", args.jobId)
    .eq("status", "todo")
    .ilike("title", `${args.prefix}%`)
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  if (existing?.id) {
    const { error } = await args.admin
      .from("recruiter_tasks")
      .update({
        title: args.title,
        description: args.description,
        assignee_id: args.assigneeId,
        href: args.href,
        priority: args.priority,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { created: false as const };
  }

  const { error } = await args.admin.from("recruiter_tasks").insert({
    title: args.title,
    description: args.description,
    assignee_id: args.assigneeId,
    subject_type: "job",
    subject_id: args.jobId,
    href: args.href,
    priority: args.priority,
    status: "todo",
    repeat_rule: "none",
    due_at: now,
  });
  if (error) throw error;
  return { created: true as const };
}

async function replaceParticipantNotification(args: {
  admin: AdminClient;
  userId: string;
  type: string;
  href: string;
  title: string;
  body: string;
  priority?: "normal" | "high" | "urgent";
}) {
  const now = new Date().toISOString();
  const { error: resolveError } = await args.admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", args.userId)
    .eq("type", args.type)
    .eq("href", args.href)
    .is("done_at", null);
  if (resolveError) throw resolveError;

  const { error } = await args.admin.from("notifications").insert({
    user_id: args.userId,
    type: args.type,
    priority: args.priority || "normal",
    title: args.title,
    body: args.body,
    href: args.href,
  });
  if (error) throw error;
}

export async function ensureOfferClientConfirmationAction(args: {
  admin: AdminClient;
  offerId: string;
  job: { id: string; title?: string | null; recruiter_id?: string | null };
  clientId: string;
  urgent?: boolean;
}) {
  const assigneeId = await activeRecruiter(args.admin, args.job.recruiter_id);
  if (!assigneeId) return { created: false as const, reason: "no_active_recruiter" as const };
  const roleTitle = String(args.job.title || "Client role").slice(0, 105);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    assigneeId,
    prefix: OFFER_CONFIRM_PREFIX,
    title: `${OFFER_CONFIRM_PREFIX}${roleTitle}`,
    description: args.urgent
      ? "The VA accepted more than 24 hours ago and the client has not confirmed the placement. Follow up now so the hire does not stall."
      : "The VA accepted the placement offer and the client has not confirmed yet. Keep the close moving and make sure the client can review the final placement.",
    href: `/workspace/recruiter/roles/${args.job.id}#interviews`,
    priority: args.urgent ? "urgent" : "high",
  });

  await replaceParticipantNotification({
    admin: args.admin,
    userId: args.clientId,
    type: "offer_followup",
    href: `/workspace/client/offers?offer=${args.offerId}`,
    title: args.urgent
      ? `Placement confirmation still needed: ${roleTitle}`
      : `Confirm your placement: ${roleTitle}`,
    body: "The VA accepted the final terms. Confirm the placement to activate the workroom and onboarding.",
    priority: args.urgent ? "high" : "normal",
  });

  return { ...task, reason: args.urgent ? ("client_confirmation_24h" as const) : ("client_confirmation_4h" as const) };
}

export async function resolveOfferClientConfirmationArtifacts(
  admin: AdminClient,
  offerId: string,
  jobId: string,
  clientId?: string | null,
) {
  await resolveTaskPrefix(admin, jobId, OFFER_CONFIRM_PREFIX);
  if (!clientId) return;

  const now = new Date().toISOString();
  const { error } = await admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", clientId)
    .eq("type", "offer_followup")
    .eq("href", `/workspace/client/offers?offer=${offerId}`)
    .is("done_at", null);
  if (error) throw error;
}

export async function ensurePlacementHandoffAction(args: {
  admin: AdminClient;
  workroomId: string;
  job: { id: string; title?: string | null; recruiter_id?: string | null };
  clientSuccessOwnerId?: string | null;
  urgent?: boolean;
}) {
  const assigneeId = await activeRecruiter(args.admin, args.job.recruiter_id);
  if (!assigneeId) return { created: false as const, reason: "no_active_recruiter" as const };
  const roleTitle = String(args.job.title || "Client role").slice(0, 100);
  const ownerAssigned = Boolean(args.clientSuccessOwnerId);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    assigneeId,
    prefix: HANDOFF_PREFIX,
    title: ownerAssigned
      ? `${HANDOFF_PREFIX}complete formal handoff · ${roleTitle}`
      : `${HANDOFF_PREFIX}assign Client Success · ${roleTitle}`,
    description: ownerAssigned
      ? "The placement is confirmed and has a Client Success owner. Add a useful handoff note and complete the formal recruiter-to-Client-Success handoff."
      : "The placement is confirmed. Assign a Client Success owner, then complete the formal handoff before recruitment ownership ends.",
    href: `/workspace/client-success/${args.workroomId}`,
    priority: args.urgent ? "urgent" : "high",
  });

  return { ...task, reason: ownerAssigned ? ("complete_handoff" as const) : ("assign_owner" as const) };
}

export async function resolvePlacementHandoffTask(
  admin: AdminClient,
  jobId: string,
) {
  await resolveTaskPrefix(admin, jobId, HANDOFF_PREFIX);
}

export async function ensurePlacementReadinessAction(args: {
  admin: AdminClient;
  room: {
    id: string;
    job_id: string;
    client_id: string;
    va_id: string;
    client_success_owner_id?: string | null;
  };
  job: { id: string; title?: string | null };
  urgent?: boolean;
}) {
  const assigneeId = await activeClientSuccessOwner(
    args.admin,
    args.room.client_success_owner_id,
  );
  if (!assigneeId) return { created: false as const, reason: "no_active_cs_owner" as const };

  const { data: checklist, error } = await args.admin
    .from("workroom_checklist")
    .select("owner_role,completed_at")
    .eq("workroom_id", args.room.id);
  if (error) throw error;

  const incomplete = (checklist || []).filter((row) => !row.completed_at);
  if (!incomplete.length) {
    await resolveTaskPrefix(args.admin, args.job.id, READINESS_PREFIX);
    return { created: false as const, reason: "checklist_complete" as const };
  }

  const missingClient = incomplete.filter((row) => row.owner_role === "client").length;
  const missingVa = incomplete.filter((row) => row.owner_role === "va").length;
  const missingAgency = incomplete.filter((row) => row.owner_role === "agency").length;
  const roleTitle = String(args.job.title || "Client role").slice(0, 105);

  const task = await upsertJobTask({
    admin: args.admin,
    jobId: args.job.id,
    assigneeId,
    prefix: READINESS_PREFIX,
    title: `${READINESS_PREFIX}${roleTitle}`,
    description: `Placement is not ready for Day 1. Remaining items: client ${missingClient}, VA ${missingVa}, agency ${missingAgency}. Coordinate the missing setup without taking ownership away from the client or VA.`,
    href: `/workspace/client-success/${args.room.id}`,
    priority: args.urgent ? "urgent" : "high",
  });

  if (missingClient > 0) {
    await replaceParticipantNotification({
      admin: args.admin,
      userId: args.room.client_id,
      type: "placement_readiness",
      href: `/workspace/client/workroom?placement=${args.room.id}`,
      title: args.urgent
        ? `Day 1 setup is still incomplete: ${roleTitle}`
        : `Finish placement setup: ${roleTitle}`,
      body: `You have ${missingClient} onboarding item${missingClient === 1 ? "" : "s"} left before the placement is ready.`,
      priority: args.urgent ? "high" : "normal",
    });
  }

  if (missingVa > 0) {
    await replaceParticipantNotification({
      admin: args.admin,
      userId: args.room.va_id,
      type: "placement_readiness",
      href: `/workspace/va/workroom?placement=${args.room.id}`,
      title: args.urgent
        ? `Day 1 setup is still incomplete: ${roleTitle}`
        : `Finish placement setup: ${roleTitle}`,
      body: `You have ${missingVa} onboarding item${missingVa === 1 ? "" : "s"} left before the placement is ready.`,
      priority: args.urgent ? "high" : "normal",
    });
  }

  return {
    ...task,
    reason: args.urgent ? ("readiness_24h" as const) : ("readiness_48h" as const),
  };
}

export async function resolvePlacementReadinessIfReady(
  admin: AdminClient,
  workroomId: string,
) {
  const { data: room, error } = await admin
    .from("workrooms")
    .select("id,job_id,client_id,va_id,placement_ready_at")
    .eq("id", workroomId)
    .maybeSingle();
  if (error) throw error;
  if (!room?.placement_ready_at) return false;

  await resolveTaskPrefix(admin, room.job_id, READINESS_PREFIX);
  const now = new Date().toISOString();
  const hrefs = [
    { userId: room.client_id, href: `/workspace/client/workroom?placement=${workroomId}` },
    { userId: room.va_id, href: `/workspace/va/workroom?placement=${workroomId}` },
  ];
  for (const item of hrefs) {
    const { error: notificationError } = await admin
      .from("notifications")
      .update({ done_at: now, read_at: now, snoozed_until: null })
      .eq("user_id", item.userId)
      .eq("type", "placement_readiness")
      .eq("href", item.href)
      .is("done_at", null);
    if (notificationError) throw notificationError;
  }
  return true;
}
