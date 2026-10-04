import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const qualityPath = "src/lib/training-quality.ts";
const actionPath = "src/app/actions/training-admin.ts";
const adminPath = "src/lib/training-admin.ts";

test("lesson quality requires exactly one exercise template and checklist", async () => {
  const quality = await readFile(qualityPath, "utf8");

  assert.match(quality, /counts\.exercise !== 1/);
  assert.match(quality, /counts\.template !== 1/);
  assert.match(quality, /counts\.checklist !== 1/);
  assert.match(quality, /exercise\.deliverable/);
  assert.match(quality, /items\.length < 3/);
});

test("course and lesson publishing enforce practical lesson quality", async () => {
  const actions = await readFile(actionPath, "utf8");

  assert.match(actions, /hasCompleteTrainingPracticalLesson/);
  assert.match(actions, /Every published lesson needs exactly one complete practice task, reusable template, and QA checklist/);
  assert.match(actions, /Add exactly one complete practice task, reusable template, and QA checklist before publishing/);
  assert.match(actions, /Add a final assessment before publishing the course/);
});

test("course publishing requires a complete practical final", async () => {
  const [quality, actions] = await Promise.all([
    readFile(qualityPath, "utf8"),
    readFile(actionPath, "utf8"),
  ]);

  assert.match(quality, /assessment\.assessment_type === "practical"/);
  assert.match(quality, /rubric\.length < 4/);
  assert.match(quality, /assessment\.resource_pack\.length < 2/);
  assert.match(quality, /total === 100/);
  assert.match(actions, /isTrainingPracticalAssessmentReady/);
  assert.match(actions, /Publish at least one complete practical final assessment before the course can go live/);
});

test("admin readiness uses the same practical quality rules as publishing", async () => {
  const admin = await readFile(adminPath, "utf8");

  assert.match(admin, /hasCompleteTrainingPracticalLesson\(lesson\.content\)/);
  assert.match(admin, /isTrainingAssessmentPublishReady/);
  assert.match(admin, /courseAssessments\.some\(isTrainingPracticalAssessmentReady\)/);
  assert.match(admin, /assessment_type,rubric,resource_pack/);
});


test("specialist-gated courses require a current approved specialist review", async () => {
  const actions = await readFile(actionPath, "utf8");

  assert.match(actions, /getSpecialistReviewDefinition\(parsed\.data\.slug\) \? "specialist" : "editorial"/);
  assert.match(actions, /course\.review_requirement === "specialist"/);
  assert.match(actions, /training_specialist_reviews/);
  assert.match(actions, /specialistReview\?\.decision === "approved"/);
  assert.match(actions, /specialistReview\.review_revision/);
  assert.match(actions, /specialistReview\.assigned_revision/);
  assert.match(actions, /Complete the current specialist review before publishing this course/);
});

test("repair migration restores specialist classification without fabricating approval", async () => {
  const migration = await readFile("supabase/migrations/20261004091000_restore_training_specialist_review_requirements.sql", "utf8");

  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
    "australian-allied-health-administration",
    "cliniko-for-virtual-assistants",
    "australian-bookkeeping-administration",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(migration.includes(`'${slug}'`), "Missing specialist course classification: " + slug);
  }

  assert.match(migration, /review_requirement = 'specialist'/);
  assert.doesNotMatch(migration, /specialist_reviewed_by\s*=/);
  assert.doesNotMatch(migration, /status\s*=\s*'published'/);
});
