/**
 * Privacy-safe lesson-level "next step" bottlenecks for administrators.
 * Enrolment counts represent learner-course pairs, not unique platform users.
 * This module never returns user IDs, emails, or any contact destination.
 */
export type BottleneckCourse = {
  id: string;
  slug: string;
  title: string;
  status: string;
};
export type BottleneckModule = {
  id: string;
  course_id: string;
  position: number;
};
export type BottleneckLesson = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
};
export type BottleneckEnrollment = {
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
};
export type BottleneckProgress = {
  user_id: string;
  lesson_id: string;
  completed_at: string;
};
export type BottleneckEngagement = {
  user_id: string;
  lesson_id: string;
  active_seconds: number | null;
  last_activity_at: string | null;
  updated_at: string;
};
export type LessonBottleneck = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonNumber: number;
  totalLessons: number;
  waiting: number;
  stalled7d: number;
  noRecordedEngagement: number;
};
export type TrainingLessonBottlenecks = {
  available: boolean;
  reason: string | null;
  inactivityDays: number;
  totals: {
    unfinishedEnrollments: number;
    withNextLesson: number;
    stalled7d: number;
    noRecordedEngagement: number;
  };
  lessons: LessonBottleneck[];
};
export type LessonBottleneckInput = {
  courses: BottleneckCourse[];
  modules: BottleneckModule[];
  lessons: BottleneckLesson[];
  enrollments: BottleneckEnrollment[];
  progress: BottleneckProgress[];
  engagement: BottleneckEngagement[];
  nowMs: number;
  complete?: boolean;
};

const DAY_MS = 86_400_000;
const INACTIVITY_DAYS = 7;
function timestamp(value: string | null | undefined): number {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
}
function unavailable(): TrainingLessonBottlenecks {
  return {
    available: false,
    reason: "Lesson or learner activity data was incomplete. Retry before ranking bottlenecks.",
    inactivityDays: INACTIVITY_DAYS,
    totals: {
      unfinishedEnrollments: 0, withNextLesson: 0, stalled7d: 0,
      noRecordedEngagement: 0,
    },
    lessons: [],
  };
}

export function buildTrainingLessonBottlenecks(input: LessonBottleneckInput): TrainingLessonBottlenecks {
  if (input.complete === false || !Number.isFinite(input.nowMs)) return unavailable();

  const published = input.courses.filter(course => course.status === "published");
  const coursesById = new Map(published.map(course => [course.id, course]));
  const modulesById = new Map(input.modules.filter(m => coursesById.has(m.course_id)).map(m => [m.id, m]));
  const orderedByCourse = new Map(published.map(course => [course.id, [] as BottleneckLesson[]]));
  const lessonCourse = new Map<string, string>();
  const lessons = input.lessons.filter(lesson => lesson.is_published && modulesById.has(lesson.module_id));
  lessons.sort((a,b) => {
    const ma = modulesById.get(a.module_id)!;
    const mb = modulesById.get(b.module_id)!;
    return ma.course_id.localeCompare(mb.course_id) ||
      Number(ma.position) - Number(mb.position) ||
      Number(a.position) - Number(b.position) ||
      a.id.localeCompare(b.id);
  });
  for (const lesson of lessons) {
    const courseId = modulesById.get(lesson.module_id)!.course_id;
    orderedByCourse.get(courseId)!.push(lesson);
    lessonCourse.set(lesson.id, courseId);
  }

  // An enrolment is one learner and course even if historic data duplicated it.
  // Any completed duplicate wins over an incomplete duplicate.
  const enrollments = new Map<string, BottleneckEnrollment>();
  for (const e of input.enrollments) {
    if (!coursesById.has(e.course_id) || !e.user_id) continue;
    const key = e.user_id + ":" + e.course_id;
    const previous = enrollments.get(key);
    if (!previous) { enrollments.set(key,e); continue; }
    const first = [timestamp(e.started_at),timestamp(previous.started_at)]
      .filter(n => n > 0).sort((a,b) => a-b)[0];
    enrollments.set(key,{
      ...previous,
      started_at: first ? new Date(first).toISOString() : previous.started_at,
      completed_at: previous.completed_at || e.completed_at,
    });
  }

  const progress = new Map<string, Set<string>>();
  const lastActivity = new Map<string, number>();
  const engaged = new Set<string>();
  for (const p of input.progress) {
    const course = lessonCourse.get(p.lesson_id);
    if (!course) continue;
    const key = p.user_id + ":" + course;
    if (!enrollments.has(key)) continue;
    if (!progress.has(key)) progress.set(key,new Set());
    progress.get(key)!.add(p.lesson_id);
    lastActivity.set(key,Math.max(lastActivity.get(key)||0,timestamp(p.completed_at)));
    engaged.add(key);
  }
  for (const e of input.engagement) {
    const course = lessonCourse.get(e.lesson_id);
    if (!course) continue;
    const key = e.user_id + ":" + course;
    if (!enrollments.has(key)) continue;
    lastActivity.set(key,Math.max(lastActivity.get(key)||0,timestamp(e.last_activity_at||e.updated_at)));
    if (Number(e.active_seconds||0)>0) engaged.add(key);
  }

  const byLesson = new Map<string, LessonBottleneck>();
  let unfinishedEnrollments = 0;
  let withNextLesson = 0;
  let stalled7d = 0;
  let noRecordedEngagement = 0;
  for (const [key,e] of enrollments) {
    if (e.completed_at) continue;
    unfinishedEnrollments += 1;
    const ordered = orderedByCourse.get(e.course_id) || [];
    const index = ordered.findIndex(lesson => !progress.get(key)?.has(lesson.id));
    if (index < 0) continue; // At final assessment, tracked in course health.
    withNextLesson += 1;
    const lesson = ordered[index];
    const course = coursesById.get(e.course_id)!;
    const idleSince = Math.max(timestamp(e.started_at),lastActivity.get(key)||0);
    const stale = idleSince>0 && idleSince<=input.nowMs-INACTIVITY_DAYS*DAY_MS;
    const unseen = !engaged.has(key);
    if (stale) stalled7d += 1;
    if (unseen) noRecordedEngagement += 1;

    let row = byLesson.get(lesson.id);
    if (!row) {
      row = {
        courseId:course.id,courseSlug:course.slug,courseTitle:course.title,
        lessonId:lesson.id,lessonTitle:lesson.title,
        lessonNumber:index+1,totalLessons:ordered.length,
        waiting:0,stalled7d:0,noRecordedEngagement:0,
      };
      byLesson.set(lesson.id,row);
    }
    row.waiting += 1;
    if (stale) row.stalled7d += 1;
    if (unseen) row.noRecordedEngagement += 1;
  }

  const bottlenecks = [...byLesson.values()].sort((a,b) =>
    b.stalled7d-a.stalled7d ||
    b.waiting-a.waiting ||
    b.noRecordedEngagement-a.noRecordedEngagement ||
    a.courseTitle.localeCompare(b.courseTitle) ||
    a.lessonNumber-b.lessonNumber ||
    a.lessonId.localeCompare(b.lessonId)
  );
  return {
    available:true,reason:null,inactivityDays:INACTIVITY_DAYS,
    totals:{unfinishedEnrollments,withNextLesson,stalled7d,noRecordedEngagement},
    lessons:bottlenecks,
  };
}
