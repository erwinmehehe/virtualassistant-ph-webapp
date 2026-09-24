import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

function completionCredentialCode() {
  return `VAT-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export async function finalizeTrainingCourseIfEligible(userId: string, courseId: string) {
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("training_courses")
    .select("id,slug,status")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();

  if (!course) return { completed: false, newlyCompleted: false, certificateIssued: false };

  const { data: modules } = await admin
    .from("training_modules")
    .select("id")
    .eq("course_id", courseId);

  const moduleIds = (modules || []).map((item) => item.id);
  if (!moduleIds.length) return { completed: false, newlyCompleted: false, certificateIssued: false };

  const { data: lessons } = await admin
    .from("training_lessons")
    .select("id")
    .in("module_id", moduleIds)
    .eq("is_published", true);

  const lessonIds = (lessons || []).map((item) => item.id);
  if (!lessonIds.length) return { completed: false, newlyCompleted: false, certificateIssued: false };

  const { data: progress } = await admin
    .from("training_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  const completedLessonIds = new Set((progress || []).map((item) => item.lesson_id));
  if (!lessonIds.every((id) => completedLessonIds.has(id))) {
    return { completed: false, newlyCompleted: false, certificateIssued: false };
  }

  const { data: assessments } = await admin
    .from("training_assessments")
    .select("id,pass_score")
    .eq("course_id", courseId)
    .eq("is_published", true);

  const publishedAssessments = assessments || [];
  if (publishedAssessments.length) {
    const assessmentIds = publishedAssessments.map((assessment) => assessment.id);
    const { data: submissions } = await admin
      .from("training_assessment_submissions")
      .select("assessment_id,status,score,submitted_at,response")
      .eq("user_id", userId)
      .in("assessment_id", assessmentIds)
      .eq("status", "reviewed")
      .order("submitted_at", { ascending: false });

    const passingAssessmentIds = new Set<string>();
    for (const assessment of publishedAssessments) {
      const passing = (submissions || []).some((submission) => {
        const response =
          submission.response &&
          typeof submission.response === "object" &&
          !Array.isArray(submission.response)
            ? submission.response
            : null;
        return (
          submission.assessment_id === assessment.id &&
          submission.status === "reviewed" &&
          response?.kind === "automatic_knowledge_check" &&
          (assessment.pass_score === null || assessment.pass_score === undefined ||
            (submission.score !== null && Number(submission.score) >= Number(assessment.pass_score)))
        );
      });
      if (passing) passingAssessmentIds.add(assessment.id);
    }

    if (!publishedAssessments.every((assessment) => passingAssessmentIds.has(assessment.id))) {
      return { completed: false, newlyCompleted: false, certificateIssued: false };
    }
  }

  const completedAt = new Date().toISOString();
  const { data: enrollmentRows } = await admin
    .from("training_enrollments")
    .update({ completed_at: completedAt })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .is("completed_at", null)
    .select("id");

  const newlyCompleted = Boolean(enrollmentRows?.length);

  const { data: existingCertificate } = await admin
    .from("training_certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  let certificateIssued = false;
  if (!existingCertificate) {
    const { error } = await admin
      .from("training_certificates")
      .insert({
        credential_code: completionCredentialCode(),
        user_id: userId,
        course_id: courseId,
        issued_at: completedAt,
        metadata: {
          credential_type: "certificate_of_completion",
          public_profile_visible: false,
        },
      });

    if (error && error.code !== "23505") {
      throw new Error("Course completion was saved, but the certificate could not be issued.");
    }
    certificateIssued = !error;
  }

  return { completed: true, newlyCompleted, certificateIssued };
}
