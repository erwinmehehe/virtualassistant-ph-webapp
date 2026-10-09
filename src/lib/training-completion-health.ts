/**
 * Snapshot of learner/course progress for the admin dashboard.
 * This file intentionally has no DB client or user-facing identities.
 * One learner enrolled in three courses counts as three enrollments.
 * Completion is all-time, not an age-matched conversion cohort.
 */
export type CompletionHealthCourse = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedLessonIds: string[];
};

export type CompletionHealthEnrollment = {
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
};

export type CompletionHealthProgress = {
  user_id: string;
  lesson_id: string;
  completed_at: string;
};

export type CompletionHealthEngagement = {
  user_id: string;
  lesson_id: string;
  active_seconds: number | null;
  last_activity_at: string | null;
  updated_at: string;
};

export type CompletionHealthAssessment = {
  user_id: string;
  course_id: string;
  status: string;
  submitted_at: string;
};

export type TrainingCompletionHealthRow = {
  id: string;
  title: string;
  slug: string;
  enrolled: number;
  completed: number;
  completionRate: number;
  engaged: number;
  stalled7d: number;
  notEngaged7d: number;
  oneLessonLeft: number;
  finalStep: number;
  awaitingReview: number;
  needsRevision: number;
};

export type TrainingCompletionHealth = {
  available: boolean;
  reason: string | null;
  totals: Omit<TrainingCompletionHealthRow, "id" | "title" | "slug" | "completionRate"> & { completionRate: number };
  courses: TrainingCompletionHealthRow[];
};

export type CompletionHealthInput = {
  courses: CompletionHealthCourse[];
  enrollments: CompletionHealthEnrollment[];
  progress: CompletionHealthProgress[];
  engagement: CompletionHealthEngagement[];
  assessments: CompletionHealthAssessment[];
  nowMs: number;
  complete?: boolean;
};

const DAY_MS = 86_400_000;
type Metric = keyof Omit<TrainingCompletionHealthRow, "id" | "title" | "slug" | "completionRate">;
const METRICS: Metric[] = [
  "enrolled", "completed", "engaged", "stalled7d", "notEngaged7d",
  "oneLessonLeft", "finalStep", "awaitingReview", "needsRevision",
];

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function blankRow(course: CompletionHealthCourse): TrainingCompletionHealthRow {
  return {
    id: course.id, title: course.title, slug: course.slug,
    enrolled: 0, completed: 0, completionRate: 0, engaged: 0,
    stalled7d: 0, notEngaged7d: 0, oneLessonLeft: 0,
    finalStep: 0, awaitingReview: 0, needsRevision: 0,
  };
}

function summarize(rows: TrainingCompletionHealthRow[]): TrainingCompletionHealth["totals"] {
  const totals = {
    enrolled: 0, completed: 0, engaged: 0, stalled7d: 0, notEngaged7d: 0,
    oneLessonLeft: 0, finalStep: 0, awaitingReview: 0, needsRevision: 0,
    completionRate: 0,
  };
  for (const row of rows) {
    for (const metric of METRICS) totals[metric] += row[metric];
  }
  totals.completionRate = totals.enrolled ? Math.round(100 * totals.completed / totals.enrolled) : 0;
  return totals;
}

