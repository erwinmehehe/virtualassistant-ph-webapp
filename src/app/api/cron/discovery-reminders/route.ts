import { createAdminClient } from "@/lib/supabase/admin";
import { bearerTokenFromRequest, timingSafeSecretMatches } from "@/lib/http-security";

export const runtime = "nodejs";

async function isAuthorized(request: Request, admin: ReturnType<typeof createAdminClient>) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (timingSafeSecretMatches(bearerTokenFromRequest(request), expectedSecret)) return true;

  const schedulerToken = request.headers.get("x-discovery-cron-token")?.trim();
  if (!schedulerToken) return false;
  const { data, error } = await admin.rpc("verify_discovery_reminder_cron_token", { candidate: schedulerToken });
  return !error && data === true;
}

export async function GET(request: Request) {
  const admin = createAdminClient();
  if (!(await isAuthorized(request, admin))) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const lower = new Date(now + 30 * 60 * 1000).toISOString();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("lead_intake")
    .select("id", { count: "exact", head: true })
    .not("discovery_scheduled_at", "is", null)
    .is("discovery_completed_at", null)
    .is("discovery_cancelled_at", null)
    .gte("discovery_scheduled_at", lower)
    .lte("discovery_scheduled_at", upper);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({
    ok: true,
    checked: count || 0,
    reminder24h: 0,
    reminder1h: 0,
    suppressed: count || 0,
    reason: "client_email_shortlist_only",
  });
}
