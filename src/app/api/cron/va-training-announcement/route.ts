import { createAdminClient } from "@/lib/supabase/admin";
import { sendVaTrainingAnnouncementBatch } from "@/lib/va-training-announcement";

export const runtime = "nodejs";

async function isAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (expectedSecret && authorization === `Bearer ${expectedSecret}`) return true;

  const schedulerToken = request.headers.get("x-discovery-cron-token")?.trim();
  if (!schedulerToken) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("verify_discovery_reminder_cron_token", { candidate: schedulerToken });
  return !error && data === true;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return new Response("Unauthorized", { status: 401 });

  try {
    const result = await sendVaTrainingAnnouncementBatch(20);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[va-training-announcement] batch failed", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
