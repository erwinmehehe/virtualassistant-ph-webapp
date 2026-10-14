/**
 * Privacy-preserving, observational follow-up to training resume reminders.
 * The most recent recorded reminder (not confirmed email delivery) anchors
 * each learner/course window. No user identifier escapes this calculation.
 * Positive outcomes are timestamped lesson or course completions, not opens.
 */
export type ReminderOutcomeCourse = { id: string; slug: string; title: string; status: string };
export type ReminderOutcomeRecord = {
  subject_type: string;
  subject_id: string;
  recipient_id: string;
  action: string;
  reminder_count: number;
  last_sent_at: string | null;
};
export type ReminderOutcomeEnrollment = {
  user_id: string; course_id: string; started_at: string; completed_at: string | null;
};
export type ReminderOutcomeLesson = { id: string; course_id: string };
export type ReminderOutcomeProgress = {
  user_id: string; lesson_id: string; completed_at: string;
};
export type ReminderOutcomeWindow = { eligible: number; reached: number; rate: number | null };
export type ReminderOutcomeCourseRow = {
  id: string; slug: string; title: string;
  nudged: number; remindersLogged: number;
  sevenDay: ReminderOutcomeWindow; fourteenDay: ReminderOutcomeWindow;
};
export type TrainingReminderOutcomes = {
  available: boolean;
  reason: string | null;
  nudgedEnrollments: number;
  learnersNudged: number;
  remindersLogged: number;
  sevenDay: ReminderOutcomeWindow;
  fourteenDay: ReminderOutcomeWindow;
  courses: ReminderOutcomeCourseRow[];
};
export type ReminderOutcomesInput = {
  courses: ReminderOutcomeCourse[];
  reminders: ReminderOutcomeRecord[];
  enrollments: ReminderOutcomeEnrollment[];
  lessons: ReminderOutcomeLesson[];
  progress: ReminderOutcomeProgress[];
  nowMs: number;
  complete?: boolean;
};
const DAY_MS = 86_400_000;
const REMINDER = /^resume_training_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
function when(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
function window(): ReminderOutcomeWindow { return { eligible: 0, reached: 0, rate: null }; }
function finalize(w: ReminderOutcomeWindow): ReminderOutcomeWindow {
  return { ...w, rate: w.eligible ? Math.round(w.reached * 100 / w.eligible) : null };
}
function unavailable(): TrainingReminderOutcomes {
  return {
    available: false,
    reason: "Reminder outcome data could not be loaded completely. Retry before drawing conclusions.",
    nudgedEnrollments: 0, learnersNudged: 0, remindersLogged: 0,
    sevenDay: window(), fourteenDay: window(), courses: [],
  };
}
export function buildTrainingReminderOutcomes(input: ReminderOutcomesInput): TrainingReminderOutcomes {
  if (input.complete === false || !Number.isFinite(input.nowMs)) return unavailable();
  const courses = new Map(input.courses.map(c => [c.id, c]));
  const enrollments = new Map<string, {started: number; finished: number | null}>();
  for (const enrollment of input.enrollments) {
    if (!courses.has(enrollment.course_id)) continue;
    const started = when(enrollment.started_at);
    if (started === null || started > input.nowMs) continue;
    const key = enrollment.user_id + ":" + enrollment.course_id;
    const finished = when(enrollment.completed_at);
    const previous = enrollments.get(key);
    enrollments.set(key, {
      started: Math.min(previous?.started ?? started, started),
      finished: finished === null ? previous?.finished ?? null :
        previous?.finished === null || previous === undefined ? finished :
          Math.min(previous.finished, finished),
    });
  }
  const lessonCourse = new Map(input.lessons.map(lesson => [lesson.id, lesson.course_id]));
  const lessonCompletions = new Map<string, number[]>();
  for (const progress of input.progress) {
    const courseId = lessonCourse.get(progress.lesson_id);
    if (!courseId || !courses.has(courseId)) continue;
    const timestamp = when(progress.completed_at);
    if (timestamp === null || timestamp > input.nowMs) continue;
    const key = progress.user_id + ":" + courseId;
    const completions = lessonCompletions.get(key) || [];
    completions.push(timestamp);
    lessonCompletions.set(key, completions);
  }

  const latest = new Map<string, { userId: string; courseId: string; sent: number; count: number }>();
  for (const reminder of input.reminders) {
    const match = REMINDER.exec(reminder.action);
    if (!match || reminder.subject_type !== "va" ||
        reminder.subject_id !== reminder.recipient_id ||
        !courses.has(match[1])) continue;
    const sent = when(reminder.last_sent_at);
    if (sent === null || sent > input.nowMs) continue;
    const key = reminder.recipient_id + ":" + match[1];
    const existing = latest.get(key);
    if (!existing || sent > existing.sent) {
      latest.set(key, {
        userId: reminder.recipient_id, courseId: match[1],
        sent, count: Math.max(0, Number(reminder.reminder_count) || 0),
      });
    } else if (sent === existing.sent) {
      existing.count = Math.max(existing.count, Math.max(0, Number(reminder.reminder_count) || 0));
    }
  }

  const rows = new Map<string, ReminderOutcomeCourseRow>();
  for (const course of courses.values()) {
    rows.set(course.id, {
      id: course.id, slug: course.slug, title: course.title,
      nudged: 0, remindersLogged: 0, sevenDay: window(), fourteenDay: window(),
    });
  }
  const learnerIds = new Set<string>();
  const sevenDay = window();
  const fourteenDay = window();
  let nudgedEnrollments = 0;
  let remindersLogged = 0;
  for (const reminder of latest.values()) {
    const key = reminder.userId + ":" + reminder.courseId;
    const enrollment = enrollments.get(key);
    // Do not count stale/orphan reminder records as nonresponding learners.
    if (!enrollment || enrollment.started > reminder.sent ||
        (enrollment.finished !== null && enrollment.finished <= reminder.sent)) continue;
    const row = rows.get(reminder.courseId)!;
    row.nudged += 1;
    row.remindersLogged += reminder.count;
    nudgedEnrollments += 1;
    remindersLogged += reminder.count;
    learnerIds.add(reminder.userId);

    const graduated = enrollment.finished !== null && enrollment.finished > reminder.sent;
    const progressIn7Days = (lessonCompletions.get(key) || []).some(ts =>
      ts > reminder.sent && ts <= reminder.sent + 7 * DAY_MS && ts <= input.nowMs);
    const graduationIn7Days = graduated && enrollment.finished! <= reminder.sent + 7 * DAY_MS;
    const graduationIn14Days = graduated && enrollment.finished! <= reminder.sent + 14 * DAY_MS;
    if (input.nowMs >= reminder.sent + 7 * DAY_MS) {
      sevenDay.eligible++;
      row.sevenDay.eligible++;
      if (progressIn7Days || graduationIn7Days) {
        sevenDay.reached++;
        row.sevenDay.reached++;
      }
    }
    if (input.nowMs >= reminder.sent + 14 * DAY_MS) {
      fourteenDay.eligible++;
      row.fourteenDay.eligible++;
      if (graduationIn14Days) {
        fourteenDay.reached++;
        row.fourteenDay.reached++;
      }
    }
  }
  return {
    available: true, reason: null,
    nudgedEnrollments, learnersNudged: learnerIds.size, remindersLogged,
    sevenDay: finalize(sevenDay), fourteenDay: finalize(fourteenDay),
    courses: [...rows.values()]
      .filter(row => row.nudged > 0)
      .map(row => ({ ...row, sevenDay: finalize(row.sevenDay), fourteenDay: finalize(row.fourteenDay) }))
      .sort((a,b) => b.sevenDay.eligible - a.sevenDay.eligible || b.nudged - a.nudged || a.title.localeCompare(b.title)),
  };
}
