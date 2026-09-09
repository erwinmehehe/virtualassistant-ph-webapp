import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

export async function POST(request: Request) {
  let token = "";
  try {
    const body = await request.json();
    token = String(body?.token || "").trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin.from("lead_proposals")
    .update({ viewed_at: now, updated_at: now })
    .eq("public_token", token)
    .is("viewed_at", null)
    .select("id,lead_id,role_title")
    .maybeSingle();

  if (data) {
    await writeRecruiterActivity({
      subjectType: "lead",
      subjectId: data.lead_id,
      action: "proposal_viewed",
      description: `Client viewed proposal for ${data.role_title}`,
      metadata: { proposal_id: data.id }
    });
  }
  return NextResponse.json({ ok: true });
}
