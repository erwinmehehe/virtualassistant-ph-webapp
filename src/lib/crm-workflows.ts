import { createAdminClient } from "@/lib/supabase/admin";

type WorkflowRow = {
  id: string;
  name: string;
  action_type: "create_task" | "set_follow_up";
  action_config: Record<string, unknown> | null;
};

function clampDays(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(30, Math.round(n)));
}

function fillTemplate(value: unknown, lead: { name?: string | null; company?: string | null }) {
  const raw = String(value || "Follow up with {{company}}").slice(0, 180);
  return raw
    .replaceAll("{{name}}", lead.name || "client")
    .replaceAll("{{company}}", lead.company || lead.name || "client");
}

export async function runCrmStageWorkflows(args: {
  leadId: string;
  stage: string;
  actorId: string;
}) {
  const admin = createAdminClient();
  const [{ data: lead, error: leadError }, { data: workflowRows, error: workflowError }] = await Promise.all([
    admin
      .from("lead_intake")
      .select("id,name,company,owner_id,job_id,next_follow_up_at")
      .eq("id", args.leadId)
      .maybeSingle(),
    admin
      .from("crm_workflows")
      .select("id,name,action_type,action_config")
      .eq("trigger_stage", args.stage)
      .eq("is_enabled", true)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);
  if (leadError) throw leadError;
  if (workflowError) throw workflowError;
  if (!lead) return;

  for (const workflow of (workflowRows || []) as WorkflowRow[]) {
    const config = workflow.action_config || {};
    if (workflow.action_type === "create_task") {
      const dueDays = clampDays(config.due_days, 2);
      const dueAt = new Date(Date.now() + dueDays * 86400000).toISOString();
      const title = fillTemplate(config.title, lead);
      const priority = ["low", "normal", "high", "urgent"].includes(String(config.priority))
        ? String(config.priority)
        : "normal";
      const assigneeId = lead.owner_id || args.actorId;

      const { error } = await admin.from("recruiter_tasks").insert({
        title,
        description: `Created by CRM automation: ${workflow.name}`,
        assignee_id: assigneeId,
        created_by: args.actorId,
        subject_type: "lead",
        subject_id: args.leadId,
        href: `/workspace/recruiter/crm/${args.leadId}`,
        priority,
        repeat_rule: "none",
        due_at: dueAt,
      });
      if (error) throw error;

      await admin.from("recruiter_activity").insert({
        subject_type: "lead",
        subject_id: args.leadId,
        action: "crm_workflow_task_created",
        description: `${workflow.name}: ${title}`,
        actor_id: args.actorId,
        metadata: { workflow_id: workflow.id, due_at: dueAt, priority },
      });
      continue;
    }

    if (workflow.action_type === "set_follow_up") {
      const days = clampDays(config.days, 2);
      const nextFollowUpAt = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await admin
        .from("lead_intake")
        .update({ next_follow_up_at: nextFollowUpAt })
        .eq("id", args.leadId);
      if (error) throw error;

      await admin.from("recruiter_activity").insert({
        subject_type: "lead",
        subject_id: args.leadId,
        action: "crm_workflow_follow_up_set",
        description: `${workflow.name}: follow-up scheduled`,
        actor_id: args.actorId,
        metadata: { workflow_id: workflow.id, next_follow_up_at: nextFollowUpAt },
      });
    }
  }
}
