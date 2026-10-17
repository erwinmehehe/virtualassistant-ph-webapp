import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { extensionFromStoragePath, privateStorageDownloadResponse } from "@/lib/private-storage-download";

export async function GET(_: Request, { params }: { params: Promise<{ vaId: string }> }) {
  const { vaId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data: va } = await admin.from("va_profiles").select("resume_path").eq("user_id", vaId).single();
  if (!va?.resume_path) return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
  const extension = extensionFromStoragePath(va.resume_path);
  const response = await privateStorageDownloadResponse({
    bucket: "resumes",
    path: va.resume_path,
    downloadName: extension ? `resume.${extension}` : "resume",
  });
  return response || NextResponse.json({ error: "Resume unavailable" }, { status: 404 });
}
