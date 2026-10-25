import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Cache only published curriculum owned by VAPH. Never put a learner ID,
// enrollment, assessment submission, progress, certificate, or session cookie
// into these cross-request cache entries.
const COURSE_FIELDS =
  "id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,published_at,updated_at";
const MODULE_FIELDS = "id,course_id,title,summary,position";
const LESSON_SUMMARY_FIELDS =
  "id,module_id,slug,title,summary,estimated_minutes,position,is_published,content_version,reviewed_by,last_reviewed_at";
const LESSON_DETAIL_FIELDS =
  "id,module_id,slug,title,summary,content,estimated_minutes,position,is_published,content_version,reviewed_by,last_reviewed_at";
const ASSESSMENT_SUMMARY_FIELDS = "id,course_id,title,pass_score,position";
const ASSESSMENT_DETAIL_FIELDS =
  "id,course_id,module_id,title,instructions,assessment_type,pass_score,position,is_published,rubric,resource_pack";

function guardQuery(error: { message?: string } | null, name: string) {
  if (error) {
    // Do not cache a partial/failed curriculum or expose service-role errors
    // to the learner-facing page.
    console.warn("[training-curriculum] cache fill failed", { name });
    throw new Error("The training catalogue is temporarily unavailable.");
  }
}

export const getCachedPublishedTrainingCatalogue = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data: courses, error: courseError } = await admin
      .from("training_courses")
      .select(COURSE_FIELDS)
      .eq("status", "published")
      .order("recommended_order", { ascending: true })
      .order("title");
    guardQuery(courseError, "courses");
    const courseIds = (courses || []).map((course) => course.id);

    const [moduleResult, assessmentResult, pathResult] = await Promise.all([
      courseIds.length
        ? admin.from("training_modules").select(MODULE_FIELDS)
            .in("course_id", courseIds).order("position")
        : Promise.resolve({ data: [], error: null }),
      courseIds.length
        ? admin.from("training_assessments").select(ASSESSMENT_SUMMARY_FIELDS)
            .in("course_id", courseIds).eq("is_published", true).order("position")
        : Promise.resolve({ data: [], error: null }),
      admin.from("training_learning_paths")
        .select("id,slug,title,summary,country_focus,status")
        .eq("status", "published").order("title"),
    ]);
    guardQuery(moduleResult.error, "modules");
    guardQuery(assessmentResult.error, "assessments");
    guardQuery(pathResult.error, "paths");

    const moduleIds = (moduleResult.data || []).map((module) => module.id);
    const pathIds = (pathResult.data || []).map((path) => path.id);
    const [lessonResult, pathCourseResult] = await Promise.all([
      moduleIds.length
        ? admin.from("training_lessons").select(LESSON_SUMMARY_FIELDS)
            .in("module_id", moduleIds).eq("is_published", true).order("position")
        : Promise.resolve({ data: [], error: null }),
      pathIds.length
        ? admin.from("training_learning_path_courses")
            .select("path_id,course_id,position").in("path_id", pathIds).order("position")
        : Promise.resolve({ data: [], error: null }),
    ]);
    guardQuery(lessonResult.error, "lesson summaries");
    guardQuery(pathCourseResult.error, "path course relations");

    return {
      courses: courses || [],
      modules: moduleResult.data || [],
      lessons: lessonResult.data || [],
      assessments: assessmentResult.data || [],
      paths: pathResult.data || [],
      pathCourses: pathCourseResult.data || [],
    };
  },
  ["published-training-catalogue-v1"],
  { revalidate: 120, tags: ["training-curriculum"] },
);

export const getCachedPublishedTrainingCourse = unstable_cache(
  async (slug: string) => {
    // Reject synthetic/high-cardinality slugs before the cache fills from bot
    // requests. Valid published course slugs are lowercase hyphenated strings.
    if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
    const admin = createAdminClient();
    const { data: course, error: courseError } = await admin
      .from("training_courses").select(COURSE_FIELDS)
      .eq("slug", slug).eq("status", "published").maybeSingle();
    guardQuery(courseError, "course");
    if (!course) return null;

    const [moduleResult, assessmentResult] = await Promise.all([
      admin.from("training_modules").select(MODULE_FIELDS)
        .eq("course_id", course.id).order("position"),
      admin.from("training_assessments").select(ASSESSMENT_DETAIL_FIELDS)
        .eq("course_id", course.id).eq("is_published", true).order("position"),
    ]);
    guardQuery(moduleResult.error, "course modules");
    guardQuery(assessmentResult.error, "course assessments");

    const moduleIds = (moduleResult.data || []).map((module) => module.id);
    const lessonResult = moduleIds.length
      ? await admin.from("training_lessons").select(LESSON_DETAIL_FIELDS)
          .in("module_id", moduleIds).eq("is_published", true).order("position")
      : { data: [], error: null };
    guardQuery(lessonResult.error, "course lessons");

    return {
      course,
      modules: moduleResult.data || [],
      lessons: lessonResult.data || [],
      assessments: assessmentResult.data || [],
    };
  },
  ["published-training-course-v1"],
  { revalidate: 120, tags: ["training-curriculum"] },
);
