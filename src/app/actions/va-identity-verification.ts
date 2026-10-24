"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  diditConfiguration,
  IDV_CONSENT_VERSION,
  IDV_STATUS_PATH,
  isExpectedDiditRedirect,
} from "@/lib/va-identity-verification";

/**
 * Explicit, purpose-specific consent is recorded before the external provider
 * is asked to process an ID or selfie. Only the provider captures those files.
 * This action must not be invoked from signup, marketing, or training pages.
 */
export async function startVaIdentityVerificationAction(formData: FormData) {
  const { user } = await requireRole("va");
  const config = diditConfiguration();
  if (!config) redirect(`${IDV_STATUS_PATH}?notice=unavailable`);
  if (formData.get("identity_consent") !== "yes") {
    redirect(`${IDV_STATUS_PATH}?notice=consent`);
  }

  const admin = createAdminClient();
  const [{ data: profile, error: profileError }, { data: previous, error: ledgerError }] =
    await Promise.all([
      admin.from("profiles").select("role,identity_verified_at").eq("id", user.id).single(),
      admin.from("va_identity_checks")
        .select("status,last_started_at,attempt_count,attempt_day")
        .eq("user_id", user.id).maybeSingle(),
    ]);
  if (profileError || ledgerError || profile?.role !== "va") {
    redirect(`${IDV_STATUS_PATH}?notice=unavailable`);
  }
  if (profile.identity_verified_at || previous?.status === "verified") {
    redirect(IDV_STATUS_PATH);
  }
  if (previous?.status === "needs_review") {
    redirect(`${IDV_STATUS_PATH}?notice=review`);
  }

  const now = Date.now();
  const lastStartedMs = previous?.last_started_at ? Date.parse(previous.last_started_at) : 0;
  if (lastStartedMs && Number.isFinite(lastStartedMs) && now - lastStartedMs < 30_000) {
    redirect(`${IDV_STATUS_PATH}?notice=too_soon`);
  }
  const today = new Date(now).toISOString().slice(0, 10);
  const attempts = previous?.attempt_day === today ? Number(previous.attempt_count || 0) : 0;
  if (attempts >= 5) redirect(`${IDV_STATUS_PATH}?notice=limit`);

  // The authorization, narrow consent purpose and capped attempt count are
  // server-controlled; no user ID, result status or provider URL is accepted
  // from the submitted form.
  const { error: consentError } = await admin.from("va_identity_checks").upsert({
    user_id: user.id,
    provider: "didit",
    session_id: null,
    status: "initiating",
    consent_version: IDV_CONSENT_VERSION,
    consented_at: new Date(now).toISOString(),
    last_started_at: new Date(now).toISOString(),
    attempt_day: today,
    attempt_count: attempts + 1,
    last_event_id: null,
    last_provider_created_at: 0,
    verified_at: null,
    updated_at: new Date(now).toISOString(),
  }, { onConflict: "user_id" });
  if (consentError) redirect(`${IDV_STATUS_PATH}?notice=unavailable`);

  let destination: string | null = null;
  let sessionId: string | null = null;
  try {
    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
      body: JSON.stringify({
        workflow_id: config.workflowId,
        vendor_data: user.id,
        callback: config.callback,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (response.ok) {
      const result = await response.json() as { url?: unknown; session_id?: unknown };
      if (isExpectedDiditRedirect(result.url) &&
        typeof result.session_id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(result.session_id)) {
        destination = result.url;
        sessionId = result.session_id;
      }
    }
  } catch {
    // Never log identity material, provider response bodies or session URLs.
  }

  if (!destination || !sessionId) {
    await admin.from("va_identity_checks").update({
      status: "error", updated_at: new Date().toISOString(),
    }).eq("user_id", user.id).eq("status", "initiating");
    redirect(`${IDV_STATUS_PATH}?notice=unavailable`);
  }

  const { error: sessionSaveError } = await admin.from("va_identity_checks")
    .update({ session_id: sessionId, status: "pending", updated_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("status", "initiating");
  if (sessionSaveError) {
    // An orphaned provider session must never grant a verified badge.
    redirect(`${IDV_STATUS_PATH}?notice=unavailable`);
  }
  revalidatePath(IDV_STATUS_PATH);
  redirect(destination);
}
