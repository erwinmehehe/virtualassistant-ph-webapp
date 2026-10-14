import "server-only";

import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildTrainingReminderOutcomes,
  type ReminderOutcomeCourse,
  type ReminderOutcomeRecord,
  type ReminderOutcomeEnrollment,
  type ReminderOutcomeLesson,
  type ReminderOutcomeProgress,
  type TrainingReminderOutcomes,
} from "@/lib/training-reminder-outcomes";

const PAGE_SIZE = 500;
const MAX_PAGES_PER_BATCH = 40;
const MAX_ROWS_PER_SOURCE = 100_000;
const BATCH_SIZE = 75;
const RESUME_ACTION = /^resume_training_([0-9a-f-]{36})$/i;

type Page<T> = { data: T[] | null; error: { message: string } | null };
function batches<T>(items: T[], count = BATCH_SIZE): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += count) result.push(items.slice(i, i + count));
  return result;
}
async function pages<T>(
  label: string,
  factory: (start: number, end: number) => PromiseLike<unknown>,
): Promise<T[]> {
  const result: T[] = [];
  for (let page = 0; page < MAX_PAGES_PER_BATCH; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = (await factory(from, from + PAGE_SIZE - 1)) as Page<T>;
    if (error || !data) throw new Error(label + ": read failed");
    result.push(...data);
    if (result.length > MAX_ROWS_PER_SOURCE) throw new Error(label + ": row ceiling reached");
    if (data.length < PAGE_SIZE) return result;
  }
  throw new Error(label + ": pagination incomplete");
}
async function byIds<T>(
  label: string,
  ids: string[],
  query: (batch: string[], from: number, end: number) => PromiseLike<unknown>,
): Promise<T[]> {
  const all: T[] = [];
  for (const batch of batches(ids)) {
    all.push(...await pages<T>(label, (start, end) => query(batch, start, end)));
    if (all.length > MAX_ROWS_PER_SOURCE) throw new Error(label + ": row ceiling reached");
  }
  return all;
}

export async function getTrainingReminderOutcomes(): Promise<TrainingReminderOutcomes> {
  // Training data includes identifiable learner relationships: guard access
  // before instantiating a privileged Supabase client.
  await requireRoleFast("admin");
  const admin = createAdminClient();
  const nowMs = Date.now();
  const fallback = () => buildTrainingReminderOutcomes({
    courses: [], reminders: [], enrollments: [], lessons: [],
    progress: [], nowMs, complete: false,
  });

  try {
    // Workflow reminders represent in-app reminder records; they are not
    // evidence that a separate optional low-priority email was delivered.
    const reminders = await pages<ReminderOutcomeRecord>("workflow_reminders", (from,to) =>
      admin.from("workflow_reminders")
        .select("subject_type,subject_id,recipient_id,action,reminder_count,last_sent_at")
        .eq("subject_type", "va")
        .like("action", "resume_training_%")
        .order("subject_id").order("recipient_id").order("action")
        .range(from,to));
    if (!reminders.length) {
      return buildTrainingReminderOutcomes({
        courses: [], reminders: [], enrollments: [], lessons: [],
        progress: [], nowMs,
      });
    }
    const courseIds = [...new Set(reminders
      .map(row => RESUME_ACTION.exec(row.action)?.[1] || "")
      .filter(Boolean))];
    const userIds = [...new Set(reminders.map(row => row.recipient_id).filter(Boolean))];
    if (!courseIds.length || !userIds.length) return fallback();

    const [courses, enrollments, modules] = await Promise.all([
      byIds<ReminderOutcomeCourse>("training_courses", courseIds, (ids,from,to) =>
        admin.from("training_courses")
          .select("id,slug,title,status")
          .in("id",ids).order("id").range(from,to)),
      byIds<ReminderOutcomeEnrollment>("training_enrollments", userIds, (ids,from,to) =>
        admin.from("training_enrollments")
          .select("user_id,course_id,started_at,completed_at")
          .in("user_id",ids).in("course_id",courseIds)
          .order("user_id").order("course_id").range(from,to)),
      byIds<{ id: string; course_id: string }>("training_modules", courseIds, (ids,from,to) =>
        admin.from("training_modules")
          .select("id,course_id")
          .in("course_id",ids).order("id").range(from,to)),
    ]);
    const moduleCourse = new Map(modules.map(row => [row.id, row.course_id]));
    const lessons = await byIds<{id:string;module_id:string}>("training_lessons",
      modules.map(row => row.id), (ids,from,to) =>
        admin.from("training_lessons")
          .select("id,module_id")
          .in("module_id",ids).order("id").range(from,to));
    const courseLessons: ReminderOutcomeLesson[] = lessons
      .map(lesson => ({id:lesson.id,course_id:moduleCourse.get(lesson.module_id)||""}))
      .filter(lesson => Boolean(lesson.course_id));

    const firstReminder = Math.min(...reminders
      .map(row => Date.parse(row.last_sent_at || ""))
      .filter(value => Number.isFinite(value)));
    if (!Number.isFinite(firstReminder)) return fallback();
    const progress = courseLessons.length
      ? await byIds<ReminderOutcomeProgress>("training_lesson_progress",userIds,(ids,from,to) =>
          admin.from("training_lesson_progress")
            .select("user_id,lesson_id,completed_at")
            .in("user_id",ids)
            .gte("completed_at",new Date(firstReminder).toISOString())
            .order("user_id").order("lesson_id").range(from,to))
      : [];

    return buildTrainingReminderOutcomes({
      courses, reminders, enrollments, lessons: courseLessons, progress, nowMs,
    });
  } catch (error) {
    // Do not log auth user IDs, emails, raw SQL responses or private records.
    console.error("[training] Recovery outcome aggregate unavailable",
      error instanceof Error ? error.message : "unknown");
    return fallback();
  }
}
