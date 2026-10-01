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

export async function resolveProposalClosingArtifacts(
  admin: AdminClient,
  proposalId: string,
  leadId: string,
) {
  const now = new Date().toISOString();
  const href = `/workspace/recruiter/crm/${leadId}/proposal`;

  const { error: taskError } = await admin
    .from("recruiter_tasks")
    .update({
      status: "done",
      completed_at: now,
      updated_at: now,
      snoozed_until: null,
    })
    .eq("subject_type", "proposal")
    .eq("subject_id", proposalId)
    .eq("status", "todo")
    .ilike("title", "Proposal close%");

  if (taskError) throw taskError;

  const { error: notificationError } = await admin
    .from("notifications")
    .update({
      done_at: now,
      read_at: now,
      snoozed_until: null,
    })
    .eq("type", "proposal_closing")
    .eq("href", href)
    .is("done_at", null);

  if (notificationError) throw notificationError;
}

export async function ensureProposalClosingTask(args: {
  admin: AdminClient;
  proposalId: string;
  leadId: string;
  ownerId?: string | null;
  subject: string;
  kind: "not_viewed" | "viewed_waiting" | "changes_requested";
  urgent?: boolean;
}) {
  await resolveProposalClosingArtifacts(
    args.admin,
    args.proposalId,
    args.leadId,
  );

  const assigneeId = await activeAssignee(args.admin, args.ownerId);
  if (!assigneeId) {
    return { created: false as const, reason: "no_active_assignee" as const };
  }

  const subject = String(args.subject || "Client proposal").slice(0, 110);
  const href = `/workspace/recruiter/crm/${args.leadId}/proposal`;
  const priority = args.urgent ? "urgent" : "high";

  const content =
    args.kind === "changes_requested"
      ? {
          title: `Proposal close · revise now · ${subject}`,
          description:
            "The client requested proposal changes. Review the requested changes, update the recommendation, and resend it before this opportunity goes cold.",
        }
      : args.kind === "viewed_waiting"
        ? {
            title: `Proposal close · viewed, no decision · ${subject}`,
            description:
              "The client viewed the proposal but has not accepted or requested changes. Follow up while buying intent is still warm and record the next step.",
          }
        : {
            title: `Proposal close · not viewed · ${subject}`,
            description:
              "The proposal has not been viewed yet. Check delivery context and follow up with the client so the recommendation does not stall.",
          };

  const { data: existing } = await args.admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "proposal")
    .eq("subject_id", args.proposalId)
    .eq("status", "todo")
    .ilike("title", "Proposal close%")
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  let taskError = null;

  if (existing?.id) {
    const result = await args.admin
      .from("recruiter_tasks")
      .update({
        title: content.title,
        description: content.description,
        assignee_id: assigneeId,
        href,
        priority,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existing.id);
    taskError = result.error;
  } else {
    const result = await args.admin.from("recruiter_tasks").insert({
      title: content.title,
      description: content.description,
      assignee_id: assigneeId,
      subject_type: "proposal",
      subject_id: args.proposalId,
      href,
      priority,
      status: "todo",
      repeat_rule: "none",
      due_at: now,
    });
    taskError = result.error;
  }

  if (taskError) throw taskError;

  await args.admin
    .from("notifications")
    .update({
      done_at: now,
      read_at: now,
      snoozed_until: null,
    })
    .eq("user_id", assigneeId)
    .eq("type", "proposal_closing")
    .eq("href", href)
    .is("done_at", null);

  const { error: notificationError } = await args.admin
    .from("notifications")
    .insert({
      user_id: assigneeId,
      type: "proposal_closing",
      priority,
      title: content.title.replace("Proposal close · ", ""),
      body: content.description,
      href,
    });

  if (notificationError) throw notificationError;

  return {
    created: !existing?.id,
    reason: args.kind,
  };
}
