import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceActionRateLimit(actionKey: string, subject: string, maxAttempts: number, windowMinutes: number) {
  const normalized = subject.trim().toLowerCase();
  if (!normalized) return;

  const subjectHash = createHash("sha256").update(normalized).digest("hex");
  const admin = createAdminClient();
  const { data: allowed, error } = await admin.rpc("consume_action_rate_limit", {
    p_action_key: actionKey,
    p_subject_hash: subjectHash,
    p_max_attempts: maxAttempts,
    p_window_seconds: Math.max(1, Math.round(windowMinutes * 60))
  });

  if (error) {
    console.error("[rate-limit] atomic limiter failed", {
      actionKey,
      code: error.code || null,
      message: error.message
    });
    throw new Error("We could not verify this request safely. Please try again in a few minutes.");
  }

  if (!allowed) {
    throw new Error("Too many attempts. Please wait a few minutes and try again.");
  }
}
