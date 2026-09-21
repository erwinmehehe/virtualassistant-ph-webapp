"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/account-security";
import { requireAnyRole } from "@/lib/auth";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/seo-url";
import { isDisposableEmail } from "@/lib/disposable-email";
import { sendEmailChangeVerificationEmail } from "@/lib/email";

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


const accountNameSchema = z.string().trim().min(2, "Enter your full name.").max(100, "Keep your name under 100 characters.");

export async function updateAccountProfileAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const parsedName = accountNameSchema.safeParse(String(formData.get("full_name") || ""));
  if (!parsedName.success) {
    redirect(`/workspace/account?tab=account&error=${encodeURIComponent(parsedName.error.issues[0]?.message || "Enter a valid name.")}`);
  }

  const admin = createAdminClient();
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  let nextAvatarUrl = currentProfile?.avatar_url || null;
  let uploadedPath: string | null = null;
  const avatar = formData.get("avatar");

  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 3 * 1024 * 1024) {
      redirect("/workspace/account?tab=account&error=Profile%20photo%20must%20be%203%20MB%20or%20smaller");
    }

    const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMime.has(avatar.type)) {
      redirect("/workspace/account?tab=account&error=Upload%20a%20JPG%2C%20PNG%2C%20or%20WEBP%20photo");
    }

    const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
    uploadedPath = `${user.id}/account-${Date.now()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(uploadedPath, avatar, { upsert: false, contentType: avatar.type });

    if (uploadError) {
      redirect("/workspace/account?tab=account&error=We%20could%20not%20upload%20your%20photo");
    }

    const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(uploadedPath);
    nextAvatarUrl = publicUrl.publicUrl;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name: parsedName.data,
      avatar_url: nextAvatarUrl,
    })
    .eq("id", user.id);

  if (updateError) {
    if (uploadedPath) {
      await admin.storage.from("avatars").remove([uploadedPath]);
    }
    redirect("/workspace/account?tab=account&error=We%20could%20not%20save%20your%20profile");
  }

  if (uploadedPath && currentProfile?.avatar_url && currentProfile.avatar_url !== nextAvatarUrl) {
    const previousPath = currentProfile.avatar_url.split("/avatars/")[1];
    if (previousPath) {
      await admin.storage.from("avatars").remove([previousPath]);
    }
  }

  try {
    await recordSecurityEvent({ eventType: "profile_updated" });
  } catch {
    // Profile updates remain successful if security activity logging is unavailable.
  }

  revalidatePath("/workspace/account");
  revalidatePath("/workspace/admin");
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/client");
  revalidatePath("/workspace/va");
  redirect("/workspace/account?tab=account&saved=1");
}


const accountEmailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export async function requestAccountEmailChangeAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const parsedEmail = accountEmailSchema.safeParse(String(formData.get("new_email") || ""));
  if (!parsedEmail.success) {
    redirect(`/workspace/account?tab=account&error=${encodeURIComponent(parsedEmail.error.issues[0]?.message || "Enter a valid email address.")}`);
  }

  const newEmail = parsedEmail.data;
  if (newEmail === user.email?.trim().toLowerCase()) {
    redirect("/workspace/account?tab=account&error=That%20is%20already%20your%20account%20email");
  }
  if (isDisposableEmail(newEmail)) {
    redirect("/workspace/account?tab=account&error=Please%20use%20a%20permanent%20email%20address");
  }

  try {
    await enforceActionRateLimit("account_email_change", user.id, 3, 60);
  } catch (error) {
    if (typeof (error as { digest?: unknown })?.digest === "string" && String((error as { digest: string }).digest).startsWith("NEXT_")) {
      throw error;
    }
    redirect("/workspace/account?tab=account&error=Too%20many%20email-change%20requests.%20Please%20try%20again%20later");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();

  await admin
    .from("account_email_change_requests")
    .delete()
    .eq("user_id", user.id)
    .is("confirmed_at", null);

  const { data: changeRequest, error: insertError } = await admin
    .from("account_email_change_requests")
    .insert({
      user_id: user.id,
      new_email: newEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !changeRequest) {
    redirect("/workspace/account?tab=account&error=We%20could%20not%20start%20the%20email%20change");
  }

  const actionUrl = `${siteOrigin()}/auth/change-email/confirm?token=${encodeURIComponent(token)}`;
  let delivery: Awaited<ReturnType<typeof sendEmailChangeVerificationEmail>>;
  try {
    delivery = await sendEmailChangeVerificationEmail({ to: newEmail, actionUrl });
  } catch {
    await admin.from("account_email_change_requests").delete().eq("id", changeRequest.id);
    redirect("/workspace/account?tab=account&error=We%20could%20not%20send%20the%20verification%20email");
  }

  if (!delivery.sent) {
    await admin.from("account_email_change_requests").delete().eq("id", changeRequest.id);
    redirect("/workspace/account?tab=account&error=We%20could%20not%20send%20the%20verification%20email");
  }

  try {
    await recordSecurityEvent({
      eventType: "email_change_requested",
      metadata: { new_email: newEmail },
    });
  } catch {
    // Email verification is already underway; audit logging is best-effort.
  }

  revalidatePath("/workspace/account");
  redirect(`/workspace/account?tab=account&message=${encodeURIComponent(`Verification sent to ${newEmail}. Your current email stays active until you confirm the new one.`)}`);
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const enabled = (name: string) => String(formData.get(name) || "") === "on";
  const supabase = await createClient();

  const { error } = await supabase
    .from("account_notification_preferences")
    .upsert({
      user_id: user.id,
      hiring_updates: enabled("hiring_updates"),
      booking_reminders: enabled("booking_reminders"),
      candidate_activity: enabled("candidate_activity"),
      product_emails: enabled("product_emails"),
      security_alerts: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    redirect("/workspace/account?tab=notifications&error=We%20could%20not%20save%20your%20notification%20preferences");
  }

  revalidatePath("/workspace/account");
  redirect("/workspace/account?tab=notifications&message=Notification%20preferences%20saved");
}


const accountDisplayPreferencesSchema = z.object({
  timezone: z.string().trim().min(1).max(100),
  date_format: z.enum(["medium", "short"]),
  time_format: z.enum(["12h", "24h"]),
});

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function updateAccountDisplayPreferencesAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const parsed = accountDisplayPreferencesSchema.safeParse({
    timezone: String(formData.get("timezone") || ""),
    date_format: String(formData.get("date_format") || ""),
    time_format: String(formData.get("time_format") || ""),
  });

  if (!parsed.success || !isValidTimeZone(parsed.data.timezone)) {
    redirect("/workspace/account?tab=preferences&error=Choose%20a%20valid%20timezone%20and%20display%20format");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("account_display_preferences")
    .upsert({
      user_id: user.id,
      timezone: parsed.data.timezone,
      date_format: parsed.data.date_format,
      time_format: parsed.data.time_format,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    redirect("/workspace/account?tab=preferences&error=We%20could%20not%20save%20your%20display%20preferences");
  }

  revalidatePath("/workspace/account");
  redirect("/workspace/account?tab=preferences&message=Display%20preferences%20saved");
}

const deletionConfirmationSchema = z.literal("DELETE MY ACCOUNT");

export async function requestAccountDeletionAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const confirmation = deletionConfirmationSchema.safeParse(String(formData.get("confirmation") || "").trim());

  if (!confirmation.success) {
    redirect("/workspace/account?tab=privacy&error=Type%20DELETE%20MY%20ACCOUNT%20to%20confirm%20the%20request");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("account_deletion_requests")
    .upsert({
      user_id: user.id,
      status: "pending",
      requested_at: now,
      updated_at: now,
    }, { onConflict: "user_id" });

  if (error) {
    redirect("/workspace/account?tab=privacy&error=We%20could%20not%20submit%20your%20account%20deletion%20request");
  }

  revalidatePath("/workspace/account");
  redirect("/workspace/account?tab=privacy&message=Account%20deletion%20request%20submitted%20for%20review");
}
