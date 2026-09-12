import { PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";

export type RecruiterTalentFilters = {
  q?: string | null;
  stage?: string | null;
  readiness?: string | null;
  photo?: string | null;
  resume?: string | null;
  skill?: string | null;
  min_experience?: string | number | null;
  max_rate?: string | number | null;
  availability?: string | null;
  stale?: string | number | null;
};

function numberValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Apply the recruiter talent directory filters in one place so the visible
 * table and "select all filtered results" bulk actions cannot drift apart.
 */
export function applyRecruiterTalentFilters(query: any, filters: RecruiterTalentFilters) {
  const q = String(filters.q || "").trim().replace(/[,%()]/g, " ");
  const stage = String(filters.stage || "");
  const readiness = String(filters.readiness || "");
  const photo = String(filters.photo || "");
  const resume = String(filters.resume || "");
  const availability = String(filters.availability || "");
  const skill = String(filters.skill || "").trim();
  const minExperience = numberValue(filters.min_experience);
  const maxRate = numberValue(filters.max_rate);
  const stale = numberValue(filters.stale);

  if (stage) query = query.eq("stage", stage);
  if (availability) query = query.eq("availability_status", availability);

  if (readiness === "ready") {
    query = query
      .gte("completion_score", PUBLIC_VA_MIN_COMPLETION)
      .not("avatar_url", "is", null)
      .neq("stage", "approved")
      .neq("stage", "bench")
      .neq("stage", "rejected")
      .eq("account_status", "active");
  }

  if (readiness === "incomplete") {
    query = query
      .gt("completion_score", 0)
      .lt("completion_score", PUBLIC_VA_MIN_COMPLETION)
      .neq("stage", "rejected")
      .eq("account_status", "active");
  }

  if (readiness === "zero") {
    query = query
      .eq("completion_score", 0)
      .neq("stage", "rejected")
      .eq("account_status", "active");
  }

  if (readiness === "vetted_hidden") {
    query = query
      .in("stage", ["approved", "bench"])
      .eq("account_status", "active")
      .eq("directory_visible", false);
  }

  if (photo === "yes") query = query.not("avatar_url", "is", null);
  if (photo === "no") query = query.is("avatar_url", null);
  if (resume === "yes") query = query.not("resume_path", "is", null);
  if (resume === "no") query = query.is("resume_path", null);
  if (minExperience != null) query = query.gte("years_experience", minExperience);
  if (maxRate != null) query = query.lte("hourly_rate", maxRate);
  if (skill) query = query.contains("skills", [skill]);
  if (stale != null && stale > 0) {
    query = query.lt("last_activity_at", new Date(Date.now() - stale * 86400000).toISOString());
  }
  if (q) query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,primary_category.ilike.%${q}%`);

  return query;
}
