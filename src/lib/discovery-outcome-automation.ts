import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

async function activeAssignee(
  admin: AdminClient,
  ownerId?: string | null,
) {
  if (ownerId) {
    const { data: owner } = await admin
      .from("profiles")
      .select("id,role,account_status")
      .eq("id", ownerId)
      .maybeSingle();
    if (
      owner &&
      ["recruiter", "admin"].includes(String(owner.role)) &&
      owner.account_status === "active"
    ) {
      return owner.id as string;
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

export async function resolveDiscoveryOutcomeArtifacts(
  admin: AdminClient,
  leadId: string,
) {
  const now = new Date().toISOString();
  const href = `/workspace/recruiter/crm/${leadId}/discovery`;

  const { error: taskError } = await admin
    .from("recruiter_tasks")
    .update({
      status: "done",
      completed_at: now,
      updated_at: now,
      snoozed_until: null,
    })
    .eq("subject_type", "lead")
    .eq("subject_id", leadId)
    .eq("status", "todo")
    .ilike("title", "Discovery outcome due%");

  if (taskError) throw taskError;

  const { error: notificationError } = await admin
    .from("notifications")
    .update({
      done_at: now,
      read_at: now,
      snoozed_until: null,
    })
    .eq("type", "discovery_outcome")
    .eq("href", href)
    .is("done_at", null);

  if (notificationError) throw notificationError;
}

export async function ensureDiscoveryOutcomeNextAction(args: {
  admin: AdminClient;
  leadId: string;
  ownerId?: string | null;
  subject: string;
  outcome: string | null;
}) {
  await resolveDiscoveryOutcomeArtifacts(args.admin, args.leadId);

  if (!["qualified", "no_show"].includes(String(args.outcome || ""))) {
    return { created: false as const, reason: "no_next_action" as const };
  }

  const assigneeId = await activeAssignee(args.admin, args.ownerId);
  if (!assigneeId) {
    return { created: false as const, reason: "no_active_assignee" as const };
  }

  const subject = String(args.subject || "Client").slice(0, 110);
  const href =
    args.outcome === "qualified"
      ? `/workspace/recruiter/crm/${args.leadId}/discovery`
      : `/workspace/recruiter/crm/${args.leadId}`;

  if (args.outcome === "qualified") {
    const { data: proposal } = await args.admin
      .from("lead_proposals")
      .select("id,status")
      .eq("lead_id", args.leadId)
      .in("status", ["draft", "sent", "viewed", "changes_requested", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposal?.id) {
      return { created: false as const, reason: "proposal_exists" as const };
    }
  }

  const title =
    args.outcome === "qualified"
      ? `Prepare recommendation · ${subject}`
      : `Recover no-show · ${subject}`;
  const description =
    args.outcome === "qualified"
      ? "Discovery was marked qualified. Turn the call into a client-ready recommendation now, while the requirements and buying context are still fresh."
      : "The client missed the discovery call. Review the lead and arrange the next rebooking step. No automatic client email has been sent.";

  const titlePrefix =
    args.outcome === "qualified"
      ? "Prepare recommendation%"
      : "Recover no-show%";

  const { data: existing } = await args.admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "lead")
    .eq("subject_id", args.leadId)
    .eq("status", "todo")
    .ilike("title", titlePrefix)
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  let taskError = null;

  if (existing?.id) {
    const result = await args.admin
      .from("recruiter_tasks")
      .update({
        title,
        description,
        assignee_id: assigneeId,
        href,
        priority: "high",
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
      assignee_id: assigneeId,
      subject_type: "lead",
      subject_id: args.leadId,
      href,
      priority: "high",
      status: "todo",
      repeat_rule: "none",
      due_at: now,
    });
    taskError = result.error;
  }

  if (taskError) throw taskError;

  return {
    created: !existing?.id,
    reason:
      args.outcome === "qualified"
        ? ("proposal_handoff" as const)
        : ("no_show_recovery" as const),
  };
}
