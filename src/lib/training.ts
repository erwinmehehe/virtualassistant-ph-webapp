import { createClient } from "@/lib/supabase/server";

type CourseRow = {
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
  review_requirement: "editorial" | "specialist";
  specialist_reviewed_by: string | null;
  specialist_reviewer_role: string | null;
  specialist_review_notes: string | null;
  specialist_reviewed_at: string | null;
  published_at: string | null;
  updated_at: string;
};

type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  position: number;
};

export type LessonContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "callout"; title?: string; text: string }
  | { type: "scenario"; title?: string; text: string };

export type LessonRow = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: LessonContentBlock[] | unknown;
  estimated_minutes: number;
  position: number;
  is_published: boolean;
  content_version: number;
  reviewed_by: string | null;
  last_reviewed_at: string | null;
};

type EnrollmentRow = {
  course_id: string;
  started_at: string;
  completed_at: string | null;
};

type CertificateRow = {
  course_id: string;
  credential_code: string;
  issued_at: string;
  revoked_at: string | null;
};

export type TrainingCourseSummary = CourseRow & {
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
  enrolled: boolean;
  startedAt: string | null;
  completedAt: string | null;
  certificate: CertificateRow | null;
};

export type TrainingLearningPathSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  country_focus: string | null;
  status: "draft" | "published" | "archived";
  courses: TrainingCourseSummary[];
};

export type TrainingModule = ModuleRow & {
  lessons: Array<LessonRow & { completed: boolean }>;
};

export type TrainingAssessmentSubmission = {
  id: string;
  assessment_id: string;
  status: "submitted" | "reviewed" | "needs_revision";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  response: Record<string, unknown>;
};

export type TrainingAssessment = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  instructions: string | null;
  assessment_type: "knowledge" | "practical";
  pass_score: number | null;
  position: number;
  is_published: boolean;
  latestSubmission?: TrainingAssessmentSubmission | null;
};

