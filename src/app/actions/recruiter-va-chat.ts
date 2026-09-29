"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendRecruiterVaMessageAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "va"]);
  const admin = createAdminClient();
  const vaId = String(formData.get("va_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body || body.length > 4000) throw new Error("Message must be 1 to 4000 characters.");

  let threadId = String(formData.get("thread_id") || "");
  let thread: { id: string; recruiter_id: string; va_id: string } | null = null;
  if (threadId) {
    const { data, error } = await admin.from("recruiter_va_threads")
      .select("id,recruiter_id,va_id").eq("id", threadId).maybeSingle();
    if (error) throw error;
    thread = data;
  } else if (profile.role === "recruiter" && vaId) {
    const { data: va } = await admin.from("profiles").select("id")
      .eq("id", vaId).eq("role", "va").maybeSingle();
    if (!va) throw new Error("VA account not found.");
    const { data, error } = await admin.from("recruiter_va_threads")
      .upsert({ recruiter_id: user.id, va_id: vaId }, { onConflict: "recruiter_id,va_id" })
      .select("id,recruiter_id,va_id").single();
    if (error) throw error;
    thread = data;
    threadId = data.id;
  }
  if (!thread || (user.id !== thread.recruiter_id && user.id !== thread.va_id)) {
    throw new Error("You cannot access this conversation.");
  }
  if (vaId && vaId !== thread.va_id) throw new Error("VA does not match this conversation.");

  const now = new Date().toISOString();
  const { error } = await admin.from("recruiter_va_messages")
    .insert({ thread_id: threadId, sender_id: user.id, body, created_at: now });
  if (error) throw error;
  const { error: updateError } = await admin.from("recruiter_va_threads")
    .update({ last_message_at: now }).eq("id", threadId);
  if (updateError) throw updateError;
  const recipientId = profile.role === "recruiter" ? thread.va_id : thread.recruiter_id;
  const href = profile.role === "recruiter"
    ? `/workspace/va/messages?thread=${encodeURIComponent(threadId)}`
    : `/workspace/recruiter/va-messages?thread=${encodeURIComponent(threadId)}`;
  await admin.from("notifications").insert({
    user_id: recipientId, title: "New message from " + (profile.role === "recruiter" ? "your recruiter" : "a VA"),
    body: body.slice(0, 180), href, type: "recruiter_va_chat", priority: "normal",
  });
  revalidatePath("/workspace/recruiter/va-messages");
  revalidatePath("/workspace/va/messages");
  redirect(profile.role === "recruiter"
    ? `/workspace/recruiter/va-messages?thread=${encodeURIComponent(threadId)}&sent=1`
    : `/workspace/va/messages?thread=${encodeURIComponent(threadId)}&sent=1`);
}
