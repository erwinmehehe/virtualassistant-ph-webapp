import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { Role } from "@/lib/types";

export type WorkspaceBadges = Record<string, number>;
type QueryError = { message?: string; code?: string } | null;

export const getWorkspaceBadgeResult = cache(async function getWorkspaceBadgeResult(role: Role, userId: string): Promise<{ badges: WorkspaceBadges; error: QueryError }> {
  if (role === "admin") return { badges: {}, error: null };

  try {
    const admin = createAdminClient();
    const { data, error } = await withServerTiming(`workspace.badges.${role}`, () => admin.rpc("workspace_badges", { p_role: role, p_user_id: userId }));
    if (error) return { badges: {}, error };

    const raw = (data || {}) as Record<string, unknown>;
    if (role === "recruiter") {
      return {
        badges: {
          "/workspace/recruiter/leads": Number(raw.leads || 0),
          "/workspace/recruiter/queue": Number(raw.vetting || 0),
          "/workspace/recruiter/matching": Number(raw.pending_roles || 0)
        },
        error: null
      };
    }

    const base = `/workspace/${role}`;
    return {
      badges: {
        [`${base}/messages`]: Number(raw.messages || 0),
        [`${base}/notifications`]: Number(raw.notifications || 0)
      },
      error: null
    };
  } catch (error) {
    return {
      badges: {},
      error: { message: error instanceof Error ? error.message : "Workspace badge query failed" }
    };
  }
});

export async function getWorkspaceBadges(role: Role, userId: string): Promise<WorkspaceBadges> {
  return (await getWorkspaceBadgeResult(role, userId)).badges;
}
