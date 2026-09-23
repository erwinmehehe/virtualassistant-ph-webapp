import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("specialist review queue migration persists review evidence privately", async () => {
  const migration = await readFile("supabase/migrations/20260923152000_training_specialist_review_queue.sql", "utf8");
  assert.match(migration, /create table if not exists public\.training_specialist_reviews/);
  assert.match(migration, /check \(decision in \('in_progress', 'changes_requested', 'approved'\)\)/);
  assert.match(migration, /alter table public\.training_specialist_reviews enable row level security/);
  assert.match(migration, /revoke all on public\.training_specialist_reviews from anon, authenticated/);
  assert.match(migration, /grant all on public\.training_specialist_reviews to service_role/);
});

test("all four gated courses have specific specialist review checklists", async () => {
  const definitions = await readFile("src/lib/training-specialist-review.ts", "utf8");
  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
  ]) {
    assert.ok(definitions.includes('"' + slug + '"'), "Missing checklist definition for " + slug);
  }
  assert.match(definitions, /Fair-housing and discrimination boundaries are safe/);
  assert.match(definitions, /Non-clinical role boundaries are explicit/);
  assert.match(definitions, /Payment controls are safe/);
  assert.match(definitions, /Bank-detail change controls are safe/);
});

test("specialist review action requires evidence and every checklist item before approval", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /saveTrainingSpecialistReviewAction/);
  assert.match(action, /Complete every specialist checklist item before approving the course/);
  assert.match(action, /Add the specialist reviewer, role, and meaningful review notes before approval/);
  assert.match(action, /training_specialist_reviews/);
  assert.match(action, /specialist_reviewed_at: reviewedAt/);
  assert.match(action, /status: "draft"/);
});

test("specialist review queue shows readiness, decisions, and publishing separation", async () => {
  const page = await readFile("src/app/workspace/admin/training/reviews/page.tsx", "utf8");
  assert.match(page, /Specialist review queue/);
  assert.match(page, /Save progress/);
  assert.match(page, /Needs changes/);
  assert.match(page, /Approve specialist review/);
  assert.match(page, /Publish reviewed course/);
  assert.match(page, /Publishing remains separate/);
});

test("training admin links to specialist review queue", async () => {
  const page = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  assert.match(page, /workspace\/admin\/training\/reviews/);
  assert.match(page, /Specialist reviews/);
});


test("specialist approval cannot be granted from ordinary course settings", async () => {
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.doesNotMatch(coursePage, /name="specialist_review_action"/);
  assert.doesNotMatch(coursePage, /name="specialist_reviewed_by"/);
  assert.match(coursePage, /Specialist sign-off is managed in the review queue/);
  assert.match(action, /saveTrainingSpecialistReviewAction/);
  assert.match(action, /specialist_reviewed_by: null/);
  assert.match(action, /decision: "in_progress"/);
});
