"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent, requireSensitiveAal2 } from "@/lib/account-security";

const sessionIdSchema = z.string().uuid();
const factorIdSchema = z.string().uuid();

export async function revokeOwnSessionAction(formData: FormData) {
  const parsed = sessionIdSchema.safeParse(String(formData.get("session_id") || ""));
  if (!parsed.success) {
    redirect("/workspace/account?tab=security&error=Invalid%20session");
  }

  const supabase = await createClient();
  await supabase.rpc("revoke_own_auth_session", { target_session_id: parsed.data });
  redirect("/workspace/account?tab=security");
}

export async function logoutOtherDevicesAction() {
  const supabase = await createClient();
  try {
    await recordSecurityEvent({ eventType: "logout_others" });
  } catch {
    // A logging failure must never block a security action.
  }
  await supabase.auth.signOut({ scope: "others" });
  redirect("/workspace/account?tab=security&message=Other%20devices%20were%20signed%20out");
}

export async function logoutEverywhereAction() {
  await requireSensitiveAal2("/workspace/account?tab=security");
  const supabase = await createClient();
  try {
    await recordSecurityEvent({ eventType: "logout_all" });
  } catch {
    // A logging failure must never block a security action.
  }
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login?message=You%20have%20been%20logged%20out%20on%20all%20devices");
}


export async function confirmMfaEnrollmentStartedAction(factorId: string) {
  const parsed = factorIdSchema.safeParse(factorId);
  if (!parsed.success) throw new Error("Authenticator setup could not be verified.");

  const supabase = await createClient();
  const [{ data: userData }, { data: factors }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (!userData.user) throw new Error("Sign in again to continue.");
  const factor = (factors?.totp ?? []).find((item) => item.id === parsed.data);
  if (!factor) throw new Error("Authenticator setup could not be verified.");

  try {
    await recordSecurityEvent({
      eventType: "totp_enrollment_started",
      metadata: { factor_id: parsed.data },
    });
  } catch {
    // Audit logging must not strand a valid enrollment.
  }
}

export async function confirmMfaEnabledAction() {
  const supabase = await createClient();
  const [
    { data: userData },
    { data: aal },
    { data: factors },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (!userData.user) throw new Error("Sign in again to continue.");
  const verifiedFactors = (factors?.totp ?? []).filter((factor) => factor.status === "verified");
  const currentLevel = aal?.currentLevel ?? "aal1";
  if (verifiedFactors.length === 0 || currentLevel !== "aal2") {
    throw new Error("Two-factor authentication could not be confirmed.");
  }

  try {
    await recordSecurityEvent({
      eventType: "totp_enabled",
      metadata: { factor_count: verifiedFactors.length },
    });
  } catch {
    // Audit logging must not invalidate a successful MFA enrollment.
  }

  revalidatePath("/workspace/account");
  return { enabled: true as const };
}

export async function removeTotpFactorAction(formData: FormData) {
  const parsed = factorIdSchema.safeParse(String(formData.get("factor_id") || ""));
  if (!parsed.success) redirect("/workspace/account?tab=security&error=Invalid%20authenticator");

  await requireSensitiveAal2("/workspace/account?tab=security");

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = (factors?.totp ?? []).find(
    (item) => item.id === parsed.data && item.status === "verified",
  );
  if (!factor) redirect("/workspace/account?tab=security&error=Authenticator%20not%20found");

  const { error } = await supabase.auth.mfa.unenroll({ factorId: parsed.data });
  if (error) redirect("/workspace/account?tab=security&error=Could%20not%20remove%20authenticator");

  try {
    await recordSecurityEvent({
      eventType: "totp_factor_removed",
      metadata: { factor_id: parsed.data },
    });
  } catch {
    // Factor removal must not fail because audit logging is unavailable.
  }

  revalidatePath("/workspace/account");
  redirect("/workspace/account?tab=security&message=Authenticator%20removed");
}
