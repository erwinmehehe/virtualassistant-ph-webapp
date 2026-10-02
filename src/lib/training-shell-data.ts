import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TrainingShellNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

function safeName(value: unknown) {
  const name = String(value || "").trim();
  return name.length >= 2 && name.length <= 100 ? name : null;
}

export async function getTrainingShellData(userId: string) {
  const supabase = await createClient();
  const [{ data: userResult }, { data: notificationRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("training_notifications")
      .select("id,title,body,href,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const authName = safeName(userResult.user?.user_metadata?.full_name);
  const notifications: TrainingShellNotification[] = (notificationRows || []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body || null,
    href: row.href || null,
    readAt: row.read_at || null,
    createdAt: row.created_at,
  }));

  return {
    authName,
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
  };
}
