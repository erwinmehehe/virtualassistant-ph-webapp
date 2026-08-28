import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { getSessionProfile } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: application } = await admin.from("applications").select("id,job_id,va_id,profile_snapshot,jobs!inner(client_id)").eq("id",applicationId).single();
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const clientId = Array.isArray(application.jobs) ? application.jobs[0]?.client_id : (application.jobs as any)?.client_id;

  let allowed = profile.role === "admin" || profile.role === "recruiter" || application.va_id === user.id;
  if (!allowed && profile.role === "client" && clientId === user.id) {
    const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", application.job_id).maybeSingle();
    allowed = candidateAccessUnlocked(access?.access_status);
  }
  if (!allowed) return NextResponse.json({ error: "Candidate access required" }, { status: 403 });

  const path = (application.profile_snapshot as any)?.resume_path;
  if (!path) return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
  const { data, error } = await admin.storage.from("resumes").createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Resume unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
