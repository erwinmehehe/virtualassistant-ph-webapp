"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/account-security";
import { requireAnyRole } from "@/lib/auth";

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
