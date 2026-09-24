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

const QUESTION_VARIANTS_PER_LESSON = 6;

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

function truncateContext(value: string, max = 340) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return compact.slice(0, max - 1).trimEnd() + "…";
}

function practicalContext(content: unknown, lessonTitle: string) {
  const blocks = lessonBlocks(content);
  const scenarios = blocks.filter(
    (block): block is Extract<LessonContentBlock, { type: "scenario" }> => block.type === "scenario",
  );
  const worked = scenarios.find((block) =>
    /worked example|judgment|final challenge|practice scenario/i.test(block.title || ""),
  ) || scenarios[scenarios.length - 1];

  if (worked?.text) {
    return truncateContext(
      worked.title ? `${worked.title}: ${worked.text}` : worked.text,
    );
  }

  const exercise = blocks.find(
    (block): block is Extract<LessonContentBlock, { type: "exercise" }> => block.type === "exercise",
  );
  if (exercise?.text) {
    return truncateContext(
      exercise.title ? `${exercise.title}: ${exercise.text}` : exercise.text,
    );
  }

  return lessonTitle;
}

function stripTerminal(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function ruleFor(
  items: string[],
  pattern: RegExp,
  fallbackIndex: number,
) {
  return items.find((item) => pattern.test(item)) || items[fallbackIndex % items.length] || items[0];
}

function actionFromRule(rule: string) {
  return `Apply this control before moving forward: ${stripTerminal(rule)}.`;
}

function closureFromRule(rule: string) {
  return `Keep the item open until this control is satisfied: ${stripTerminal(rule)}.`;
}

function authorityFromRule(rule: string) {
  return `Do the administrative work that is supported by evidence, but preserve this boundary: ${stripTerminal(rule)}.`;
}

function handoffFromRule(rule: string) {
  return `Make the handoff decision-ready by applying this standard: ${stripTerminal(rule)}.`;
}

function plausibleShortcutOptions(seed: string) {
  return stableShuffle([
    "Use the current system state as the working answer and document the assumption so it can be corrected later.",
    "Follow the closest previous case unless new information proves that the current case is different.",
    "Keep the work moving through the reversible steps and leave the unresolved control for the final handoff.",
    "Ask for a full reviewer decision before doing any of the routine administrative preparation.",
    "Treat a clean-looking status or matching total as sufficient unless someone raises an exception.",
    "Use the client’s likely intention as the default when the source information is incomplete.",
  ], seed);
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
  const unique = [args.correctText, ...args.distractors].filter(
    (text, index, values) => text && values.indexOf(text) === index,
  );
  const filler = plausibleShortcutOptions(questionSeed + ":fill");
  for (const option of filler) {
    if (unique.length >= 4) break;
    if (!unique.includes(option)) unique.push(option);
  }

  const rawOptions = unique.slice(0, 4);
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
  const evidenceRule = ruleFor(
    orderedRules,
    /evidence|source|verify|record|document|audit|check|match|confirm/i,
    1,
  );
  const authorityRule = ruleFor(
    orderedRules,
    /approval|authori|decision|escalat|licensed|clinical|tax|gst|bas|payroll|specialist|owner|boundary/i,
    2,
  );
  const handoffRule = ruleFor(
    orderedRules,
    /handoff|owner|checkpoint|deadline|status|next action|open item|follow-up/i,
    3,
  );
  const sequenceRule = ruleFor(
    orderedRules,
    /before|first|until|only when|prior|after|ready|complete/i,
    4,
  );
  const context = practicalContext(args.content, args.lessonTitle);
  const shortcuts = plausibleShortcutOptions(seed + ":shortcuts");

  const scenarioDecision = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 0,
    prompt: `Case: ${context} What is the strongest next move?`,
    correctText: actionFromRule(sequenceRule),
    distractors: [shortcuts[0], shortcuts[1], shortcuts[2]],
  });

  const evidenceDecision = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 1,
    prompt: `In the same case from "${args.lessonTitle}", the status looks nearly complete but one source or fact may still be unresolved. What should control closure?`,
    correctText: closureFromRule(evidenceRule),
    distractors: [shortcuts[4], shortcuts[0], shortcuts[5]],
  });

  const authorityDecision = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 2,
    prompt: `The client wants this handled quickly and the administrative steps are clear, but one judgment or approval is outside the VA role. Which response is best?`,
    correctText: authorityFromRule(authorityRule),
    distractors: [shortcuts[5], shortcuts[1], shortcuts[3]],
  });

  const handoffDecision = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 3,
    prompt: `You cannot fully resolve the case before handoff. Which approach best protects continuity and accountability?`,
    correctText: handoffFromRule(handoffRule),
    distractors: [shortcuts[2], shortcuts[3], shortcuts[4]],
  });

  const pressureDecision = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 4,
    prompt: `A deadline is close and the likely answer seems obvious. Which choice best reflects the lesson under time pressure?`,
    correctText: actionFromRule(primary),
    distractors: [
      "Use the likely answer now, then add evidence only if the outcome is challenged.",
      "Apply the full control only to unusual cases; routine-looking work can use the system state.",
      "Choose the fastest reversible action and let the next owner verify the underlying assumption.",
    ],
  });

  const subtleFailure = makeQuestion({
    lessonId: args.lessonId,
    seed,
    index: 5,
    prompt: `Which response is the most subtle process failure in this lesson?`,
    correctText: `Apply this control only after the work has moved forward: ${stripTerminal(primary)}.`,
    distractors: [
      actionFromRule(evidenceRule),
      authorityFromRule(authorityRule),
      handoffFromRule(handoffRule),
    ],
  });

  return [
    scenarioDecision,
    evidenceDecision,
    authorityDecision,
    handoffDecision,
    pressureDecision,
    subtleFailure,
  ];
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
  if (!eligible.length) return [];

  const targetCount = Math.min(
    args.questionCount || 8,
    eligible.length * QUESTION_VARIANTS_PER_LESSON,
  );
  const seed = `${args.assessmentId}:${args.userId}:attempt:${args.attemptNumber}`;
  const orderedLessons = stableShuffle(eligible, seed + ":lessons");
  const slots: Array<{ lesson: (typeof eligible)[number]; occurrence: number }> = [];

  let round = 0;
  while (slots.length < targetCount) {
    const roundLessons = stableShuffle(orderedLessons, `${seed}:round:${round}`);
    for (const lesson of roundLessons) {
      if (slots.length >= targetCount) break;
      slots.push({ lesson, occurrence: round });
    }
    round += 1;
  }

  return slots
    .map(({ lesson, occurrence }, index) => {
      const bank = buildLessonQuestionBank({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        userId: args.userId,
        content: lesson.content,
        seedSuffix: `assessment:${args.assessmentId}:${args.attemptNumber}`,
      });
      if (!bank.length) return null;

      const variantIndex =
        (
          args.attemptNumber +
          index +
          occurrence +
          hashInt(`${seed}:${lesson.id}:variant`)
        ) % bank.length;
      const checkpoint = bank[variantIndex];

      return {
        id: createHash("sha256")
          .update(`${seed}:${index}:${lesson.id}:${checkpoint.questionKey}`)
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
