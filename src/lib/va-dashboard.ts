import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VaProfile, VaVetting } from "@/lib/types";

export type VaDashboardSummary = {
  profile: Partial<VaProfile> & { preferred_timezone?: string | null };
  avatar_url: string | null;
  vetting: Partial<VaVetting>;
  test_score: number | null;
  scorecard_total: number | null;
  application_count: number;
  pipeline: {
    applied: number;
    shortlisted: number;
    interview: number;
    offered: number;
    hired: number;
    rejected: number;
  };
  pending_invites: number;
  workroom_count: number;
  certification_count: number;
  unread_notifications: number;
  unread_messages: number;
  recruiter_requests: Array<{ id: string; title: string; body: string | null; href: string | null; created_at: string }>;
};

export const getVaDashboardSummary = cache(async function getVaDashboardSummary(userId: string) {
  const admin = createAdminClient();
  const result = await admin.rpc("va_dashboard_summary", { p_va_id: userId });
  return {
    data: (result.data || null) as VaDashboardSummary | null,
    error: result.error
  };
});
