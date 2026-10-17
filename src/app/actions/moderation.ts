"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { writeAdminAudit } from "@/lib/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";

type ModerationAdmin = ReturnType<typeof createAdminClient>;

function authBanIsCurrent(bannedUntil: string | null | undefined) {
  const until = bannedUntil ? Date.parse(bannedUntil) : Number.NaN;
  return Number.isFinite(until) && until > Date.now();
}

// A successful Auth API request alone is not proof that the intended ban state
// was persisted. Return null on provider errors instead of assuming success.
async function readAuthBanState(admin: ModerationAdmin, userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      console.error("[moderation] auth ban state could not be checked", { code: error?.code || "unavailable" });
      return null;
    }
    return authBanIsCurrent(data.user.banned_until);
  } catch {
    console.error("[moderation] auth ban state request failed");
    return null;
  }
}

async function setAuthBanState(admin: ModerationAdmin, userId: string, banned: boolean) {
  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? "876000h" : "none",
    });
    if (error) {
      console.error("[moderation] auth ban update failed", { code: error.code || "unknown" });
      return false;
    }
    const confirmed = await readAuthBanState(admin, userId);
    if (confirmed !== banned) {
      console.error("[moderation] auth ban state did not verify", { requested: banned });
      return false;
    }
    return true;
  } catch {
    console.error("[moderation] auth ban update request failed");
    return false;
  }
}

async function loadModerationTarget(admin: ModerationAdmin, actorId: string, targetId: string) {
  if (!targetId || targetId === actorId) throw new Error("You cannot moderate this account.");
  const { data, error } = await admin.from("profiles")
    .select("id,role,account_status")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) throw new Error("Account could not be found.");
  if (data.role === "admin") throw new Error("Admin accounts need a separate access-review procedure.");
  return data;
}

function revalidateModeration() {
  revalidatePath("/workspace/admin/moderation");
  revalidatePath("/workspace/admin/users");
}

export async function banUserAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const flagId = String(formData.get("flag_id") ?? "").trim();
  if (!reason || reason.length < 5) throw new Error("Add a short reason for the ban record.");

  const admin = createAdminClient();
  await loadModerationTarget(admin, user.id, userId);
  const { data: updated, error: profileError } = await admin.from("profiles").update({
    account_status: "banned",
    banned_at: new Date().toISOString(),
    banned_reason: reason,
    banned_by: user.id,
  }).eq("id", userId).select("id").maybeSingle();
  if (profileError || !updated) throw new Error("VAPH could not suspend this account.");

  // Profile enforcement blocks protected VAPH actions immediately. A failed
  // provider-side ban must remain visible for manual reconciliation, not be
  // swallowed or misreported as an Auth-level ban.
  const authBanVerified = await setAuthBanState(admin, userId, true);
  if (flagId) {
    const { error: flagError } = await admin.from("message_flags")
      .update({ status: "actioned", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", flagId);
    if (flagError) console.error("[moderation] could not mark reviewed flag", { code: flagError.code });
  }

  await writeAdminAudit({
    actorId: user.id, action: "user_banned", targetType: "user", targetId: userId,
    metadata: { reason, flag_id: flagId || null, auth_ban_verified: authBanVerified },
  });
  revalidateModeration();
  if (!authBanVerified) {
    throw new Error("VAPH blocked the account, but the Supabase Auth ban is not confirmed. Use Verify / retry Auth ban.");
  }
}

export async function reconcileBannedUserAuthAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "").trim();
  const admin = createAdminClient();
  const profile = await loadModerationTarget(admin, user.id, userId);
  if (profile.account_status !== "banned") throw new Error("Only already-banned accounts may be reconciled.");

  // Idempotent: inspect before writing, and never restrict an active profile.
  const verified = (await readAuthBanState(admin, userId)) === true
    || await setAuthBanState(admin, userId, true);
  await writeAdminAudit({
    actorId: user.id,
    action: verified ? "user_auth_ban_reconciled" : "user_auth_ban_reconciliation_failed",
    targetType: "user",
    targetId: userId,
    metadata: { auth_ban_verified: verified },
  });
  revalidateModeration();
  if (!verified) throw new Error("Auth ban could not be confirmed. Keep the account blocked and investigate provider status.");
}

export async function unbanUserAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "").trim();
  const admin = createAdminClient();
  const profile = await loadModerationTarget(admin, user.id, userId);
  if (profile.account_status !== "banned") throw new Error("This account is not banned.");

  // Unban Auth first: if the provider fails, keep the VAPH restriction in
  // place instead of reporting a restored account that still cannot sign in.
  const authUnbanVerified = await setAuthBanState(admin, userId, false);
  if (!authUnbanVerified) {
    await writeAdminAudit({
      actorId: user.id, action: "user_auth_unban_failed", targetType: "user", targetId: userId,
      metadata: { auth_unban_verified: false },
    });
    throw new Error("Supabase Auth unban was not confirmed. This account remains blocked in VAPH.");
  }

  const { data: updated, error: profileError } = await admin.from("profiles").update({
    account_status: "active",
    banned_at: null,
    banned_reason: null,
    banned_by: null,
  }).eq("id", userId).eq("account_status", "banned").select("id").maybeSingle();
  if (profileError || !updated) {
    await writeAdminAudit({
      actorId: user.id, action: "user_profile_unban_failed", targetType: "user", targetId: userId,
      metadata: { auth_unban_verified: true },
    });
    throw new Error("Auth was unbanned, but the VAPH profile could not be restored. Recheck the account.");
  }

  await writeAdminAudit({
    actorId: user.id, action: "user_unbanned", targetType: "user", targetId: userId,
    metadata: { auth_unban_verified: true },
  });
  revalidateModeration();
}

export async function dismissFlagAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const flagId = String(formData.get("flag_id") ?? "");
  if (!flagId) throw new Error("Missing flag.");
  const admin = createAdminClient();
  const { error } = await admin.from("message_flags")
    .update({ status: "dismissed", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", flagId);
  if (error) throw new Error("The moderation flag could not be dismissed.");
  await writeAdminAudit({ actorId: user.id, action: "message_flag_dismissed", targetType: "message_flag", targetId: flagId });
  revalidatePath("/workspace/admin/moderation");
}
