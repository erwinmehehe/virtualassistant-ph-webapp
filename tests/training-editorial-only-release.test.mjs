import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const policyPath = "supabase/migrations/20261004102500_restore_operational_training_specialist_reviews.sql";

test("current training policy restores specialist review for the configured higher-risk courses", async () => {
  const sql = await readFile(policyPath, "utf8");

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
    assert.ok(sql.includes("'" + slug + "'"), "Missing specialist course: " + slug);
  }
  assert.doesNotMatch(sql, /status = 'draft'/);
});

test("course authoring derives specialist requirements and exposes the review workflow", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  const queue = await readFile("src/app/workspace/admin/training/reviews/page.tsx", "utf8");

  assert.match(action, /getSpecialistReviewDefinition/);
  assert.match(action, /training_specialist_reviews/);
  assert.match(action, /assignTrainingSpecialistReviewerAction/);
  assert.match(action, /saveTrainingSpecialistReviewAction/);
  assert.match(coursePage, /Specialist review/);
  assert.match(coursePage, /specialistReady/);
  assert.match(inventory, /Specialist reviews/);
  assert.match(inventory, /Published · specialist review pending/);
  assert.match(queue, /Needs reviewer/);
  assert.match(queue, /Review assigned/);
  assert.match(queue, /In review/);
  assert.match(queue, /Changes requested/);
  assert.match(queue, /Approved/);
});
