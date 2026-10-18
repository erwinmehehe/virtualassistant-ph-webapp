import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// These action and reason values are server-owned. No caller-supplied content,
// browser identifiers, account IDs, email, IP, token or secrets are persisted.
const AUTH_PATHS: Record<string, string> = {
  login: "/auth/login",
  password_reset: "/auth/forgot",
  resend_confirmation: "/auth/login",
  join: "/auth/join",
  training_join: "/auth/join/training",
};

export type AuthChallengeFailure =
  | "incomplete_configuration"
  | "missing_or_malformed_token"
  | "siteverify_http_failure"
  | "siteverify_rejected"
  | "action_mismatch"
  | "hostname_mismatch"
  | "siteverify_request_failed";

export async function recordAuthChallengeFailure(
  action: string | undefined,
  reason: AuthChallengeFailure,
) {
  const path = action && AUTH_PATHS[action];
  if (!path) return;

  try {
    // Best-effort with a strict deadline; a logging outage must never turn
    // a rejected security check into an authenticated request.
    await createAdminClient()
      .from("analytics_events")
      .insert({
        event_name: "auth_security_check_failed",
        path,
        session_id: null,
        user_id: null,
        metadata: { action, reason },
      })
      .abortSignal(AbortSignal.timeout(1_500));
  } catch {
    // Existing [turnstile] logs remain the fallback diagnostic channel.
  }
}
