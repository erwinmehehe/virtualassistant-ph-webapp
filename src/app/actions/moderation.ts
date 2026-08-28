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
  await admin.from("profiles").update({
    account_status: "banned",
    banned_at: new Date().toISOString(),
    banned_reason: reason,
    banned_by: user.id
  }).eq("id", userId);

  // Ban at the Supabase Auth level too (not just our own account_status
  // column) so the account is blocked from signing in again at all, not
  // just from reaching a workspace. ~100 years is Supabase's documented
  // pattern for an effectively permanent ban.
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" }).catch(() => {
    // Best-effort -- our own account_status check still blocks them either way.
  });

  if (flagId) {
    await admin.from("message_flags").update({ status: "actioned", reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", flagId);
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
  await admin.from("profiles").update({
    account_status: "active",
    banned_at: null,
    banned_reason: null,
    banned_by: null
  }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" }).catch(() => {});
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
  await admin.from("message_flags").update({ status: "dismissed", reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", flagId);
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "message_flag_dismissed", targetType: "message_flag", targetId: flagId });
  revalidatePath("/workspace/admin/moderation");
}
