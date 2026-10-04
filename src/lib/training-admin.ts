import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonContentBlock, LessonRow, TrainingAssessment } from "@/lib/training";
import { hasCompleteTrainingPracticalLesson, isTrainingAssessmentPublishReady, isTrainingPracticalAssessmentReady } from "@/lib/training-quality";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: "foundation" | "software" | "industry" | "skill";
  country_focus: string | null;
  estimated_minutes: number;
  recommended_order: number | null;
  status: "draft" | "published" | "archived";
  content_version: number;
  trademark_disclaimer: string | null;
  reviewed_by: string | null;
  last_reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminModule = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  position: number;
};

export async function getTrainingCourseForAdmin(courseId: string) {
  const admin = createAdminClient();
  const { data: courseData, error } = await admin
    .from("training_courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !courseData) return { course: null, error: error?.message || null };

  const course = courseData as AdminCourse;
  const { data: moduleData } = await admin
    .from("training_modules")
    .select("id,course_id,title,summary,position")
    .eq("course_id", courseId)
    .order("position");

  const modules = (moduleData || []) as AdminModule[];
  const moduleIds = modules.map((item) => item.id);
  const [{ data: lessonData }, { data: assessmentData }] = await Promise.all([
    moduleIds.length
      ? admin
          .from("training_lessons")
          .select("id,module_id,slug,title,summary,content,estimated_minutes,position,is_published,content_version,reviewed_by,last_reviewed_at")
          .in("module_id", moduleIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    admin
      .from("training_assessments")
      .select("id,course_id,module_id,title,instructions,assessment_type,pass_score,position,is_published,rubric,resource_pack")
      .eq("course_id", courseId)
      .order("position"),
  ]);

  const lessons = (lessonData || []) as LessonRow[];
  const assessments = (assessmentData || []) as TrainingAssessment[];
  const assessmentIds = assessments.map((assessment) => assessment.id);
  const { data: submissionData } = assessmentIds.length
    ? await admin
        .from("training_assessment_submissions")
        .select("user_id,assessment_id,status,score,response,submitted_at")
        .in("assessment_id", assessmentIds)
        .order("submitted_at", { ascending: true })
    : { data: [] };

  const automaticSubmissions = (submissionData || []).filter(
    (submission) =>
      submission.response &&
      typeof submission.response === "object" &&
      !Array.isArray(submission.response) &&
      submission.response.kind === "automatic_knowledge_check",
  );
  const scored = automaticSubmissions.filter(
    (submission) => submission.score !== null && Number.isFinite(Number(submission.score)),
  );
  const firstAttempts = automaticSubmissions.filter(
    (submission) =>
      submission.response &&
      typeof submission.response === "object" &&
      !Array.isArray(submission.response) &&
      Number(submission.response.attempt || 0) === 1,
  );
  const assessmentCalibration = {
    attempts: automaticSubmissions.length,
    learners: new Set(automaticSubmissions.map((submission) => submission.user_id)).size,
    averageScore: scored.length
      ? Math.round(
          (scored.reduce((sum, submission) => sum + Number(submission.score || 0), 0) / scored.length) * 10,
        ) / 10
      : null,
    firstAttemptCount: firstAttempts.length,
    firstAttemptPasses: firstAttempts.filter((submission) => submission.status === "reviewed").length,
    criticalBoundaryMisses: automaticSubmissions.filter(
      (submission) =>
        submission.response &&
        typeof submission.response === "object" &&
        !Array.isArray(submission.response) &&
        Number(submission.response.critical_miss_count || 0) > 0,
    ).length,
    answerPatternFlags: automaticSubmissions.filter(
      (submission) =>
        submission.response &&
        typeof submission.response === "object" &&
        !Array.isArray(submission.response) &&
        submission.response.answer_pattern_flagged === true,
    ).length,
  };

  const hydratedModules = modules.map((item) => ({
    ...item,
    lessons: lessons.filter((lesson) => lesson.module_id === item.id),
  }));

  return {
    course: {
      ...course,
      modules: hydratedModules,
      assessments,
      assessmentCalibration,
    },
    error: null,
  };
}

export async function getTrainingLessonForAdmin(courseId: string, lessonId: string) {
  const result = await getTrainingCourseForAdmin(courseId);
  if (!result.course) return { course: null, lesson: null, module: null, error: result.error };

  for (const courseModule of result.course.modules) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) return { course: result.course, lesson, module: courseModule, error: null };
  }

  return { course: result.course, lesson: null, module: null, error: null };
}

export function lessonBlocks(value: unknown): LessonContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((block): block is LessonContentBlock => {
    if (!block || typeof block !== "object" || !("type" in block)) return false;
    const type = String((block as { type?: unknown }).type || "");
    return ["heading", "paragraph", "list", "steps", "callout", "scenario", "exercise", "template", "checklist"].includes(type);
  });
}