export type TrainingCourseDetail = CourseRow & {
  modules: TrainingModule[];
  assessments: TrainingAssessment[];
  enrolled: boolean;
  startedAt: string | null;
  completedAt: string | null;
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
};

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export async function getTrainingDashboard(userId: string) {
  const supabase = await createClient();
  const { data: courseData, error } = await supabase
    .from("training_courses")
    .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,review_requirement,specialist_reviewed_by,specialist_reviewer_role,specialist_review_notes,specialist_reviewed_at,published_at,updated_at")
    .eq("status", "published")
    .order("recommended_order", { ascending: true })
    .order("title");

  if (error) return { courses: [] as TrainingCourseSummary[], paths: [] as TrainingLearningPathSummary[], error: error.message };

  const courses = (courseData || []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  if (!courseIds.length) return { courses: [] as TrainingCourseSummary[], paths: [] as TrainingLearningPathSummary[], error: null };

  const { data: moduleData } = await supabase
    .from("training_modules")
    .select("id,course_id,title,summary,position")
    .in("course_id", courseIds)
    .order("position");

  const modules = (moduleData || []) as ModuleRow[];
  const moduleIds = modules.map((module) => module.id);

  const { data: lessonData } = moduleIds.length
    ? await supabase
        .from("training_lessons")
        .select("id,module_id,slug,title,summary,content,estimated_minutes,position,is_published,content_version,reviewed_by,last_reviewed_at")
        .in("module_id", moduleIds)
        .eq("is_published", true)
        .order("position")
    : { data: [] };

  const lessons = (lessonData || []) as LessonRow[];
  const lessonIds = lessons.map((lesson) => lesson.id);

  const [{ data: enrollmentData }, { data: progressData }, { data: certificateData }] = await Promise.all([
    supabase
      .from("training_enrollments")
      .select("course_id,started_at,completed_at")
      .eq("user_id", userId)
      .in("course_id", courseIds),
    lessonIds.length
      ? supabase
          .from("training_lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("training_certificates")
      .select("course_id,credential_code,issued_at,revoked_at")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  const enrollments = new Map(
    ((enrollmentData || []) as EnrollmentRow[]).map((row) => [row.course_id, row]),
  );
  const completed = new Set(
    ((progressData || []) as Array<{ lesson_id: string }>).map((row) => row.lesson_id),
  );
  const certificates = new Map(
    ((certificateData || []) as CertificateRow[]).map((row) => [row.course_id, row]),
  );
  const moduleCourse = new Map(modules.map((module) => [module.id, module.course_id]));

  const summaries = courses.map((course) => {
    const courseLessons = lessons.filter((lesson) => moduleCourse.get(lesson.module_id) === course.id);
    const completedLessons = courseLessons.filter((lesson) => completed.has(lesson.id)).length;
    const enrollment = enrollments.get(course.id) || null;
    return {
      ...course,
      lessonCount: courseLessons.length,
      completedLessons,
      progressPercent: enrollment?.completed_at
        ? 100
        : courseLessons.length > 0 && completedLessons === courseLessons.length
          ? 95
          : percent(completedLessons, courseLessons.length),
      enrolled: Boolean(enrollment),
      startedAt: enrollment?.started_at || null,
      completedAt: enrollment?.completed_at || null,
      certificate: certificates.get(course.id) || null,
    };
  });

  const { data: pathData } = await supabase
    .from("training_learning_paths")
    .select("id,slug,title,summary,country_focus,status")
    .eq("status", "published")
    .order("title");

  const pathRows = (pathData || []) as Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    country_focus: string | null;
    status: "draft" | "published" | "archived";
  }>;
  const pathIds = pathRows.map((item) => item.id);
  const { data: pathCourseData } = pathIds.length
    ? await supabase
        .from("training_learning_path_courses")
        .select("path_id,course_id,position")
        .in("path_id", pathIds)
        .order("position")
    : { data: [] };

  const pathCourses = (pathCourseData || []) as Array<{ path_id: string; course_id: string; position: number }>;
  const paths: TrainingLearningPathSummary[] = pathRows.map((item) => ({
    ...item,
    courses: pathCourses
      .filter((relation) => relation.path_id === item.id)
      .sort((a, b) => a.position - b.position)
      .map((relation) => summaries.find((course) => course.id === relation.course_id))
      .filter((course): course is TrainingCourseSummary => Boolean(course)),
  }));

  return { courses: summaries, paths, error: null };
}

export async function getTrainingCourse(slug: string, userId: string): Promise<{ course: TrainingCourseDetail | null; error: string | null }> {
  const supabase = await createClient();
  const { data: courseData, error } = await supabase
    .from("training_courses")
    .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,review_requirement,specialist_reviewed_by,specialist_reviewer_role,specialist_review_notes,specialist_reviewed_at,published_at,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !courseData) return { course: null, error: error?.message || null };
  const course = courseData as CourseRow;

  const { data: moduleData } = await supabase
    .from("training_modules")
    .select("id,course_id,title,summary,position")
    .eq("course_id", course.id)
    .order("position");

  const modules = (moduleData || []) as ModuleRow[];
  const moduleIds = modules.map((module) => module.id);

  const [{ data: lessonData }, { data: enrollmentData }, { data: assessmentData }] = await Promise.all([
    moduleIds.length
      ? supabase
          .from("training_lessons")
          .select("id,module_id,slug,title,summary,content,estimated_minutes,position,is_published,content_version,reviewed_by,last_reviewed_at")
          .in("module_id", moduleIds)
          .eq("is_published", true)
          .order("position")
      : Promise.resolve({ data: [] }),
    supabase
      .from("training_enrollments")
      .select("course_id,started_at,completed_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .maybeSingle(),
    supabase
      .from("training_assessments")
      .select("id,course_id,module_id,title,instructions,assessment_type,pass_score,position,is_published")
      .eq("course_id", course.id)
      .eq("is_published", true)
      .order("position"),
  ]);

  const lessons = (lessonData || []) as LessonRow[];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: progressData } = lessonIds.length
    ? await supabase
        .from("training_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const completed = new Set(
    ((progressData || []) as Array<{ lesson_id: string }>).map((row) => row.lesson_id),
  );

  const hydratedModules: TrainingModule[] = modules.map((module) => ({
    ...module,
    lessons: lessons
      .filter((lesson) => lesson.module_id === module.id)
      .map((lesson) => ({ ...lesson, completed: completed.has(lesson.id) })),
  }));

  const completedLessons = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const enrollment = enrollmentData as EnrollmentRow | null;
  const assessments = (assessmentData || []) as TrainingAssessment[];
  const assessmentIds = assessments.map((assessment) => assessment.id);
  const { data: submissionData } = assessmentIds.length
    ? await supabase
        .from("training_assessment_submissions")
        .select("id,assessment_id,status,score,feedback,submitted_at,reviewed_at,response")
        .eq("user_id", userId)
        .in("assessment_id", assessmentIds)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  const latestSubmissionByAssessment = new Map<string, TrainingAssessmentSubmission>();
  for (const submission of (submissionData || []) as TrainingAssessmentSubmission[]) {
    if (!latestSubmissionByAssessment.has(submission.assessment_id)) {
      latestSubmissionByAssessment.set(submission.assessment_id, submission);
    }
  }

  return {
    course: {
      ...course,
      modules: hydratedModules,
      assessments: assessments.map((assessment) => ({
        ...assessment,
        latestSubmission: latestSubmissionByAssessment.get(assessment.id) || null,
      })),
      enrolled: Boolean(enrollment),
      startedAt: enrollment?.started_at || null,
      completedAt: enrollment?.completed_at || null,
      lessonCount: lessons.length,
      completedLessons,
      progressPercent: enrollment?.completed_at
        ? 100
        : lessons.length > 0 && completedLessons === lessons.length
          ? 95
          : percent(completedLessons, lessons.length),
    },
    error: null,
  };
}

export async function getTrainingLesson(courseSlug: string, lessonId: string, userId: string) {
  const result = await getTrainingCourse(courseSlug, userId);
  if (!result.course) return { course: null, lesson: null, error: result.error };
  for (const courseModule of result.course.modules) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) return { course: result.course, lesson, error: null };
  }
  return { course: result.course, lesson: null, error: null };
}

