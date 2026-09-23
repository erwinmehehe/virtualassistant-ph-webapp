"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonContentBlock } from "@/lib/training";
import { finalizeTrainingCourseIfEligible } from "@/lib/training-completion";
import { getSpecialistReviewDefinition } from "@/lib/training-specialist-review";

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

async function invalidateSpecialistReview(
  admin: ReturnType<typeof createAdminClient>,
  courseId: string,
  reason = "Course content changed after specialist review assignment.",
) {
  const [{ data: review }, { data: course }] = await Promise.all([
    admin
      .from("training_specialist_reviews")
      .select("review_revision,assigned_revision,assigned_reviewer_name,assigned_reviewer_role,review_due_date")
      .eq("course_id", courseId)
      .maybeSingle(),
    admin
      .from("training_courses")
      .select("content_version")
      .eq("id", courseId)
      .maybeSingle(),
  ]);

  if (!review) return;

  const now = new Date().toISOString();
  const nextRevision = Math.max(1, Number(review.review_revision || 1) + 1);
  const { error } = await admin
    .from("training_specialist_reviews")
    .update({
      checklist: {},
      reviewer_name: null,
      reviewer_role: null,
      notes: reason,
      decision: "in_progress",
      reviewed_at: null,
      review_revision: nextRevision,
      updated_at: now,
    })
    .eq("course_id", courseId);
  if (error) throw error;

  await admin
    .from("training_specialist_review_invites")
    .update({ status: "revoked", updated_at: now })
    .eq("course_id", courseId)
    .in("status", ["pending", "opened"]);

  const { error: eventError } = await admin
    .from("training_specialist_review_events")
    .insert({
      course_id: courseId,
      event_type: "invalidated",
      actor_id: null,
      actor_label: "System · course content changed",
      reviewer_name: review.assigned_reviewer_name || null,
      reviewer_role: review.assigned_reviewer_role || null,
      review_due_date: review.review_due_date || null,
      review_revision: nextRevision,
      assigned_revision: review.assigned_revision || null,
      course_content_version: course?.content_version ?? null,
      checklist: {},
      notes: reason,
    });
  if (eventError) throw eventError;
}

async function invalidateCourseReview(admin: ReturnType<typeof createAdminClient>, courseId: string) {
  const now = new Date().toISOString();
  await admin
    .from("training_courses")
    .update({
      status: "draft",
      published_at: null,
      last_reviewed_at: null,
      specialist_reviewed_by: null,
      specialist_reviewer_role: null,
      specialist_review_notes: null,
      specialist_reviewed_at: null,
      updated_at: now,
    })
    .eq("id", courseId);

  await invalidateSpecialistReview(admin, courseId);
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
      review_requirement: "editorial",
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
      review_requirement: "editorial",
      reviewed_by: reviewedBy,
      last_reviewed_at: lastReviewedAt,
      specialist_reviewed_by: null,
      specialist_reviewer_role: null,
      specialist_review_notes: null,
      specialist_reviewed_at: null,
      status: "draft",
      published_at: null,
      content_version: z.coerce.number().int().min(1).catch(1).parse(formData.get("content_version")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);
  if (error) throw error;

  await invalidateSpecialistReview(admin, courseId, "Course settings changed after specialist review assignment.");

  revalidateTag("public-training");
  revalidatePath(adminTrainingPath(courseId));
  revalidatePath("/workspace/admin/training");
}

export async function assignTrainingSpecialistReviewerAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const assignedReviewerName = requiredString(formData, "assigned_reviewer_name");
  const assignedReviewerRole = requiredString(formData, "assigned_reviewer_role");
  const reviewDueDate = requiredString(formData, "review_due_date") || null;

  if (!courseId || !assignedReviewerName || !assignedReviewerRole) {
    throw new Error("Add the assigned reviewer name and role.");
  }
  if (reviewDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(reviewDueDate)) {
    throw new Error("Choose a valid specialist review due date.");
  }

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: existing }] = await Promise.all([
    admin
      .from("training_courses")
      .select("id,slug,review_requirement,content_version")
      .eq("id", courseId)
      .maybeSingle(),
    admin
      .from("training_specialist_reviews")
      .select("assigned_reviewer_name,assigned_reviewer_role,review_revision")
      .eq("course_id", courseId)
      .maybeSingle(),
  ]);

  if (courseError) throw courseError;
  if (!course || course.review_requirement !== "specialist") {
    throw new Error("This course does not require specialist review.");
  }
  if (!getSpecialistReviewDefinition(course.slug)) {
    throw new Error("No specialist review checklist is configured for this course.");
  }

  const now = new Date().toISOString();

  await admin
    .from("training_specialist_review_invites")
    .update({ status: "revoked", updated_at: now })
    .eq("course_id", courseId)
    .in("status", ["pending", "opened"]);

  const reviewRevision = Math.max(1, Number(existing?.review_revision || 1));
  const eventType = existing?.assigned_reviewer_name || existing?.assigned_reviewer_role
    ? "reassigned"
    : "assigned";

  const { error: reviewError } = await admin
    .from("training_specialist_reviews")
    .upsert({
      course_id: courseId,
      assigned_reviewer_name: assignedReviewerName,
      assigned_reviewer_role: assignedReviewerRole,
      review_due_date: reviewDueDate,
      assigned_at: now,
      assigned_by: session.userId,
      review_revision: reviewRevision,
      assigned_revision: reviewRevision,
      reviewer_name: null,
      reviewer_role: null,
      checklist: {},
      notes: null,
      decision: "in_progress",
      reviewed_at: null,
      updated_at: now,
    }, { onConflict: "course_id" });
  if (reviewError) throw reviewError;

  const { error: courseUpdateError } = await admin
    .from("training_courses")
    .update({
      specialist_reviewed_by: null,
      specialist_reviewer_role: null,
      specialist_review_notes: null,
      specialist_reviewed_at: null,
      status: "draft",
      published_at: null,
      updated_at: now,
    })
    .eq("id", courseId);
  if (courseUpdateError) throw courseUpdateError;

  const { error: eventError } = await admin
    .from("training_specialist_review_events")
    .insert({
      course_id: courseId,
      event_type: eventType,
      actor_id: session.userId,
      actor_label: session.profile.full_name || "Admin",
      reviewer_name: assignedReviewerName,
      reviewer_role: assignedReviewerRole,
      review_due_date: reviewDueDate,
      review_revision: reviewRevision,
      assigned_revision: reviewRevision,
      course_content_version: course.content_version,
      checklist: {},
      notes: eventType === "reassigned"
        ? "Specialist review assignment refreshed for the current review revision."
        : "Specialist reviewer assigned.",
    });
  if (eventError) throw eventError;

  revalidatePath("/workspace/admin/training/reviews");
  revalidatePath(adminTrainingPath(courseId));
}

export async function saveTrainingSpecialistReviewAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const courseId = requiredString(formData, "course_id");
  const decision = requiredString(formData, "decision");
  const notes = requiredString(formData, "notes");

  if (!courseId || !["in_progress", "changes_requested", "approved"].includes(decision)) {
    throw new Error("Choose a valid specialist review decision.");
  }
  if (notes.length > 5000) {
    throw new Error("Keep specialist review notes under 5,000 characters.");
  }

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: review, error: reviewLoadError }] = await Promise.all([
    admin
      .from("training_courses")
      .select("id,slug,review_requirement,content_version")
      .eq("id", courseId)
      .maybeSingle(),
    admin
      .from("training_specialist_reviews")
      .select("assigned_reviewer_name,assigned_reviewer_role,review_due_date,review_revision,assigned_revision")
      .eq("course_id", courseId)
      .maybeSingle(),
  ]);

  if (courseError) throw courseError;
  if (reviewLoadError) throw reviewLoadError;
  if (!course || course.review_requirement !== "specialist") {
    throw new Error("This course does not require specialist review.");
  }

  const definition = getSpecialistReviewDefinition(course.slug);
  if (!definition) {
    throw new Error("No specialist review checklist is configured for this course.");
  }
  if (!review?.assigned_reviewer_name || !review.assigned_reviewer_role || !review.assigned_revision) {
    throw new Error("Assign a specialist reviewer before recording review work.");
  }
  if (review.assigned_revision !== review.review_revision) {
    throw new Error("This assignment is stale because the course changed. Refresh the reviewer assignment for the current revision first.");
  }

  const reviewerName = review.assigned_reviewer_name;
  const reviewerRole = review.assigned_reviewer_role;
  const checklist = Object.fromEntries(
    definition.items.map((item) => [item.id, requiredString(formData, "check_" + item.id) === "1"]),
  );
  const allChecked = definition.items.every((item) => checklist[item.id]);

  if (decision === "approved") {
    if (notes.length < 20) {
      throw new Error("Add meaningful specialist review notes before approval.");
    }
    if (!allChecked) {
      throw new Error("Complete every specialist checklist item before approving the course.");
    }
  }

  if (decision === "changes_requested" && notes.length < 20) {
    throw new Error("Record clear correction notes when requesting changes.");
  }

  const now = new Date().toISOString();
  const reviewedAt = decision === "approved" ? now : null;
  const { error: reviewError } = await admin
    .from("training_specialist_reviews")
    .update({
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole,
      checklist,
      notes: notes || null,
      decision,
      reviewed_at: reviewedAt,
      updated_at: now,
    })
    .eq("course_id", courseId);
  if (reviewError) throw reviewError;

  const courseUpdate = decision === "approved"
    ? {
        specialist_reviewed_by: reviewerName,
        specialist_reviewer_role: reviewerRole,
        specialist_review_notes: notes,
        specialist_reviewed_at: reviewedAt,
        updated_at: now,
      }
    : {
        specialist_reviewed_by: null,
        specialist_reviewer_role: null,
        specialist_review_notes: null,
        specialist_reviewed_at: null,
        status: "draft",
        published_at: null,
        updated_at: now,
      };

  const { error: updateError } = await admin
    .from("training_courses")
    .update(courseUpdate)
    .eq("id", courseId);
  if (updateError) throw updateError;

  if (decision === "approved" || decision === "changes_requested") {
    await admin
      .from("training_specialist_review_invites")
      .update({ status: "revoked", updated_at: now })
      .eq("course_id", courseId)
      .in("status", ["pending", "opened"]);
  }

  const eventType = decision === "approved"
    ? "approved"
    : decision === "changes_requested"
      ? "changes_requested"
      : "progress_saved";
  const { error: eventError } = await admin
    .from("training_specialist_review_events")
    .insert({
      course_id: courseId,
      event_type: eventType,
      actor_id: session.userId,
      actor_label: session.profile.full_name || "Admin",
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole,
      review_due_date: review.review_due_date || null,
      review_revision: review.review_revision,
      assigned_revision: review.assigned_revision,
      course_content_version: course.content_version,
      checklist,
      notes: notes || null,
    });
  if (eventError) throw eventError;

  revalidateTag("public-training");
  revalidatePath(adminTrainingPath(courseId));
  revalidatePath("/workspace/admin/training");
  revalidatePath("/workspace/admin/training/reviews");
  revalidatePath("/workspace/training");
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
    const [{ data: lessons }, { data: assessments }] = await Promise.all([
      moduleIds.length
        ? admin
            .from("training_lessons")
            .select("id,is_published,content")
            .in("module_id", moduleIds)
        : Promise.resolve({ data: [] }),
      admin
        .from("training_assessments")
        .select("id,is_published,instructions,pass_score")
        .eq("course_id", courseId),
    ]);

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
    if ((assessments || []).some((assessment) => !assessment.is_published)) {
      throw new Error("Publish every assessment that belongs in this course before publishing the course.");
    }
    if ((assessments || []).some((assessment) => !assessment.instructions || assessment.instructions.trim().length < 100)) {
      throw new Error("Every published assessment needs clear learner instructions before the course can go live.");
    }
    if ((assessments || []).some((assessment) => assessment.pass_score === null)) {
      throw new Error("Set a pass score for every published assessment before publishing the course.");
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

export async function setTrainingLearningPathStatusAction(formData: FormData) {
  await requireRoleFast("admin");
  const pathId = requiredString(formData, "path_id");
  const status = requiredString(formData, "status");
  if (!pathId || !["draft", "published", "archived"].includes(status)) {
    throw new Error("Invalid learning path status.");
  }

  const admin = createAdminClient();

  if (status === "published") {
    const { data: relations } = await admin
      .from("training_learning_path_courses")
      .select("course_id")
      .eq("path_id", pathId);
    const courseIds = (relations || []).map((item) => item.course_id);
    if (!courseIds.length) throw new Error("Add courses before publishing this learning path.");

    const { data: publishedCourses } = await admin
      .from("training_courses")
      .select("id")
      .in("id", courseIds)
      .eq("status", "published");

    if (!(publishedCourses || []).length) {
      throw new Error("Publish at least one reviewed course before publishing this learning path.");
    }
  }

  const { error } = await admin
    .from("training_learning_paths")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", pathId);
  if (error) throw error;

  revalidateTag("public-training");
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


export async function reviewTrainingAssessmentSubmissionAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const submissionId = requiredString(formData, "submission_id");
  const courseId = requiredString(formData, "course_id");
  const decision = requiredString(formData, "decision");
  const feedback = requiredString(formData, "feedback");
  const scoreValue = requiredString(formData, "score");

  if (!submissionId || !courseId || !["pass", "needs_revision"].includes(decision)) {
    throw new Error("Choose a valid assessment review decision.");
  }

  const score = z.coerce.number().min(0).max(100).parse(scoreValue);
  if (feedback.length < 10 || feedback.length > 5000) {
    throw new Error("Add clear reviewer feedback between 10 and 5,000 characters.");
  }

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("training_assessment_submissions")
    .select("id,user_id,assessment_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) throw new Error("Assessment submission not found.");

  const { data: assessment } = await admin
    .from("training_assessments")
    .select("id,course_id,pass_score")
    .eq("id", submission.assessment_id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!assessment) throw new Error("Assessment does not belong to this course.");
  if (decision === "pass" && assessment.pass_score !== null && score < assessment.pass_score) {
    throw new Error(`A passing review must meet the ${assessment.pass_score}% pass score.`);
  }

  const status = decision === "pass" ? "reviewed" : "needs_revision";
  const { error } = await admin
    .from("training_assessment_submissions")
    .update({
      status,
      score,
      feedback,
      reviewer_id: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw error;

  const completion = await finalizeTrainingCourseIfEligible(submission.user_id, courseId);
  if (completion.newlyCompleted) {
    await admin.from("analytics_events").insert({
      event_name: "training_course_complete",
      path: "/workspace/training",
      session_id: null,
      user_id: submission.user_id,
      metadata: { course_id: courseId, completion_source: "assessment_review" },
    });
  }

  revalidatePath(adminTrainingPath(courseId));
  revalidatePath("/workspace/training");
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
