import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/workspace/admin/analytics/page.tsx";

test("admin analytics uses database truth for the per-course training funnel", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /from\("training_courses"\)/);
  assert.match(page, /from\("training_enrollments"\)/);
  assert.match(page, /from\("training_lesson_progress"\)/);
  assert.match(page, /from\("training_assessment_submissions"\)/);
  assert.match(page, /from\("training_certificates"\)/);
  assert.match(page, /trainingCourseFunnels/);
  assert.match(page, /"Enrolled"/);
  assert.match(page, /"≥1 lesson"/);
  assert.match(page, /"All lessons"/);
  assert.match(page, /"Final attempted"/);
  assert.match(page, /"Final passed"/);
  assert.match(page, /"Completed"/);
  assert.match(page, /"Certified"/);
});

test("course funnel highlights drop-off without exposing individual learners", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Where learners drop by course/);
  assert.match(page, /Largest current course drop-off/);
  assert.match(page, /Biggest drop/);
  assert.match(page, /Database-backed learner state across all time/);
  assert.doesNotMatch(page, /email_address|full_name|candidate_name/);
});

test("admin analytics shows lesson progression for the most-active course", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /mostActiveCourse/);
  assert.match(page, /mostActiveLessons/);
  assert.match(page, /Lesson progression/);
  assert.match(page, /Completed learners/);
  assert.match(page, /Of enrolled/);
  assert.match(page, /Drop from previous step/);
  assert.match(page, /completionsByLesson/);
});

test("legacy event funnel remains separate from learner-state funnel", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Training engagement/);
  assert.match(page, /trainingConversionStages/);
  assert.match(page, /trainingParticipantCount/);
  assert.match(page, /Course completion/);
  assert.match(page, /Course enrolments/);
});