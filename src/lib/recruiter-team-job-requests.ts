import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pendingJobRequests, type JobRequestRole } from "@/lib/recruiter-job-requests";

export type RecruiterTeamPendingRequest = JobRequestRole & {
  title: string | null;
  company_name: string | null;
};

const PAGE_LIMIT = 250;

/**
 * Team-wide submitted requests. The existing roles_summary RPC intentionally
 * returns only a recruiter's assigned pipeline, which is not a team inbox.
 * Keep this service-role query server-side and enforce an active recruiter first.
 */
export const getRecruiterTeamPendingJobRequests = cache(async () => {
  const { profile } = await requireRoleFast("recruiter");
  if (profile.account_status !== "active") notFound();

  const { data, error, count } = await createAdminClient()
    .from("jobs")
    .select("id,title,company_name,status,hiring_stage,created_at,recruiter_id,client_id", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(PAGE_LIMIT);

  if (error) throw error;
  const rows = (data || []) as RecruiterTeamPendingRequest[];
  return {
    jobs: pendingJobRequests(rows),
    truncated: (count ?? rows.length) > rows.length,
  };
});
