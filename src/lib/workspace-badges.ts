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
    if (role === "recruiter") {
      return {
        "/workspace/recruiter/leads": Number(raw.leads || 0),
        "/workspace/recruiter/queue": Number(raw.vetting || 0),
        "/workspace/recruiter/matching": Number(raw.pending_roles || 0),
        "/workspace/recruiter/notifications": Number(raw.notifications || 0),
        "/workspace/recruiter/tasks": Number(raw.tasks || 0),
      };
    }

    const base = `/workspace/${role}`;
    return {
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
