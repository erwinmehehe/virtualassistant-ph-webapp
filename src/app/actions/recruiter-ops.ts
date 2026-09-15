"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStaffClientFollowupEmail } from "@/lib/email";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const REPEAT_RULES = new Set(["none", "daily", "weekly"]);
const SNOOZE_MINUTES = new Set([60, 1440, 4320]);
const FOLLOW_UP_DAYS = new Set([1, 2, 3, 7, 14]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function parseManilaDateTime(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? new Date(`${raw}:00+08:00`) : new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function refreshRecruiterOps() {
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter/tasks");
  revalidatePath("/workspace/recruiter/agenda");
  revalidatePath("/workspace/recruiter/notifications");
}

export async function markRecruiterNotificationReadAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const id = String(formData.get("notification_id") || "");
  if (!id) return;
  await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  refreshRecruiterOps();
}

export async function openRecruiterNotificationAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const id = String(formData.get("notification_id") || "");
  if (!id) redirect("/workspace/recruiter/notifications");
  const admin = createAdminClient();
  const { data: notification } = await admin
    .from("notifications")
    .select("id,href")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!notification) redirect("/workspace/recruiter/notifications");
  const now = new Date().toISOString();
  await admin.from("notifications").update({ read_at: now }).eq("id", id).eq("user_id", userId);
  refreshRecruiterOps();
  redirect(safePath(notification.href, "/workspace/recruiter/notifications"));
}

export async function markAllRecruiterNotificationsReadAction() {
  const { userId } = await requireRoleFast("recruiter");
  await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  refreshRecruiterOps();
}

export async function completeRecruiterNotificationAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const id = String(formData.get("notification_id") || "");
  if (!id) return;
  const now = new Date().toISOString();
  await createAdminClient().from("notifications").update({ done_at: now, read_at: now, snoozed_until: null }).eq("id", id).eq("user_id", userId);
  refreshRecruiterOps();
}

export async function snoozeRecruiterNotificationAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const id = String(formData.get("notification_id") || "");
  const minutes = Number(formData.get("minutes") || 60);
  if (!id || !SNOOZE_MINUTES.has(minutes)) return;
  await createAdminClient().from("notifications").update({ snoozed_until: addMinutes(minutes), read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  refreshRecruiterOps();
}

export async function setRecruiterNotificationPriorityAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const id = String(formData.get("notification_id") || "");
  const priority = String(formData.get("priority") || "normal");
  if (!id || !PRIORITIES.has(priority)) return;
  await createAdminClient().from("notifications").update({ priority }).eq("id", id).eq("user_id", userId);
  refreshRecruiterOps();
}

