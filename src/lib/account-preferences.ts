import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AccountNotificationPreferences = {
  hiring_updates: boolean;
  booking_reminders: boolean;
  candidate_activity: boolean;
  product_emails: boolean;
  security_alerts: true;
};

export const DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES: AccountNotificationPreferences = {
  hiring_updates: true,
  booking_reminders: true,
  candidate_activity: true,
  product_emails: false,
  security_alerts: true,
};

export async function getAccountNotificationPreferences(userId: string): Promise<AccountNotificationPreferences> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_notification_preferences")
    .select("hiring_updates,booking_reminders,candidate_activity,product_emails,security_alerts")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES;

  return {
    hiring_updates: data.hiring_updates !== false,
    booking_reminders: data.booking_reminders !== false,
    candidate_activity: data.candidate_activity !== false,
    product_emails: data.product_emails === true,
    security_alerts: true,
  };
}

export async function getPendingEmailChange(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_email_change_requests")
    .select("new_email,expires_at,created_at")
    .eq("user_id", userId)
    .is("confirmed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
