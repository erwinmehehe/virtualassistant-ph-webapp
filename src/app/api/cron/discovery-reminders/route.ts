import { bookingManageUrl } from "@/lib/booking-operations";
import { formatDiscoverySlot } from "@/lib/discovery-booking";
import { sendDiscoveryReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const admin = createAdminClient();
  const now = Date.now();
  const { data: leads, error } = await admin.from("lead_intake")
    .select("id,name,email,timezone,discovery_scheduled_at,discovery_meeting_url,discovery_manage_token,discovery_reminder_24h_sent_at,discovery_reminder_1h_sent_at")
    .not("discovery_scheduled_at", "is", null).is("discovery_completed_at", null).is("discovery_cancelled_at", null)
    .gte("discovery_scheduled_at", new Date(now).toISOString()).lte("discovery_scheduled_at", new Date(now + 25 * 3600000).toISOString()).limit(100);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  let sent = 0;
  for (const lead of leads || []) {
    if (!lead.discovery_manage_token) continue;
    const hours = (new Date(lead.discovery_scheduled_at).getTime() - now) / 3600000;
    const window = !lead.discovery_reminder_1h_sent_at && hours <= 2 ? "1h" : !lead.discovery_reminder_24h_sent_at && hours > 2 && hours <= 25 ? "24h" : null;
    if (!window) continue;
    const result = await sendDiscoveryReminderEmail({ to: lead.email, clientName: lead.name, scheduledLabel: formatDiscoverySlot(lead.discovery_scheduled_at, lead.timezone || "Asia/Manila"), meetingUrl: lead.discovery_meeting_url, manageUrl: bookingManageUrl(lead.discovery_manage_token), window });
    if (result.sent) {
      await admin.from("lead_intake").update(window === "1h" ? { discovery_reminder_1h_sent_at: new Date().toISOString() } : { discovery_reminder_24h_sent_at: new Date().toISOString() }).eq("id", lead.id);
      sent += 1;
    }
  }
  return Response.json({ ok: true, checked: leads?.length || 0, sent });
}
