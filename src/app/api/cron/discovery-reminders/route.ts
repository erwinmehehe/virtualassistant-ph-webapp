import { bookingManageUrl, createBookingManageToken, recreateBookingManageToken } from "@/lib/booking-operations";
import { formatDiscoverySlot } from "@/lib/discovery-booking";
import { sendDiscoveryReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReminderWindow = "24h" | "1h";
type ReminderField = "discovery_reminder_24h_sent_at" | "discovery_reminder_1h_sent_at";

const RETRIABLE_EMAIL_REASONS = new Set([
  "email_not_configured",
  "suppression_lookup_failed",
  "quota_lookup_failed",
  "daily_quota_reserved",
]);

async function isAuthorized(request: Request, admin: ReturnType<typeof createAdminClient>) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (expectedSecret && authorization === `Bearer ${expectedSecret}`) return true;

  const schedulerToken = request.headers.get("x-discovery-cron-token")?.trim();
  if (!schedulerToken) return false;
  const { data, error } = await admin.rpc("verify_discovery_reminder_cron_token", { candidate: schedulerToken });
  return !error && data === true;
}

function reminderField(window: ReminderWindow): ReminderField {
  return window === "1h" ? "discovery_reminder_1h_sent_at" : "discovery_reminder_24h_sent_at";
}

async function claimDiscoveryReminder(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
  window: ReminderWindow,
) {
  const field = reminderField(window);
  const claimAt = new Date().toISOString();
  const { data, error } = await admin
    .from("lead_intake")
    .update({ [field]: claimAt })
    .eq("id", leadId)
    .is(field, null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data?.id ? claimAt : null;
}

async function releaseDiscoveryReminderClaim(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
  window: ReminderWindow,
  claimAt: string,
) {
  const field = reminderField(window);
  const { error } = await admin
    .from("lead_intake")
    .update({ [field]: null })
    .eq("id", leadId)
    .eq(field, claimAt);
  if (error) {
    console.error("[discovery-reminders] Could not release failed reminder claim", {
      leadId,
      window,
      error: error.message,
    });
  }
}

async function ensureManageCapability(
  admin: ReturnType<typeof createAdminClient>,
  lead: {
    id: string;
    discovery_manage_token_hash?: string | null;
    discovery_manage_token_id?: string | null;
    discovery_manage_token_expires_at?: string | null;
  },
) {
  let manage = recreateBookingManageToken(
    lead.discovery_manage_token_id,
    lead.discovery_manage_token_expires_at,
  );

  if (manage && manage.hash === lead.discovery_manage_token_hash) return manage;

  manage = createBookingManageToken();
  const { error } = await admin
    .from("lead_intake")
    .update({
      discovery_manage_token: null,
      discovery_manage_token_hash: manage.hash,
      discovery_manage_token_id: manage.tokenId,
      discovery_manage_token_expires_at: manage.expiresAt,
    })
    .eq("id", lead.id);
  if (error) throw error;
  return manage;
}

export async function GET(request: Request) {
  const admin = createAdminClient();
  if (!(await isAuthorized(request, admin))) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const lower = new Date(now + 30 * 60 * 1000).toISOString();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await admin
    .from("lead_intake")
    .select(
      "id,name,email,timezone,discovery_scheduled_at,discovery_meeting_url,discovery_manage_token_hash,discovery_manage_token_id,discovery_manage_token_expires_at,discovery_reminder_24h_sent_at,discovery_reminder_1h_sent_at",
    )
    .not("discovery_scheduled_at", "is", null)
    .is("discovery_completed_at", null)
    .is("discovery_cancelled_at", null)
    .gte("discovery_scheduled_at", lower)
    .lte("discovery_scheduled_at", upper)
    .limit(300);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let reminder24h = 0;
  let reminder1h = 0;
  let claimedElsewhere = 0;

  for (const lead of leads || []) {
    if (!lead.email || !lead.discovery_scheduled_at) continue;

    const minutesUntil = (new Date(lead.discovery_scheduled_at).getTime() - now) / 60_000;
    const window: ReminderWindow | null =
      minutesUntil >= 30 && minutesUntil <= 90 && !lead.discovery_reminder_1h_sent_at
        ? "1h"
        : minutesUntil >= 23 * 60 && minutesUntil <= 25 * 60 && !lead.discovery_reminder_24h_sent_at
          ? "24h"
          : null;
    if (!window) continue;

    const claimAt = await claimDiscoveryReminder(admin, lead.id, window);
    if (!claimAt) {
      claimedElsewhere += 1;
      continue;
    }

    try {
      const manage = await ensureManageCapability(admin, lead);
      const scheduledLabel = formatDiscoverySlot(
        lead.discovery_scheduled_at,
        lead.timezone || "Asia/Manila",
      );
      const result = await sendDiscoveryReminderEmail({
        leadId: lead.id,
        to: lead.email,
        clientName: lead.name,
        scheduledLabel,
        meetingUrl: lead.discovery_meeting_url,
        manageUrl: bookingManageUrl(manage.token),
        window,
      });

      if (!result.sent) {
        if (result.reason && RETRIABLE_EMAIL_REASONS.has(result.reason)) {
          await releaseDiscoveryReminderClaim(admin, lead.id, window, claimAt);
        }
        continue;
      }

      if (window === "1h") reminder1h += 1;
      else reminder24h += 1;
    } catch (sendError) {
      await releaseDiscoveryReminderClaim(admin, lead.id, window, claimAt);
      console.error("[discovery-reminders] Reminder send failed", {
        leadId: lead.id,
        window,
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  }

  return Response.json({
    ok: true,
    checked: leads?.length || 0,
    reminder24h,
    reminder1h,
    claimedElsewhere,
  });
}
