import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicFoundationCourse = {
  slug: string;
  title: string;
  summary: string | null;
  estimated_minutes: number;
  published_at: string | null;
};

export const getPublishedFoundationCourse = unstable_cache(
  async (): Promise<PublicFoundationCourse | null> => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("training_courses")
        .select("slug,title,summary,estimated_minutes,published_at")
        .eq("slug", "virtual-assistant-foundations")
        .eq("status", "published")
        .maybeSingle();

      if (error || !data) return null;
      return data as PublicFoundationCourse;
    } catch {
      // The public landing page must remain available if training storage is
      // temporarily unavailable. A missing result simply keeps release copy
      // in its pre-launch state.
      return null;
    }
  },
  ["public-training-foundations-release"],
  { revalidate: 300, tags: ["public-training"] },
);
