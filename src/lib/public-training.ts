import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicTrainingCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: "foundation" | "software" | "industry" | "skill";
  country_focus: string | null;
  estimated_minutes: number;
  recommended_order: number | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  lesson_count: number;
};

export type PublicTrainingPath = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  country_focus: string | null;
  status: "draft" | "published" | "archived";
  courses: PublicTrainingCourse[];
};

export type PublicTrainingOverview = {
  courses: PublicTrainingCourse[];
  paths: PublicTrainingPath[];
};

export const getPublicTrainingOverview = unstable_cache(
  async (): Promise<PublicTrainingOverview> => {
    try {
      const admin = createAdminClient();
      const [{ data: courseData, error: courseError }, { data: pathData, error: pathError }] = await Promise.all([
        admin
          .from("training_courses")
          .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,published_at")
          .neq("status", "archived")
          .order("recommended_order", { ascending: true })
          .order("title"),
        admin
          .from("training_learning_paths")
          .select("id,slug,title,summary,country_focus,status")
          .neq("status", "archived")
          .order("title"),
      ]);

      if (courseError) return { courses: [], paths: [] };

      const rawCourses = (courseData || []) as Array<Omit<PublicTrainingCourse, "lesson_count">>;
      const courseIds = rawCourses.map((course) => course.id);
      const { data: moduleData } = courseIds.length
        ? await admin.from("training_modules").select("id,course_id").in("course_id", courseIds)
        : { data: [] };
      const modules = (moduleData || []) as Array<{ id: string; course_id: string }>;
      const moduleIds = modules.map((module) => module.id);
      const { data: lessonData } = moduleIds.length
        ? await admin
            .from("training_lessons")
            .select("id,module_id")
            .in("module_id", moduleIds)
            .eq("is_published", true)
        : { data: [] };
      const lessons = (lessonData || []) as Array<{ id: string; module_id: string }>;
      const moduleCourse = new Map(modules.map((module) => [module.id, module.course_id]));

      const courses: PublicTrainingCourse[] = rawCourses.map((course) => ({
        ...course,
        lesson_count: lessons.filter((lesson) => moduleCourse.get(lesson.module_id) === course.id).length,
      }));

      if (pathError || !(pathData || []).length) return { courses, paths: [] };

      const pathIds = (pathData || []).map((path) => path.id);
      const { data: relationData } = await admin
        .from("training_learning_path_courses")
        .select("path_id,course_id,position")
        .in("path_id", pathIds)
        .order("position");

      const relations = (relationData || []) as Array<{
        path_id: string;
        course_id: string;
        position: number;
      }>;

      const paths: PublicTrainingPath[] = (pathData || []).map((path) => ({
        ...path,
        courses: relations
          .filter((relation) => relation.path_id === path.id)
          .sort((a, b) => a.position - b.position)
          .map((relation) => courses.find((course) => course.id === relation.course_id))
          .filter((course): course is PublicTrainingCourse => Boolean(course)),
      })) as PublicTrainingPath[];

      return { courses, paths };
    } catch {
      // /training should stay available even when the training database is
      // temporarily unavailable. The page falls back to conservative copy.
      return { courses: [], paths: [] };
    }
  },
  ["public-training-overview"],
  { revalidate: 300, tags: ["public-training"] },
);

export async function getPublishedFoundationCourse() {
  const { courses } = await getPublicTrainingOverview();
  return courses.find(
    (course) => course.slug === "virtual-assistant-foundations" && course.status === "published",
  ) || null;
}
