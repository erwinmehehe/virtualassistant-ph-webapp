import "server-only";

import { createHash } from "node:crypto";
import type { LessonContentBlock, TrainingCourseDetail } from "@/lib/training";

export type TrainingCheckpointOption = {
  id: string;
  text: string;
};

export type TrainingLessonCheckpoint = {
  prompt: string;
  options: TrainingCheckpointOption[];
  correctOptionId: string;
  checkpointKey: string;
};

export type TrainingAssessmentQuestion = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  options: TrainingCheckpointOption[];
  correctOptionId: string;
};

function hashInt(value: string) {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 12);
  return Number.parseInt(digest, 16);
}

function optionId(seed: string, text: string) {
  return createHash("sha256").update(seed + "|" + text).digest("hex").slice(0, 12);
}

function stableShuffle<T>(items: T[], seed: string) {
  return [...items]
    .map((item, index) => ({
      item,
      rank: hashInt(seed + ":" + index),
    }))
    .sort((a, b) => a.rank - b.rank)
    .map((row) => row.item);
}

function checklistItems(content: unknown) {
  if (!Array.isArray(content)) return [] as string[];
  return (content as LessonContentBlock[])
    .filter((block): block is Extract<LessonContentBlock, { type: "checklist" }> => block.type === "checklist")
    .flatMap((block) => block.items)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function lessonActiveSecondsRequired(estimatedMinutes: number) {
  return Math.max(60, Math.min(300, Math.ceil(estimatedMinutes * 60 * 0.2)));
}

const distractors = [
  "Move quickly and fill any evidence gaps only if someone asks later.",
  "Use your own judgment to make any missing approval or specialist decision so the task does not stall.",
  "Mark the work complete once the visible output looks right, even if the source trail or handoff is incomplete.",
  "Treat the newest message as the source of truth even when it conflicts with an approved record.",
  "Skip the escalation step when the likely answer seems obvious.",
  "Prioritize speed over verification whenever the task looks routine.",
];

export function buildLessonCheckpoint(args: {
  lessonId: string;
  lessonTitle: string;
  userId: string;
  content: unknown;
  seedSuffix?: string;
}): TrainingLessonCheckpoint | null {
  const items = checklistItems(args.content);
  if (!items.length) return null;

  const seed = [args.lessonId, args.userId, args.seedSuffix || "lesson"].join(":");
  const correctText = items[hashInt(seed + ":correct") % items.length];
  const selectedDistractors = stableShuffle(distractors, seed + ":distractors").slice(0, 3);
  const rawOptions = [correctText, ...selectedDistractors];
  const options = stableShuffle(rawOptions, seed + ":options").map((text) => ({
    id: optionId(seed, text),
    text,
  }));

  return {
    prompt: `Before completing "${args.lessonTitle}", which approach best matches the QA standard you just read?`,
    options,
    correctOptionId: optionId(seed, correctText),
    checkpointKey: createHash("sha256").update(seed + ":" + correctText).digest("hex").slice(0, 16),
  };
}

export function buildAssessmentQuestionsFromLessons(args: {
  lessons: Array<{ id: string; title: string; content: unknown }>;
  assessmentId: string;
  userId: string;
  attemptNumber: number;
  questionCount?: number;
}) {
  const eligible = args.lessons.filter((lesson) => checklistItems(lesson.content).length > 0);
  const count = Math.min(args.questionCount || 8, eligible.length);
  const seed = `${args.assessmentId}:${args.userId}:attempt:${args.attemptNumber}`;
  const chosen = stableShuffle(eligible, seed + ":lessons").slice(0, count);

  return chosen
    .map((lesson, index) => {
      const checkpoint = buildLessonCheckpoint({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        userId: args.userId,
        content: lesson.content,
        seedSuffix: `assessment:${args.assessmentId}:${args.attemptNumber}:${index}`,
      });
      if (!checkpoint) return null;
      return {
        id: createHash("sha256").update(seed + ":" + lesson.id).digest("hex").slice(0, 16),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        prompt: checkpoint.prompt,
        options: checkpoint.options,
        correctOptionId: checkpoint.correctOptionId,
      } satisfies TrainingAssessmentQuestion;
    })
    .filter((item): item is TrainingAssessmentQuestion => Boolean(item));
}

export function buildAssessmentQuestions(args: {
  course: TrainingCourseDetail;
  assessmentId: string;
  userId: string;
  attemptNumber: number;
  questionCount?: number;
}) {
  return buildAssessmentQuestionsFromLessons({
    lessons: args.course.modules.flatMap((module) => module.lessons),
    assessmentId: args.assessmentId,
    userId: args.userId,
    attemptNumber: args.attemptNumber,
    questionCount: args.questionCount,
  });
}

export function publicAssessmentQuestions(questions: TrainingAssessmentQuestion[]) {
  return questions.map((question) => ({
    id: question.id,
    lessonId: question.lessonId,
    lessonTitle: question.lessonTitle,
    prompt: question.prompt,
    options: question.options,
  }));
}
