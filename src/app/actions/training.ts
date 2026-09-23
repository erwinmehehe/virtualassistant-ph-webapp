"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function recordTrainingEvent(
  eventName: "training_course_start" | "training_lesson_complete" | "training_course_complete",
  userId: string,
  path: string,
  metadata: Record<string, string | number | boolean> = {},
) {
  try {
    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      event_name: eventName,
      path,
      referrer: null,
      session_id: null,
      user_id: userId,
      metadata,
    });
  } catch {
    // Training progress must never fail because analytics storage is unavailable.
  }
}

export async function startTrainingCourseAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const courseId = String(formData.get("course_id") || "");
  if (!courseId) redirect("/workspace/training");

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("id,slug")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();

  if (!course) redirect("/workspace/training");

  const { error } = await supabase
    .from("training_enrollments")
    .insert({ user_id: userId, course_id: course.id });

  if (error && error.code !== "23505") {
    throw new Error("Could not start this training course.");
  }

  if (!error) {
    await recordTrainingEvent(
      "training_course_start",
      userId,
      `/workspace/training/courses/${course.slug}`,
      { course_slug: course.slug },
    );
  }

  revalidatePath("/workspace/training");
  redirect(`/workspace/training/courses/${course.slug}`);
}

function completionCredentialCode() {
  return `VAT-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export async function markTrainingLessonCompleteAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const lessonId = String(formData.get("lesson_id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  if (!lessonId || !courseSlug) redirect("/workspace/training");

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("id,slug")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!course) redirect("/workspace/training");

  const { data: moduleRows } = await supabase
    .from("training_modules")
    .select("id")
    .eq("course_id", course.id);

  const moduleIds = (moduleRows || []).map((module) => module.id);
  if (!moduleIds.length) redirect(`/workspace/training/courses/${course.slug}`);

  const { data: lesson } = await supabase
    .from("training_lessons")
    .select("id,module_id")
    .eq("id", lessonId)
    .eq("is_published", true)
    .in("module_id", moduleIds)
    .maybeSingle();

  if (!lesson) redirect(`/workspace/training/courses/${course.slug}`);

  const { error: enrollmentError } = await supabase
    .from("training_enrollments")
    .insert({ user_id: userId, course_id: course.id });

  if (enrollmentError && enrollmentError.code !== "23505") {
    throw new Error("Could not start this training course.");
  }

  const { data: existingProgress } = await supabase
    .from("training_lesson_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const { error: progressError } = await supabase
    .from("training_lesson_progress")
    .upsert(
      { user_id: userId, lesson_id: lesson.id, completed_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );

  if (progressError) throw new Error("Could not save lesson progress.");

  if (!existingProgress?.completed_at) {
    await recordTrainingEvent(
      "training_lesson_complete",
      userId,
      `/workspace/training/courses/${course.slug}/lessons/${lesson.id}`,
      { course_slug: course.slug, lesson_id: lesson.id },
    );
  }

  const { data: lessonRows } = await supabase
    .from("training_lessons")
    .select("id")
    .in("module_id", moduleIds)
    .eq("is_published", true);

  const publishedLessonIds = (lessonRows || []).map((item) => item.id);
  if (publishedLessonIds.length) {
    const { data: completedRows } = await supabase
      .from("training_lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .in("lesson_id", publishedLessonIds);

    const completedIds = new Set((completedRows || []).map((item) => item.lesson_id));
    const courseComplete = publishedLessonIds.every((id) => completedIds.has(id));

    if (courseComplete) {
      const admin = createAdminClient();
      const completedAt = new Date().toISOString();

      const { data: completedEnrollmentRows } = await admin
        .from("training_enrollments")
        .update({ completed_at: completedAt })
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .is("completed_at", null)
        .select("id");

      if (completedEnrollmentRows?.length) {
        await recordTrainingEvent(
          "training_course_complete",
          userId,
          `/workspace/training/courses/${course.slug}`,
          { course_slug: course.slug },
        );
      }

      const { data: existingCertificate } = await admin
        .from("training_certificates")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .maybeSingle();

      if (!existingCertificate) {
        const { error: certificateError } = await admin
          .from("training_certificates")
          .insert({
            credential_code: completionCredentialCode(),
            user_id: userId,
            course_id: course.id,
            issued_at: completedAt,
            metadata: { credential_type: "certificate_of_completion" },
          });

        if (certificateError && certificateError.code !== "23505") {
          throw new Error("Your lesson was saved, but the completion certificate could not be issued.");
        }
      }
    }
  }

  revalidatePath("/workspace/training");
  revalidatePath(`/workspace/training/courses/${course.slug}`);
  revalidatePath(`/workspace/training/courses/${course.slug}/lessons/${lessonId}`);
}
