import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonContentBlock, LessonRow, TrainingAssessment } from "@/lib/training";

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
  review_requirement: "editorial" | "specialist";
  specialist_reviewed_by: string | null;
  specialist_reviewer_role: string | null;
  specialist_review_notes: string | null;
  specialist_reviewed_at: string | null;
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
      .select("id,course_id,module_id,title,instructions,assessment_type,pass_score,position,is_published")
      .eq("course_id", courseId)
      .order("position"),
  ]);

  const lessons = (lessonData || []) as LessonRow[];
  const hydratedModules = modules.map((item) => ({
    ...item,
    lessons: lessons.filter((lesson) => lesson.module_id === item.id),
  }));

  return {
    course: {
      ...course,
      modules: hydratedModules,
      assessments: (assessmentData || []) as TrainingAssessment[],
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
    return ["heading", "paragraph", "list", "steps", "callout", "scenario"].includes(type);
  });
}


export type AdminTrainingAssessmentSubmission = {
  id: string;
  user_id: string;
  assessment_id: string;
  assessment_title: string;
  response: Record<string, unknown>;
  status: "submitted" | "reviewed" | "needs_revision";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  user_email: string | null;
};

export async function getTrainingAssessmentSubmissionsForAdmin(courseId: string) {
  const admin = createAdminClient();
  const { data: assessments, error: assessmentError } = await admin
    .from("training_assessments")
    .select("id,title")
    .eq("course_id", courseId);

  if (assessmentError) return { submissions: [] as AdminTrainingAssessmentSubmission[], error: assessmentError.message };

  const titleById = new Map((assessments || []).map((assessment) => [assessment.id, assessment.title]));
  const assessmentIds = [...titleById.keys()];
  if (!assessmentIds.length) return { submissions: [] as AdminTrainingAssessmentSubmission[], error: null };

  const { data, error } = await admin
    .from("training_assessment_submissions")
    .select("id,user_id,assessment_id,response,status,score,feedback,submitted_at,reviewed_at")
    .in("assessment_id", assessmentIds)
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (error) return { submissions: [] as AdminTrainingAssessmentSubmission[], error: error.message };

  const userIds = [...new Set((data || []).map((submission) => submission.user_id))];
  const emailByUser = new Map<string, string | null>();
  await Promise.all(userIds.map(async (userId) => {
    try {
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      emailByUser.set(userId, userData.user?.email || null);
    } catch {
      emailByUser.set(userId, null);
    }
  }));

  return {
    submissions: (data || []).map((submission) => ({
      ...submission,
      assessment_title: titleById.get(submission.assessment_id) || "Assessment",
      user_email: emailByUser.get(submission.user_id) || null,
    })) as AdminTrainingAssessmentSubmission[],
    error: null,
  };
}


export type SpecialistTrainingReviewQueueItem = {
  course: Pick<AdminCourse,
    "id" | "slug" | "title" | "status" | "content_version" |
    "reviewed_by" | "last_reviewed_at" |
    "specialist_reviewed_by" | "specialist_reviewer_role" |
    "specialist_review_notes" | "specialist_reviewed_at"
  >;
  moduleCount: number;
  lessonCount: number;
  publishedLessonCount: number;
  substantiveLessonCount: number;
  assessmentCount: number;
  assessmentReadyCount: number;
  editorialReady: boolean;
  contentReady: boolean;
  assessmentReady: boolean;
  specialistReady: boolean;
  assignmentCurrent: boolean;
  review: {
    reviewer_name: string | null;
    reviewer_role: string | null;
    assigned_reviewer_name: string | null;
    assigned_reviewer_role: string | null;
    review_due_date: string | null;
    assigned_at: string | null;
    assigned_by: string | null;
    review_revision: number;
    assigned_revision: number | null;
    checklist: Record<string, boolean>;
    notes: string | null;
    decision: "in_progress" | "changes_requested" | "approved";
    reviewed_at: string | null;
    updated_at: string;
  } | null;
  invite: {
    id: string;
    reviewer_email: string;
    reviewer_name: string;
    reviewer_role: string;
    review_revision: number;
    assigned_revision: number;
    course_content_version: number;
    due_at: string | null;
    expires_at: string;
    status: "pending" | "opened" | "submitted" | "revoked";
    sent_at: string | null;
    opened_at: string | null;
    submitted_at: string | null;
    created_at: string;
  } | null;
  history: Array<{
    id: string;
    event_type: "assigned" | "reassigned" | "progress_saved" | "changes_requested" | "approved" | "invalidated" | "invite_sent" | "invite_opened" | "invite_revoked" | "external_changes_requested" | "external_approved";
    actor_id: string | null;
    actor_label: string | null;
    reviewer_name: string | null;
    reviewer_role: string | null;
    review_due_date: string | null;
    review_revision: number;
    assigned_revision: number | null;
    course_content_version: number | null;
    notes: string | null;
    created_at: string;
  }>;
};

