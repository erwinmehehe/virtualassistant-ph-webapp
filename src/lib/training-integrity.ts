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
  questionKey: string;
};

export type TrainingAssessmentQuestion = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  options: TrainingCheckpointOption[];
  correctOptionId: string;
  questionKey: string;
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

function lessonBlocks(content: unknown) {
  return Array.isArray(content) ? (content as LessonContentBlock[]) : [];
}

function checklistItems(content: unknown) {
  return lessonBlocks(content)
    .filter((block): block is Extract<LessonContentBlock, { type: "checklist" }> => block.type === "checklist")
    .flatMap((block) => block.items)
    .map((item) => item.trim())
    .filter(Boolean);
}

function practicalContext(content: unknown) {
  const blocks = lessonBlocks(content);
  const workedExample = blocks.find(
    (block): block is Extract<LessonContentBlock, { type: "callout" }> =>
      block.type === "callout" && Boolean(block.title?.toLowerCase().startsWith("worked example")),
  );
  if (workedExample?.title) return workedExample.title.replace(/^Worked example:\s*/i, "").trim();

  const exercise = blocks.find(
    (block): block is Extract<LessonContentBlock, { type: "exercise" }> => block.type === "exercise",
  );
  return exercise?.title?.trim() || null;
}

function stripTerminal(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function weakenedRuleVariants(rule: string) {
  const base = stripTerminal(rule);
  return [
    `${base}, unless the request is time-sensitive and the likely outcome seems clear.`,
    `${base} after the work has already moved forward, if a reviewer later asks for evidence.`,
    `${base} only when two records directly conflict; routine cases can proceed without that control.`,
  ];
}

function makeQuestion(args: {
  lessonId: string;
  seed: string;
  index: number;
  prompt: string;
  correctText: string;
  distractors: string[];
}) {
  const questionSeed = `${args.seed}:question:${args.index}`;
  const rawOptions = [args.correctText, ...args.distractors].slice(0, 4);
  const options = stableShuffle(rawOptions, questionSeed + ":options").map((text) => ({
    id: optionId(questionSeed, text),
    text,
  }));
  const correctOptionId = optionId(questionSeed, args.correctText);
  const questionKey = createHash("sha256")
    .update(`${args.lessonId}:${args.index}:${args.prompt}:${args.correctText}`)
    .digest("hex")
    .slice(0, 16);

  return {
    prompt: args.prompt,
    options,
    correctOptionId,
    questionKey,
    checkpointKey: createHash("sha256")
      .update(`${args.lessonId}:${questionKey}:${correctOptionId}`)
      .digest("hex")
      .slice(0, 16),
  } satisfies TrainingLessonCheckpoint;
}

export function lessonActiveSecondsRequired(estimatedMinutes: number) {
  return Math.max(60, Math.min(300, Math.ceil(estimatedMinutes * 60 * 0.2)));
}

export function buildLessonQuestionBank(args: {
  lessonId: string;
  lessonTitle: string;
  userId: string;
  content: unknown;
  seedSuffix?: string;
}): TrainingLessonCheckpoint[] {
  const items = checklistItems(args.content);
  if (!items.length) return [];

  const seed = [args.lessonId, args.userId, args.seedSuffix || "lesson-bank"].join(":");
  const orderedRules = stableShuffle(items, seed + ":rules");
  const primary = orderedRules[0];
  const second = orderedRules[1] || primary;
  const evidenceRule =
    orderedRules.find((item) => /evidence|source|verify|approval|owner|record|audit|document/i.test(item)) ||
    orderedRules[2] ||
    primary;
  const context = practicalContext(args.content) || args.lessonTitle;

  const positive = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 0,
    prompt: `Which statement accurately reflects the QA standard for "${args.lessonTitle}"?`,
    correctText: primary,
    distractors: weakenedRuleVariants(primary),
  });

  const unsafeShortcut = weakenedRuleVariants(second)[0];
  const safeAlternatives = orderedRules
    .filter((item) => item !== second)
    .slice(0, 3);
  while (safeAlternatives.length < 3) safeAlternatives.push(primary);
  const negative = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 1,
    prompt: "Which option introduces a shortcut this lesson does NOT allow?",
    correctText: unsafeShortcut,
    distractors: safeAlternatives,
  });

  const firstStep = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 2,
    prompt: `For "${context}", which rule should govern the next step before you move the work forward?`,
    correctText: second,
    distractors: weakenedRuleVariants(second),
  });

  const evidence = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 3,
    prompt: "The work looks nearly complete, but a source, approval, or handoff may still be unresolved. Which rule should you apply before closing it?",
    correctText: evidenceRule,
    distractors: weakenedRuleVariants(evidenceRule),
  });

  return [positive, negative, firstStep, evidence];
}

export function buildLessonCheckpoint(args: {
  lessonId: string;
  lessonTitle: string;
  userId: string;
  content: unknown;
  seedSuffix?: string;
}): TrainingLessonCheckpoint | null {
  const bank = buildLessonQuestionBank(args);
  if (!bank.length) return null;
  const seed = [args.lessonId, args.userId, args.seedSuffix || "lesson"].join(":");
  return bank[hashInt(seed + ":pick") % bank.length];
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
      const bank = buildLessonQuestionBank({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        userId: args.userId,
        content: lesson.content,
        seedSuffix: `assessment:${args.assessmentId}:${args.attemptNumber}`,
      });
      if (!bank.length) return null;

      const variantIndex =
        (args.attemptNumber + index + hashInt(seed + ":" + lesson.id + ":variant")) % bank.length;
      const checkpoint = bank[variantIndex];

      return {
        id: createHash("sha256")
          .update(`${seed}:${lesson.id}:${checkpoint.questionKey}`)
          .digest("hex")
          .slice(0, 16),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        prompt: checkpoint.prompt,
        options: checkpoint.options,
        correctOptionId: checkpoint.correctOptionId,
        questionKey: checkpoint.questionKey,
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
