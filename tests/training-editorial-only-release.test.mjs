import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const legacyMigrationPath = "supabase/migrations/20260924000000_remove_all_course_specialist_gates.sql";
const repairMigrationPath = "supabase/migrations/20261004091000_restore_training_specialist_review_requirements.sql";

test("legacy editorial-only migration remains historical evidence", async () => {
  const sql = await readFile(legacyMigrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /status = 'revoked'/);
  assert.doesNotMatch(sql, /delete from public\.training_specialist_review_events/);
});

test("current migration restores specialist requirements for configured high-risk courses", async () => {
  const sql = await readFile(repairMigrationPath, "utf8");

  assert.match(sql, /review_requirement = 'specialist'/);
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
    assert.ok(sql.includes(`'${slug}'`), "Missing restored specialist course: " + slug);
  }
  assert.doesNotMatch(sql, /specialist_reviewed_by\s*=/);
  assert.doesNotMatch(sql, /specialist_reviewed_at\s*=/);
});

test("course publishing requires current specialist approval when configured", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const statusAction = action.slice(action.indexOf("export async function setTrainingCourseStatusAction"));

  assert.match(statusAction, /course\.review_requirement === "specialist"/);
  assert.match(statusAction, /getSpecialistReviewDefinition\(course\.slug\)/);
  assert.match(statusAction, /specialistReview\?\.decision === "approved"/);
  assert.match(statusAction, /review_revision/);
  assert.match(statusAction, /assigned_revision/);
  assert.match(statusAction, /Complete the current specialist review before publishing this course/);
});

test("course creation and editing derive specialist requirement from the configured review definition", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");

  assert.ok((action.match(/getSpecialistReviewDefinition\(parsed\.data\.slug\) \? "specialist" : "editorial"/g) || []).length >= 2);
  assert.doesNotMatch(action, /review_requirement: "editorial"/);
});

test("training admin exposes specialist review status and queue", async () => {
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");

  assert.match(coursePage, /Specialist review/);
  assert.match(coursePage, /specialistReady/);
  assert.match(coursePage, /\/workspace\/admin\/training\/reviews/);
  assert.match(inventory, /Specialist reviews/);
  assert.match(inventory, /Specialist QA for higher-risk subjects/);
});
