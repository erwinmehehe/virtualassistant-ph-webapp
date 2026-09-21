import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AccountDisplayPreferences = {
  timezone: string;
  date_format: "medium" | "short";
  time_format: "12h" | "24h";
};

export const DEFAULT_ACCOUNT_DISPLAY_PREFERENCES: AccountDisplayPreferences = {
  timezone: "UTC",
  date_format: "medium",
  time_format: "12h",
};

function normalizeDateFormat(value: unknown): AccountDisplayPreferences["date_format"] {
  return value === "short" ? "short" : "medium";
}

function normalizeTimeFormat(value: unknown): AccountDisplayPreferences["time_format"] {
  return value === "24h" ? "24h" : "12h";
}

export async function getAccountDisplayPreferences(userId: string): Promise<AccountDisplayPreferences> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_display_preferences")
    .select("timezone,date_format,time_format")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_ACCOUNT_DISPLAY_PREFERENCES;

  return {
    timezone: typeof data.timezone === "string" && data.timezone.trim()
      ? data.timezone
      : DEFAULT_ACCOUNT_DISPLAY_PREFERENCES.timezone,
    date_format: normalizeDateFormat(data.date_format),
    time_format: normalizeTimeFormat(data.time_format),
  };
}

export async function getPendingAccountDeletionRequest(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_deletion_requests")
    .select("status,requested_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!data) return null;

  return {
    status: "pending" as const,
    requested_at: data.requested_at,
  };
}
