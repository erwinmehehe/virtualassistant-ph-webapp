import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";

export async function GET(_: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client","va","admin","recruiter"].includes(profile.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: message } = await admin.from("messages").select("id,attachment_path,conversation_id").eq("id", messageId).maybeSingle();
  if (!message?.attachment_path) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  const { data: conversation } = await admin.from("conversations").select("id,application_id,client_id,va_id").eq("id", message.conversation_id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const staff = ["admin","recruiter"].includes(profile.role);
  const participant = conversation.client_id === user.id || conversation.va_id === user.id;
  if (!staff && !participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (profile.role === "client") {
    const { data: application } = conversation.application_id ? await admin.from("applications").select("job_id").eq("id", conversation.application_id).maybeSingle() : { data: null };
    const { data: access } = application?.job_id ? await admin.from("job_candidate_access").select("access_status").eq("job_id", application.job_id).maybeSingle() : { data: null };
    if (!candidateAccessUnlocked(access?.access_status)) return NextResponse.json({ error: "Candidate access required" }, { status: 403 });
  }
  const { data, error } = await admin.storage.from("message-attachments").createSignedUrl(message.attachment_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Could not open attachment" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
