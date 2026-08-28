import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceActionRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || "Unknown client error").slice(0, 1000);
    const digest = body?.digest ? String(body.digest).slice(0, 200) : null;
    const path = body?.path ? String(body.path).slice(0, 500) : null;
    const { user, profile } = await getSessionProfile();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    await enforceActionRateLimit("client_error_event", user?.id || ip, 20, 5);
    await createAdminClient().from("app_error_events").insert({
      digest,
      message,
      path,
      role: profile?.role || null,
      user_id: user?.id || null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
      metadata: { source: "next_error_boundary" }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 204 });
  }
}
