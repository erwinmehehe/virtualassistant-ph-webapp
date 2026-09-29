"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateClientRecruiterThread } from "@/lib/recruiter-client-chat";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function recruiterRecipients(admin: ReturnType<typeof createAdminClient>, recruiterId?: string | null) {
  if (recruiterId) return [recruiterId];
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "recruiter")
    .eq("account_status", "active");
  if (error) throw error;
  return (data || []).map((row) => String(row.id));
}

export async function sendRecruiterClientChatMessageAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["client", "recruiter"]);
  const body = String(formData.get("body") || "").trim().slice(0, 4000);
  const requestedThreadId = String(formData.get("thread_id") || "");
  const requestedClientId = String(formData.get("client_id") || "");
  const fallback = profile.role === "client"
    ? "/workspace/client/messages"
    : requestedThreadId
      ? "/workspace/recruiter/messages?thread=" + encodeURIComponent(requestedThreadId)
      : "/workspace/recruiter/messages";
  const returnTo = safeReturnTo(formData.get("return_to"), fallback);
  if (!body) throw new Error("Write a message before sending.");

  const admin = createAdminClient();
  let thread = profile.role === "client"
    ? await getOrCreateClientRecruiterThread(user.id)
    : null;

  if (profile.role === "recruiter") {
    if (!requestedThreadId) throw new Error("Choose a client conversation.");
    const { data, error } = await admin
      .from("client_recruiter_threads")
      .select("*")
      .eq("id", requestedThreadId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Chat thread not found.");
    if (data.recruiter_id && data.recruiter_id !== user.id) {
      throw new Error("This client is assigned to another recruiter.");
    }
    if (!data.recruiter_id) {
      const { data: claimed, error: claimError } = await admin
        .from("client_recruiter_threads")
        .update({ recruiter_id: user.id, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .is("recruiter_id", null)
        .select("*")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) throw new Error("Another recruiter has taken this conversation. Refresh your inbox.");
      thread = claimed;
    } else {
      thread = data;
    }
  }

  if (!thread) throw new Error("Chat thread not found.");
  if (requestedClientId && requestedClientId !== thread.client_id) {
    throw new Error("Client does not match this conversation.");
  }

  const now = new Date().toISOString();
  const { error: messageError } = await admin
    .from("client_recruiter_messages")
    .insert({
      thread_id: thread.id,
      sender_id: user.id,
      body,
      created_at: now,
    });
  if (messageError) throw messageError;

  const { error: threadError } = await admin
    .from("client_recruiter_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", thread.id);
  if (threadError) throw threadError;

  if (profile.role === "client") {
    const recipients = await recruiterRecipients(admin, thread.recruiter_id);
    if (recipients.length) {
      await admin.from("notifications").insert(recipients.map((id) => ({
        user_id: id,
        title: "Client sent a new message",
        body: body.slice(0, 180),
        href: "/workspace/recruiter/messages?thread=" + encodeURIComponent(thread.id),
        type: "client_chat",
        priority: "high",
      })));
    }

    const { data: lead } = await admin
      .from("lead_intake")
      .select("id")
      .eq("client_id", user.id)
      .eq("lead_type", "client_hiring")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lead?.id) {
      await writeRecruiterActivity({
        subjectType: "lead",
        subjectId: lead.id,
        action: "client_chat_message",
        description: body,
        actorId: user.id,
        metadata: { thread_id: thread.id, source: "in_app_chat" },
      });
      revalidatePath("/workspace/recruiter/crm/" + lead.id);
    }
  } else {
    await admin.from("notifications").insert({
      user_id: thread.client_id,
      title: "Your recruiter replied",
      body: body.slice(0, 180),
      href: "/workspace/client/messages",
      type: "client_chat",
      priority: "normal",
    });
  }

  revalidatePath("/workspace/client/messages");
  revalidatePath("/workspace/recruiter/messages");
  revalidatePath("/workspace/recruiter/today");
  redirect(returnTo + (returnTo.includes("?") ? "&" : "?") + "sent=1");
}
