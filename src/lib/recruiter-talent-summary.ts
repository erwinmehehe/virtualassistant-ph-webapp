import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { JobOptionRow, RecruiterVaDirectoryRow, VaProfileReminderRow } from "@/lib/workspace-rows";

export type RecruiterTalentSavedViewCounts = {
  all: number;
  approval_ready: number;
  approval_cleanup: number;
  missing_photo: number;
  approved_hidden: number;
  bench: number;
  stale_60: number;
  available: number;
  needs_review: number;
};

export type RecruiterTalentSupportSummary = {
  saved_view_counts: RecruiterTalentSavedViewCounts;
  new_accounts_count: number;
  recent_zero_count: number;
  verified_recent_zero_count: number;
  stalled: RecruiterVaDirectoryRow[];
  roles: JobOptionRow[];
};

export type RecruiterTalentEnrichmentRow = {
  user_id: string;
  reminder: VaProfileReminderRow | null;
  public_now: boolean;
  visibility_profile: Record<string, unknown>;
};

export const getRecruiterTalentSupportSummary = cache(async function getRecruiterTalentSupportSummary() {
  const admin = createAdminClient();
  const result = await withServerTiming("recruiter.talent_support_summary", () =>
    admin.rpc("recruiter_talent_support_summary"),
  );

  return {
    data: (result.data || null) as RecruiterTalentSupportSummary | null,
    error: result.error,
  };
});

export async function getRecruiterTalentPageEnrichment(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) {
    return {
      data: [] as RecruiterTalentEnrichmentRow[],
      error: null,
    };
  }

  const admin = createAdminClient();
  const result = await withServerTiming("recruiter.talent_page_enrichment", () =>
    admin.rpc("recruiter_talent_page_enrichment", { p_va_ids: ids }),
  );

  return {
    data: (result.data || []) as RecruiterTalentEnrichmentRow[],
    error: result.error,
  };
}
