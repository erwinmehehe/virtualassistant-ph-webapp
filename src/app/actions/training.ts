"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/product-events";
import { finalizeTrainingCourseIfEligible } from "@/lib/training-completion";
import {
  assessmentQuestionSetKey,
  buildAssessmentQuestionsFromLessons,
  buildLessonCheckpoint,
  lessonActiveSecondsRequired,
  summarizeAssessmentAnswerPattern,
} from "@/lib/training-integrity";
import { getAustraliaSpecialization, isAustraliaSpecializationSlug } from "@/lib/training-specializations";

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

export async function selectAustraliaSpecializationAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const specializationSlug = String(formData.get("specialization_slug") || "").trim();

  if (!isAustraliaSpecializationSlug(specializationSlug)) {
    redirect("/workspace/training");
  }

  const specialization = getAustraliaSpecialization(specializationSlug);
  if (!specialization) redirect("/workspace/training");

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: preferenceError } = await supabase
    .from("training_learner_preferences")
    .upsert({
      user_id: userId,
      australia_specialization: specialization.slug,
      australia_selected_at: now,
      updated_at: now,
    }, { onConflict: "user_id" });

  if (preferenceError) {
    throw new Error("Could not save your Australian specialisation.");
  }

  const { data: courseRows } = await supabase
    .from("training_courses")
    .select("id,slug")
    .in("slug", [...specialization.courses])
    .eq("status", "published");

  const courseBySlug = new Map((courseRows || []).map((course) => [course.slug, course]));
  const pathCourses = specialization.courses
    .map((slug) => courseBySlug.get(slug) || null)
    .filter((course): course is { id: string; slug: string } => Boolean(course));

  const courseIds = pathCourses.map((course) => course.id);
  const { data: enrollmentRows } = courseIds.length
    ? await supabase
        .from("training_enrollments")
        .select("course_id,completed_at")
        .eq("user_id", userId)
        .in("course_id", courseIds)
    : { data: [] };

  const enrollmentByCourse = new Map(
    (enrollmentRows || []).map((row) => [row.course_id, row]),
  );
  const next = pathCourses.find((course) => !enrollmentByCourse.get(course.id)?.completed_at) || null;

  await recordProductEvent("training_australia_specialization_select", {
    userId,
    path: "/workspace/training",
    metadata: { specialization_slug: specialization.slug },
  });

  if (!next) {
    revalidatePath("/workspace/training");
    redirect("/workspace/training");
  }

  if (!enrollmentByCourse.has(next.id)) {
    const { error: enrollmentError } = await supabase
      .from("training_enrollments")
      .insert({ user_id: userId, course_id: next.id });

    if (enrollmentError && enrollmentError.code !== "23505") {
      throw new Error("Could not start the first course in this path.");
    }

    if (!enrollmentError) {
      await recordProductEvent("training_course_start", {
        userId,
        path: `/workspace/training/courses/${next.slug}`,
        metadata: {
          course_slug: next.slug,
          source: "australia_specialization",
          specialization_slug: specialization.slug,
        },
      });
    }
  }

  revalidatePath("/workspace/training");
  redirect(`/workspace/training/courses/${next.slug}`);
}

