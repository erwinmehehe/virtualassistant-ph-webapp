/**
 * Learner-facing course continuation priority.
 *
 * A course at its final check should not disappear behind a freshly opened
 * course. Within the same completion stage, prefer the most recently worked
 * on course. This never changes assessment, progress, or certificate records.
 */
export type TrainingResumeCandidate = {
  enrolled: boolean;
  completedAt: string | null;
  assessmentStatus: string;
  nextAssessment: { id: string } | null;
  nextLesson: { id: string } | null;
  lessonCount: number;
  completedLessons: number;
  lastActivityAt: string | null;
  startedAt: string | null;
};

function validTime(value: string | null): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function recentTime(course: TrainingResumeCandidate): number {
  return validTime(course.lastActivityAt) || validTime(course.startedAt);
}

function completionPriority(course: TrainingResumeCandidate): number {
  if (course.nextAssessment && course.assessmentStatus === "ready") return 4;
  if (course.nextAssessment && course.assessmentStatus === "needs_revision") return 3;
  if (course.nextLesson && course.lessonCount > 0 &&
      course.lessonCount - course.completedLessons === 1) return 2;
  if (course.assessmentStatus === "in_review") return 0;
  return 1;
}

export function chooseTrainingResumeCourse<T extends TrainingResumeCandidate>(
  courses: readonly T[],
): T | null {
  const active = courses.filter((course) => course.enrolled && !course.completedAt);
  if (!active.length) return null;

  // Copy before sorting so the active-course list retains its recency order.
  return [...active].sort((a, b) =>
    completionPriority(b) - completionPriority(a) ||
    recentTime(b) - recentTime(a)
  )[0] || null;
}
