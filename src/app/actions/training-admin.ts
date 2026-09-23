"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonContentBlock } from "@/lib/training";

const courseSchema = z.object({
  title: z.string().trim().min(4).max(140),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(20).max(800),
  category: z.enum(["foundation", "software", "industry", "skill"]),
  country_focus: z.string().trim().max(80).optional(),
  estimated_minutes: z.coerce.number().int().min(0).max(10000),
  recommended_order: z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(1).max(999).optional(),
  ),
  trademark_disclaimer: z.string().trim().max(1000).optional(),
});

const moduleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().max(500).optional(),
  position: z.coerce.number().int().min(1).max(999),
});

const lessonSchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(10).max(600),
  estimated_minutes: z.coerce.number().int().min(1).max(30),
  position: z.coerce.number().int().min(1).max(999),
});

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function adminTrainingPath(courseId?: string, lessonId?: string) {
  if (!courseId) return "/workspace/admin/training";
  if (!lessonId) return `/workspace/admin/training/${courseId}`;
  return `/workspace/admin/training/${courseId}/lessons/${lessonId}`;
}

async function invalidateCourseReview(admin: ReturnType<typeof createAdminClient>, courseId: string) {
  await admin
    .from("training_courses")
    .update({
      status: "draft",
      published_at: null,
      last_reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);
  revalidateTag("public-training");
}

async function invalidateLessonReview(admin: ReturnType<typeof createAdminClient>, lessonId: string) {
  await admin
    .from("training_lessons")
    .update({
      is_published: false,
      last_reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);
}

export async function createTrainingCourseAction(formData: FormData) {
  await requireRoleFast("admin");
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    category: formData.get("category"),
    country_focus: formData.get("country_focus") || undefined,
    estimated_minutes: formData.get("estimated_minutes") || 0,
    recommended_order: formData.get("recommended_order") || undefined,
    trademark_disclaimer: formData.get("trademark_disclaimer") || undefined,
  });
  if (!parsed.success) throw new Error("Check the course title, slug, summary, category, and duration.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_courses")
    .insert({
      ...parsed.data,
      country_focus: parsed.data.country_focus || null,
      recommended_order: parsed.data.recommended_order || null,
      trademark_disclaimer: parsed.data.trademark_disclaimer || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  redirect(adminTrainingPath(data.id));
}

export async function updateTrainingCourseAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    category: formData.get("category"),
    country_focus: formData.get("country_focus") || undefined,
    estimated_minutes: formData.get("estimated_minutes") || 0,
    recommended_order: formData.get("recommended_order") || undefined,
    trademark_disclaimer: formData.get("trademark_disclaimer") || undefined,
  });
  if (!courseId || !parsed.success) throw new Error("Check the course fields and try again.");

  const admin = createAdminClient();
  const reviewedBy = requiredString(formData, "reviewed_by") || null;
  const reviewAction = requiredString(formData, "review_action");
  const { data: existing } = await admin
    .from("training_courses")
    .select("last_reviewed_at")
    .eq("id", courseId)
    .maybeSingle();
  const lastReviewedAt = reviewAction === "mark_now"
    ? new Date().toISOString()
    : reviewAction === "clear"
      ? null
      : existing?.last_reviewed_at || null;
  const { error } = await admin
    .from("training_courses")
    .update({
      ...parsed.data,
      country_focus: parsed.data.country_focus || null,
      recommended_order: parsed.data.recommended_order || null,
      trademark_disclaimer: parsed.data.trademark_disclaimer || null,
      reviewed_by: reviewedBy,
      last_reviewed_at: lastReviewedAt,
      status: "draft",
      published_at: null,
      content_version: z.coerce.number().int().min(1).catch(1).parse(formData.get("content_version")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);
  if (error) throw error;

  revalidateTag("public-training");
  revalidatePath(adminTrainingPath(courseId));
  revalidatePath("/workspace/admin/training");
}

export async function setTrainingCourseStatusAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const status = requiredString(formData, "status");
  if (!courseId || !["draft", "published", "archived"].includes(status)) throw new Error("Invalid course status.");

  const admin = createAdminClient();

  if (status === "published") {
    const { data: course } = await admin
      .from("training_courses")
      .select("reviewed_by,last_reviewed_at")
      .eq("id", courseId)
      .maybeSingle();
    const { data: modules } = await admin
      .from("training_modules")
      .select("id")
      .eq("course_id", courseId);
    const moduleIds = (modules || []).map((item) => item.id);
    const { data: lessons } = moduleIds.length
      ? await admin
          .from("training_lessons")
          .select("id,is_published,content")
          .in("module_id", moduleIds)
      : { data: [] };

    if (!course?.reviewed_by || !course.last_reviewed_at) {
      throw new Error("Record a reviewer and review date before publishing the course.");
    }
    if (!(lessons || []).length) throw new Error("Add lessons before publishing the course.");
    if ((lessons || []).some((lesson) => !lesson.is_published)) {
      throw new Error("Publish every lesson that belongs in this course before publishing the course.");
    }
    if ((lessons || []).some((lesson) => !Array.isArray(lesson.content) || lesson.content.length < 3)) {
      throw new Error("Every published lesson needs substantive content before the course can go live.");
    }
  }

  const { error } = await admin
    .from("training_courses")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);
  if (error) throw error;

  revalidateTag("public-training");
  revalidatePath(adminTrainingPath(courseId));
  revalidatePath("/workspace/admin/training");
  revalidatePath("/workspace/training");
  revalidatePath("/training");
}

