import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

export type ClientDashboardSummary = {
  job_count: number;
  active_jobs: number;
  hire_count: number;
  application_count: number;
  pipeline: {
    applied: number;
    shortlisted: number;
    interview: number;
    offered: number;
    hired: number;
    rejected: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    published_at: string | null;
    applicants: number;
    shortlisted: number;
    interview: number;
    offered: number;
    hired: number;
  }>;
};

export const getClientDashboardSummary = cache(async function getClientDashboardSummary(clientId: string) {
  const admin = createAdminClient();
  const result = await withServerTiming("client.dashboard_summary", () =>
    admin.rpc("client_dashboard_summary", { p_client_id: clientId })
  );
  return {
    data: (result.data || null) as ClientDashboardSummary | null,
    error: result.error
  };
});
