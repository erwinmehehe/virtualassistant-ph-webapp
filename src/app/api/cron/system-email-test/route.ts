import { sendSystemTestEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function isAuthorized(request: Request, admin: ReturnType<typeof createAdminClient>) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (expectedSecret && authorization === `Bearer ${expectedSecret}`) return true;

  const schedulerToken = request.headers.get("x-discovery-cron-token")?.trim();
  if (!schedulerToken) return false;
  const { data, error } = await admin.rpc("verify_discovery_reminder_cron_token", { candidate: schedulerToken });
  return !error && data === true;
}

export async function GET(request: Request) {
  const admin = createAdminClient();
  if (!(await isAuthorized(request, admin))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const adminId = new URL(request.url).searchParams.get("admin_id")?.trim();
  if (!adminId) return Response.json({ ok: false, error: "admin_id is required" }, { status: 400 });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,role")
    .eq("id", adminId)
    .eq("role", "admin")
    .maybeSingle();

  if (profileError) return Response.json({ ok: false, error: profileError.message }, { status: 500 });
  if (!profile) return Response.json({ ok: false, error: "Admin account not found" }, { status: 404 });

  const { data, error } = await admin.auth.admin.getUserById(adminId);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!data.user?.email) return Response.json({ ok: false, error: "Admin email not found" }, { status: 404 });

  await sendSystemTestEmail(data.user.email);
  return Response.json({ ok: true });
}
