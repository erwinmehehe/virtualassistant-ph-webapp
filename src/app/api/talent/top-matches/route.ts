import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";
import type { TopMatch } from "@/lib/talent-preview";

/**
 * Public preview of the approved pool, used on the hiring-form success screen:
 * "here are three people who fit". Reads the same consented public view as
 * /find-talent and returns only fields that page already shows.
 */

export const dynamic = "force-dynamic";

type DirectoryRow = {
  user_id: string;
  slug: string | null;
  full_name: string | null;
  headline: string | null;
  primary_category: string | null;
  categories: string[] | null;
  skills: unknown;
  avatar_url: string | null;
  years_experience: number | null;
  weekly_hours: number | null;
};

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category")?.trim() || "";

  let rows: DirectoryRow[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("public_va_directory")
      .select("user_id,slug,full_name,headline,primary_category,categories,skills,avatar_url,years_experience,weekly_hours")
      .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
      .limit(200);
    rows = (data as DirectoryRow[] | null) || [];
  } catch {
    return NextResponse.json({ category, exact: false, total: 0, matches: [] as TopMatch[] });
  }

  const eligible = rows.filter((row) => row.slug && row.full_name);
  const inCategory = category
    ? eligible.filter((row) => [row.primary_category, ...(row.categories || [])].filter(Boolean).includes(category))
    : eligible;
  // A near-empty specialty should still show people rather than an empty state,
  // but the client is then told the pool is the whole directory, not the specialty.
  const exact = inCategory.length >= 3;
  const pool = exact ? inCategory : [...inCategory, ...eligible.filter((row) => !inCategory.includes(row))];

  const matches: TopMatch[] = pool
    .sort((a, b) => Number(b.years_experience || 0) - Number(a.years_experience || 0))
    .slice(0, 3)
    .map((row) => ({
      id: row.user_id,
      name: row.full_name || "Virtual Assistant",
      headline: row.headline || row.primary_category || "Virtual Assistant",
      avatarUrl: row.avatar_url,
      yearsExperience: Number(row.years_experience || 0),
      weeklyHours: row.weekly_hours ? Number(row.weekly_hours) : null,
      skills: uniqueStrings(row.skills).slice(0, 3)
    }));

  // Size of the pool these three came from, so three faces do not read as "that is all".
  const total = exact ? inCategory.length : eligible.length;
  return NextResponse.json({ category, exact, total, matches }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
