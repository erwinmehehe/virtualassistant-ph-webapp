import "server-only";
import { cache } from "react";
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

export const getWorkspaceBadgeResult = cache(async function getWorkspaceBadgeResult(role: Role, userId: string): Promise<{ badges: WorkspaceBadges; error: QueryError }> {
  try {
    if (role === "admin") {
      return { badges: await withServerTiming("workspace.badges.admin", getAdminBadges), error: null };
    }

    const admin = createAdminClient();
    const { data, error } = await withServerTiming(`workspace.badges.${role}`, () => admin.rpc("workspace_badges", { p_role: role, p_user_id: userId }));
    if (error) return { badges: {}, error };

    const raw = (data || {}) as Record<string, unknown>;
    if (role === "recruiter") {
      return {
        badges: {
          "/workspace/recruiter/leads": Number(raw.leads || 0),
          "/workspace/recruiter/queue": Number(raw.vetting || 0),
          "/workspace/recruiter/matching": Number(raw.pending_roles || 0),
          "/workspace/recruiter/notifications": Number(raw.notifications || 0),
          "/workspace/recruiter/tasks": Number(raw.tasks || 0),
        },
        error: null,
      };
    }

    const base = `/workspace/${role}`;
    return {
      badges: {
        [`${base}/notifications`]: Number(raw.notifications || 0),
      },
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
