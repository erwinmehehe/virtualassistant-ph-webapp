"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function safeTrainingHref(value: unknown) {
  const href = String(value || "").trim();
  if (href === "/workspace/training" || href.startsWith("/workspace/training/")) return href;
  if (href.startsWith("/training/certificates/")) return href;
  return "/workspace/training";
}

export async function openTrainingNotificationAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const notificationId = String(formData.get("notification_id") || "").trim();
  if (!notificationId) redirect("/workspace/training");

  const supabase = await createClient();
  const { data: notification } = await supabase
    .from("training_notifications")
    .select("id,href,read_at")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!notification) redirect("/workspace/training");

  if (!notification.read_at) {
    await supabase
      .from("training_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id)
      .eq("user_id", userId);
    revalidatePath("/workspace/training");
  }

  redirect(safeTrainingHref(notification.href));
}

export async function markAllTrainingNotificationsReadAction() {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const supabase = await createClient();
  await supabase
    .from("training_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  revalidatePath("/workspace/training");
}
