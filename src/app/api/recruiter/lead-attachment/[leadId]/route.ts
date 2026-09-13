import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["admin", "recruiter"].includes(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("attachment_path").eq("id", leadId).maybeSingle();
  if (!lead?.attachment_path) return NextResponse.json({ error: "No client document" }, { status: 404 });
  const { data, error } = await admin.storage.from("lead-attachments").createSignedUrl(lead.attachment_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Document unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
