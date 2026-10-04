import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadLossReasonLabel } from "@/lib/loss-reasons";

const WIN_BACK_TASK_TITLE = "Win-back follow-up";

export async function syncLeadWinBackTask({
  leadId,
  assigneeId,
  actorId,
  subject,
  reasonCode,
  winBackAt,
}: {
  leadId: string;
  assigneeId?: string | null;
  actorId?: string | null;
  subject?: string | null;
  reasonCode?: string | null;
  winBackAt?: string | null;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("recruiter_tasks")
    .select("id,status")
    .eq("subject_type", "lead")
    .eq("subject_id", leadId)
    .eq("title", WIN_BACK_TASK_TITLE)
    .eq("status", "todo")
    .maybeSingle();

  if (!winBackAt) {
    if (existing?.id) {
      const { error } = await admin
        .from("recruiter_tasks")
        .update({ status: "done", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    }
    return { scheduled: false, taskId: existing?.id || null };
  }

  const effectiveAssignee = assigneeId || actorId;
  if (!effectiveAssignee) return { scheduled: false, taskId: existing?.id || null };

  const description = `Re-engage ${subject || "this client"} after a recoverable lost opportunity. Reason: ${leadLossReasonLabel(reasonCode)}.`;
  if (existing?.id) {
    const { error } = await admin
      .from("recruiter_tasks")
      .update({
        assignee_id: effectiveAssignee,
        description,
        due_at: winBackAt,
        priority: "normal",
        snoozed_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { scheduled: true, taskId: existing.id };
  }

  const { data, error } = await admin
    .from("recruiter_tasks")
    .insert({
      title: WIN_BACK_TASK_TITLE,
      description,
      assignee_id: effectiveAssignee,
      created_by: actorId || null,
      subject_type: "lead",
      subject_id: leadId,
      href: `/workspace/recruiter/crm/${leadId}`,
      priority: "normal",
      status: "todo",
      due_at: winBackAt,
      repeat_rule: "none",
    })
    .select("id")
    .single();
  if (error) throw error;
  return { scheduled: true, taskId: data.id };
}
