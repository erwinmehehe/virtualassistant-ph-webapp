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
  assert.ok(lesson.indexOf("if (exerciseSaveError)") < lesson.indexOf('const { error: progressError }'));
});

test("completion and certificate database lookup errors are not ignored", () => {
  assert.match(completion, /if \(completionSaveError\) throw/);
  assert.match(completion, /if \(certificateLookupError\) throw/);
});

test("reading engagement uses serialized database RPC rather than read-modify-write", () => {
  const start = actions.indexOf("export async function recordTrainingLessonEngagementAction");
  const end = actions.indexOf("export async function checkTrainingLessonCheckpointAction", start);
  const action = actions.slice(start, end);
  assert.match(action, /\.rpc\("record_training_engagement_atomic"/);
  assert.doesNotMatch(action, /\.from\("training_lesson_engagement"\)\.upsert/);

  const migration = readFileSync(
    new URL("../supabase/migrations/20261026150000_atomic_training_engagement.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /for update/);
  assert.match(migration, /grant execute .*service_role/);
  assert.match(migration, /revoke all .*anon, authenticated/);
});
