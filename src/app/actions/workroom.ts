"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTaskAction(formData: FormData) {
  const { user } = await requireRole("client");
  const workroomId = String(formData.get("workroom_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required.");
  const supabase = await createClient();
  const { data: room } = await supabase.from("workrooms").select("id,va_id").eq("id",workroomId).eq("client_id",user.id).single();
  if (!room) throw new Error("Workroom not found.");
  const { error } = await createAdminClient().from("workroom_tasks").insert({
    workroom_id: workroomId,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    assigned_to: room.va_id,
    created_by: user.id,
    due_date: String(formData.get("due_date") ?? "") || null
  });
  if (error) throw error;
  revalidatePath("/workspace/client/workroom");
  revalidatePath("/workspace/va/workroom");
}

export async function updateTaskStatusAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client","va"].includes(profile.role)) throw new Error("Not authorized.");
  const taskId = String(formData.get("task_id"));
  const status = String(formData.get("status"));
  if (!["todo","in_progress","review","done"].includes(status)) throw new Error("Invalid task status.");
  const supabase = await createClient();
  const { data: task } = await supabase.from("workroom_tasks").select("id").eq("id",taskId).single();
  if (!task) throw new Error("Task not found.");
  const { error } = await createAdminClient().from("workroom_tasks").update({ status, updated_at: new Date().toISOString() }).eq("id",taskId);
  if (error) throw error;
  revalidatePath("/workspace/client/workroom");
  revalidatePath("/workspace/va/workroom");
}

export async function toggleChecklistAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client","va"].includes(profile.role)) throw new Error("Not authorized.");
  const id = String(formData.get("checklist_id"));
  const done = String(formData.get("done")) === "1";
  const supabase = await createClient();
  const { data: checklistItem } = await supabase.from("workroom_checklist").select("id").eq("id",id).single();
  if (!checklistItem) throw new Error("Checklist item not found.");
  const { error } = await createAdminClient().from("workroom_checklist").update({ completed_at: done ? null : new Date().toISOString(), completed_by: done ? null : user.id }).eq("id",id);
  if (error) throw error;
  revalidatePath("/workspace/client/workroom");
  revalidatePath("/workspace/va/workroom");
}

export async function logTimeAction(formData: FormData) {
  const { user } = await requireRole("va");
  const workroomId = String(formData.get("workroom_id"));
  const hours = Number(formData.get("hours"));
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error("Enter valid hours.");
  const supabase = await createClient();
  const { data: room } = await supabase.from("workrooms").select("id").eq("id",workroomId).eq("va_id",user.id).single();
  if (!room) throw new Error("Workroom not found.");
  await supabase.from("time_entries").insert({
    workroom_id: workroomId,
    va_id: user.id,
    work_date: String(formData.get("work_date") ?? new Date().toISOString().slice(0,10)),
    hours,
    note: String(formData.get("note") ?? "").trim() || null,
    status: "pending"
  });
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/client/workroom");
}

export async function updateTimeEntryAction(formData: FormData) {
  const { user } = await requireRole("va");
  const id = String(formData.get("time_entry_id") ?? "");
  const hours = Number(formData.get("hours"));
  const workDate = String(formData.get("work_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) throw new Error("Choose a valid work date.");
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error("Enter valid hours.");
  const supabase = await createClient();
  const { data: entry } = await supabase.from("time_entries").select("id,status,va_id,workroom_id").eq("id", id).eq("va_id", user.id).single();
  if (!entry) throw new Error("Time entry not found.");
  if (entry.status === "approved") throw new Error("Approved time cannot be changed. Ask the client to review it before making a correction.");
  const admin = createAdminClient();
  await admin.from("time_entries").update({ work_date: workDate, hours, note, status: "pending", client_note: null, updated_at: new Date().toISOString() }).eq("id", id).eq("va_id", user.id);
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/client/workroom");
}

export async function deleteTimeEntryAction(formData: FormData) {
  const { user } = await requireRole("va");
  const id = String(formData.get("time_entry_id") ?? "");
  const supabase = await createClient();
  const { data: entry } = await supabase.from("time_entries").select("id,status").eq("id", id).eq("va_id", user.id).single();
  if (!entry) throw new Error("Time entry not found.");
  if (entry.status === "approved") throw new Error("Approved time cannot be deleted.");
  const { error } = await supabase.from("time_entries").delete().eq("id", id).eq("va_id", user.id);
  if (error) throw error;
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/client/workroom");
}

export async function reviewTimeEntryAction(formData: FormData) {
  const { user } = await requireRole("client");
  const id = String(formData.get("time_entry_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const clientNote = String(formData.get("client_note") ?? "").trim() || null;
  if (!["approve", "changes"].includes(decision)) throw new Error("Invalid time-entry review decision.");
  if (decision === "changes" && (!clientNote || clientNote.length < 5)) throw new Error("Add a short note explaining the correction needed.");
  const supabase = await createClient();
  const { data: entry } = await supabase.from("time_entries").select("id,va_id,status,workroom_id,workrooms!inner(client_id)").eq("id", id).eq("workrooms.client_id", user.id).single();
  if (!entry) throw new Error("Time entry not found.");
  const admin = createAdminClient();
  const status = decision === "approve" ? "approved" : "changes_requested";
  await admin.from("time_entries").update({ status, client_note: clientNote, updated_at: new Date().toISOString() }).eq("id", id);
  if (decision === "changes") await admin.from("notifications").insert({ user_id: entry.va_id, title: "Time entry needs a correction", body: clientNote || "The client requested a correction to a time entry.", href: "/workspace/va/workroom" });
  revalidatePath("/workspace/va/workroom");
  revalidatePath("/workspace/client/workroom");
}

export async function submitPlacementReviewAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) throw new Error("Not authorized.");

  const workroomId = String(formData.get("workroom_id") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();
  const requestedVisibility = String(formData.get("visibility") ?? "contract");
  if (!workroomId) throw new Error("Workroom is required.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.");
  if (body.length < 10 || body.length > 1600) throw new Error("Review must be between 10 and 1,600 characters.");
  if (!['public','contract'].includes(requestedVisibility)) throw new Error("Invalid review visibility.");

  const supabase = await createClient();
  const { data: room } = await supabase.from("workrooms").select("id,client_id,va_id").eq("id", workroomId).single();
  if (!room) throw new Error("Workroom not found.");

  const isClient = profile.role === "client" && room.client_id === user.id;
  const isVa = profile.role === "va" && room.va_id === user.id;
  if (!isClient && !isVa) throw new Error("You are not a participant in this placement.");

  const revieweeId = isClient ? room.va_id : room.client_id;
  const visibility = isClient && requestedVisibility === "public" ? "public" : "contract";
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").upsert({
    workroom_id: workroomId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating,
    body,
    visibility
  }, { onConflict: "workroom_id,reviewer_id" });
  if (error) throw error;

  await admin.from("notifications").insert({
    user_id: revieweeId,
    title: "New placement review",
    body: isClient ? "Your client submitted or updated a review for your placement." : "Your VA submitted or updated a review for your placement.",
    href: isClient ? "/workspace/va/workroom" : "/workspace/client/workroom"
  });

  revalidatePath("/workspace/client/workroom");
  revalidatePath("/workspace/va/workroom");
  if (isClient) {
    const { data: va } = await admin.from("va_profiles").select("slug").eq("user_id", room.va_id).maybeSingle();
    if (va?.slug) revalidatePath(`/va/${va.slug}`);
  }
}