export async function createTrainingModuleAction(formData: FormData) {
  await requireRoleFast("admin");
  const parsed = moduleSchema.safeParse({
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    position: formData.get("position"),
  });
  if (!parsed.success) throw new Error("Check the module title and position.");

  const admin = createAdminClient();
  const { error } = await admin.from("training_modules").insert({
    ...parsed.data,
    summary: parsed.data.summary || null,
  });
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  revalidatePath(adminTrainingPath(parsed.data.course_id));
}

export async function updateTrainingModuleAction(formData: FormData) {
  await requireRoleFast("admin");
  const moduleId = requiredString(formData, "module_id");
  const parsed = moduleSchema.safeParse({
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    position: formData.get("position"),
  });
  if (!moduleId || !parsed.success) throw new Error("Check the module title and position.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_modules")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      position: parsed.data.position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", moduleId);
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  revalidatePath(adminTrainingPath(parsed.data.course_id));
}

export async function createTrainingLessonAction(formData: FormData) {
  await requireRoleFast("admin");
  const parsed = lessonSchema.safeParse({
    course_id: formData.get("course_id"),
    module_id: formData.get("module_id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    estimated_minutes: formData.get("estimated_minutes"),
    position: formData.get("position"),
  });
  if (!parsed.success) throw new Error("Check the lesson title, slug, summary, duration, and position.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_lessons")
    .insert({
      module_id: parsed.data.module_id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      estimated_minutes: parsed.data.estimated_minutes,
      position: parsed.data.position,
      content: [],
      is_published: false,
    })
    .select("id")
    .single();
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  redirect(adminTrainingPath(parsed.data.course_id, data.id));
}

export async function updateTrainingLessonMetadataAction(formData: FormData) {
  await requireRoleFast("admin");
  const lessonId = requiredString(formData, "lesson_id");
  const parsed = lessonSchema.safeParse({
    course_id: formData.get("course_id"),
    module_id: formData.get("module_id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    estimated_minutes: formData.get("estimated_minutes"),
    position: formData.get("position"),
  });
  if (!lessonId || !parsed.success) throw new Error("Check the lesson fields and try again.");

  const reviewedBy = requiredString(formData, "reviewed_by") || null;
  const reviewAction = requiredString(formData, "review_action");
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("training_lessons")
    .select("last_reviewed_at")
    .eq("id", lessonId)
    .maybeSingle();
  const lastReviewedAt = reviewAction === "mark_now"
    ? new Date().toISOString()
    : reviewAction === "clear"
      ? null
      : existing?.last_reviewed_at || null;
  const { error } = await admin
    .from("training_lessons")
    .update({
      module_id: parsed.data.module_id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      estimated_minutes: parsed.data.estimated_minutes,
      position: parsed.data.position,
      reviewed_by: reviewedBy,
      last_reviewed_at: lastReviewedAt,
      is_published: false,
      content_version: z.coerce.number().int().min(1).catch(1).parse(formData.get("content_version")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  revalidatePath(adminTrainingPath(parsed.data.course_id, lessonId));
  revalidatePath(adminTrainingPath(parsed.data.course_id));
}

export async function setTrainingLessonPublishedAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const lessonId = requiredString(formData, "lesson_id");
  const publish = requiredString(formData, "publish") === "1";
  if (!courseId || !lessonId) throw new Error("Lesson is required.");

  const admin = createAdminClient();
  if (publish) {
    const { data: lesson } = await admin
      .from("training_lessons")
      .select("content,reviewed_by,last_reviewed_at")
      .eq("id", lessonId)
      .maybeSingle();
    if (!lesson?.reviewed_by || !lesson.last_reviewed_at) {
      throw new Error("Record a reviewer and review date before publishing this lesson.");
    }
    if (!Array.isArray(lesson.content) || lesson.content.length < 3) {
      throw new Error("Add substantive lesson content before publishing.");
    }
  }

  const { error } = await admin
    .from("training_lessons")
    .update({ is_published: publish, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw error;

  revalidatePath(adminTrainingPath(courseId, lessonId));
  revalidatePath(adminTrainingPath(courseId));
}

const assessmentSchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid().optional(),
  title: z.string().trim().min(4).max(180),
  instructions: z.string().trim().min(20).max(5000),
  assessment_type: z.enum(["knowledge", "practical"]),
  pass_score: z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(0).max(100).optional(),
  ),
  position: z.coerce.number().int().min(1).max(999),
});

export async function createTrainingAssessmentAction(formData: FormData) {
  await requireRoleFast("admin");
  const parsed = assessmentSchema.safeParse({
    course_id: formData.get("course_id"),
    module_id: formData.get("module_id") || undefined,
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    assessment_type: formData.get("assessment_type"),
    pass_score: formData.get("pass_score") || "",
    position: formData.get("position"),
  });
  if (!parsed.success) throw new Error("Check the assessment title, instructions, type, score, and position.");

  const admin = createAdminClient();
  const { error } = await admin.from("training_assessments").insert({
    course_id: parsed.data.course_id,
    module_id: parsed.data.module_id || null,
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    assessment_type: parsed.data.assessment_type,
    pass_score: parsed.data.pass_score ?? null,
    position: parsed.data.position,
    is_published: false,
  });
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  revalidatePath(adminTrainingPath(parsed.data.course_id));
}

export async function updateTrainingAssessmentAction(formData: FormData) {
  await requireRoleFast("admin");
  const assessmentId = requiredString(formData, "assessment_id");
  const parsed = assessmentSchema.safeParse({
    course_id: formData.get("course_id"),
    module_id: formData.get("module_id") || undefined,
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    assessment_type: formData.get("assessment_type"),
    pass_score: formData.get("pass_score") || "",
    position: formData.get("position"),
  });
  if (!assessmentId || !parsed.success) throw new Error("Check the assessment fields and try again.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_assessments")
    .update({
      module_id: parsed.data.module_id || null,
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      assessment_type: parsed.data.assessment_type,
      pass_score: parsed.data.pass_score ?? null,
      position: parsed.data.position,
      is_published: requiredString(formData, "is_published") === "1",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId);
  if (error) throw error;
  await invalidateCourseReview(admin, parsed.data.course_id);

  revalidatePath(adminTrainingPath(parsed.data.course_id));
}

function parseList(text: string) {
  return text
    .split("\n")
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function blockFromForm(formData: FormData): LessonContentBlock {
  const type = requiredString(formData, "block_type");
  const title = requiredString(formData, "block_title");
  const text = requiredString(formData, "block_text");
  if (!text) throw new Error("Lesson block content cannot be empty.");

  if (type === "heading") return { type: "heading", text };
  if (type === "paragraph") return { type: "paragraph", text };
  if (type === "list") return { type: "list", items: parseList(text) };
  if (type === "steps") return { type: "steps", items: parseList(text) };
  if (type === "callout") return { type: "callout", title: title || undefined, text };
  if (type === "scenario") return { type: "scenario", title: title || undefined, text };
  throw new Error("Unsupported lesson block type.");
}

async function getLessonContent(admin: ReturnType<typeof createAdminClient>, lessonId: string) {
  const { data, error } = await admin
    .from("training_lessons")
    .select("content")
    .eq("id", lessonId)
    .maybeSingle();
  if (error || !data) throw error || new Error("Lesson not found.");
  return Array.isArray(data.content) ? data.content as LessonContentBlock[] : [];
}

export async function addTrainingLessonBlockAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const lessonId = requiredString(formData, "lesson_id");
  if (!courseId || !lessonId) throw new Error("Lesson is required.");

  const block = blockFromForm(formData);
  const admin = createAdminClient();
  const content = await getLessonContent(admin, lessonId);
  const { error } = await admin
    .from("training_lessons")
    .update({ content: [...content, block], updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw error;
  await invalidateLessonReview(admin, lessonId);
  await invalidateCourseReview(admin, courseId);

  revalidatePath(adminTrainingPath(courseId, lessonId));
}

export async function updateTrainingLessonBlockAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const lessonId = requiredString(formData, "lesson_id");
  const index = z.coerce.number().int().min(0).parse(formData.get("block_index"));
  if (!courseId || !lessonId) throw new Error("Lesson is required.");

  const admin = createAdminClient();
  const content = await getLessonContent(admin, lessonId);
  if (!content[index]) throw new Error("Lesson block was not found.");
  content[index] = blockFromForm(formData);

  const { error } = await admin
    .from("training_lessons")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw error;
  await invalidateLessonReview(admin, lessonId);
  await invalidateCourseReview(admin, courseId);

  revalidatePath(adminTrainingPath(courseId, lessonId));
}

export async function removeTrainingLessonBlockAction(formData: FormData) {
  await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const lessonId = requiredString(formData, "lesson_id");
  const index = z.coerce.number().int().min(0).parse(formData.get("block_index"));
  if (!courseId || !lessonId) throw new Error("Lesson is required.");

  const admin = createAdminClient();
  const content = await getLessonContent(admin, lessonId);
  if (!content[index]) throw new Error("Lesson block was not found.");

  const { error } = await admin
    .from("training_lessons")
    .update({ content: content.filter((_, itemIndex) => itemIndex !== index), updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw error;
  await invalidateLessonReview(admin, lessonId);
  await invalidateCourseReview(admin, courseId);

  revalidatePath(adminTrainingPath(courseId, lessonId));
}
