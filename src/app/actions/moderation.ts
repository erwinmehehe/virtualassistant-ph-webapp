"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function banUserAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const flagId = String(formData.get("flag_id") ?? "");
  if (!userId) throw new Error("Missing account to ban.");
  if (!reason || reason.length < 5) throw new Error("Add a short reason for the ban record.");

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin.from("profiles").select("id,role").eq("id", userId).maybeSingle();
  if (targetError) throw targetError;
  if (!target) throw new Error("Account not found.");
  if (!["client", "va"].includes(String(target.role))) {
    throw new Error("Anti-circumvention moderation can only ban client or VA accounts.");
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").update({
    account_status: "banned",
    banned_at: now,
    banned_reason: reason,
    banned_by: user.id
  }).eq("id", userId);
  if (profileError) throw profileError;

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (authError) {
    console.error("[moderation] Supabase Auth ban failed; database account_status remains authoritative", {
      userId,
      message: authError.message,
    });
  }

  if (flagId) {
    const { error: flagError } = await admin.from("communication_flags").update({
      status: "actioned",
      reviewed_at: now,
      reviewed_by: user.id
    }).eq("id", flagId);
    if (flagError) throw flagError;
  }

  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "user_banned", targetType: "user", targetId: userId, metadata: { reason, flag_id: flagId || null } });
  revalidatePath("/workspace/admin/moderation");
  revalidatePath("/workspace/admin/users");
}

export async function unbanUserAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) throw new Error("Missing account to restore.");

  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").update({
    account_status: "active",
    banned_at: null,
    banned_reason: null,
    banned_by: null
  }).eq("id", userId);
  if (profileError) throw profileError;

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (authError) {
    console.error("[moderation] Supabase Auth unban failed; review the account in Auth", {
      userId,
      message: authError.message,
    });
  }

  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "user_unbanned", targetType: "user", targetId: userId });
  revalidatePath("/workspace/admin/moderation");
  revalidatePath("/workspace/admin/users");
}

export async function dismissFlagAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const flagId = String(formData.get("flag_id") ?? "");
  if (!flagId) throw new Error("Missing flag.");

  const admin = createAdminClient();
  const { error } = await admin.from("communication_flags").update({
    status: "dismissed",
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id
  }).eq("id", flagId);
  if (error) throw error;

  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "communication_flag_dismissed", targetType: "communication_flag", targetId: flagId });
  revalidatePath("/workspace/admin/moderation");
}
