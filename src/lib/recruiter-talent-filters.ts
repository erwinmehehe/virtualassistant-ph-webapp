import { MIN_HOURLY_RATE } from "@/lib/constants";
import { APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";

export const RECRUITER_BULK_LIMIT = 500;

export type RecruiterTalentFilters = {
  q?: string | null;
  category?: string | string[] | null;
  category_match?: string | null;
  classification?: string | null;
  registration?: string | null;
  address?: string | null;
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

function stringValues(value: string | string[] | null | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function excludeTerminalVettingStages(query: any) {
  return query.or("stage.is.null,and(stage.neq.approved,stage.neq.bench,stage.neq.rejected)");
}

function excludeRejectedStage(query: any) {
  return query.or("stage.is.null,stage.neq.rejected");
}

/**
 * Apply recruiter talent filters in one place so the visible table and
 * "select all filtered results" bulk actions cannot drift apart.
 */
export function applyRecruiterTalentFilters(query: any, filters: RecruiterTalentFilters) {
  const q = String(filters.q || "").trim().replace(/[,%()]/g, " ");
  const categories = stringValues(filters.category);
  const categoryMatch = String(filters.category_match || "any") === "all" ? "all" : "any";
  const classification = String(filters.classification || "");
  const registration = String(filters.registration || "");
  const address = String(filters.address || "");
  const stage = String(filters.stage || "");
  const readiness = String(filters.readiness || "");
  const photo = String(filters.photo || "");
  const resume = String(filters.resume || "");
  const availability = String(filters.availability || "");
  const skill = String(filters.skill || "").trim();
  const minExperience = numberValue(filters.min_experience);
  const maxRate = numberValue(filters.max_rate);
  const stale = numberValue(filters.stale);

  if (categories.length) {
    if (categoryMatch === "all") {
      query = query.contains("categories", categories);
    } else {
      const categoryTerms = categories.flatMap((category) => {
        const quotedCategory = `"${category.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        return [
          `primary_category.eq.${quotedCategory}`,
          `categories.cs.{${quotedCategory}}`,
        ];
      });
      query = query.or(categoryTerms.join(","));
    }
  }
  if (classification === "classified") query = query.eq("classification_status", "classified");
  if (classification === "ready_to_classify") query = query.eq("classification_status", "ready_to_classify");
  if (classification === "incomplete_profile") query = query.eq("classification_status", "incomplete_profile");

  if (registration === "email_unconfirmed") query = query.eq("registration_health", "email_unconfirmed");
  if (registration === "never_started") query = query.eq("registration_health", "never_started");
  if (registration === "profile_incomplete") query = query.eq("registration_health", "profile_incomplete");
  if (address === "missing") query = query.eq("has_private_address", false);
  if (address === "review") query = query.eq("has_private_address", false).eq("address_resume_status", "review");

  if (stage) query = query.eq("stage", stage);
  if (availability) query = query.eq("availability_status", availability);

  if (readiness === "ready") {
    query = query
      .gte("completion_score", PUBLIC_VA_MIN_COMPLETION)
      .not("avatar_url", "is", null)
      .eq("account_status", "active");
    query = excludeTerminalVettingStages(query);
  }

  if (readiness === "incomplete") {
    query = query
      .gt("completion_score", 0)
      .lt("completion_score", APPROVAL_MIN_COMPLETION)
      .eq("account_status", "active");
    query = excludeRejectedStage(query);
  }

  if (readiness === "approval_ready") {
    query = query
      .gte("completion_score", APPROVAL_MIN_COMPLETION)
      .eq("account_status", "active");
    query = excludeTerminalVettingStages(query);
  }

  if (readiness === "approval_cleanup") {
    query = query
      .in("stage", ["approved", "bench"])
      .lt("completion_score", APPROVAL_MIN_COMPLETION)
      .eq("account_status", "active");
  }

  if (readiness === "zero") {
    query = query
      .eq("completion_score", 0)
      .eq("account_status", "active");
    query = excludeRejectedStage(query);
  }

  if (readiness === "vetted_hidden") {
    // "Not public" is broader than directory_visible=false. An approved VA can
    // have the switch on and still be blocked by the public directory rules.
    query = query
      .in("stage", ["approved", "bench"])
      .eq("account_status", "active")
      .or([
        "directory_visible.eq.false",
        `completion_score.lt.${PUBLIC_VA_MIN_COMPLETION}`,
        "avatar_url.is.null",
        `years_experience.lt.${PUBLIC_VA_MIN_EXPERIENCE}`,
        "years_experience.is.null",
        `hourly_rate.lt.${MIN_HOURLY_RATE}`,
        "hourly_rate.is.null",
        "availability_status.neq.available",
        "availability_status.is.null"
      ].join(","));
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
  if (q) {
    const quoted = `"${q.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    query = query.or([
      `full_name.ilike.%${q}%`,
      `headline.ilike.%${q}%`,
      `primary_category.ilike.%${q}%`,
      `categories.cs.{${quoted}}`,
      `skills.cs.{${quoted}}`,
      `tools.cs.{${quoted}}`,
      `industries.cs.{${quoted}}`,
    ].join(","));
  }

  return query;
}
