import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("training specialist review schema is versioned and core high-risk courses require it", async () => {
  const migration = await readFile("supabase/migrations/20260923133654_training_specialist_review_gate.sql", "utf8");
  assert.match(migration, /review_requirement text not null default 'editorial'/);
  assert.match(migration, /specialist_reviewed_by text/);
  assert.match(migration, /specialist_reviewer_role text/);
  assert.match(migration, /specialist_review_notes text/);
  assert.match(migration, /specialist_reviewed_at timestamptz/);

  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
  ]) {
    assert.ok(migration.includes(slug), "Missing specialist-review course: " + slug);
  }
});

test("course publishing blocks specialist courses without explicit specialist sign-off", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /review_requirement === "specialist"/);
  assert.match(action, /specialist_reviewed_by/);
  assert.match(action, /specialist_reviewer_role/);
  assert.match(action, /specialist_review_notes/);
  assert.match(action, /specialist_reviewed_at/);
  assert.match(action, /Complete the required specialist review before publishing this course/);
});

test("editing course content invalidates specialist review date", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /specialist_reviewed_at: null/);
  assert.match(action, /invalidateCourseReview/);
});

test("training admin exposes specialist-review requirement and evidence fields", async () => {
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  const newCourse = await readFile("src/app/workspace/admin/training/new/page.tsx", "utf8");

  assert.match(coursePage, /Editorial \+ specialist review/);
  assert.match(coursePage, /Specialist reviewer/);
  assert.match(coursePage, /Specialist role \/ scope/);
  assert.match(coursePage, /Specialist review notes/);
  assert.match(coursePage, /Specialist sign-off required before publishing/);
  assert.match(inventory, /Specialist review required/);
  assert.match(newCourse, /review_requirement/);
});

test("training query types carry specialist review state", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");
  const admin = await readFile("src/lib/training-admin.ts", "utf8");
  assert.match(training, /review_requirement: "editorial" \| "specialist"/);
  assert.match(training, /specialist_reviewed_at: string \| null/);
  assert.match(admin, /specialist_reviewer_role: string \| null/);
});
