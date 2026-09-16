import { bookingManageUrl } from "@/lib/booking-operations";
import { formatDiscoverySlot } from "@/lib/discovery-booking";
import { sendDiscoveryReminderEmail } from "@/lib/email";
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
  if (!(await isAuthorized(request, admin))) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const lower = new Date(now + 30 * 60 * 1000).toISOString();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await admin.from("lead_intake")
    .select("id,name,email,timezone,discovery_scheduled_at,discovery_meeting_url,discovery_manage_token,discovery_reminder_24h_sent_at,discovery_reminder_1h_sent_at")
    .not("discovery_scheduled_at", "is", null)
    .is("discovery_completed_at", null)
    .is("discovery_cancelled_at", null)
    .gte("discovery_scheduled_at", lower)
    .lte("discovery_scheduled_at", upper)
    .limit(300);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let reminder24h = 0;
  let reminder1h = 0;
  for (const lead of leads || []) {
    if (!lead.email || !lead.discovery_scheduled_at || !lead.discovery_manage_token) continue;
    const minutesUntil = (new Date(lead.discovery_scheduled_at).getTime() - now) / 60_000;
    const scheduledLabel = formatDiscoverySlot(lead.discovery_scheduled_at, lead.timezone || "Asia/Manila");
    const manageUrl = bookingManageUrl(lead.discovery_manage_token);

    if (minutesUntil >= 30 && minutesUntil <= 90 && !lead.discovery_reminder_1h_sent_at) {
      const result = await sendDiscoveryReminderEmail({
        to: lead.email,
        clientName: lead.name,
        scheduledLabel,
        meetingUrl: lead.discovery_meeting_url,
        manageUrl,
        window: "1h",
      });
      if (result.sent) {
        await admin.from("lead_intake")
          .update({ discovery_reminder_1h_sent_at: new Date().toISOString() })
          .eq("id", lead.id)
          .is("discovery_reminder_1h_sent_at", null);
        reminder1h += 1;
      }
      continue;
    }

    if (minutesUntil >= 23 * 60 && minutesUntil <= 25 * 60 && !lead.discovery_reminder_24h_sent_at) {
      const result = await sendDiscoveryReminderEmail({
        to: lead.email,
        clientName: lead.name,
        scheduledLabel,
        meetingUrl: lead.discovery_meeting_url,
        manageUrl,
        window: "24h",
      });
      if (result.sent) {
        await admin.from("lead_intake")
          .update({ discovery_reminder_24h_sent_at: new Date().toISOString() })
          .eq("id", lead.id)
          .is("discovery_reminder_24h_sent_at", null);
        reminder24h += 1;
      }
    }
  }

  return Response.json({ ok: true, checked: leads?.length || 0, reminder24h, reminder1h });
}