export async function getTrainingAssessment(courseSlug: string, assessmentId: string, userId: string) {
  const result = await getTrainingCourse(courseSlug, userId);
  if (!result.course) return { course: null, assessment: null, error: result.error };
  const assessment = result.course.assessments.find((item) => item.id === assessmentId) || null;
  return { course: result.course, assessment, error: null };
}

export async function getTrainingAdminSummary() {
  const supabase = await createClient();
  const { data: courseData, error } = await supabase
    .from("training_courses")
    .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,review_requirement,specialist_reviewed_by,specialist_reviewer_role,specialist_review_notes,specialist_reviewed_at,published_at,updated_at")
    .order("recommended_order", { ascending: true })
    .order("title");

  if (error) {
    return {
      courses: [] as Array<CourseRow & { modules: number; lessons: number; publishedLessons: number }>,
      paths: [] as Array<{ id: string; slug: string; title: string; summary: string | null; country_focus: string | null; status: string; courseCount: number }>,
      totals: { courses: 0, published: 0, lessons: 0 },
      error: error.message,
    };
  }

  const courses = (courseData || []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  const { data: moduleData } = courseIds.length
    ? await supabase.from("training_modules").select("id,course_id").in("course_id", courseIds)
    : { data: [] };
  const modules = (moduleData || []) as Array<{ id: string; course_id: string }>;
  const moduleIds = modules.map((module) => module.id);
  const { data: lessonData } = moduleIds.length
    ? await supabase
        .from("training_lessons")
        .select("id,module_id,is_published")
        .in("module_id", moduleIds)
    : { data: [] };
  const lessons = (lessonData || []) as Array<{ id: string; module_id: string; is_published: boolean }>;
  const moduleCourse = new Map(modules.map((module) => [module.id, module.course_id]));

  const hydrated = courses.map((course) => {
    const courseModules = modules.filter((module) => module.course_id === course.id);
    const courseLessons = lessons.filter((lesson) => moduleCourse.get(lesson.module_id) === course.id);
    return {
      ...course,
      modules: courseModules.length,
      lessons: courseLessons.length,
      publishedLessons: courseLessons.filter((lesson) => lesson.is_published).length,
    };
  });

  const { data: adminPathData } = await supabase
    .from("training_learning_paths")
    .select("id,slug,title,summary,country_focus,status")
    .order("title");
  const adminPaths = (adminPathData || []) as Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    country_focus: string | null;
    status: string;
  }>;
  const adminPathIds = adminPaths.map((item) => item.id);
  const { data: adminPathCourseData } = adminPathIds.length
    ? await supabase
        .from("training_learning_path_courses")
        .select("path_id,course_id")
        .in("path_id", adminPathIds)
    : { data: [] };
  const adminPathCourses = (adminPathCourseData || []) as Array<{ path_id: string; course_id: string }>;

  return {
    courses: hydrated,
    paths: adminPaths.map((item) => ({
      ...item,
      courseCount: adminPathCourses.filter((relation) => relation.path_id === item.id).length,
    })),
    totals: {
      courses: hydrated.length,
      published: hydrated.filter((course) => course.status === "published").length,
      lessons: lessons.length,
    },
    error: null,
  };
}
