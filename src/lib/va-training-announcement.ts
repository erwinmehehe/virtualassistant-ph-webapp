import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEventEmail } from "@/lib/email";

export const VA_TRAINING_EVENT_TYPE = "product_training_launch";

export async function sendVaTrainingAnnouncementBatch(maxSends = 20) {
  const admin = createAdminClient();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id,full_name")
    .eq("role", "va")
    .eq("account_status", "active")
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;

  const { data: sentEvents } = await admin
    .from("outbound_email_events")
    .select("idempotency_key")
    .eq("event_type", VA_TRAINING_EVENT_TYPE)
    .in("status", ["sending", "sent", "delivered"])
    .limit(1000);

  const done = new Set((sentEvents || []).map((row: any) => String(row.idempotency_key || "")).filter(Boolean));
  let sent = 0;
  let skipped = 0;
  let quotaReached = false;

  for (const profile of profiles || []) {
    if (sent >= maxSends) break;
    const idempotencyKey = `free-training-launch-${profile.id}`;
    if (done.has(idempotencyKey)) continue;

    const { data: authData } = await admin.auth.admin.getUserById(profile.id);
    const email = authData.user?.email?.trim();
    const verified = Boolean(authData.user?.email_confirmed_at || authData.user?.confirmed_at);
    if (!email || !verified) {
      skipped += 1;
      continue;
    }

    const result = await sendTransactionalEventEmail({
      to: email,
      firstName: profile.full_name,
      subject: "Free VA Training Is Now Available on VirtualAssistant.com.ph",
      heading: "Free VA training is now available",
      body: "You now have free access to the full VirtualAssistant.com.ph training library. Build practical skills with realistic workflows, complete assessments, and earn certificates at your own pace.",
      href: `${appUrl}/workspace/training`,
      hrefLabel: "Start free training",
      senderName: "VirtualAssistant.com.ph",
      teamLabel: "VA training",
      footerText: "You are receiving this because you have an active Virtual Assistant account. You can change optional email preferences in Account settings.",
      eventType: VA_TRAINING_EVENT_TYPE,
      idempotencyKey,
      priority: "low",
    });

    if (result.sent) {
      sent += 1;
      done.add(idempotencyKey);
      continue;
    }
    if (result.reason === "daily_quota_reserved" || result.reason === "quota_lookup_failed") {
      quotaReached = true;
      break;
    }
    skipped += 1;
  }

  return { checked: profiles?.length || 0, sent, skipped, quotaReached };
}
