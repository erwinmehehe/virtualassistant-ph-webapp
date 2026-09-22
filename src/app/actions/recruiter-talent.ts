"use server";

import { redirect } from "next/navigation";
import { saveJobShortlistAction } from "@/app/actions/matching";
import { bulkRecruiterVaAction } from "@/app/actions/recruiter";
import { applyRecruiterTalentFilters } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";

function filterValue(formData: FormData, name: string) {
  return String(formData.get(name) || "");
}

function safeReturnTo(formData: FormData) {
  const value = String(formData.get("return_to") || "/workspace/recruiter/talent");
  return value.startsWith("/") && !value.startsWith("//") ? value : "/workspace/recruiter/talent";
}

function clientReviewForm(formData: FormData, ids: string[]) {
  const forwarded = new FormData();
  forwarded.set("job_id", String(formData.get("job_id") || ""));
  forwarded.set("mode", "release");
  forwarded.set("return_to", safeReturnTo(formData));
  for (const id of ids) forwarded.append("va_id", id);
  return forwarded;
}

function clientReviewError(formData: FormData, message: string): never {
  const returnTo = safeReturnTo(formData);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_error=${encodeURIComponent(message)}`);
}

export async function bulkRecruiterTalentAction(formData: FormData) {
  const action = String(formData.get("bulk_action") || "");
  const filteredScope = String(formData.get("selection_scope") || "selected") === "filtered";

  if (!filteredScope) {
    if (action === "send_client_review") {
      const selected = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))];
      if (!selected.length) return clientReviewError(formData, "Select at least one reviewed VA to send to the client.");
      if (selected.length > 50) return clientReviewError(formData, "Send at most 50 VAs to client review at a time.");
      return saveJobShortlistAction(clientReviewForm(formData, selected));
    }
    return bulkRecruiterVaAction(formData);
  }

  const admin = createAdminClient();
  const filters = {
    q: filterValue(formData, "filter_q"),
    category: filterValue(formData, "filter_category"),
    stage: filterValue(formData, "filter_stage"),
    readiness: filterValue(formData, "filter_readiness"),
    photo: filterValue(formData, "filter_photo"),
    resume: filterValue(formData, "filter_resume"),
    skill: filterValue(formData, "filter_skill"),
    min_experience: filterValue(formData, "filter_min_experience"),
    max_rate: filterValue(formData, "filter_max_rate"),
    availability: filterValue(formData, "filter_availability"),
    stale: filterValue(formData, "filter_stale")
  };

  let countQuery: any = admin.from("recruiter_va_directory").select("user_id", { count: "exact", head: true });
  countQuery = applyRecruiterTalentFilters(countQuery, filters);
  const { count: filteredCount, error: countError } = await countQuery;
  if (countError) throw countError;
  if (Number(filteredCount || 0) > 500) {
    const returnTo = safeReturnTo(formData);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=${encodeURIComponent("Filtered bulk actions are limited to 500 VAs. Narrow the filters before running the action.")}`);
  }

  let query: any = admin.from("recruiter_va_directory").select("user_id").limit(500);
  query = applyRecruiterTalentFilters(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  if (action === "send_client_review") {
    const ids: string[] = [...new Set<string>((data || []).map((row: any) => String(row.user_id)).filter((id: string) => Boolean(id)))];
    if (!ids.length) return clientReviewError(formData, "No reviewed VAs matched that selection.");
    if (ids.length > 50) return clientReviewError(formData, "Your filtered selection has more than 50 VAs. Narrow the filters before sending to client review.");
    return saveJobShortlistAction(clientReviewForm(formData, ids));
  }

  const forwarded = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === "selection_scope" || key === "va_id") continue;
    forwarded.append(key, value);
  }
  forwarded.set("selection_scope", "selected");
  for (const row of data || []) forwarded.append("va_id", String(row.user_id));

  return bulkRecruiterVaAction(forwarded);
}
