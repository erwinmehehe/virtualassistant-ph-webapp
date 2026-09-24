import "server-only";

import { unstable_cache } from "next/cache";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { createPublicClient } from "@/lib/supabase/public";

export const getFeaturedPublicVas = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("public_va_directory")
      .select(
        "slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate,schedule,availability_status",
      )
      .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
      .not("avatar_url", "is", null)
      .order("years_experience", { ascending: false })
      .order("weekly_hours", { ascending: false })
      .order("full_name", { ascending: true })
      .limit(30);

    if (error) throw error;
    return (data ?? [])
      .filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim())
      .slice(0, 6);
  },
  ["homepage-featured-public-vas-v1"],
  { revalidate: 300, tags: ["public-va-directory"] },
);