export async function recordTrainingLessonEngagementAction(input: {
  lessonId: string;
  courseSlug: string;
  scrollPercent: number;
}) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const lessonId = String(input.lessonId || "").trim();
  const courseSlug = String(input.courseSlug || "").trim();
  const scrollPercent = Math.max(0, Math.min(100, Math.round(Number(input.scrollPercent || 0))));
  if (!lessonId || !courseSlug) return { activeSeconds: 0, maxScrollPercent: 0 };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("training_courses")
    .select("id")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return { activeSeconds: 0, maxScrollPercent: 0 };

  const { data: modules } = await admin
    .from("training_modules")
    .select("id")
    .eq("course_id", course.id);
  const moduleIds = (modules || []).map((item) => item.id);
  if (!moduleIds.length) return { activeSeconds: 0, maxScrollPercent: 0 };

  const { data: lesson } = await admin
    .from("training_lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("is_published", true)
    .in("module_id", moduleIds)
    .maybeSingle();
  if (!lesson) return { activeSeconds: 0, maxScrollPercent: 0 };

  const { data: existing } = await admin
    .from("training_lesson_engagement")
    .select("active_seconds,max_scroll_percent,last_activity_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const now = new Date();
  let earnedSeconds = 0;
  if (existing?.last_activity_at) {
    const elapsed = Math.floor((now.getTime() - new Date(existing.last_activity_at).getTime()) / 1000);
    if (elapsed >= 5 && elapsed <= 45) earnedSeconds = Math.min(30, elapsed);
  }

  const activeSeconds = Number(existing?.active_seconds || 0) + earnedSeconds;
  const maxScrollPercent = Math.max(Number(existing?.max_scroll_percent || 0), scrollPercent);

  await admin.from("training_lesson_engagement").upsert({
    user_id: userId,
    lesson_id: lesson.id,
    active_seconds: activeSeconds,
    max_scroll_percent: maxScrollPercent,
    last_activity_at: now.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "user_id,lesson_id" });

  return { activeSeconds, maxScrollPercent };
}

export async function checkTrainingLessonCheckpointAction(input: {
  lessonId: string;
  courseSlug: string;
  optionId: string;
}) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const lessonId = String(input.lessonId || "").trim();
  const courseSlug = String(input.courseSlug || "").trim();
  const optionId = String(input.optionId || "").trim();
  if (!lessonId || !courseSlug || !optionId) return { correct: false };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("training_courses")
    .select("id")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return { correct: false };

  const { data: modules } = await admin
    .from("training_modules")
    .select("id")
    .eq("course_id", course.id);
  const moduleIds = (modules || []).map((item) => item.id);
  if (!moduleIds.length) return { correct: false };

  const { data: lesson } = await admin
    .from("training_lessons")
    .select("id,title,content")
    .eq("id", lessonId)
    .eq("is_published", true)
    .in("module_id", moduleIds)
    .maybeSingle();
  if (!lesson) return { correct: false };

  const checkpoint = buildLessonCheckpoint({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    userId,
    content: lesson.content,
  });
  if (!checkpoint) return { correct: false };

  const correct = optionId === checkpoint.correctOptionId;
  await recordProductEvent("training_checkpoint_attempt", {
    userId,
    path: `/workspace/training/courses/${courseSlug}/lessons/${lesson.id}`,
    metadata: {
      course_slug: courseSlug,
      lesson_id: lesson.id,
      question_key: checkpoint.questionKey,
      correct,
    },
  });
  if (!correct) return { correct: false };

  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("training_lesson_engagement")
    .select("active_seconds,max_scroll_percent,last_activity_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  await admin.from("training_lesson_engagement").upsert({
    user_id: userId,
    lesson_id: lesson.id,
    active_seconds: Number(existing?.active_seconds || 0),
    max_scroll_percent: Number(existing?.max_scroll_percent || 0),
    checkpoint_passed_at: now,
    checkpoint_key: checkpoint.checkpointKey,
    last_activity_at: existing?.last_activity_at || now,
    updated_at: now,
  }, { onConflict: "user_id,lesson_id" });

  return { correct: true };
}

export async function markTrainingLessonCompleteAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const lessonId = String(formData.get("lesson_id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  const continueTo = String(formData.get("continue_to") || "").trim();
  const exerciseResponse = String(formData.get("exercise_response") || "").trim();
  if (!lessonId || !courseSlug) redirect("/workspace/training");

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("training_courses")
    .select("id,slug")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) redirect("/workspace/training");

  const { data: modules } = await admin
    .from("training_modules")
    .select("id,position")
    .eq("course_id", course.id)
    .order("position");
  const moduleIds = (modules || []).map((module) => module.id);
  if (!moduleIds.length) redirect(`/workspace/training/courses/${course.slug}`);

  const { data: lessons } = await admin
    .from("training_lessons")
    .select("id,module_id,title,content,estimated_minutes,position,is_published")
    .in("module_id", moduleIds)
    .eq("is_published", true);

  const modulePosition = new Map((modules || []).map((module) => [module.id, module.position]));
  const orderedLessons = (lessons || []).sort((a, b) =>
    Number(modulePosition.get(a.module_id) || 0) - Number(modulePosition.get(b.module_id) || 0) ||
    Number(a.position) - Number(b.position)
  );
  const lessonIndex = orderedLessons.findIndex((item) => item.id === lessonId);
  if (lessonIndex < 0) redirect(`/workspace/training/courses/${course.slug}`);
  const lesson = orderedLessons[lessonIndex];
  const lessonPath = `/workspace/training/courses/${course.slug}/lessons/${lesson.id}`;
  type LessonCompletionErrorReason = "sequence" | "time" | "scroll" | "checkpoint" | "exercise";
  const failLessonCompletion = (reason: LessonCompletionErrorReason): never => {
    redirect(`${lessonPath}?lesson_error=${reason}`);
  };

  const previousIds = orderedLessons.slice(0, lessonIndex).map((item) => item.id);
  if (previousIds.length) {
    const { data: previousProgress } = await admin
      .from("training_lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .in("lesson_id", previousIds);
    const completedPrevious = new Set((previousProgress || []).map((item) => item.lesson_id));
    if (!previousIds.every((id) => completedPrevious.has(id))) {
      failLessonCompletion("sequence");
    }
  }

  const { data: engagement } = await admin
    .from("training_lesson_engagement")
    .select("active_seconds,max_scroll_percent,checkpoint_key")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const requiredActiveSeconds = lessonActiveSecondsRequired(Number(lesson.estimated_minutes || 1));
  if (Number(engagement?.active_seconds || 0) < requiredActiveSeconds) {
    failLessonCompletion("time");
  }
  if (Number(engagement?.max_scroll_percent || 0) < 85) {
    failLessonCompletion("scroll");
  }

  const checkpoint = buildLessonCheckpoint({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    userId,
    content: lesson.content,
  });
  if (checkpoint && engagement?.checkpoint_key !== checkpoint.checkpointKey) {
    failLessonCompletion("checkpoint");
  }

  const hasExercise =
    Array.isArray(lesson.content) &&
    lesson.content.some((block) => block && typeof block === "object" && (block as { type?: string }).type === "exercise");
  if (hasExercise && (exerciseResponse.length < 80 || exerciseResponse.length > 5000)) {
    failLessonCompletion("exercise");
  }

  const now = new Date().toISOString();
  await admin.from("training_lesson_engagement").upsert({
    user_id: userId,
    lesson_id: lesson.id,
    active_seconds: Number(engagement?.active_seconds || 0),
    max_scroll_percent: Number(engagement?.max_scroll_percent || 0),
    checkpoint_passed_at: checkpoint ? now : null,
    checkpoint_key: checkpoint?.checkpointKey || null,
    exercise_response: hasExercise ? exerciseResponse : null,
    last_activity_at: now,
    updated_at: now,
  }, { onConflict: "user_id,lesson_id" });

  const { error: enrollmentError } = await admin
    .from("training_enrollments")
    .insert({ user_id: userId, course_id: course.id });
  if (enrollmentError && enrollmentError.code !== "23505") {
    throw new Error("Could not start this training course.");
  }

  const { data: existingProgress } = await admin
    .from("training_lesson_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const { error: progressError } = await admin
    .from("training_lesson_progress")
    .upsert(
      { user_id: userId, lesson_id: lesson.id, completed_at: now },
      { onConflict: "user_id,lesson_id" },
    );
  if (progressError) throw new Error("Could not save lesson progress.");

  if (!existingProgress?.completed_at) {
    await recordProductEvent("training_lesson_complete", {
      userId,
      path: `/workspace/training/courses/${course.slug}/lessons/${lesson.id}`,
      metadata: {
        course_slug: course.slug,
        lesson_id: lesson.id,
        active_seconds: Number(engagement?.active_seconds || 0),
        max_scroll_percent: Number(engagement?.max_scroll_percent || 0),
        checkpoint_required: Boolean(checkpoint),
        practical_response_required: hasExercise,
        lesson_number: lessonIndex + 1,
        lesson_count: orderedLessons.length,
        is_final_lesson: lessonIndex === orderedLessons.length - 1,
      },
    });
  }

  const completion = await finalizeTrainingCourseIfEligible(userId, course.id);
  if (completion.newlyCompleted) {
    await recordProductEvent("training_course_complete", {
      userId,
      path: `/workspace/training/courses/${course.slug}`,
      metadata: { course_slug: course.slug, completion_source: "automatic_integrity" },
    });
  }
  if (completion.certificateIssued) {
    await recordProductEvent("training_certificate_issued", {
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

  if (
    safeContinueTo.includes("/assessments/") &&
    !existingProgress?.completed_at
  ) {
    await recordProductEvent("training_assessment_open", {
      userId,
      path: safeContinueTo,
      metadata: {
        course_slug: course.slug,
        source: "final_lesson_auto_handoff",
        from_lesson_id: lesson.id,
      },
    });
  }

  if (safeContinueTo) redirect(safeContinueTo);
  redirect(coursePath);
}


export async function submitTrainingAssessmentAction(formData: FormData) {
  const courseSlug = String(formData.get("course_slug") || "").trim();
  const assessmentId = String(formData.get("assessment_id") || "").trim();
  const requestedAttempt = Number(formData.get("attempt_number") || 0);
  const submittedQuestionSetKey = String(formData.get("question_set_key") || "").trim();
  const { userId } = await requireAuthenticatedUserFast(
    courseSlug && assessmentId
      ? `/workspace/training/courses/${courseSlug}/assessments/${assessmentId}`
      : "/workspace/training",
  );
  if (!courseSlug || !assessmentId) redirect("/workspace/training");

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("training_courses")
    .select("id,slug")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) redirect("/workspace/training");

  const { data: assessment } = await admin
    .from("training_assessments")
    .select("id,course_id,pass_score")
    .eq("id", assessmentId)
    .eq("course_id", course.id)
    .eq("is_published", true)
    .maybeSingle();
  if (!assessment) redirect(`/workspace/training/courses/${course.slug}`);

  const assessmentPath = `/workspace/training/courses/${course.slug}/assessments/${assessment.id}`;
  type AssessmentSubmissionErrorReason =
    | "lessons"
    | "stale"
    | "limit"
    | "not_ready"
    | "question_set";
  const failAssessmentSubmission = (reason: AssessmentSubmissionErrorReason): never => {
    redirect(`${assessmentPath}?assessment_error=${reason}`);
  };

  const { data: modules } = await admin
    .from("training_modules")
    .select("id,position")
    .eq("course_id", course.id)
    .order("position");
  const moduleIds = (modules || []).map((module) => module.id);
  const { data: lessons } = moduleIds.length
    ? await admin
        .from("training_lessons")
        .select("id,module_id,title,content,position,is_published")
        .in("module_id", moduleIds)
        .eq("is_published", true)
    : { data: [] };

  const modulePosition = new Map((modules || []).map((module) => [module.id, module.position]));
  const orderedLessons = (lessons || []).sort((a, b) =>
    Number(modulePosition.get(a.module_id) || 0) - Number(modulePosition.get(b.module_id) || 0) ||
    Number(a.position) - Number(b.position)
  );
  const lessonIds = orderedLessons.map((lesson) => lesson.id);
  const { data: completedRows } = lessonIds.length
    ? await admin
        .from("training_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] };
  const completedIds = new Set((completedRows || []).map((item) => item.lesson_id));
  if (!lessonIds.length || !lessonIds.every((id) => completedIds.has(id))) {
    failAssessmentSubmission("lessons");
  }

  const { data: attempts } = await admin
    .from("training_assessment_submissions")
    .select("id,submitted_at,status,score")
    .eq("user_id", userId)
    .eq("assessment_id", assessment.id)
    .order("submitted_at", { ascending: true });

  const attemptRows = attempts || [];
  const nextAttempt = attemptRows.length + 1;
  if (requestedAttempt && requestedAttempt !== nextAttempt) {
    failAssessmentSubmission("stale");
  }

  const since = Date.now() - 86_400_000;
  const recentAttempts = attemptRows.filter((row) => new Date(row.submitted_at).getTime() >= since);
  if (recentAttempts.length >= 3) {
    failAssessmentSubmission("limit");
  }

  const questions = buildAssessmentQuestionsFromLessons({
    lessons: orderedLessons,
    assessmentId: assessment.id,
    userId,
    attemptNumber: nextAttempt,
    questionCount: 8,
  });
  if (questions.length < 4) {
    failAssessmentSubmission("not_ready");
  }

  const expectedQuestionSetKey = assessmentQuestionSetKey(questions);
  if (!submittedQuestionSetKey || submittedQuestionSetKey !== expectedQuestionSetKey) {
    failAssessmentSubmission("question_set");
  }

  const answers: Record<string, string> = {};
  const missedLessonIds: string[] = [];
  let correct = 0;
  for (const question of questions) {
    const answer = String(formData.get("question_" + question.id) || "").trim();
    answers[question.id] = answer;
    if (answer === question.correctOptionId) correct += 1;
    else missedLessonIds.push(question.lessonId);
  }

  const score = Math.round((correct / questions.length) * 100);
  const passScore = Number(assessment.pass_score ?? 80);
  const criticalMisses = questions.filter(
    (question) => question.critical && answers[question.id] !== question.correctOptionId,
  );
  const pattern = summarizeAssessmentAnswerPattern(questions, answers);
  const passed = score >= passScore && criticalMisses.length === 0;
  const missedLessonTitles = questions
    .filter((question) => missedLessonIds.includes(question.lessonId))
    .map((question) => question.lessonTitle)
    .filter((value, index, values) => values.indexOf(value) === index);
  const feedback = passed
    ? "Passed automatically. Your course completion and certificate are being issued now."
    : criticalMisses.length
      ? `Not passed yet. Review the authority and decision-boundary material in: ${missedLessonTitles.join(", ")}. A critical boundary question was missed. The answer key is not shown.`
      : `Not passed yet. Review these lessons before retrying: ${missedLessonTitles.join(", ")}. The answer key is not shown.`;

  const { error: submissionError } = await admin
    .from("training_assessment_submissions")
    .insert({
      user_id: userId,
      assessment_id: assessment.id,
      response: {
        kind: "automatic_knowledge_check",
        attempt: nextAttempt,
        question_ids: questions.map((question) => question.id),
        question_keys: questions.map((question) => question.questionKey),
        question_set_key: expectedQuestionSetKey,
        question_kinds: questions.map((question) => question.kind),
        answers,
        answer_positions: pattern.positions,
        answer_position_histogram: pattern.histogram,
        unique_answer_positions: pattern.uniquePositions,
        longest_same_position_run: pattern.longestSamePositionRun,
        answer_pattern_flagged: pattern.flagged,
        critical_miss_count: criticalMisses.length,
        critical_missed_question_keys: criticalMisses.map((question) => question.questionKey),
        missed_lesson_ids: missedLessonIds,
      },
      status: passed ? "reviewed" : "needs_revision",
      score,
      feedback,
      reviewer_id: null,
      reviewed_at: new Date().toISOString(),
    });
  if (submissionError) throw new Error("Could not save your assessment result.");

  await recordProductEvent("training_assessment_submit", {
    userId,
    path: `/workspace/training/courses/${course.slug}/assessments/${assessment.id}`,
    metadata: { course_slug: course.slug, assessment_id: assessment.id, attempt: nextAttempt },
  });
  await recordProductEvent("training_assessment_reviewed", {
    userId,
    path: `/workspace/training/courses/${course.slug}/assessments/${assessment.id}`,
    metadata: {
      course_slug: course.slug,
      assessment_id: assessment.id,
      outcome: passed ? "pass" : "needs_revision",
      score,
      source: "automatic",
      attempt: nextAttempt,
      question_count: questions.length,
      correct_count: correct,
      missed_lesson_count: missedLessonTitles.length,
      critical_miss_count: criticalMisses.length,
      answer_pattern_flagged: pattern.flagged,
      unique_answer_positions: pattern.uniquePositions,
      longest_same_position_run: pattern.longestSamePositionRun,
    },
  });

  if (passed) {
    const completion = await finalizeTrainingCourseIfEligible(userId, course.id);
    if (completion.newlyCompleted) {
      await recordProductEvent("training_course_complete", {
        userId,
        path: `/workspace/training/courses/${course.slug}`,
        metadata: { course_slug: course.slug, completion_source: "automatic_assessment" },
      });
    }
    if (completion.certificateIssued) {
      await recordProductEvent("training_certificate_issued", {
        userId,
        path: `/workspace/training/courses/${course.slug}`,
        metadata: { course_slug: course.slug },
      });
    }
  }

  revalidatePath("/workspace/training");
  revalidatePath(`/workspace/training/courses/${course.slug}`);
  revalidatePath(`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`);
  redirect(
    `/workspace/training/courses/${course.slug}/assessments/${assessment.id}?result=${passed ? "passed" : "failed"}`
  );
}
