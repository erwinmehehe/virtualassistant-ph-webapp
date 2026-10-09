import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildTrainingCompletionHealth } from "@/lib/training-completion-health";
import { buildTrainingCohortConversion } from "@/lib/training-cohort-conversion";
import { buildTrainingLessonBottlenecks } from "@/lib/training-lesson-bottlenecks";

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
  | { type: "scenario"; title?: string; text: string }
  | { type: "exercise"; title?: string; text: string; deliverable?: string }
  | { type: "template"; title?: string; text: string }
  | { type: "checklist"; title?: string; items: string[] };

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
  id: string;
  course_id: string;
  credential_code: string;
  issued_at: string;
  revoked_at: string | null;
  metadata: Record<string, unknown> | null;
  publicVisible: boolean;
};

type LessonProgressRow = {
  lesson_id: string;
  completed_at: string;
};

type AssessmentSummaryRow = {
  id: string;
  course_id: string;
  title: string;
  pass_score: number | null;
  position: number;
};

type AssessmentSubmissionSummaryRow = {
  assessment_id: string;
  status: "submitted" | "reviewed" | "needs_revision";
  score: number | null;
  submitted_at: string;
};

export type TrainingDashboardLearnerProfile = {
  primaryCategory: string | null;
  categories: string[];
  tools: string[];
  industries: string[];
};

export type TrainingLearnerPreferences = {
  australiaSpecialization: string | null;
  australiaSelectedAt: string | null;
};

export type TrainingCourseSummary = CourseRow & {
  searchTerms: string[];
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
  enrolled: boolean;
  startedAt: string | null;
  completedAt: string | null;
  certificate: CertificateRow | null;
  nextLesson: { id: string; title: string; estimatedMinutes: number } | null;
  nextAssessment: { id: string; title: string } | null;
  assessmentStatus: "not_required" | "not_started" | "ready" | "in_review" | "needs_revision" | "passed";
  lastActivityAt: string | null;
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
  rubric_scores: Record<string, number>;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  response: Record<string, unknown>;
};

export type TrainingAssessmentRubricCriterion = {
  id: string;
  label: string;
  weight: number;
  description: string;
  hard_fail?: boolean;
};

