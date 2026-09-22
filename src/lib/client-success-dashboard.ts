import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

export type ClientSuccessSupportRequest = {
  id: string;
  workroom_id: string;
  requester_id: string;
  requester_role: string;
  request_type: string;
  priority: string;
  details: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  replacement_reason: string | null;
  replacement_sla_due_on: string | null;
  guarantee_status: string | null;
  guarantee_notes: string | null;
  job_id: string;
  job_title: string | null;
  company_name: string | null;
  client_id: string | null;
  client_name: string | null;
  va_id: string | null;
  va_name: string | null;
  client_success_owner_id: string | null;
  placement_stage: string | null;
  health_status: string | null;
  health_score: number | null;
  recruiter_id: string | null;
};

export type ClientSuccessRetentionRoom = {
  id: string;
  job_id: string;
  client_id: string | null;
  va_id: string | null;
  client_success_owner_id: string | null;
  placement_stage: string;
  health_status: string;
  health_score: number | null;
  renewal_date: string | null;
  renewal_status: string;
  end_reason: string | null;
  offboarding_notes: string | null;
  created_at: string;
  job_title: string | null;
  company_name: string | null;
  recruiter_id: string | null;
  client_name: string | null;
  va_name: string | null;
};

export type ClientSuccessReplacement = {
  id: string;
  workroom_id: string;
  status: string;
  details: string;
  resolution: string | null;
  replacement_reason: string | null;
  replacement_sla_due_on: string | null;
  guarantee_status: string | null;
  guarantee_notes: string | null;
  created_at: string;
  job_id: string;
  job_title: string | null;
  company_name: string | null;
  client_id: string | null;
  client_name: string | null;
  va_id: string | null;
  va_name: string | null;
};

export type ClientSuccessPlacementRoom = {
  id: string;
  job_id: string;
  client_id: string | null;
  va_id: string | null;
  client_success_owner_id: string | null;
  placement_stage: string;
  handoff_completed_at: string | null;
  handoff_notes: string | null;
  placement_ready_at: string | null;
  health_score: number | null;
  health_status: string;
  health_coverage: number | null;
  at_risk_reason: string | null;
  recovery_plan: string | null;
};

export type ClientSuccessPlacementDetail = {
  room: ClientSuccessPlacementRoom;
  job: {
    id: string;
    title: string | null;
    company_name: string | null;
    client_id: string | null;
    recruiter_id: string | null;
  };
  client_name: string | null;
  va_name: string | null;
  recruiter_name: string | null;
  client_success_owner_name: string | null;
  checklist: Array<{
    id: string;
    workroom_id: string;
    owner_role: string | null;
    title: string;
    completed_at: string | null;
  }>;
  checkins: Array<{
    id: string;
    workroom_id: string;
    checkpoint: string;
    due_at: string;
    status: string;
    client_signal: string | null;
    client_note: string | null;
    va_signal: string | null;
    va_note: string | null;
  }>;
  staff: Array<{
    id: string;
    full_name: string | null;
    role: string | null;
    account_status: string | null;
  }>;
};

export const getClientSuccessSupportSummary = cache(async function getClientSuccessSupportSummary(actorId: string) {
  const admin = createAdminClient();
  const result = await withServerTiming("client-success.support_summary", () =>
    admin.rpc("client_success_support_summary", { p_actor_id: actorId, p_limit: 300 }),
  );
  const data = (result.data || {}) as { requests?: ClientSuccessSupportRequest[] };
  return { data: data.requests || [], error: result.error };
});

export const getClientSuccessRetentionSummary = cache(async function getClientSuccessRetentionSummary(actorId: string) {
  const admin = createAdminClient();
  const result = await withServerTiming("client-success.retention_summary", () =>
    admin.rpc("client_success_retention_summary", { p_actor_id: actorId, p_room_limit: 200, p_request_limit: 200 }),
  );
  const data = (result.data || {}) as {
    rooms?: ClientSuccessRetentionRoom[];
    replacements?: ClientSuccessReplacement[];
  };
  return {
    data: {
      rooms: data.rooms || [],
      replacements: data.replacements || [],
    },
    error: result.error,
  };
});

export const getClientSuccessPlacementDetail = cache(async function getClientSuccessPlacementDetail(actorId: string, workroomId: string) {
  const admin = createAdminClient();
  const result = await withServerTiming("client-success.placement_detail", () =>
    admin.rpc("client_success_placement_detail", { p_actor_id: actorId, p_workroom_id: workroomId }),
  );
  return {
    data: (result.data || null) as ClientSuccessPlacementDetail | null,
    error: result.error,
  };
});
