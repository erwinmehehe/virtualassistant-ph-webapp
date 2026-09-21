"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/account-security";

const sessionIdSchema = z.string().uuid();

export async function revokeOwnSessionAction(formData: FormData) {
  const parsed = sessionIdSchema.safeParse(String(formData.get("session_id") || ""));
  if (!parsed.success) {
    redirect("/workspace/account?tab=security&error=Invalid%20session");
  }

  const supabase = await createClient();
  const [
    { data: userData },
    { data: claimsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);

  const user = userData.user;
  const currentSessionId =
    claimsData?.claims && typeof claimsData.claims.session_id === "string"
      ? claimsData.claims.session_id
      : null;

  if (!user || !currentSessionId) {
    redirect("/auth/login?next=/workspace/account?tab=security");
  }

  const admin = createAdminClient();
  const { data: revoked } = await admin.rpc("revoke_auth_session_for_user", {
    target_user_id: user.id,
    target_session_id: parsed.data,
    current_session_id: currentSessionId,
  });
  if (revoked) {
    try {
      await recordSecurityEvent({
        eventType: "session_revoked",
        metadata: { target_session_id: parsed.data },
      });
    } catch {
      // Session revocation must not fail because audit logging is unavailable.
    }
  }
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
  const supabase = await createClient();
  try {
    await recordSecurityEvent({ eventType: "logout_all" });
  } catch {
    // A logging failure must never block a security action.
  }
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login?message=You%20have%20been%20logged%20out%20on%20all%20devices");
}
