import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type WorkspaceBadges = Record<string, number>;

/**
 * Unread counts for the workspace sidebar, keyed by nav href.
 *
 * Until now these counts existed only on the dashboard, so anyone working
 * inside Applications or Candidates had no idea a message or notification had
 * arrived. Runs in the layout, so it must stay cheap and must never throw --
 * a failed count is a missing badge, never a broken page.
 */
export const getWorkspaceBadges = cache(async function getWorkspaceBadges(role: Role, userId: string): Promise<WorkspaceBadges> {
  if (role !== "va" && role !== "client") return {};
  const base = `/workspace/${role}`;

  try {
    const supabase = await createClient();
    const conversationColumn = role === "va" ? "va_id" : "client_id";

    const [{ data: conversations }, { count: notifications }] = await Promise.all([
      supabase.from("conversations").select("id").eq(conversationColumn, userId).limit(500),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null)
    ]);

    const conversationIds = (conversations || []).map((row: { id: string }) => row.id);
    const { count: messages } = conversationIds.length
      ? await supabase.from("messages").select("id", { count: "exact", head: true }).in("conversation_id", conversationIds).neq("sender_id", userId).is("read_at", null)
      : { count: 0 };

    return {
      [`${base}/messages`]: messages || 0,
      [`${base}/notifications`]: notifications || 0
    };
  } catch {
    // Badges are decoration. If the counts cannot be read, render the nav
    // without them rather than failing the whole workspace layout.
    return {};
  }
});
