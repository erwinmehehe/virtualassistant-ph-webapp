"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/product-events";
import { finalizeTrainingCourseIfEligible } from "@/lib/training-completion";

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
    await recordProductEvent("training_course_start", {
      userId,
      path: `/workspace/training/courses/${course.slug}`,
      metadata: { course_slug: course.slug },
    });
  }

  revalidatePath("/workspace/training");
  redirect(`/workspace/training/courses/${course.slug}`);
}

export async function markTrainingLessonCompleteAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const lessonId = String(formData.get("lesson_id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  const continueTo = String(formData.get("continue_to") || "").trim();
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
    await recordProductEvent("training_lesson_complete", {
      userId,
      path: `/workspace/training/courses/${course.slug}/lessons/${lesson.id}`,
      metadata: { course_slug: course.slug, lesson_id: lesson.id },
    });
  }

  const completion = await finalizeTrainingCourseIfEligible(userId, course.id);
  if (completion.newlyCompleted) {
    await recordProductEvent("training_course_complete", {
      userId,
      path: `/workspace/training/courses/${course.slug}`,
      metadata: { course_slug: course.slug },
    });
  }

  revalidatePath("/workspace/training");
  revalidatePath(`/workspace/training/courses/${course.slug}`);
  revalidatePath(`/workspace/training/courses/${course.slug}/lessons/${lessonId}`);

  const coursePath = `/workspace/training/courses/${course.slug}`;
  const safeContinueTo =
    continueTo === coursePath || continueTo.startsWith(`${coursePath}/`)
      ? continueTo
      : "";
  if (safeContinueTo) redirect(safeContinueTo);
}


export async function submitTrainingAssessmentAction(formData: FormData) {
  const courseSlug = String(formData.get("course_slug") || "").trim();
  const assessmentId = String(formData.get("assessment_id") || "").trim();
  const responseText = String(formData.get("response_text") || "").trim();
  const { userId } = await requireAuthenticatedUserFast(
    courseSlug && assessmentId
      ? `/workspace/training/courses/${courseSlug}/assessments/${assessmentId}`
      : "/workspace/training",
  );

  if (!courseSlug || !assessmentId || responseText.length < 100 || responseText.length > 20000) {
    throw new Error("Submit at least 100 characters and no more than 20,000.");
  }

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("id,slug")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!course) redirect("/workspace/training");

  const { data: assessment } = await supabase
    .from("training_assessments")
    .select("id,course_id")
    .eq("id", assessmentId)
    .eq("course_id", course.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!assessment) redirect(`/workspace/training/courses/${course.slug}`);

  const { data: moduleRows } = await supabase
    .from("training_modules")
    .select("id")
    .eq("course_id", course.id);
  const moduleIds = (moduleRows || []).map((module) => module.id);
  const { data: lessonRows } = moduleIds.length
    ? await supabase
        .from("training_lessons")
        .select("id")
        .in("module_id", moduleIds)
        .eq("is_published", true)
    : { data: [] };
  const lessonIds = (lessonRows || []).map((lesson) => lesson.id);
  const { data: completedRows } = lessonIds.length
    ? await supabase
        .from("training_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] };
  const completedIds = new Set((completedRows || []).map((item) => item.lesson_id));
  if (!lessonIds.length || !lessonIds.every((id) => completedIds.has(id))) {
    throw new Error("Complete all published lessons before submitting the final assessment.");
  }

  const { error: enrollmentError } = await supabase
    .from("training_enrollments")
    .insert({ user_id: userId, course_id: course.id });

  if (enrollmentError && enrollmentError.code !== "23505") {
    throw new Error("Could not enroll you in this course.");
  }

  const { data: pendingSubmission } = await supabase
    .from("training_assessment_submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("assessment_id", assessment.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pendingSubmission) {
    const { error } = await supabase
      .from("training_assessment_submissions")
      .insert({
        user_id: userId,
        assessment_id: assessment.id,
        response: { text: responseText },
        status: "submitted",
      });

    if (error) throw new Error("Could not submit your assessment.");

    await recordProductEvent("training_assessment_submit", {
      userId,
      path: `/workspace/training/courses/${course.slug}/assessments/${assessment.id}`,
      metadata: { course_slug: course.slug, assessment_id: assessment.id },
    });
  }

  revalidatePath("/workspace/training");
  revalidatePath(`/workspace/training/courses/${course.slug}`);
  revalidatePath(`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`);
  redirect(`/workspace/training/courses/${course.slug}/assessments/${assessment.id}?submitted=1`);
}
