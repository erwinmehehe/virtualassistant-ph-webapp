"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function openWorkspaceNotificationAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) return;

  const notificationId = String(formData.get("notification_id") || "");
  const base = profile.role === "va" ? "/workspace/va" : "/workspace/client";
  if (!notificationId) redirect(`${base}/notifications`);

  const supabase = await createClient();
  const { data: notification } = await supabase
    .from("notifications")
    .select("id,href,read_at")
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!notification) redirect(`${base}/notifications`);

  if (!notification.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);
    revalidatePath(`${base}/notifications`);
    revalidatePath(base);
  }

  const href = String(notification.href || "");
  const safeHref = href.startsWith(`${base}/`) || href === base ? href : base;
  redirect(safeHref);
}
