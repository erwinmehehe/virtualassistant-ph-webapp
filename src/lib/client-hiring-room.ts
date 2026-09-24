import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { TrainingCredential } from "@/lib/training-credentials";

export type ClientHiringRoomJob = {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
};

export type ClientHiringRoomReleasedCandidate = {
  id: string;
  job_id: string;
  va_id: string;
  match_score: number | null;
  shortlist_order: number | null;
  released_at: string | null;
  client_recommendation: string | null;
  client_decision: string | null;
  client_decision_note: string | null;
  client_decision_at: string | null;
};

export type ClientHiringRoomVa = {
  user_id: string;
  slug: string | null;
  headline: string | null;
  primary_category: string | null;
  weekly_hours: number | null;
  hourly_rate: number | null;
  skills: string[] | null;
  tools: string[] | null;
  years_experience: number | null;
  schedule: string | null;
  overlap_hours: number | null;
};

type RawCredential = {
  user_id: string;
  id: string;
  credential_code: string;
  issued_at: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  course_summary: string | null;
  category: string;
  estimated_minutes: number;
};

export type ClientHiringRoomSummary = {
  jobs: ClientHiringRoomJob[];
  selected_job: ClientHiringRoomJob | null;
  access_status: string | null;
  released: ClientHiringRoomReleasedCandidate[];
  profiles: Array<{ id: string; full_name: string | null }>;
  vas: ClientHiringRoomVa[];
  credentials: RawCredential[];
  active_interviews: number;
  active_offers: number;
};

export const getClientHiringRoomSummary = cache(async function getClientHiringRoomSummary(
  clientId: string,
  selectedJobId?: string | null,
) {
  const admin = createAdminClient();
  const result = await withServerTiming("client.hiring_room_summary", () =>
    admin.rpc("client_hiring_room_summary", {
      p_client_id: clientId,
      p_selected_job_id: selectedJobId || null,
    }),
  );

  return {
    data: (result.data || null) as ClientHiringRoomSummary | null,
    error: result.error,
  };
});

export async function recordClientShortlistView(
  clientId: string,
  jobId: string,
  releasedCount: number,
) {
  const admin = createAdminClient();
  return withServerTiming("client.shortlist_view", () =>
    admin.rpc("record_client_shortlist_view", {
      p_client_id: clientId,
      p_job_id: jobId,
      p_released_count: releasedCount,
    }),
  );
}

export function trainingCredentialsByUser(rows: RawCredential[]) {
  const byUser = new Map<string, TrainingCredential[]>();

  for (const row of rows || []) {
    const credential: TrainingCredential = {
      id: row.id,
      credentialCode: row.credential_code,
      issuedAt: row.issued_at,
      courseId: row.course_id,
      courseSlug: row.course_slug,
      courseTitle: row.course_title,
      courseSummary: row.course_summary,
      category: row.category,
      estimatedMinutes: row.estimated_minutes,
      // The legacy hiring-room RPC does not carry certificate visibility metadata.
      // Fail closed for external client surfaces rather than treating internal
      // certificate evidence as publicly shareable.
      publicVisible: false,
    };
    byUser.set(row.user_id, [...(byUser.get(row.user_id) || []), credential]);
  }

  return byUser;
}
