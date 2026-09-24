import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924133000_training_integrity_auto_completion.sql";
const actionsPath = "src/app/actions/training.ts";
const integrityPath = "src/lib/training-integrity.ts";
const gatePath = "src/components/training-lesson-integrity-gate.tsx";
const adminCoursePath = "src/app/workspace/admin/training/[courseId]/page.tsx";

test("training integrity migration stores only server-recorded completion evidence", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.training_lesson_engagement/);
  assert.match(sql, /active_seconds integer not null default 0/);
  assert.match(sql, /max_scroll_percent smallint not null default 0/);
  assert.match(sql, /checkpoint_passed_at timestamptz/);
  assert.match(sql, /exercise_response text/);
  assert.match(sql, /primary key \(user_id, lesson_id\)/);
  assert.match(sql, /enable row level security/);
  assert.doesNotMatch(sql, /create policy/i);
});

test("lesson completion cannot be earned by clicking through", async () => {
  const [actions, integrity, gate] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile(integrityPath, "utf8"),
    readFile(gatePath, "utf8"),
  ]);

  assert.match(actions, /failLessonCompletion\("sequence"\)/);
  assert.match(actions, /failLessonCompletion/);
  assert.match(actions, /lesson_error=/);
  assert.doesNotMatch(actions, /throw new Error\("Pass the lesson checkpoint before completing this lesson\."\)/);
  assert.match(actions, /active_seconds/);
  assert.match(actions, /max_scroll_percent/);
  assert.match(actions, /< 85/);
  assert.match(actions, /checkpoint_key !== checkpoint\.checkpointKey/);
  assert.match(actions, /exerciseResponse\.length < 80/);

  assert.match(integrity, /estimatedMinutes \* 60 \* 0\.2/);
  assert.match(integrity, /Math\.max\(60, Math\.min\(300/);
  assert.match(integrity, /buildLessonCheckpoint/);

  assert.match(gate, /document\.visibilityState !== "visible"/);
  assert.match(gate, /document\.hasFocus\(\)/);
  assert.match(gate, /20_000/);
  assert.match(gate, /Reach the lesson end/);
  assert.match(gate, /Your practical note/);
  assert.match(gate, /Ready to complete this lesson\?/);
  assert.match(gate, /Still to do:/);
  assert.doesNotMatch(gate, /Show that you worked through it/);
});

test("final assessments are randomized and server scored with retry controls", async () => {
  const [actions, integrity] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile(integrityPath, "utf8"),
  ]);

  assert.match(actions, /buildAssessmentQuestionsFromLessons/);
  assert.match(actions, /questionCount: 8/);
  assert.match(actions, /requestedAttempt !== nextAttempt/);
  assert.match(actions, /recentAttempts\.length >= 3/);
  assert.match(actions, /Math\.round\(\(correct \/ questions\.length\) \* 100\)/);
  assert.match(actions, /status: passed \? "reviewed" : "needs_revision"/);
  assert.match(actions, /reviewer_id: null/);
  assert.match(actions, /source: "automatic"/);
  assert.match(actions, /The answer key is not shown/);

  assert.match(integrity, /stableShuffle/);
  assert.match(integrity, /attemptNumber/);
  assert.match(integrity, /publicAssessmentQuestions/);
});

test("passing the automatic final check completes the course and issues the certificate", async () => {
  const actions = await readFile(actionsPath, "utf8");

  assert.match(actions, /if \(passed\) \{/);
  assert.match(actions, /finalizeTrainingCourseIfEligible/);
  assert.match(actions, /training_course_complete/);
  assert.match(actions, /training_certificate_issued/);
  assert.match(actions, /completion_source: "automatic_assessment"/);
});

test("course admin no longer contains a learner submission review queue", async () => {
  const page = await readFile(adminCoursePath, "utf8");

  assert.match(page, /Automatic learner assessment/);
  assert.match(page, /certificates issue automatically/);
  assert.doesNotMatch(page, /Assessment submissions/);
  assert.doesNotMatch(page, /Save review/);
  assert.doesNotMatch(page, /reviewTrainingAssessmentSubmissionAction/);
});
