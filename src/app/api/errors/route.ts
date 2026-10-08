import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { isExplicitCrossSiteRequest, readRequestJson } from "@/lib/http-security";

type ClientErrorPayload = {
  message?: unknown;
  name?: unknown;
  stack?: unknown;
  digest?: unknown;
  path?: unknown;
};

export async function POST(request: Request) {
  if (isExplicitCrossSiteRequest(request)) return new Response(null, { status: 204 });

  try {
    const body = await readRequestJson<ClientErrorPayload>(request, 32_768).catch(() => ({} as ClientErrorPayload));
    const message = String(body?.message || "Unknown client error").slice(0, 1000);
    const errorName = body?.name ? String(body.name).slice(0, 200) : "Error";
    const path = body?.path ? String(body.path).slice(0, 500) : null;
    const clientStack = body?.stack ? String(body.stack).slice(0, 6000) : null;
    const suppliedDigest = body?.digest ? String(body.digest).slice(0, 200) : null;
    const digest = suppliedDigest || createHash("sha256")
      .update([errorName, message, path || ""].join("|"))
      .digest("hex")
      .slice(0, 32);

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
      metadata: {
        source: "next_error_boundary",
        error_name: errorName,
        client_stack: clientStack,
        release_sha: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
        deployment_environment: process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || null,
        deployment_host: process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || null,
      }
    });

    return NextResponse.json({ ok: true, reference: digest });
  } catch {
    return new Response(null, { status: 204 });
  }
}