export function buildTrainingCompletionHealth(input: CompletionHealthInput): TrainingCompletionHealth {
  if (input.complete === false) {
    return { available: false, reason: "Source data is incomplete or unavailable. Retry before relying on completion rates.", totals: summarize([]), courses: [] };
  }

  const activeCourses = input.courses.filter(course => course.status === "published");
  const rowsByCourse = new Map(activeCourses.map(course => [course.id, blankRow(course)]));
  const courseLessons = new Map(activeCourses.map(course => [course.id, new Set(course.publishedLessonIds)]));
  const lessonCourse = new Map<string, string>();
  for (const course of activeCourses) {
    for (const lessonId of courseLessons.get(course.id) || []) lessonCourse.set(lessonId, course.id);
  }

  const enrollmentByKey = new Map<string, CompletionHealthEnrollment>();
  for (const item of input.enrollments) {
    if (!rowsByCourse.has(item.course_id)) continue;
    const key = item.user_id + ":" + item.course_id;
    const existing = enrollmentByKey.get(key);
    if (!existing) {
      enrollmentByKey.set(key, item);
      continue;
    }
    // Defensive deduplication: a completed duplicate cannot be demoted by an
    // incomplete one, and the earliest recorded start is the cohort origin.
    const earlyStart = Math.min(
      timestamp(item.started_at) || Infinity,
      timestamp(existing.started_at) || Infinity,
    );
    enrollmentByKey.set(key, {
      ...existing,
      started_at: Number.isFinite(earlyStart) ? new Date(earlyStart).toISOString() : existing.started_at,
      completed_at: existing.completed_at || item.completed_at,
    });
  }

  const progressByKey = new Map<string, Set<string>>();
  const activityByKey = new Map<string, number>();
  const engagedKeys = new Set<string>();

  for (const row of input.progress) {
    const courseId = lessonCourse.get(row.lesson_id);
    if (!courseId) continue;
    const key = row.user_id + ":" + courseId;
    if (!enrollmentByKey.has(key)) continue;
    if (!progressByKey.has(key)) progressByKey.set(key, new Set());
    progressByKey.get(key)!.add(row.lesson_id);
    engagedKeys.add(key);
    activityByKey.set(key, Math.max(activityByKey.get(key) || 0, timestamp(row.completed_at)));
  }
  for (const row of input.engagement) {
    const courseId = lessonCourse.get(row.lesson_id);
    if (!courseId) continue;
    const key = row.user_id + ":" + courseId;
    if (!enrollmentByKey.has(key)) continue;
    if (Number(row.active_seconds || 0) > 0) engagedKeys.add(key);
    activityByKey.set(
      key,
      Math.max(activityByKey.get(key) || 0, timestamp(row.last_activity_at || row.updated_at)),
    );
  }

  const assessmentByKey = new Map<string, CompletionHealthAssessment>();
  for (const row of input.assessments) {
    const key = row.user_id + ":" + row.course_id;
    if (!enrollmentByKey.has(key)) continue;
    const previous = assessmentByKey.get(key);
    if (!previous || timestamp(row.submitted_at) > timestamp(previous.submitted_at)) {
      assessmentByKey.set(key, row);
    }
    activityByKey.set(key, Math.max(activityByKey.get(key) || 0, timestamp(row.submitted_at)));
    engagedKeys.add(key);
  }

  for (const [key, enrollment] of enrollmentByKey) {
    const record = rowsByCourse.get(enrollment.course_id)!;
    const lessonCount = courseLessons.get(enrollment.course_id)!.size;
    const completedLessons = progressByKey.get(key)?.size || 0;
    const finished = Boolean(enrollment.completed_at);
    const latest = assessmentByKey.get(key);
    const engaged = finished || engagedKeys.has(key);
    record.enrolled += 1;
    if (engaged) record.engaged += 1;
    if (finished) {
      record.completed += 1;
      continue;
    }
    const lastSeen = Math.max(timestamp(enrollment.started_at), activityByKey.get(key) || 0);
    if (lastSeen > 0 && lastSeen <= input.nowMs - 7 * DAY_MS) {
      record.stalled7d += 1;
      if (!engaged) record.notEngaged7d += 1;
    }
    if (latest?.status === "submitted") record.awaitingReview += 1;
    if (latest?.status === "needs_revision") record.needsRevision += 1;
    if (lessonCount > 0 && completedLessons === lessonCount) {
      record.finalStep += 1;
    } else if (lessonCount > 1 && completedLessons === lessonCount - 1) {
      record.oneLessonLeft += 1;
    }
  }

  const rows = [...rowsByCourse.values()]
    .filter(row => row.enrolled > 0)
    .map(row => ({
      ...row,
      completionRate: Math.round(100 * row.completed / row.enrolled),
    }))
    .sort((a, b) =>
      b.stalled7d - a.stalled7d ||
      b.finalStep - a.finalStep ||
      b.awaitingReview - a.awaitingReview ||
      b.enrolled - a.enrolled ||
      a.title.localeCompare(b.title),
    ));

  return { available: true, reason: null, totals: summarize(rows), courses: rows };
}
