import "server-only";
import { unstable_cache } from "next/cache";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";
import { createPublicClient } from "@/lib/supabase/public";

export const PUBLIC_JOBS_PAGE_SIZE = 20;

export type PublicJobFilters = {
  q: string;
  category: string;
  minRate: number;
  hours: "full" | "part" | "";
  sort: "newest" | "rate" | "hours";
  page: number;
};

const PUBLIC_JOB_COLUMNS =
  "id,slug,title,company_name,summary,categories,required_skills,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,engagement_length,published_at,company_logo_url,company_industry,company_location,company_verified_at,company_hires_count";

/**
 * Bound public inputs to avoid expensive or unbounded search/filter requests.
 * Job detail pages and applicant access remain under their existing guards.
 */
export function parsePublicJobFilters(params: Record<string, string | undefined>): PublicJobFilters {
  const q = String(params.q || "")
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
  const requestedCategory = String(params.category || "").trim();
  const category = VA_CATEGORIES.some((item) => item === requestedCategory) ? requestedCategory : "";
  const numericRate = Number(params.min_rate || 0);
  const minRate = Number.isFinite(numericRate) && numericRate >= 0 && numericRate <= 100 ? numericRate : 0;
  const hours = params.hours === "full" || params.hours === "part" ? params.hours : "";
  const sort = params.sort === "rate" || params.sort === "hours" ? params.sort : "newest";
  const numericPage = Number(params.page || 1);
  const page = Number.isFinite(numericPage) ? Math.min(1000, Math.max(1, Math.floor(numericPage))) : 1;
  return { q, category, minRate, hours, sort, page };
}

/**
 * Query only the sanitized public view through a session-free anonymous client.
 * Exact published counts and filtered paging remain computed by PostgREST.
 */
async function queryPublicJobResults(filters: PublicJobFilters) {
  const client = createPublicClient();
  if (!client) return { jobs: [] as Record<string, unknown>[], total: 0 };

  let query = client
    .from("public_jobs")
    .select(PUBLIC_JOB_COLUMNS, { count: "exact" })
    .gte("min_hourly_rate", MIN_HOURLY_RATE);

  if (filters.q) {
    query = query.or(`title.ilike.%${filters.q}%,summary.ilike.%${filters.q}%`);
  }
  if (filters.category) query = query.contains("categories", [filters.category]);
  if (filters.minRate > 0) query = query.gte("min_hourly_rate", filters.minRate);
  if (filters.hours === "full") query = query.gte("hours_per_week", 35);
  if (filters.hours === "part") query = query.gt("hours_per_week", 0).lt("hours_per_week", 35);

  if (filters.sort === "rate") query = query.order("min_hourly_rate", { ascending: false, nullsFirst: false });
  else if (filters.sort === "hours") query = query.order("hours_per_week", { ascending: false, nullsFirst: false });
  else query = query.order("published_at", { ascending: false, nullsFirst: false });

  const from = (filters.page - 1) * PUBLIC_JOBS_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PUBLIC_JOBS_PAGE_SIZE - 1);
  if (error) throw error;
  return { jobs: (data || []) as Record<string, unknown>[], total: count || 0 };
}

// The unfiltered landing page is visited most by browsers and crawlers.
// Cache that shared, non-personal result for one minute. Filtered searches
// remain fresh and are not allowed to create unlimited cache keys.
const getCachedDefaultJobResults = unstable_cache(
  () => queryPublicJobResults({ q: "", category: "", minRate: 0, hours: "", sort: "newest", page: 1 }),
  ["public-jobs-default-page-v1"],
  { revalidate: 60, tags: ["public-jobs"] },
);

export async function getPublicJobResults(filters: PublicJobFilters) {
  const isDefault =
    !filters.q && !filters.category && filters.minRate === 0 &&
    !filters.hours && filters.sort === "newest" && filters.page === 1;
  return isDefault ? getCachedDefaultJobResults() : queryPublicJobResults(filters);
}

// Only the public filter floor is cached; no private admin settings are
// serialized into the page or an anonymous API response.
export const getPublicJobFilterFloor = unstable_cache(
  async () => (await getBusinessSettings()).minHourlyRate,
  ["public-jobs-filter-floor-v1"],
  { revalidate: 300 },
);
