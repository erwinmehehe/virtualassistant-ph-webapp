"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { detectCircumvention } from "@/lib/circumvention-detection";
import { enforceActionRateLimit } from "@/lib/rate-limit";

export async function sendMessageAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client","va"].includes(profile.role)) throw new Error("Please sign in to a client or VA workspace.");
  await enforceActionRateLimit("message_send", user.id, 40, 10);
  const conversationId = String(formData.get("conversation_id"));
  const body = String(formData.get("body") ?? "").trim();
  const attachment = formData.get("attachment");
  const hasAttachment = attachment instanceof File && attachment.size > 0;
  if ((!body && !hasAttachment) || body.length > 5000) throw new Error("Add a message or attachment before sending.");
  if (hasAttachment && attachment.size > 10 * 1024 * 1024) throw new Error("Attachments must be 10 MB or smaller.");
  const allowedAttachmentTypes = new Set(["application/pdf","image/jpeg","image/png","image/webp","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
  if (hasAttachment && !allowedAttachmentTypes.has(attachment.type)) throw new Error("Attach a PDF, image, TXT, or DOCX file only.");
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select("id,application_id,client_id,va_id").eq("id",conversationId).single();
  if (!conversation) throw new Error("Conversation not found.");

  // Clients may only read/write candidate conversations after access for the
  // related role has been paid or explicitly comped. Enforce this server-side
  // so a crafted form submission cannot bypass the UI gate.
  if (profile.role === "client") {
    const admin = createAdminClient();
    if (!conversation.application_id) throw new Error("Candidate access is required before messaging.");
    const { data: application } = await admin.from("applications").select("job_id").eq("id", conversation.application_id).maybeSingle();
    const { data: access } = application?.job_id
      ? await admin.from("job_candidate_access").select("access_status").eq("job_id", application.job_id).maybeSingle()
      : { data: null };
    if (!candidateAccessUnlocked(access?.access_status)) throw new Error("Candidate access is required before messaging.");
  }

  const admin = createAdminClient();
  let attachmentPath: string | null = null;
  if (hasAttachment) {
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "attachment";
    attachmentPath = `${conversationId}/${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from("message-attachments").upload(attachmentPath, attachment, { upsert: false, contentType: attachment.type });
    if (uploadError) throw uploadError;
  }
  const { data: inserted, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body || "Attachment", attachment_path: attachmentPath, attachment_name: hasAttachment ? attachment.name.slice(0,180) : null, attachment_type: hasAttachment ? attachment.type : null, attachment_size: hasAttachment ? attachment.size : null }).select("id").single();
  if (error) { if (attachmentPath) await admin.storage.from("message-attachments").remove([attachmentPath]); throw error; }

  // Flag possible off-platform payment/contact attempts for admin review.
  // This never blocks the message or penalizes the sender automatically --
  // keyword matching has false positives, so a human confirms before any
  // account action is taken.
  const detection = detectCircumvention(body);
  if (detection.matched) {
    const admin = createAdminClient();
    await admin.from("message_flags").insert({
      message_id: inserted.id,
      conversation_id: conversationId,
      sender_id: user.id,
      matched_terms: detection.terms
    });
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(admins.map((a) => ({
        user_id: a.id,
        title: "Possible off-platform payment mention",
        body: `A message in a conversation matched: ${detection.terms.join(", ")}. Review before it affects this account.`,
        href: "/workspace/admin/moderation"
      })));
    }
  }

  const recipient = conversation.client_id === user.id ? conversation.va_id : conversation.client_id;
  let notificationTitle = "New private message";
  let notificationBody = `${profile.full_name || "A hiring contact"} sent you a message.`;
  let notificationHref = profile.role === "client" ? `/workspace/va/messages?thread=${conversationId}` : `/workspace/client/messages?thread=${conversationId}`;

  // A VA can still write in their application conversation while candidate access is locked.
  // Never leak the VA's identity through a notification before the client has paid/been comped.
  if (profile.role === "va") {
    let accessIsUnlocked = false;
    let jobId = "";
    if (conversation.application_id) {
      const { data: application } = await admin.from("applications").select("job_id").eq("id", conversation.application_id).maybeSingle();
      jobId = String(application?.job_id || "");
      if (jobId) {
        const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle();
        accessIsUnlocked = candidateAccessUnlocked(access?.access_status);
      }
    }
    if (!accessIsUnlocked) {
      notificationTitle = "New candidate message";
      notificationBody = "A candidate sent a message. Candidate identity and message content become available when candidate access is active.";
      notificationHref = jobId ? `/workspace/client/jobs/${jobId}` : "/workspace/client/jobs";
    }
  }

  await admin.from("notifications").insert({
    user_id: recipient,
    title: notificationTitle,
    body: notificationBody,
    href: notificationHref
  });
  try {
    const recipientAuth = await admin.auth.admin.getUserById(recipient);
    const { sendTransactionalEventEmail } = await import("@/lib/email");
    await sendTransactionalEventEmail({ to: recipientAuth.data.user?.email, subject: notificationTitle, heading: notificationTitle, body: notificationBody, href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}${notificationHref}`, hrefLabel: "Open conversation", archive: false });
  } catch { /* email is best-effort */ }

  revalidatePath(profile.role === "client" ? "/workspace/client/messages" : "/workspace/va/messages");
}

export async function markConversationReadAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client","va"].includes(profile.role)) return;
  const conversationId = String(formData.get("conversation_id") || "");
  if (!conversationId) return;
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select("id").eq("id", conversationId).single();
  if (!conversation) return;
  await createAdminClient().from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", conversationId).neq("sender_id", user.id).is("read_at", null);
}

export async function markNotificationReadAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) return;
  const id = String(formData.get("notification_id") || "");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id",id).eq("user_id",user.id);
  const base = profile.role === "va" ? "/workspace/va" : "/workspace/client";
  revalidatePath(`${base}/notifications`);
  revalidatePath(base);
}

export async function markAllNotificationsReadAction() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id",user.id).is("read_at",null);
  const base = profile.role === "va" ? "/workspace/va" : "/workspace/client";
  revalidatePath(`${base}/notifications`);
  revalidatePath(base);
}