export async function createRecruiterTaskAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const title = String(formData.get("title") || "").trim().slice(0, 180);
  const description = String(formData.get("description") || "").trim().slice(0, 4000);
  const assigneeId = String(formData.get("assignee_id") || userId).trim() || userId;
  const subjectType = String(formData.get("subject_type") || "").trim();
  const subjectId = String(formData.get("subject_id") || "").trim();
  const href = safePath(formData.get("href"), "");
  const priority = String(formData.get("priority") || "normal");
  const repeatRule = String(formData.get("repeat_rule") || "none");
  const due = parseManilaDateTime(formData.get("due_at"));
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/tasks");

  if (title.length < 3) redirect(`${returnTo}?task_error=${encodeURIComponent("Add a task title.")}`);
  if (!PRIORITIES.has(priority) || !REPEAT_RULES.has(repeatRule)) redirect(`${returnTo}?task_error=${encodeURIComponent("Choose valid task settings.")}`);
  if (String(formData.get("due_at") || "").trim() && !due) redirect(`${returnTo}?task_error=${encodeURIComponent("Choose a valid due date and time.")}`);
  if (subjectType && !["lead", "job", "va", "client"].includes(subjectType)) redirect(`${returnTo}?task_error=${encodeURIComponent("Choose a valid linked record.")}`);

  const admin = createAdminClient();
  const { data: assignee } = await admin.from("profiles").select("id,role,account_status").eq("id", assigneeId).maybeSingle();
  if (!assignee || !["recruiter", "admin"].includes(String(assignee.role)) || assignee.account_status !== "active") {
    redirect(`${returnTo}?task_error=${encodeURIComponent("Choose an active recruiter or admin.")}`);
  }

  const { error } = await admin.from("recruiter_tasks").insert({
    title,
    description: description || null,
    assignee_id: assigneeId,
    created_by: userId,
    subject_type: subjectType || null,
    subject_id: subjectId || null,
    href: href || null,
    priority,
    repeat_rule: repeatRule,
    due_at: due?.toISOString() || null
  });
  if (error) redirect(`${returnTo}?task_error=${encodeURIComponent(error.message)}`);
  refreshRecruiterOps();
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}task_saved=1`);
}

export async function completeRecruiterTaskAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const taskId = String(formData.get("task_id") || "");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/today");
  if (!taskId) return;
  const admin = createAdminClient();
  const { data: task } = await admin.from("recruiter_tasks").select("*").eq("id", taskId).eq("assignee_id", userId).maybeSingle();
  if (!task || task.status === "done") return;

  const now = new Date().toISOString();
  const { error } = await admin.from("recruiter_tasks").update({ status: "done", completed_at: now, updated_at: now, snoozed_until: null }).eq("id", taskId).eq("assignee_id", userId);
  if (error) throw error;

  if (["daily", "weekly"].includes(task.repeat_rule) && task.due_at) {
    const next = new Date(task.due_at);
    next.setUTCDate(next.getUTCDate() + (task.repeat_rule === "daily" ? 1 : 7));
    await admin.from("recruiter_tasks").insert({
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      created_by: userId,
      subject_type: task.subject_type,
      subject_id: task.subject_id,
      href: task.href,
      priority: task.priority,
      repeat_rule: task.repeat_rule,
      due_at: next.toISOString()
    });
  }

  refreshRecruiterOps();
  revalidatePath(returnTo);
}

export async function snoozeRecruiterTaskAction(formData: FormData) {
  const { userId } = await requireRoleFast("recruiter");
  const taskId = String(formData.get("task_id") || "");
  const minutes = Number(formData.get("minutes") || 60);
  if (!taskId || !SNOOZE_MINUTES.has(minutes)) return;
  await createAdminClient().from("recruiter_tasks").update({ snoozed_until: addMinutes(minutes), updated_at: new Date().toISOString() }).eq("id", taskId).eq("assignee_id", userId).eq("status", "todo");
  refreshRecruiterOps();
}

export async function sendRecruiterTemplateEmailAction(formData: FormData) {
  const { userId, profile } = await requireRoleFast("recruiter");
  const leadId = String(formData.get("lead_id") || "").trim();
  const subject = String(formData.get("subject") || "").trim().slice(0, 180);
  const message = String(formData.get("message") || "").trim().slice(0, 5000);
  const templateId = String(formData.get("template_id") || "custom").slice(0, 80);
  const followUpDays = Number(formData.get("follow_up_days") || 2);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/today");

  const fail = (text: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_error=${encodeURIComponent(text)}`);
  if (!leadId || subject.length < 3 || message.length < 10 || !FOLLOW_UP_DAYS.has(followUpDays)) return fail("Add a valid subject, message, and follow-up schedule.");

  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake")
    .select("id,email,name,job_id,crm_stage,owner_id,first_contact_at")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.email) return fail("No client email is attached to this lead.");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const href = lead.job_id ? `${appUrl}/workspace/client/jobs/${lead.job_id}` : undefined;
  const result = await sendStaffClientFollowupEmail({
    to: lead.email,
    subject,
    message,
    senderName: profile.full_name || "VirtualAssistant.com.ph hiring team",
    href
  });
  if (!result.sent) return fail("Client email could not be sent. Check the email configuration and recipient address.");

  const now = new Date();
  const patch: Record<string, unknown> = {
    last_contact_at: now.toISOString(),
    owner_id: lead.owner_id || userId,
    next_follow_up_at: new Date(now.getTime() + followUpDays * 86_400_000).toISOString()
  };
  if (!lead.first_contact_at) patch.first_contact_at = now.toISOString();
  if ((lead.crm_stage || "new") === "new") {
    patch.crm_stage = "contacted";
    patch.stage_updated_at = now.toISOString();
  }
  await admin.from("lead_intake").update(patch).eq("id", leadId);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "client_followup_sent",
    description: `Template email sent to ${lead.name || lead.email}: ${subject}`,
    actorId: userId,
    metadata: { template_id: templateId, follow_up_days: followUpDays, recipient: lead.email, job_id: lead.job_id || null }
  });

  refreshRecruiterOps();
  revalidatePath("/workspace/recruiter/leads");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_sent=1`);
}