export async function getTrainingSpecialistReviewQueue() {
  const admin = createAdminClient();
  const { data: courseData, error } = await admin
    .from("training_courses")
    .select("id,slug,title,status,content_version,reviewed_by,last_reviewed_at,specialist_reviewed_by,specialist_reviewer_role,specialist_review_notes,specialist_reviewed_at")
    .eq("review_requirement", "specialist")
    .order("recommended_order", { ascending: true })
    .order("title");

  if (error) {
    return { items: [] as SpecialistTrainingReviewQueueItem[], error: error.message };
  }

  const courses = (courseData || []) as SpecialistTrainingReviewQueueItem["course"][];
  const courseIds = courses.map((course) => course.id);
  if (!courseIds.length) return { items: [] as SpecialistTrainingReviewQueueItem[], error: null };

  const [{ data: moduleData }, { data: assessmentData }, { data: reviewData }, { data: eventData }, { data: inviteData }] = await Promise.all([
    admin
      .from("training_modules")
      .select("id,course_id")
      .in("course_id", courseIds),
    admin
      .from("training_assessments")
      .select("course_id,is_published,instructions,pass_score")
      .in("course_id", courseIds),
    admin
      .from("training_specialist_reviews")
      .select("course_id,reviewer_name,reviewer_role,assigned_reviewer_name,assigned_reviewer_role,review_due_date,assigned_at,assigned_by,review_revision,assigned_revision,checklist,notes,decision,reviewed_at,updated_at")
      .in("course_id", courseIds),
    admin
      .from("training_specialist_review_events")
      .select("id,course_id,event_type,actor_id,actor_label,reviewer_name,reviewer_role,review_due_date,review_revision,assigned_revision,course_content_version,notes,created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
      .limit(140),
    admin
      .from("training_specialist_review_invites")
      .select("id,course_id,reviewer_email,reviewer_name,reviewer_role,review_revision,assigned_revision,course_content_version,due_at,expires_at,status,sent_at,opened_at,submitted_at,created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false }),
  ]);

  const modules = (moduleData || []) as Array<{ id: string; course_id: string }>;
  const moduleIds = modules.map((module) => module.id);
  const { data: lessonData } = moduleIds.length
    ? await admin
        .from("training_lessons")
        .select("id,module_id,is_published,content")
        .in("module_id", moduleIds)
    : { data: [] };

  const lessons = (lessonData || []) as Array<{
    id: string;
    module_id: string;
    is_published: boolean;
    content: unknown;
  }>;
  const assessments = (assessmentData || []) as Array<{
    course_id: string;
    is_published: boolean;
    instructions: string | null;
    pass_score: number | null;
  }>;
  const reviews = new Map(
    ((reviewData || []) as Array<{
      course_id: string;
      reviewer_name: string | null;
      reviewer_role: string | null;
      assigned_reviewer_name: string | null;
      assigned_reviewer_role: string | null;
      review_due_date: string | null;
      assigned_at: string | null;
      assigned_by: string | null;
      review_revision: number;
      assigned_revision: number | null;
      checklist: Record<string, boolean> | null;
      notes: string | null;
      decision: "in_progress" | "changes_requested" | "approved";
      reviewed_at: string | null;
      updated_at: string;
    }>).map((review) => [review.course_id, {
      reviewer_name: review.reviewer_name,
      reviewer_role: review.reviewer_role,
      assigned_reviewer_name: review.assigned_reviewer_name,
      assigned_reviewer_role: review.assigned_reviewer_role,
      review_due_date: review.review_due_date,
      assigned_at: review.assigned_at,
      assigned_by: review.assigned_by,
      review_revision: Math.max(1, Number(review.review_revision || 1)),
      assigned_revision: review.assigned_revision,
      checklist: review.checklist || {},
      notes: review.notes,
      decision: review.decision,
      reviewed_at: review.reviewed_at,
      updated_at: review.updated_at,
    }]),
  );
  const events = (eventData || []) as Array<{
    id: string;
    course_id: string;
    event_type: "assigned" | "reassigned" | "progress_saved" | "changes_requested" | "approved" | "invalidated" | "invite_sent" | "invite_opened" | "invite_revoked" | "external_changes_requested" | "external_approved";
    actor_id: string | null;
    actor_label: string | null;
    reviewer_name: string | null;
    reviewer_role: string | null;
    review_due_date: string | null;
    review_revision: number;
    assigned_revision: number | null;
    course_content_version: number | null;
    notes: string | null;
    created_at: string;
  }>;
  const latestInviteByCourse = new Map<string, SpecialistTrainingReviewQueueItem["invite"]>();
  for (const invite of (inviteData || []) as Array<{
    id: string;
    course_id: string;
    reviewer_email: string;
    reviewer_name: string;
    reviewer_role: string;
    review_revision: number;
    assigned_revision: number;
    course_content_version: number;
    due_at: string | null;
    expires_at: string;
    status: "pending" | "opened" | "submitted" | "revoked";
    sent_at: string | null;
    opened_at: string | null;
    submitted_at: string | null;
    created_at: string;
  }>) {
    if (!latestInviteByCourse.has(invite.course_id)) {
      latestInviteByCourse.set(invite.course_id, {
        id: invite.id,
        reviewer_email: invite.reviewer_email,
        reviewer_name: invite.reviewer_name,
        reviewer_role: invite.reviewer_role,
        review_revision: invite.review_revision,
        assigned_revision: invite.assigned_revision,
        course_content_version: invite.course_content_version,
        due_at: invite.due_at,
        expires_at: invite.expires_at,
        status: invite.status,
        sent_at: invite.sent_at,
        opened_at: invite.opened_at,
        submitted_at: invite.submitted_at,
        created_at: invite.created_at,
      });
    }
  }

  const moduleCourse = new Map(modules.map((module) => [module.id, module.course_id]));

  const items: SpecialistTrainingReviewQueueItem[] = courses.map((course) => {
    const courseModules = modules.filter((module) => module.course_id === course.id);
    const courseLessons = lessons.filter((lesson) => moduleCourse.get(lesson.module_id) === course.id);
    const courseAssessments = assessments.filter((assessment) => assessment.course_id === course.id);
    const publishedLessonCount = courseLessons.filter((lesson) => lesson.is_published).length;
    const substantiveLessonCount = courseLessons.filter(
      (lesson) => Array.isArray(lesson.content) && lesson.content.length >= 3,
    ).length;
    const assessmentReadyCount = courseAssessments.filter(
      (assessment) =>
        assessment.is_published &&
        Boolean(assessment.instructions && assessment.instructions.trim().length >= 100) &&
        assessment.pass_score !== null,
    ).length;
    const editorialReady = Boolean(course.reviewed_by && course.last_reviewed_at);
    const contentReady =
      courseLessons.length > 0 &&
      publishedLessonCount === courseLessons.length &&
      substantiveLessonCount === courseLessons.length;
    const assessmentReady =
      courseAssessments.length > 0 &&
      assessmentReadyCount === courseAssessments.length;
    const review = reviews.get(course.id) || null;
    const assignmentCurrent = Boolean(
      review?.assigned_reviewer_name &&
      review.assigned_reviewer_role &&
      review.assigned_revision &&
      review.assigned_revision === review.review_revision,
    );
    const specialistReady = Boolean(
      course.specialist_reviewed_by &&
      course.specialist_reviewer_role &&
      course.specialist_reviewed_at &&
      course.specialist_review_notes &&
      course.specialist_review_notes.trim().length >= 20 &&
      review?.decision === "approved" &&
      assignmentCurrent &&
      review.reviewed_at,
    );

    return {
      course,
      moduleCount: courseModules.length,
      lessonCount: courseLessons.length,
      publishedLessonCount,
      substantiveLessonCount,
      assessmentCount: courseAssessments.length,
      assessmentReadyCount,
      editorialReady,
      contentReady,
      assessmentReady,
      specialistReady,
      assignmentCurrent,
      review,
      invite: latestInviteByCourse.get(course.id) || null,
      history: events.filter((event) => event.course_id === course.id).slice(0, 16),
    };
  });

  return { items, error: null };
}
