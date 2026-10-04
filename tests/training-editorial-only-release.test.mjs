import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cleanupMigrationPath = "supabase/migrations/20261004094500_remove_training_specialist_review_requirement.sql";

test("current training policy is editorial-only", async () => {
  const sql = await readFile(cleanupMigrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /specialist_reviewed_by = null/);
  assert.match(sql, /specialist_reviewer_role = null/);
  assert.match(sql, /specialist_review_notes = null/);
  assert.match(sql, /specialist_reviewed_at = null/);
  assert.match(sql, /status = 'revoked'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("course authoring no longer derives or enforces specialist review", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");

  assert.match(action, /review_requirement: "editorial"/);
  assert.doesNotMatch(action, /getSpecialistReviewDefinition/);
  assert.doesNotMatch(action, /training_specialist_reviews/);
  assert.doesNotMatch(action, /assignTrainingSpecialistReviewerAction/);
  assert.doesNotMatch(action, /saveTrainingSpecialistReviewAction/);
  assert.doesNotMatch(coursePage, /Specialist review/);
  assert.doesNotMatch(coursePage, /specialistReady/);
  assert.doesNotMatch(inventory, /Specialist reviews/);
  assert.doesNotMatch(inventory, /Specialist QA for higher-risk subjects/);
});
