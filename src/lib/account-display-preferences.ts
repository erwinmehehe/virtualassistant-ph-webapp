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

export type AccountDeletionRequestStatus = "pending" | "cancelled" | "reviewing" | "approved" | "rejected";

function normalizeDeletionStatus(value: unknown): AccountDeletionRequestStatus {
  return value === "cancelled" || value === "reviewing" || value === "approved" || value === "rejected"
    ? value
    : "pending";
}

export async function getPendingAccountDeletionRequest(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_deletion_requests")
    .select("status,requested_at,reviewed_at,review_note")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const status = normalizeDeletionStatus(data.status);
  if (status === "cancelled") return null;

  return {
    status,
    requested_at: data.requested_at,
    reviewed_at: data.reviewed_at ?? null,
    review_note: data.review_note ?? null,
  };
}
