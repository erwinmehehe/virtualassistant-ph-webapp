"use server";

import { bulkRecruiterVaAction } from "@/app/actions/recruiter";
import { applyRecruiterTalentFilters } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";

function filterValue(formData: FormData, name: string) {
  return String(formData.get(name) || "");
}

export async function bulkRecruiterTalentAction(formData: FormData) {
  if (String(formData.get("selection_scope") || "selected") !== "filtered") {
    return bulkRecruiterVaAction(formData);
  }

  const admin = createAdminClient();
  let query: any = admin.from("recruiter_va_directory").select("user_id").limit(500);
  query = applyRecruiterTalentFilters(query, {
    q: filterValue(formData, "filter_q"),
    stage: filterValue(formData, "filter_stage"),
    readiness: filterValue(formData, "filter_readiness"),
    photo: filterValue(formData, "filter_photo"),
    resume: filterValue(formData, "filter_resume"),
    skill: filterValue(formData, "filter_skill"),
    min_experience: filterValue(formData, "filter_min_experience"),
    max_rate: filterValue(formData, "filter_max_rate"),
    availability: filterValue(formData, "filter_availability"),
    stale: filterValue(formData, "filter_stale")
  });

  const { data, error } = await query;
  if (error) throw error;

  const forwarded = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === "selection_scope" || key === "va_id") continue;
    forwarded.append(key, value);
  }
  forwarded.set("selection_scope", "selected");
  for (const row of data || []) forwarded.append("va_id", String(row.user_id));

  return bulkRecruiterVaAction(forwarded);
}
