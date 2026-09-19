"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace notification reads. These used to sit beside the client/VA
 * messaging actions; messaging was removed because coordination runs through
 * the recruiter over email, and notifications outlived it.
 */

export async function markNotificationReadAction(formData: FormData) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) return;
  const id = String(formData.get("notification_id") || "");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  const base = profile.role === "va" ? "/workspace/va" : "/workspace/client";
  revalidatePath(`${base}/notifications`);
  revalidatePath(base);
}

export async function markAllNotificationsReadAction() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || !["client", "va"].includes(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  const base = profile.role === "va" ? "/workspace/va" : "/workspace/client";
  revalidatePath(`${base}/notifications`);
  revalidatePath(base);
}
