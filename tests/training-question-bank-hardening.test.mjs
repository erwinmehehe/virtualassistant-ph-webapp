import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const integrityPath = "src/lib/training-integrity.ts";
const actionsPath = "src/app/actions/training.ts";
const pagePath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";

test("lesson checkpoints use six applied-judgment variants instead of checklist recall", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /QUESTION_VARIANTS_PER_LESSON = 6/);
  assert.match(source, /What is the strongest next move/);
  assert.match(source, /What should control closure/);
  assert.match(source, /one judgment or approval is outside the VA role/);
  assert.match(source, /best protects continuity and accountability/);
  assert.match(source, /deadline is close and the likely answer seems obvious/);
  assert.match(source, /most subtle process failure/);
  assert.match(source, /practicalContext/);
  assert.match(source, /scenario/);
  assert.doesNotMatch(source, /Which statement accurately reflects the QA standard/);
});

test("question distractors are plausible process errors rather than cartoonishly unsafe answers", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /current system state as the working answer/);
  assert.match(source, /closest previous case/);
  assert.match(source, /reversible steps/);
  assert.match(source, /full reviewer decision before doing any of the routine administrative preparation/);
  assert.match(source, /clean-looking status or matching total/);
  assert.match(source, /client’s likely intention/);
  assert.doesNotMatch(source, /Prioritize speed over verification whenever the task looks routine/);
});

test("final assessment can still produce eight questions for courses with fewer than eight lessons", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /eligible\.length \* QUESTION_VARIANTS_PER_LESSON/);
  assert.match(source, /while \(slots\.length < targetCount\)/);
  assert.match(source, /occurrence: round/);
  assert.match(source, /round:/);
  assert.match(source, /questionKey/);
  assert.doesNotMatch(source, /Math\.min\(args\.questionCount \|\| 8, eligible\.length\)/);
});

test("final assessment rotates variants across attempts and keeps answer keys server-only", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /args\.attemptNumber \+/);
  assert.match(source, /:variant/);
  assert.match(source, /% bank\.length/);
  assert.match(source, /questionKey: checkpoint\.questionKey/);
  assert.match(source, /publicAssessmentQuestions/);

  const publicBlock = source.match(/export function publicAssessmentQuestions[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(publicBlock, /correctOptionId:/);
  assert.doesNotMatch(publicBlock, /questionKey:/);
});

test("assessment UI displays the actual generated question count", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /\{questions\.length \|\| 8\} questions/);
  assert.match(page, /Answer \{questions\.length \|\| 8\} questions based on the course/);
});

test("checkpoint attempts record lesson, question variant, and correctness server-side", async () => {
  const actions = await readFile(actionsPath, "utf8");

  assert.match(actions, /recordProductEvent\("training_checkpoint_attempt"/);
  assert.match(actions, /question_key: checkpoint\.questionKey/);
  assert.match(actions, /lesson_id: lesson\.id/);
  assert.match(actions, /correct,/);
});

test("automatic final submission stores question evidence without storing an answer key", async () => {
  const actions = await readFile(actionsPath, "utf8");

  assert.match(actions, /question_ids: questions\.map/);
  assert.match(actions, /question_keys: questions\.map/);
  assert.match(actions, /answers,/);
  assert.match(actions, /missed_lesson_ids: missedLessonIds/);
  assert.doesNotMatch(actions, /correct_answers/);
  assert.doesNotMatch(actions, /answer_key/);
});


test("finals balance competency modes and mark authority judgment as critical", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /ASSESSMENT_KIND_SEQUENCE/);
  assert.match(source, /"scenario"/);
  assert.match(source, /"evidence"/);
  assert.match(source, /"authority"/);
  assert.match(source, /"handoff"/);
  assert.match(source, /"pressure"/);
  assert.match(source, /"subtle_failure"/);
  assert.match(source, /critical: true/);
  assert.match(source, /usedKindsByLesson/);
});

test("question-set fingerprint and answer-pattern telemetry are server-generated", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /export function assessmentQuestionSetKey/);
  assert.match(source, /question\.questionKey/);
  assert.match(source, /question\.options\.map/);
  assert.match(source, /export function summarizeAssessmentAnswerPattern/);
  assert.match(source, /uniquePositions/);
  assert.match(source, /longestSamePositionRun/);
  assert.match(source, /histogram/);
  assert.match(source, /flagged/);
});

test("assessment page is non-cacheable and binds form to the exact question set", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /export const revalidate = 0/);
  assert.match(page, /assessmentQuestionSetKey\(generatedQuestions\)/);
  assert.match(page, /name="question_set_key"/);
  assert.match(page, /authority-boundary question/);
});
