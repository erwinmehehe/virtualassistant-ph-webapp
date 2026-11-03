import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cache only published lesson eligibility, never per-user learning activity.
 * Cache expiry is aligned with the published-curriculum cache (120 seconds),
 * and admin publishing actions immediately invalidate the shared curriculum tag.
 * Direct database edits outside those actions may take up to this TTL to appear.
 * Fail closed on database errors rather than caching a false negative.
 */
export const getCachedPublishedLessonId = unstable_cache(
  async (lessonId: string, courseSlug: string): Promise<string | null> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("training_lessons")
      .select("id,training_modules!inner(training_courses!inner(slug,status))")
      .eq("id", lessonId)
      .eq("is_published", true)
      .eq("training_modules.training_courses.slug", courseSlug)
      .eq("training_modules.training_courses.status", "published")
      .maybeSingle();

    if (error) throw new Error("Training progress could not be validated. Please try again.");
    return data?.id ?? null;
  },
  ["training-published-lesson-eligibility"],
  { revalidate: 120, tags: ["training-curriculum"] },
);