export type TrainingAssessmentResource = {
  id: string;
  title: string;
  kind: "brief" | "dataset" | "document" | "policy" | "checklist" | "csv";
  content: string;
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
  rubric: TrainingAssessmentRubricCriterion[];
  resource_pack: TrainingAssessmentResource[];
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
  certificate: CertificateRow | null;
};

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export async function getTrainingDashboard(userId: string) {
  const supabase = await createClient();
  const [
    { data: authUserData },
    { data: courseData, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("training_courses")
      .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,published_at,updated_at")
      .eq("status", "published")
      .order("recommended_order", { ascending: true })
      .order("title"),
  ]);
  const learnerName = String(authUserData.user?.user_metadata?.full_name || "").trim() || null;

  if (error) {
    return {
      courses: [] as TrainingCourseSummary[],
      paths: [] as TrainingLearningPathSummary[],
      learnerProfile: null as TrainingDashboardLearnerProfile | null,
      learnerPreferences: null as TrainingLearnerPreferences | null,
      savedCourseIds: [] as string[],
      learnerName,
      error: error.message,
    };
  }

  const courses = (courseData || []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  if (!courseIds.length) {
    return {
      courses: [] as TrainingCourseSummary[],
      paths: [] as TrainingLearningPathSummary[],
      learnerProfile: null as TrainingDashboardLearnerProfile | null,
      learnerPreferences: null as TrainingLearnerPreferences | null,
      savedCourseIds: [] as string[],
      learnerName,
      error: null,
    };
  }

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

  const [
    { data: enrollmentData },
    { data: progressData },
    { data: engagementData },
    { data: certificateData },
    { data: assessmentData },
    { data: learnerProfileData },
    { data: learnerPreferencesData },
    { data: savedCourseData },
  ] = await Promise.all([
    supabase
      .from("training_enrollments")
      .select("course_id,started_at,completed_at")
      .eq("user_id", userId)
      .in("course_id", courseIds),
    lessonIds.length
      ? supabase
          .from("training_lesson_progress")
          .select("lesson_id,completed_at")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] }),
    // Engagement is deliberately server-only under RLS. Read only this
    // authenticated learner's rows with the admin client; never widen the
    // policy or use caller-provided user IDs without a verified auth match.
    lessonIds.length && authUserData.user?.id === userId
      ? createAdminClient()
          .from("training_lesson_engagement")
          .select("lesson_id,last_activity_at,updated_at")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("training_certificates")
      .select("id,course_id,credential_code,issued_at,revoked_at,metadata")
      .eq("user_id", userId)
      .in("course_id", courseIds),
    supabase
      .from("training_assessments")
      .select("id,course_id,title,pass_score,position")
      .in("course_id", courseIds)
      .eq("is_published", true)
      .order("position"),
    supabase
      .from("va_profiles")
      .select("primary_category,categories,tools,industries")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("training_learner_preferences")
      .select("australia_specialization,australia_selected_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("training_saved_courses")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  const enrollments = new Map(
    ((enrollmentData || []) as EnrollmentRow[]).map((row) => [row.course_id, row]),
  );
  const progressRows = (progressData || []) as LessonProgressRow[];
  const completed = new Set(progressRows.map((row) => row.lesson_id));
  const progressByLesson = new Map(progressRows.map((row) => [row.lesson_id, row.completed_at]));
  const engagementActivityByLesson = new Map(
    ((engagementData || []) as Array<{
      lesson_id: string;
      last_activity_at: string | null;
      updated_at: string;
    }>).map((row) => [row.lesson_id, row.last_activity_at || row.updated_at]),
  );
  const certificates = new Map(
    ((certificateData || []) as Array<Omit<CertificateRow, "publicVisible">>).map((row) => [
      row.course_id,
      {
        ...row,
        publicVisible: row.metadata?.public_profile_visible === true,
      } satisfies CertificateRow,
    ]),
  );
  const assessments = (assessmentData || []) as AssessmentSummaryRow[];
  const assessmentIds = assessments.map((assessment) => assessment.id);
  const { data: submissionData } = assessmentIds.length
    ? await supabase
        .from("training_assessment_submissions")
        .select("assessment_id,status,score,submitted_at")
        .eq("user_id", userId)
        .in("assessment_id", assessmentIds)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  const latestSubmissionByAssessment = new Map<string, AssessmentSubmissionSummaryRow>();
  for (const submission of (submissionData || []) as AssessmentSubmissionSummaryRow[]) {
    if (!latestSubmissionByAssessment.has(submission.assessment_id)) {
      latestSubmissionByAssessment.set(submission.assessment_id, submission);
    }
  }

  const summaries = courses.map((course) => {
    const courseModules = modules
      .filter((module) => module.course_id === course.id)
      .sort((a, b) => a.position - b.position);
    const courseLessons = courseModules.flatMap((module) =>
      lessons
        .filter((lesson) => lesson.module_id === module.id)
        .sort((a, b) => a.position - b.position),
    );
    const completedLessons = courseLessons.filter((lesson) => completed.has(lesson.id)).length;
    const enrollment = enrollments.get(course.id) || null;
    const courseAssessments = assessments
      .filter((assessment) => assessment.course_id === course.id)
      .sort((a, b) => a.position - b.position);
    const assessmentPassed = (assessment: AssessmentSummaryRow) => {
      const latest = latestSubmissionByAssessment.get(assessment.id);
      return Boolean(
        latest &&
          latest.status === "reviewed" &&
          (assessment.pass_score === null ||
            (latest.score !== null && Number(latest.score) >= assessment.pass_score)),
      );
    };
    const nextAssessmentRow = courseAssessments.find((assessment) => !assessmentPassed(assessment)) || null;
    const hasNeedsRevision = courseAssessments.some(
      (assessment) => latestSubmissionByAssessment.get(assessment.id)?.status === "needs_revision",
    );
    const hasInReview = courseAssessments.some(
      (assessment) => latestSubmissionByAssessment.get(assessment.id)?.status === "submitted",
    );
    const allAssessmentsPassed =
      courseAssessments.length > 0 && courseAssessments.every((assessment) => assessmentPassed(assessment));
    const assessmentStatus: TrainingCourseSummary["assessmentStatus"] = !courseAssessments.length
      ? "not_required"
      : allAssessmentsPassed
        ? "passed"
        : hasNeedsRevision
          ? "needs_revision"
          : hasInReview
            ? "in_review"
            : courseLessons.length > 0 && completedLessons === courseLessons.length
              ? "ready"
              : "not_started";
    const nextLessonRow = courseLessons.find((lesson) => !completed.has(lesson.id)) || null;
    const activityDates = [
      enrollment?.started_at || null,
      ...courseLessons.map((lesson) => progressByLesson.get(lesson.id) || null),
      // Partial reading is meaningful activity even before a lesson is marked
      // complete. Without this, multi-course learners resume the wrong course.
      ...courseLessons.map((lesson) => engagementActivityByLesson.get(lesson.id) || null),
      ...courseAssessments.map(
        (assessment) => latestSubmissionByAssessment.get(assessment.id)?.submitted_at || null,
      ),
    ].filter((value): value is string => Boolean(value));
    const lastActivityAt = activityDates.length
      ? activityDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    return {
      ...course,
      searchTerms: courseLessons.map((lesson) => lesson.title),
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
      nextLesson: nextLessonRow
        ? {
            id: nextLessonRow.id,
            title: nextLessonRow.title,
            estimatedMinutes: nextLessonRow.estimated_minutes,
          }
        : null,
      nextAssessment: !nextLessonRow && nextAssessmentRow
        ? { id: nextAssessmentRow.id, title: nextAssessmentRow.title }
        : null,
      assessmentStatus,
      lastActivityAt,
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

  const learnerProfile = learnerProfileData
    ? {
        primaryCategory: learnerProfileData.primary_category || null,
        categories: Array.isArray(learnerProfileData.categories) ? learnerProfileData.categories : [],
        tools: Array.isArray(learnerProfileData.tools) ? learnerProfileData.tools : [],
        industries: Array.isArray(learnerProfileData.industries) ? learnerProfileData.industries : [],
      }
    : null;

  const learnerPreferences: TrainingLearnerPreferences | null = learnerPreferencesData
    ? {
        australiaSpecialization: learnerPreferencesData.australia_specialization || null,
        australiaSelectedAt: learnerPreferencesData.australia_selected_at || null,
      }
    : null;

  const savedCourseIds = (savedCourseData || []).map((row) => row.course_id);

  return { courses: summaries, paths, learnerProfile, learnerPreferences, savedCourseIds, learnerName, error: null };
}

export async function getTrainingCourse(slug: string, userId: string): Promise<{ course: TrainingCourseDetail | null; error: string | null }> {
  const supabase = await createClient();
  const { data: courseData, error } = await supabase
    .from("training_courses")
    .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,published_at,updated_at")
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

  const [
    { data: lessonData },
    { data: enrollmentData },
    { data: assessmentData },
    { data: certificateData },
  ] = await Promise.all([
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
      .select("id,course_id,module_id,title,instructions,assessment_type,pass_score,position,is_published,rubric,resource_pack")
      .eq("course_id", course.id)
      .eq("is_published", true)
      .order("position"),
    supabase
      .from("training_certificates")
      .select("id,course_id,credential_code,issued_at,revoked_at,metadata")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .is("revoked_at", null)
      .maybeSingle(),
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
        .select("id,assessment_id,status,score,rubric_scores,feedback,submitted_at,reviewed_at,response")
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
      certificate: certificateData
        ? {
            ...(certificateData as Omit<CertificateRow, "publicVisible">),
            publicVisible:
              (certificateData as Omit<CertificateRow, "publicVisible">).metadata
                ?.public_profile_visible === true,
          }
        : null,
    },
    error: null,
  };
}

export async function getTrainingLesson(courseSlug: string, lessonId: string, userId: string) {
  const result = await getTrainingCourse(courseSlug, userId);
  if (!result.course) return { course: null, lesson: null, engagement: null, error: result.error };
  for (const courseModule of result.course.modules) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      const admin = createAdminClient();
      const { data: engagement } = await admin
        .from("training_lesson_engagement")
        .select("active_seconds,max_scroll_percent,checkpoint_passed_at,checkpoint_key,exercise_response,last_activity_at")
        .eq("user_id", userId)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      return {
        course: result.course,
        lesson,
        engagement: engagement
          ? {
              activeSeconds: Number(engagement.active_seconds || 0),
              maxScrollPercent: Number(engagement.max_scroll_percent || 0),
              checkpointPassedAt: engagement.checkpoint_passed_at || null,
              checkpointKey: engagement.checkpoint_key || null,
              exerciseResponse: engagement.exercise_response || "",
              lastActivityAt: engagement.last_activity_at || null,
            }
          : {
              activeSeconds: 0,
              maxScrollPercent: 0,
              checkpointPassedAt: null,
              checkpointKey: null,
              exerciseResponse: "",
              lastActivityAt: null,
            },
        error: null,
      };
    }
  }
  return { course: result.course, lesson: null, engagement: null, error: null };
}

export async function getTrainingAssessment(courseSlug: string, assessmentId: string, userId: string) {
  const result = await getTrainingCourse(courseSlug, userId);
  if (!result.course) {
    return {
      course: null,
      assessment: null,
      attemptState: { total: 0, last24Hours: 0, retryAt: null as string | null },
      error: result.error,
    };
  }
  const assessment = result.course.assessments.find((item) => item.id === assessmentId) || null;
  if (!assessment) {
    return {
      course: result.course,
      assessment: null,
      attemptState: { total: 0, last24Hours: 0, retryAt: null as string | null },
      error: null,
    };
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data: attempts } = await admin
    .from("training_assessment_submissions")
    .select("submitted_at,status,score")
    .eq("user_id", userId)
    .eq("assessment_id", assessment.id)
    .order("submitted_at", { ascending: true });

  const attemptRows = (attempts || []) as Array<{
    submitted_at: string;
    status: "submitted" | "reviewed" | "needs_revision";
    score: number | null;
  }>;
  const recentAttempts = attemptRows.filter((row) => row.submitted_at >= since);
  const retryAt =
    recentAttempts.length >= 3
      ? new Date(new Date(recentAttempts[0].submitted_at).getTime() + 86_400_000).toISOString()
      : null;

  return {
    course: result.course,
    assessment,
    attemptState: {
      total: attemptRows.length,
      last24Hours: recentAttempts.length,
      retryAt,
    },
    error: null,
  };
}

export async function getTrainingAdminSummary() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: courseData, error } = await supabase
    .from("training_courses")
    .select("id,slug,title,summary,category,country_focus,estimated_minutes,recommended_order,status,content_version,trademark_disclaimer,reviewed_by,last_reviewed_at,published_at,updated_at")
    .order("recommended_order", { ascending: true })
    .order("title");

  if (error) {
    return {
      courses: [] as Array<CourseRow & { modules: number; lessons: number; publishedLessons: number }>,
      paths: [] as Array<{ id: string; slug: string; title: string; summary: string | null; country_focus: string | null; status: string; courseCount: number }>,
      totals: { courses: 0, published: 0, lessons: 0 },
      funnel: {
        windowDays: 30,
        stages: [] as Array<{ event: string; label: string; learners: number; events: number }>,
      },
      recovery: {
        inactivityHours: 72,
        incompleteEnrollments: 0,
        stalled72h: 0,
        stalled7d: 0,
        remindersSent: 0,
      },
      completionHealth: buildTrainingCompletionHealth({
        courses: [], enrollments: [], progress: [], engagement: [],
        assessments: [], nowMs: Date.now(), complete: false,
      }),
      cohortConversion: buildTrainingCohortConversion({
        courses: [], enrollments: [], nowMs: Date.now(), complete: false,
      }),
      lessonBottlenecks: buildTrainingLessonBottlenecks({
        courses: [], modules: [], lessons: [], enrollments: [],
        progress: [], engagement: [], nowMs: Date.now(), complete: false,
      }),
      integrity: {
        windowDays: 30,
        checkpointAttempts: 0,
        checkpointFailureRate: 0,
        firstAttemptPassRate: 0,
        retryRate: 0,
        automaticFinalAttempts: 0,
        averageFinalScore: 0,
        criticalBoundaryMisses: 0,
        answerPatternFlags: 0,
        averageActiveSeconds: 0,
        thresholdHuggingCompletions: 0,
        completedLessonsWithEngagement: 0,
        lessonFailures: [] as Array<{
          lessonId: string;
          lessonTitle: string;
          courseTitle: string;
          attempts: number;
          failures: number;
          failureRate: number;
          finalMisses: number;
        }>,
      },
      error: error.message,
    };
  }

  const courses = (courseData || []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  const { data: moduleData, error: modulesError } = courseIds.length
    ? await supabase.from("training_modules").select("id,course_id,position").in("course_id", courseIds)
    : { data: [], error: null };
  const modules = (moduleData || []) as Array<{ id: string; course_id: string; position: number }>;
  const moduleIds = modules.map((module) => module.id);
  const { data: lessonData, error: lessonsError } = moduleIds.length
    ? await supabase
        .from("training_lessons")
        .select("id,module_id,title,estimated_minutes,is_published,position")
        .in("module_id", moduleIds)
    : { data: [], error: null };
  const lessons = (lessonData || []) as Array<{
    id: string;
    module_id: string;
    title: string;
    estimated_minutes: number;
    is_published: boolean;
    position: number;
  }>;
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

  const funnelWindowDays = 30;
  const funnelSince = new Date(Date.now() - funnelWindowDays * 86_400_000).toISOString();
  const funnelDefinitions = [
    { event: "training_course_view", label: "Viewed a course" },
    { event: "training_course_start", label: "Started a course" },
    { event: "training_lesson_complete", label: "Completed a lesson" },
    { event: "training_assessment_view", label: "Opened final check" },
    { event: "training_assessment_submit", label: "Submitted final check" },
    { event: "training_assessment_reviewed", label: "Final check scored" },
    { event: "training_course_complete", label: "Completed a course" },
    { event: "training_certificate_issued", label: "Certificate issued" },
    { event: "training_certificate_profile_added", label: "Added certificate to public profile" },
    { event: "training_certificate_recruiter_view", label: "Recruiter viewed verified training" },
    { event: "training_certificate_view", label: "Viewed certificate" },
  ] as const;
  const { data: funnelEventData } = await admin
    .from("analytics_events")
    .select("event_name,user_id")
    .gte("created_at", funnelSince)
    .in("event_name", funnelDefinitions.map((item) => item.event))
    .limit(10000);

  const funnelRows = (funnelEventData || []) as Array<{
    event_name: string;
    user_id: string | null;
  }>;
  const funnel = {
    windowDays: funnelWindowDays,
    stages: funnelDefinitions.map((definition) => {
      const matching = funnelRows.filter((row) => row.event_name === definition.event);
      return {
        ...definition,
        learners: new Set(matching.map((row) => row.user_id).filter(Boolean)).size,
        events: matching.length,
      };
    }),
  };

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const lessonMeta = new Map(
    lessons.map((lesson) => {
      const courseId = moduleCourse.get(lesson.module_id) || "";
      const course = courseById.get(courseId);
      return [
        lesson.id,
        {
          title: lesson.title,
          estimatedMinutes: Number(lesson.estimated_minutes || 1),
          courseTitle: course?.title || "Course",
          courseSlug: course?.slug || "",
        },
      ] as const;
    }),
  );

  const [{ data: checkpointEventData }, { data: engagementData }, { data: completionData }, { data: submissionData }] =
    await Promise.all([
      admin
        .from("analytics_events")
        .select("metadata,user_id")
        .eq("event_name", "training_checkpoint_attempt")
        .gte("created_at", funnelSince)
        .limit(10000),
      admin
        .from("training_lesson_engagement")
        .select("lesson_id,user_id,active_seconds,max_scroll_percent,updated_at")
        .gte("updated_at", funnelSince)
        .limit(10000),
      admin
        .from("training_lesson_progress")
        .select("lesson_id,user_id,completed_at")
        .gte("completed_at", funnelSince)
        .limit(10000),
      admin
        .from("training_assessment_submissions")
        .select("user_id,status,score,response,submitted_at")
        .gte("submitted_at", funnelSince)
        .limit(10000),
    ]);

  const checkpointRows = (checkpointEventData || []) as Array<{
    metadata: Record<string, unknown> | null;
    user_id: string | null;
  }>;
  const engagements = (engagementData || []) as Array<{
    lesson_id: string;
    user_id: string;
    active_seconds: number;
    max_scroll_percent: number;
    updated_at: string;
  }>;
  const completions = (completionData || []) as Array<{
    lesson_id: string;
    user_id: string;
    completed_at: string | null;
  }>;
  const submissions = (submissionData || []) as Array<{
    user_id: string;
    status: "submitted" | "reviewed" | "needs_revision";
    score: number | null;
    response: Record<string, unknown> | null;
    submitted_at: string;
  }>;

  const checkpointByLesson = new Map<string, { attempts: number; failures: number }>();
  for (const row of checkpointRows) {
    const lessonId = typeof row.metadata?.lesson_id === "string" ? row.metadata.lesson_id : "";
    if (!lessonId) continue;
    const current = checkpointByLesson.get(lessonId) || { attempts: 0, failures: 0 };
    current.attempts += 1;
    if (row.metadata?.correct !== true) current.failures += 1;
    checkpointByLesson.set(lessonId, current);
  }

  const automaticSubmissions = submissions.filter(
    (row) => row.response?.kind === "automatic_knowledge_check",
  );
  const finalMissesByLesson = new Map<string, number>();
  for (const submission of automaticSubmissions) {
    const missed = Array.isArray(submission.response?.missed_lesson_ids)
      ? submission.response?.missed_lesson_ids
      : [];
    for (const value of missed) {
      if (typeof value !== "string") continue;
      finalMissesByLesson.set(value, (finalMissesByLesson.get(value) || 0) + 1);
    }
  }

  const completionKeys = new Set(
    completions.map((row) => `${row.user_id}:${row.lesson_id}`),
  );
  const completedEngagement = engagements.filter((row) =>
    completionKeys.has(`${row.user_id}:${row.lesson_id}`),
  );
  const averageActiveSeconds = completedEngagement.length
    ? Math.round(
        completedEngagement.reduce((sum, row) => sum + Number(row.active_seconds || 0), 0) /
          completedEngagement.length,
      )
    : 0;
  const thresholdHuggingCompletions = completedEngagement.filter((row) => {
    const meta = lessonMeta.get(row.lesson_id);
    if (!meta) return false;
    const required = Math.max(
      60,
      Math.min(300, Math.ceil(meta.estimatedMinutes * 60 * 0.2)),
    );
    return Number(row.active_seconds || 0) <= required + 20;
  }).length;

  const scoredAutomaticSubmissions = automaticSubmissions.filter(
    (row) => row.score !== null && Number.isFinite(Number(row.score)),
  );
  const averageFinalScore = scoredAutomaticSubmissions.length
    ? Math.round(
        scoredAutomaticSubmissions.reduce((sum, row) => sum + Number(row.score || 0), 0) /
          scoredAutomaticSubmissions.length,
      )
    : 0;
  const criticalBoundaryMisses = automaticSubmissions.filter(
    (row) => Number(row.response?.critical_miss_count || 0) > 0,
  ).length;
  const answerPatternFlags = automaticSubmissions.filter(
    (row) => row.response?.answer_pattern_flagged === true,
  ).length;

  const firstAttempts = automaticSubmissions.filter(
    (row) => Number(row.response?.attempt || 0) === 1,
  );
  const firstAttemptPasses = firstAttempts.filter((row) => row.status === "reviewed");
  const retries = automaticSubmissions.filter((row) => Number(row.response?.attempt || 0) > 1);
  const assessedLearners = new Set(automaticSubmissions.map((row) => row.user_id));
  const retryLearners = new Set(retries.map((row) => row.user_id));

  const lessonFailures = [...new Set([
    ...checkpointByLesson.keys(),
    ...finalMissesByLesson.keys(),
  ])]
    .map((lessonId) => {
      const checkpoint = checkpointByLesson.get(lessonId) || { attempts: 0, failures: 0 };
      const meta = lessonMeta.get(lessonId);
      return {
        lessonId,
        lessonTitle: meta?.title || "Lesson",
        courseTitle: meta?.courseTitle || "Course",
        attempts: checkpoint.attempts,
        failures: checkpoint.failures,
        failureRate: checkpoint.attempts
          ? Math.round((checkpoint.failures / checkpoint.attempts) * 100)
          : 0,
        finalMisses: finalMissesByLesson.get(lessonId) || 0,
      };
    })
    .filter((item) => item.attempts || item.finalMisses)
    .sort((a, b) =>
      b.finalMisses - a.finalMisses ||
      b.failureRate - a.failureRate ||
      b.attempts - a.attempts
    )
    .slice(0, 10);

  const checkpointAttempts = checkpointRows.length;
  const checkpointFailures = checkpointRows.filter((row) => row.metadata?.correct !== true).length;
  // The Data API may enforce a 1,000-row response ceiling regardless of
  // .limit(). Page in stable order and chunk user IDs so completion rates never
  // silently omit late rows or exceed a long REST query-string limit.
  type HealthPage<T> = { data: T[] | null; error: { message: string } | null };
  async function loadHealthRows<T>(
    identifiers: string[],
    query: (ids: string[], from: number, to: number) => PromiseLike<HealthPage<T>>,
  ): Promise<{ rows: T[]; complete: boolean }> {
    const rows: T[] = [];
    const pageSize = 500;
    const limit = 10000;
    for (let i = 0; i < identifiers.length; i += 100) {
      const batch = identifiers.slice(i, i + 100);
      let exhausted = false;
      for (let from = 0; from < limit; from += pageSize) {
        const { data, error: pageError } = await query(batch, from, from + pageSize - 1);
        if (pageError || !data) return { rows: [], complete: false };
        rows.push(...data);
        if (rows.length >= limit) return { rows: [], complete: false };
        if (data.length < pageSize) {
          exhausted = true;
          break;
        }
      }
      if (!exhausted) return { rows: [], complete: false };
    }
    return { rows, complete: true };
  }

  type HealthEnrollment = { user_id: string; course_id: string; started_at: string; completed_at: string | null };
  type HealthProgress = { user_id: string; lesson_id: string; completed_at: string };
  type HealthEngagement = {
    user_id: string; lesson_id: string; last_activity_at: string | null;
    updated_at: string; active_seconds: number | null;
  };
  type HealthAssessment = { user_id: string; assessment_id: string; submitted_at: string; status: string };
  const [enrollmentResult, assessmentCatalogResult] = await Promise.all([
    loadHealthRows<HealthEnrollment>(courseIds, (ids, from, to) =>
      admin.from("training_enrollments")
        .select("user_id,course_id,started_at,completed_at")
        .in("course_id", ids).order("user_id").order("course_id").range(from, to)),
    courseIds.length
      ? admin.from("training_assessments").select("id,course_id").in("course_id", courseIds).limit(1000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const allEnrollments = enrollmentResult.rows;
  const incompleteEnrollments = allEnrollments.filter((row) => !row.completed_at);
  const incompleteUserIds = [...new Set(incompleteEnrollments.map((row) => row.user_id))];
  const publishedLessonIds = lessons.filter((lesson) => lesson.is_published).map((lesson) => lesson.id);
  const assessmentsForCourses = (assessmentCatalogResult.data || []) as Array<{ id: string; course_id: string }>;
  const assessmentCourseId = new Map(assessmentsForCourses.map((row) => [row.id, row.course_id]));

  const [progressResult, engagementResult, assessmentResult, trainingReminderResult] = await Promise.all([
    publishedLessonIds.length
      ? loadHealthRows<HealthProgress>(incompleteUserIds, (ids, from, to) =>
          admin.from("training_lesson_progress")
            .select("user_id,lesson_id,completed_at")
            .in("user_id", ids).order("user_id").order("lesson_id").range(from, to))
      : Promise.resolve({ rows: [] as HealthProgress[], complete: true }),
    publishedLessonIds.length
      ? loadHealthRows<HealthEngagement>(incompleteUserIds, (ids, from, to) =>
          admin.from("training_lesson_engagement")
            .select("user_id,lesson_id,last_activity_at,updated_at,active_seconds")
            .in("user_id", ids).order("user_id").order("lesson_id").range(from, to))
      : Promise.resolve({ rows: [] as HealthEngagement[], complete: true }),
    incompleteUserIds.length && assessmentsForCourses.length
      ? loadHealthRows<HealthAssessment>(incompleteUserIds, (ids, from, to) =>
          admin.from("training_assessment_submissions")
            .select("user_id,assessment_id,submitted_at,status")
            .in("user_id", ids).order("user_id").order("submitted_at").order("assessment_id").range(from, to))
      : Promise.resolve({ rows: [] as HealthAssessment[], complete: true }),
    courseIds.length
      ? admin.from("workflow_reminders")
          .select("subject_id,recipient_id,reminder_count,last_sent_at")
          .eq("subject_type", "va")
          .like("action", "resume_training_%")
          .limit(5000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const recoveryProgressData = progressResult.rows;
  const recoveryEngagementData = engagementResult.rows;
  const recoveryAssessmentData = assessmentResult.rows
    .map((row) => ({ ...row, course_id: assessmentCourseId.get(row.assessment_id) || "" }))
    .filter((row) => Boolean(row.course_id));
  const trainingReminderData = trainingReminderResult.data || [];
  const completionHealth = buildTrainingCompletionHealth({
    courses: courses.map((course) => ({
      id: course.id, title: course.title, slug: course.slug, status: course.status,
      publishedLessonIds: lessons.filter((lesson) =>
        lesson.is_published && moduleCourse.get(lesson.module_id) === course.id,
      ).map((lesson) => lesson.id),
    })),
    enrollments: allEnrollments,
    progress: recoveryProgressData,
    engagement: recoveryEngagementData,
    assessments: recoveryAssessmentData,
    nowMs: Date.now(),
    complete: enrollmentResult.complete && progressResult.complete && engagementResult.complete
      && assessmentResult.complete && !assessmentCatalogResult.error
      && assessmentsForCourses.length < 1000,
  });

  // An age-matched cohort is not the same as the all-time course health
  // snapshot above. A start is only included after the entire measurement
  // window has elapsed; this prevents immature starts from appearing as
  // course drop-offs. Do not query learner identities into the page.
  const cohortConversion = buildTrainingCohortConversion({
    courses: courses.map(({ id, slug, title, status }) => ({ id, slug, title, status })),
    enrollments: allEnrollments,
    nowMs: Date.now(),
    complete: enrollmentResult.complete,
  });

  // Reuse paginated, admin-only training sources; never expose underlying
  // learner IDs. A failed metadata/progress page means no partial ranking.
  const lessonBottlenecks = buildTrainingLessonBottlenecks({
    courses: courses.map(({ id, slug, title, status }) => ({ id, slug, title, status })),
    modules,
    lessons,
    enrollments: allEnrollments,
    progress: recoveryProgressData,
    engagement: recoveryEngagementData,
    nowMs: Date.now(),
    complete: enrollmentResult.complete && progressResult.complete && engagementResult.complete
      && !modulesError && !lessonsError && modules.length < 1000 && lessons.length < 1000,
  });

  const lessonCourseId = new Map(
    lessons.map((lesson) => [lesson.id, moduleCourse.get(lesson.module_id) || ""]),
  );
  const recoveryActivityByEnrollment = new Map<string, number>();
  for (const row of recoveryProgressData || []) {
    const courseId = lessonCourseId.get(row.lesson_id);
    if (!courseId) continue;
    const key = `${row.user_id}:${courseId}`;
    const timestamp = new Date(row.completed_at).getTime();
    recoveryActivityByEnrollment.set(
      key,
      Math.max(recoveryActivityByEnrollment.get(key) || 0, timestamp),
    );
  }
  for (const row of recoveryEngagementData || []) {
    const courseId = lessonCourseId.get(row.lesson_id);
    if (!courseId) continue;
    const key = `${row.user_id}:${courseId}`;
    const timestamp = new Date(row.last_activity_at || row.updated_at).getTime();
    recoveryActivityByEnrollment.set(
      key,
      Math.max(recoveryActivityByEnrollment.get(key) || 0, timestamp),
    );
  }

  // Submitting a final check is learner activity. Do not count a learner as
  // stalled while they are actively waiting for assessment review.
  for (const row of recoveryAssessmentData) {
    const key = `${row.user_id}:${row.course_id}`;
    const time = new Date(row.submitted_at).getTime();
    recoveryActivityByEnrollment.set(
      key,
      Math.max(recoveryActivityByEnrollment.get(key) || 0, Number.isFinite(time) ? time : 0),
    );
  }

  const nowMs = Date.now();
  let stalled72h = 0;
  let stalled7d = 0;
  for (const enrollment of incompleteEnrollments) {
    const key = `${enrollment.user_id}:${enrollment.course_id}`;
    const lastActivity = Math.max(
      new Date(enrollment.started_at).getTime(),
      recoveryActivityByEnrollment.get(key) || 0,
    );
    if (lastActivity <= nowMs - 72 * 60 * 60 * 1000) stalled72h += 1;
    if (lastActivity <= nowMs - 7 * 24 * 60 * 60 * 1000) stalled7d += 1;
  }

  const recovery = {
    inactivityHours: 72,
    incompleteEnrollments: incompleteEnrollments.length,
    stalled72h,
    stalled7d,
    remindersSent: (trainingReminderData || []).reduce(
      (sum, row) => sum + Number(row.reminder_count || 0),
      0,
    ),
  };

  const integrity = {
    windowDays: funnelWindowDays,
    checkpointAttempts,
    checkpointFailureRate: checkpointAttempts
      ? Math.round((checkpointFailures / checkpointAttempts) * 100)
      : 0,
    firstAttemptPassRate: firstAttempts.length
      ? Math.round((firstAttemptPasses.length / firstAttempts.length) * 100)
      : 0,
    retryRate: assessedLearners.size
      ? Math.round((retryLearners.size / assessedLearners.size) * 100)
      : 0,
    automaticFinalAttempts: automaticSubmissions.length,
    averageFinalScore,
    criticalBoundaryMisses,
    answerPatternFlags,
    averageActiveSeconds,
    thresholdHuggingCompletions,
    completedLessonsWithEngagement: completedEngagement.length,
    lessonFailures,
  };

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
    funnel,
    recovery,
    completionHealth,
    cohortConversion,
    lessonBottlenecks,
    integrity,
    error: null,
  };
}
