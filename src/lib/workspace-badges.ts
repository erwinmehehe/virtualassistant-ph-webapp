import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { Role } from "@/lib/types";

export type WorkspaceBadges = Record<string, number>;
type QueryError = { message?: string; code?: string } | null;

async function getAdminBadges(): Promise<WorkspaceBadges> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_workspace_badges");
  if (error) throw error;
  const raw = (data || {}) as Record<string, unknown>;

  return {
    "/workspace/admin/sales": Number(raw.sales || 0),
    "/workspace/admin/finance": Number(raw.finance || 0),
  };
}

const getCachedAdminBadges = unstable_cache(
  getAdminBadges,
  ["admin-workspace-badges"],
  { revalidate: 15 },
);

const getCachedRoleBadges = unstable_cache(
  async (role: Exclude<Role, "admin">, userId: string): Promise<WorkspaceBadges> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("workspace_badges", { p_role: role, p_user_id: userId });
    if (error) throw error;

    const raw = (data || {}) as Record<string, unknown>;

    let clientChatUnread = 0;
    let vaChatUnread = 0;

    if (role === "client" || role === "recruiter") {
      let threadQuery = admin
        .from("client_recruiter_threads")
        .select("id");
      threadQuery = role === "client"
        ? threadQuery.eq("client_id", userId)
        : threadQuery.or(`recruiter_id.eq.${userId},recruiter_id.is.null`);
      const { data: threads, error: threadError } = await threadQuery;
      if (threadError) throw threadError;
      const threadIds = (threads || []).map((thread) => thread.id);
      if (threadIds.length) {
        const { count, error: unreadError } = await admin
          .from("client_recruiter_messages")
          .select("id", { count: "exact", head: true })
          .in("thread_id", threadIds)
          .neq("sender_id", userId)
          .is("read_at", null);
        if (unreadError) throw unreadError;
        clientChatUnread = Number(count || 0);
      }
    }

    if (role === "va" || role === "recruiter") {
      const threadColumn = role === "va" ? "va_id" : "recruiter_id";
      const { data: threads, error: threadError } = await admin
        .from("recruiter_va_threads")
        .select("id")
        .eq(threadColumn, userId);
      if (threadError) throw threadError;
      const threadIds = (threads || []).map((thread) => thread.id);
      if (threadIds.length) {
        const { count, error: unreadError } = await admin
          .from("recruiter_va_messages")
          .select("id", { count: "exact", head: true })
          .in("thread_id", threadIds)
          .neq("sender_id", userId)
          .is("read_at", null);
        if (unreadError) throw unreadError;
        vaChatUnread = Number(count || 0);
      }
    }

    if (role === "recruiter") {
      return {
        "/workspace/recruiter/leads": Number(raw.leads || 0),
        "/workspace/recruiter/messages": clientChatUnread,
        "/workspace/recruiter/va-messages": vaChatUnread,
        "/workspace/recruiter/talent": Number(raw.vetting || 0),
        "/workspace/recruiter/roles": Number(raw.pending_roles || 0),
        "/workspace/recruiter/notifications": Number(raw.notifications || 0),
        "/workspace/recruiter/tasks": Number(raw.tasks || 0),
      };
    }

    const base = `/workspace/${role}`;
    return {
      [`${base}/messages`]: role === "client" ? clientChatUnread : vaChatUnread,
      [`${base}/notifications`]: Number(raw.notifications || 0),
    };
  },
  ["workspace-role-badges"],
  { revalidate: 15 },
);

export const getWorkspaceBadgeResult = cache(async function getWorkspaceBadgeResult(role: Role, userId: string): Promise<{ badges: WorkspaceBadges; error: QueryError }> {
  try {
    if (role === "admin") {
      return { badges: await withServerTiming("workspace.badges.admin", getCachedAdminBadges), error: null };
    }

    return {
      badges: await withServerTiming(`workspace.badges.${role}`, () => getCachedRoleBadges(role, userId)),
      error: null,
    };
  } catch (error) {
    return {
      badges: {},
      error: { message: error instanceof Error ? error.message : "Workspace badge query failed" },
    };
  }
});

export async function getWorkspaceBadges(role: Role, userId: string): Promise<WorkspaceBadges> {
  return (await getWorkspaceBadgeResult(role, userId)).badges;
}
