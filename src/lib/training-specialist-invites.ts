import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSpecialistReviewDefinition } from "@/lib/training-specialist-review";
import type { LessonContentBlock } from "@/lib/training";

const TOKEN_RE = /^[A-Za-z0-9_-]{32,120}$/;

export type SpecialistReviewInviteStatus = "pending" | "opened" | "submitted" | "revoked";

export type SpecialistReviewInvite = {
  id: string;
  course_id: string;
  reviewer_name: string;
  reviewer_email: string;
  reviewer_role: string;
  course_content_version: number;
  due_at: string | null;
  expires_at: string;
  status: SpecialistReviewInviteStatus;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExternalSpecialistReviewCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  trademark_disclaimer: string | null;
  content_version: number;
  modules: Array<{
    id: string;
    title: string;
    summary: string | null;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      summary: string | null;
      position: number;
      estimated_minutes: number;
      content: LessonContentBlock[];
    }>;
  }>;
  assessments: Array<{
    id: string;
    title: string;
    instructions: string | null;
    assessment_type: "knowledge" | "practical";
    pass_score: number | null;
    position: number;
  }>;
};

export function hashSpecialistReviewToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function isValidSpecialistReviewToken(rawToken: string) {
  return TOKEN_RE.test(rawToken);
}

export async function getExternalSpecialistReview(rawToken: string, markOpened = false) {
  if (!isValidSpecialistReviewToken(rawToken)) {
    return { invite: null, course: null, definition: null, state: "invalid" as const };
  }

  const admin = createAdminClient();
  const tokenHash = hashSpecialistReviewToken(rawToken);
  const { data: inviteData, error: inviteError } = await admin
    .from("training_specialist_review_invites")
    .select("id,course_id,reviewer_name,reviewer_email,reviewer_role,course_content_version,due_at,expires_at,status,sent_at,opened_at,submitted_at,created_at,updated_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteError || !inviteData || inviteData.status === "revoked") {
    return { invite: null, course: null, definition: null, state: "invalid" as const };
  }

  const invite = inviteData as SpecialistReviewInvite;
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return { invite, course: null, definition: null, state: "expired" as const };
  }

  if (invite.status === "submitted") {
    return { invite, course: null, definition: null, state: "submitted" as const };
  }

  if (markOpened && invite.status === "pending") {
    const now = new Date().toISOString();
    await admin
      .from("training_specialist_review_invites")
      .update({ status: "opened", opened_at: now, updated_at: now })
      .eq("id", invite.id)
      .eq("status", "pending");
    invite.status = "opened";
    invite.opened_at = now;
    invite.updated_at = now;
  }

  const { data: courseData, error: courseError } = await admin
    .from("training_courses")
    .select("id,slug,title,summary,trademark_disclaimer,content_version,review_requirement")
    .eq("id", invite.course_id)
    .eq("review_requirement", "specialist")
    .maybeSingle();

  if (courseError || !courseData) {
    return { invite, course: null, definition: null, state: "invalid" as const };
  }

  const definition = getSpecialistReviewDefinition(courseData.slug);
  if (!definition) {
    return { invite, course: null, definition: null, state: "invalid" as const };
  }

  const { data: moduleData } = await admin
    .from("training_modules")
    .select("id,title,summary,position")
    .eq("course_id", courseData.id)
    .order("position");

  const modules = moduleData || [];
  const moduleIds = modules.map((module) => module.id);
  const [{ data: lessonData }, { data: assessmentData }] = await Promise.all([
    moduleIds.length
      ? admin
          .from("training_lessons")
          .select("id,module_id,title,summary,position,estimated_minutes,content")
          .in("module_id", moduleIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    admin
      .from("training_assessments")
      .select("id,title,instructions,assessment_type,pass_score,position")
      .eq("course_id", courseData.id)
      .order("position"),
  ]);

  const lessons = lessonData || [];
  const course: ExternalSpecialistReviewCourse = {
    id: courseData.id,
    slug: courseData.slug,
    title: courseData.title,
    summary: courseData.summary,
    trademark_disclaimer: courseData.trademark_disclaimer,
    content_version: courseData.content_version,
    modules: modules.map((module) => ({
      ...module,
      lessons: lessons
        .filter((lesson) => lesson.module_id === module.id)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          position: lesson.position,
          estimated_minutes: lesson.estimated_minutes,
          content: Array.isArray(lesson.content) ? lesson.content as LessonContentBlock[] : [],
        })),
    })),
    assessments: (assessmentData || []) as ExternalSpecialistReviewCourse["assessments"],
  };

  return { invite, course, definition, state: "active" as const };
}
