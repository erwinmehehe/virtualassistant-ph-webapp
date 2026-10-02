import { createClient } from "@/lib/supabase/server";
import {
  getAustraliaSpecialization,
  getAustraliaSpecializationsForCourse,
  type AustraliaSpecializationSlug,
} from "@/lib/training-specializations";

export type TrainingPathContextCourse = {
  slug: string;
  title: string;
  enrolled: boolean;
  completed: boolean;
};

export type TrainingPathContextPrimary = {
  slug: AustraliaSpecializationSlug;
  title: string;
  currentStep: number;
  totalSteps: number;
  completedCount: number;
  progressPercent: number;
  isSelected: boolean;
  nextCourse: TrainingPathContextCourse | null;
};

export type TrainingPathContext = {
  primary: TrainingPathContextPrimary | null;
  alternatives: Array<{
    slug: AustraliaSpecializationSlug;
    title: string;
  }>;
};

export async function getTrainingPathContext(
  courseSlug: string,
  userId: string,
): Promise<TrainingPathContext> {
  const candidates = getAustraliaSpecializationsForCourse(courseSlug);
  if (!candidates.length) return { primary: null, alternatives: [] };

  const supabase = await createClient();
  const { data: preferences } = await supabase
    .from("training_learner_preferences")
    .select("australia_specialization")
    .eq("user_id", userId)
    .maybeSingle();

  const selectedSlug =
    typeof preferences?.australia_specialization === "string"
      ? preferences.australia_specialization
      : null;

  const selected = selectedSlug
    ? candidates.find((item) => item.slug === selectedSlug) || null
    : null;

  const primary = selected || (candidates.length === 1 ? candidates[0] : null);
  const alternatives = candidates
    .filter((item) => item.slug !== primary?.slug)
    .map((item) => ({ slug: item.slug, title: item.title }));

  if (!primary) {
    return { primary: null, alternatives };
  }

  const specialization = getAustraliaSpecialization(primary.slug);
  if (!specialization) return { primary: null, alternatives };

  const { data: courseRows } = await supabase
    .from("training_courses")
    .select("id,slug,title")
    .in("slug", [...specialization.courses])
    .eq("status", "published");

  const bySlug = new Map(
    (courseRows || []).map((course) => [
      course.slug,
      { id: course.id, slug: course.slug, title: course.title },
    ]),
  );

  const orderedCourses = specialization.courses
    .map((slug) => bySlug.get(slug) || null)
    .filter(
      (
        course,
      ): course is {
        id: string;
        slug: string;
        title: string;
      } => Boolean(course),
    );

  const courseIds = orderedCourses.map((course) => course.id);
  const { data: enrollmentRows } = courseIds.length
    ? await supabase
        .from("training_enrollments")
        .select("course_id,started_at,completed_at")
        .eq("user_id", userId)
        .in("course_id", courseIds)
    : { data: [] };

  const enrollmentByCourse = new Map(
    (enrollmentRows || []).map((row) => [row.course_id, row]),
  );

  const hydrated: TrainingPathContextCourse[] = orderedCourses.map((course) => {
    const enrollment = enrollmentByCourse.get(course.id);
    return {
      slug: course.slug,
      title: course.title,
      enrolled: Boolean(enrollment),
      completed: Boolean(enrollment?.completed_at),
    };
  });

  const currentIndex = hydrated.findIndex((course) => course.slug === courseSlug);
  const completedCount = hydrated.filter((course) => course.completed).length;
  const totalSteps = hydrated.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

  const nextCourse =
    currentIndex >= 0
      ? hydrated.slice(currentIndex + 1).find((course) => !course.completed) || null
      : null;

  return {
    primary: {
      slug: primary.slug,
      title: primary.title,
      currentStep: currentIndex >= 0 ? currentIndex + 1 : 1,
      totalSteps,
      completedCount,
      progressPercent,
      isSelected: primary.slug === selectedSlug,
      nextCourse,
    },
    alternatives,
  };
}
