import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: application } = await admin.from("applications").select("id,job_id,va_id,jobs!inner(client_id)").eq("id",applicationId).single();
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const clientId = Array.isArray(application.jobs) ? application.jobs[0]?.client_id : (application.jobs as any)?.client_id;

  // Clients are deliberately excluded, even with candidate access unlocked: a
  // resume carries the VA's email, phone and often their address, which is
  // everything needed to hire around us. Recruiters summarise it instead.
  const allowed = profile.role === "admin" || profile.role === "recruiter" || application.va_id === user.id;
  if (!allowed) {
    return NextResponse.json(
      { error: clientId === user.id ? "Your recruiter can walk you through this candidate's background." : "Not authorised" },
      { status: 403 }
    );
  }

  // resume_path deliberately no longer lives in application.profile_snapshot.
  // Resolve the current private resume only after the application relationship
  // and caller authorization have been established above.
  const { data: vaProfile } = await admin
    .from("va_profiles")
    .select("resume_path")
    .eq("user_id", application.va_id)
    .maybeSingle();
  const path = vaProfile?.resume_path;
  if (!path) return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
  const { data, error } = await admin.storage.from("resumes").createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Resume unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
