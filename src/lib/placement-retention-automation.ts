import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const RETENTION_PREFIX = "Placement retention ·";
const RETENTION_CHECKPOINTS = new Set(["day3", "day7", "day14", "day30"]);

function labelCheckpoint(value: string) {
  return value.replace(/^day(\d+)$/, "Day $1");
}

async function resolveRetentionTask(admin: AdminClient, jobId: string) {
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
    .ilike("title", `${RETENTION_PREFIX}%`);
  if (error) throw error;
}

export async function syncPlacementRetentionRecovery(args: {
  admin: AdminClient;
  workroomId: string;
  checkinId?: string | null;
}) {
  const { data: room, error: roomError } = await args.admin
    .from("workrooms")
    .select("id,job_id,client_success_owner_id,handoff_completed_at,placement_stage,status")
    .eq("id", args.workroomId)
    .maybeSingle();

  if (roomError) throw roomError;
  if (!room) return { action: "room_missing" as const };

  if (
    !room.handoff_completed_at ||
    !room.client_success_owner_id ||
    room.status !== "active" ||
    ["ended", "replacement"].includes(String(room.placement_stage || ""))
  ) {
    await resolveRetentionTask(args.admin, room.job_id);
    return { action: "not_applicable" as const };
  }

  const { data: job, error: jobError } = await args.admin
    .from("jobs")
    .select("id,title")
    .eq("id", room.job_id)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) return { action: "job_missing" as const };

  let query = args.admin
    .from("placement_checkins")
    .select("id,checkpoint,due_at,client_signal,client_responded_at,va_signal,va_responded_at")
    .eq("workroom_id", room.id)
    .in("checkpoint", ["day3", "day7", "day14", "day30"])
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: false })
    .limit(1);

  if (args.checkinId) query = query.eq("id", args.checkinId);

  const { data: checkin, error: checkinError } = await query.maybeSingle();
  if (checkinError) throw checkinError;

  if (!checkin || !RETENTION_CHECKPOINTS.has(String(checkin.checkpoint))) {
    return { action: "no_due_checkpoint" as const };
  }

  const signals = [checkin.client_signal, checkin.va_signal].filter(Boolean).map(String);
  const hasRed = signals.includes("red");
  const hasYellow = signals.includes("yellow");
  const bothGreen =
    checkin.client_signal === "green" &&
    checkin.va_signal === "green";
  const overdueMs = Date.now() - new Date(checkin.due_at).getTime();
  const missingClient = !checkin.client_signal;
  const missingVa = !checkin.va_signal;
  const missingOverdue = overdueMs >= 24 * 60 * 60 * 1000 && (missingClient || missingVa);

  if (bothGreen) {
    await resolveRetentionTask(args.admin, room.job_id);
    return { action: "healthy" as const };
  }

  if (!hasRed && !hasYellow && !missingOverdue) {
    return { action: "waiting" as const };
  }

  const { data: existing } = await args.admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "job")
    .eq("subject_id", room.job_id)
    .eq("status", "todo")
    .ilike("title", `${RETENTION_PREFIX}%`)
    .limit(1)
    .maybeSingle();

  const checkpointLabel = labelCheckpoint(String(checkin.checkpoint));
  const roleTitle = String(job.title || "Client role").slice(0, 100);
  const priority = hasRed ? "urgent" : "high";
  const title = hasRed
    ? `${RETENTION_PREFIX}urgent recovery · ${roleTitle}`
    : hasYellow
      ? `${RETENTION_PREFIX}review concern · ${roleTitle}`
      : `${RETENTION_PREFIX}response overdue · ${roleTitle}`;

  const description = hasRed
    ? `${checkpointLabel} includes a red placement signal. Review the client and VA notes today, contact the affected side, and start a documented recovery plan if the issue is confirmed.`
    : hasYellow
      ? `${checkpointLabel} includes a yellow placement signal. Review the context and decide the next Client Success action before the issue grows.`
      : `${checkpointLabel} is more than 24 hours overdue and still needs ${[
          missingClient ? "client" : null,
          missingVa ? "VA" : null,
        ].filter(Boolean).join(" and ")} feedback. Follow up and record the placement signal.`;

  const now = new Date().toISOString();
  let taskError = null;
  if (existing?.id) {
    const result = await args.admin
      .from("recruiter_tasks")
      .update({
        title,
        description,
        assignee_id: room.client_success_owner_id,
        href: `/workspace/client-success/${room.id}`,
        priority,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existing.id);
    taskError = result.error;
  } else {
    const result = await args.admin.from("recruiter_tasks").insert({
      title,
      description,
      assignee_id: room.client_success_owner_id,
      subject_type: "job",
      subject_id: room.job_id,
      href: `/workspace/client-success/${room.id}`,
      priority,
      status: "todo",
      repeat_rule: "none",
      due_at: now,
    });
    taskError = result.error;
  }
  if (taskError) throw taskError;

  if (missingOverdue && !hasYellow && !hasRed) {
    const { data: prior } = await args.admin
      .from("notifications")
      .select("id")
      .eq("user_id", room.client_success_owner_id)
      .eq("type", "placement_checkin")
      .eq("href", `/workspace/client-success/${room.id}`)
      .is("done_at", null)
      .limit(1)
      .maybeSingle();

    if (!prior?.id) {
      const { error: notificationError } = await args.admin.from("notifications").insert({
        user_id: room.client_success_owner_id,
        type: "placement_checkin",
        priority: "high",
        title: `${checkpointLabel} check-in response overdue: ${roleTitle}`,
        body: description,
        href: `/workspace/client-success/${room.id}`,
      });
      if (notificationError) throw notificationError;
    }
  }

  return {
    action: hasRed
      ? ("urgent_recovery" as const)
      : hasYellow
        ? ("review_concern" as const)
        : ("response_overdue" as const),
    checkpoint: checkin.checkpoint,
  };
}
