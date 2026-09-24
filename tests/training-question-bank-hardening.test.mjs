import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const integrityPath = "src/lib/training-integrity.ts";
const actionsPath = "src/app/actions/training.ts";

test("every lesson checkpoint is selected from a four-variant lesson-specific bank", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /export function buildLessonQuestionBank/);
  assert.match(source, /return \[positive, negative, firstStep, evidence\]/);
  assert.match(source, /Which option introduces a shortcut this lesson does NOT allow\?/);
  assert.match(source, /which rule should govern the next step before you move the work forward\?/);
  assert.match(source, /a source, approval, or handoff may still be unresolved/);
  assert.match(source, /practicalContext/);
  assert.match(source, /worked example/i);
});

test("wrong answers are lesson-specific weakened versions of the real QA rule", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /function weakenedRuleVariants\(rule: string\)/);
  assert.match(source, /unless the request is time-sensitive and the likely outcome seems clear/);
  assert.match(source, /after the work has already moved forward/);
  assert.match(source, /only when two records directly conflict/);
  assert.doesNotMatch(source, /const distractors = \[/);
  assert.doesNotMatch(source, /Prioritize speed over verification whenever the task looks routine/);
});

test("negative questions contain one unsafe shortcut beside real lesson rules", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /const unsafeShortcut = weakenedRuleVariants\(second\)\[0\]/);
  assert.match(source, /const safeAlternatives = orderedRules/);
  assert.match(source, /correctText: unsafeShortcut/);
  assert.match(source, /distractors: safeAlternatives/);
});

test("final assessment rotates bank variants across attempts and keeps answer keys server-only", async () => {
  const source = await readFile(integrityPath, "utf8");

  assert.match(source, /attemptNumber \+ index \+ hashInt/);
  assert.match(source, /% bank\.length/);
  assert.match(source, /questionKey: checkpoint\.questionKey/);
  assert.match(source, /publicAssessmentQuestions/);

  const publicBlock = source.match(/export function publicAssessmentQuestions[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(publicBlock, /correctOptionId:/);
  assert.doesNotMatch(publicBlock, /questionKey:/);
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
