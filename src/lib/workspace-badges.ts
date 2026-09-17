import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { Role } from "@/lib/types";

export type WorkspaceBadges = Record<string, number>;
type QueryError = { message?: string; code?: string } | null;

async function getAdminBadges(): Promise<{ badges: WorkspaceBadges; error: QueryError }> {
  try {
    const admin = createAdminClient();
    const [salesResult, financeResult, payoutResult, vettingResult] = await Promise.all([
      admin.from("lead_intake").select("id", { count: "exact", head: true }).eq("lead_type", "client_hiring").eq("crm_stage", "new"),
      admin.from("placement_finance_profiles").select("workroom_id", { count: "exact", head: true }).eq("exception_status", "pending"),
      admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "release_pending"),
      admin.from("va_vetting").select("va_id", { count: "exact", head: true }).eq("stage", "finalist"),
    ]);

    const firstError = salesResult.error || financeResult.error || payoutResult.error || vettingResult.error;
    if (firstError) return { badges: {}, error: firstError };

    const sales = salesResult.count || 0;
    const finance = (financeResult.count || 0) + (payoutResult.count || 0);
    const vetting = vettingResult.count || 0;

    return {
      badges: {
        "/workspace/admin": sales + finance + vetting,
        "/workspace/admin/sales": sales,
        "/workspace/admin/finance": finance,
        "/workspace/admin/vetting": vetting,
      },
      error: null,
    };
  } catch (error) {
    return {
      badges: {},
      error: { message: error instanceof Error ? error.message : "Admin workspace badge query failed" },
    };
  }
}

export const getWorkspaceBadgeResult = cache(async function getWorkspaceBadgeResult(role: Role, userId: string): Promise<{ badges: WorkspaceBadges; error: QueryError }> {
  if (role === "admin") return getAdminBadges();

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
        [`${base}/messages`]: Number(raw.messages || 0),
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
