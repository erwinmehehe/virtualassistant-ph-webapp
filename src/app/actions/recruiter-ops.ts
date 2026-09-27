"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const REPEAT_RULES = new Set(["none", "daily", "weekly"]);
const SNOOZE_MINUTES = new Set([60, 1440, 4320]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function recruiterActionPath(value: FormDataEntryValue | string | null, fallback: string) {
  const path = safePath(value as FormDataEntryValue | null, fallback);
  const legacyMatch = path.match(/^\/workspace\/recruiter\/matching\/([^/?#]+)(.*)$/);
  if (legacyMatch) return `/workspace/recruiter/roles/${legacyMatch[1]}${legacyMatch[2] || ""}`;
  const adminJob = path.match(/^\/workspace\/admin\/jobs\/([^/?#]+)(.*)$/);
  if (adminJob) return `/workspace/recruiter/roles/${adminJob[1]}${adminJob[2] || ""}`;
  if (
    path === "/workspace/client-success" ||
    path.startsWith("/workspace/client-success/") ||
    path === "/workspace/account" ||
    path.startsWith("/workspace/recruiter/")
  ) return path;
  return fallback;
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
  redirect(recruiterActionPath(notification.href, "/workspace/recruiter/notifications"));
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
  const href = recruiterActionPath(formData.get("href"), "");
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
  await requireRoleFast("recruiter");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/today");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_error=${encodeURIComponent("Client email is held until recruiter-approved VAs are ready to send.")}`);
}
