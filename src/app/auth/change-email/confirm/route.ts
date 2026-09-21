import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEventForUser } from "@/lib/account-security";
import { sendAccountEmailChangedNoticeEmail } from "@/lib/email";
import { siteOrigin } from "@/lib/seo-url";

function redirectWith(requestUrl: URL, path: string, key: "message" | "error", value: string) {
  const destination = new URL(path, requestUrl.origin);
  destination.searchParams.set(key, value);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token || token.length < 32 || token.length > 256) {
    return redirectWith(url, "/auth/login", "error", "This email-change link is invalid.");
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data: changeRequest } = await admin
    .from("account_email_change_requests")
    .select("id,user_id,new_email,expires_at,confirmed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!changeRequest || changeRequest.confirmed_at || new Date(changeRequest.expires_at).getTime() <= Date.now()) {
    return redirectWith(url, "/auth/login", "error", "This email-change link has expired or was already used.");
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(changeRequest.user_id);
  if (userError || !userData.user) {
    return redirectWith(url, "/auth/login", "error", "We could not verify the account for this email change.");
  }

  const oldEmail = userData.user.email || null;
  const { error: updateError } = await admin.auth.admin.updateUserById(changeRequest.user_id, {
    email: changeRequest.new_email,
    email_confirm: true,
  });

  if (updateError) {
    const message = /already|registered|exists/i.test(updateError.message)
      ? "That email address is already connected to another account."
      : "We could not finish the email change. Please request a new verification email.";
    return redirectWith(url, "/auth/login", "error", message);
  }

  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("account_email_change_requests")
      .update({ confirmed_at: now })
      .eq("id", changeRequest.id)
      .is("confirmed_at", null),
    admin
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", changeRequest.user_id),
  ]);

  try {
    await recordSecurityEventForUser({
      targetUserId: changeRequest.user_id,
      eventType: "email_changed",
      metadata: {
        old_email: oldEmail,
        new_email: changeRequest.new_email,
      },
    });
  } catch {
    // The verified email change must remain successful if audit logging is unavailable.
  }

  if (oldEmail && oldEmail.toLowerCase() !== changeRequest.new_email.toLowerCase()) {
    try {
      await sendAccountEmailChangedNoticeEmail({
        to: oldEmail,
        newEmail: changeRequest.new_email,
        reviewUrl: `${siteOrigin()}/workspace/account?tab=security`,
      });
    } catch {
      // Do not roll back a verified account email change because a notice could not be delivered.
    }
  }

  return redirectWith(
    url,
    "/workspace/account?tab=account",
    "message",
    "Email address updated. Use the new email the next time you sign in.",
  );
}
