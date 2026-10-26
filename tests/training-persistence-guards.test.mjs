import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("../src/app/actions/training.ts", import.meta.url), "utf8");
const completion = readFileSync(new URL("../src/lib/training-completion.ts", import.meta.url), "utf8");

test("checkpoint writes require enrollment and acknowledge persistence failures", () => {
  const start = actions.indexOf("export async function checkTrainingLessonCheckpointAction");
  const end = actions.indexOf("export async function markTrainingLessonCompleteAction", start);
  const checkpoint = actions.slice(start, end);
  assert.match(checkpoint, /from\("training_enrollments"\)/);
  assert.match(checkpoint, /\.eq\("user_id", userId\)/);
  assert.match(checkpoint, /\.eq\("course_id", course\.id\)/);
  assert.match(checkpoint, /if \(!enrollment\) return \{ correct: false \}/);
  assert.match(checkpoint, /if \(checkpointSaveError\) throw/);
  assert.ok(checkpoint.indexOf("if (checkpointSaveError)") < checkpoint.indexOf("return { correct: true }"));
});

test("lesson completion does not proceed after an exercise engagement write fails", () => {
  const start = actions.indexOf("export async function markTrainingLessonCompleteAction");
  const end = actions.indexOf("export async function submitTrainingAssessmentAction", start);
  const lesson = actions.slice(start, end);
  assert.match(lesson, /if \(exerciseSaveError\) throw/);
  assert.ok(lesson.indexOf("if (exerciseSaveError)") < lesson.indexOf('from("training_lesson_progress")'));
});

test("completion and certificate database lookup errors are not ignored", () => {
  assert.match(completion, /if \(completionSaveError\) throw/);
  assert.match(completion, /if \(certificateLookupError\) throw/);
});
