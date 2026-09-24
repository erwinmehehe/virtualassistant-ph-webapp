import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceActionRateLimit(actionKey: string, subject: string, maxAttempts: number, windowMinutes: number) {
  const normalized = subject.trim().toLowerCase();
  if (!normalized) return;

  const subjectHash = createHash("sha256").update(normalized).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_action_rate_limit", {
    p_action_key: actionKey,
    p_subject_hash: subjectHash,
    p_max_attempts: maxAttempts,
    p_window_seconds: Math.max(1, Math.round(windowMinutes * 60)),
  });

  if (error) {
    console.error("[rate-limit] atomic limiter failed", { actionKey, code: error.code });
    throw new Error("We could not verify this request safely. Please try again.");
  }
  if (!data) throw new Error("Too many attempts. Please wait a few minutes and try again.");
}

export async function requestIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown";
  return forwarded.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

export async function enforceIpRateLimit(
  actionKey: string,
  maxPerIp: number,
  windowMinutes: number,
) {
  const ip = await requestIp();
  // Local previews/tests and unusual proxy paths can legitimately lack a
  // trustworthy client IP. Never collapse all such traffic into one shared
  // "unknown" bucket; other subject/session limits still apply.
  if (ip === "unknown") return;
  await enforceActionRateLimit(`${actionKey}:ip`, ip, maxPerIp, windowMinutes);
}

export async function enforceEmailAndIpRateLimit(
  actionKey: string,
  email: string,
  maxPerEmail: number,
  maxPerIp: number,
  windowMinutes: number,
) {
  await enforceActionRateLimit(`${actionKey}:email`, email, maxPerEmail, windowMinutes);
  await enforceIpRateLimit(actionKey, maxPerIp, windowMinutes);
}
