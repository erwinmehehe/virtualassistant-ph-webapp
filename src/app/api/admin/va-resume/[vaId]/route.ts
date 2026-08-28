import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ vaId: string }> }) {
  const { vaId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data: va } = await admin.from("va_profiles").select("resume_path").eq("user_id", vaId).single();
  if (!va?.resume_path) return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
  const { data, error } = await admin.storage.from("resumes").createSignedUrl(va.resume_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Resume unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
