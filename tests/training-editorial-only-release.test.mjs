import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924000000_remove_all_course_specialist_gates.sql";

test("all specialist course requirements are converted to editorial", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where review_requirement = 'specialist'/);
  assert.match(sql, /review_requirement = 'editorial'/);
  assert.doesNotMatch(sql, /set\s+review_requirement = 'specialist'/i);
});

test("active specialist handoffs are retired without deleting audit history", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /update public\.training_specialist_review_invites/);
  assert.match(sql, /status = 'revoked'/);
  assert.match(sql, /delete from public\.training_specialist_reviews/);
  assert.doesNotMatch(sql, /delete from public\.training_specialist_review_events/);
  assert.doesNotMatch(sql, /truncate public\.training_specialist_review_events/);
});

test("former specialist courses release only through ordinary editorial readiness", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /course\.reviewed_by is not null/);
  assert.match(sql, /course\.last_reviewed_at is not null/);
  assert.match(sql, /lesson\.is_published is not true/);
  assert.match(sql, /jsonb_array_length\(lesson\.content\) < 3/);
  assert.match(sql, /assessment\.is_published is not true/);
  assert.match(sql, /length\(trim\(assessment\.instructions\)\) < 100/);
  assert.match(sql, /assessment\.pass_score is null/);
  assert.match(sql, /assessment\.assessment_type = 'practical'/);
  assert.match(sql, /jsonb_array_length\(assessment\.rubric\) < 4/);
  assert.match(sql, /jsonb_array_length\(assessment\.resource_pack\) < 2/);
  assert.match(sql, /status = 'published'/);
});

test("course publishing code no longer checks specialist approval", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const statusAction = action.slice(action.indexOf("export async function setTrainingCourseStatusAction"));

  assert.match(statusAction, /Record a reviewer and review date before publishing the course/);
  assert.doesNotMatch(statusAction, /review_requirement === "specialist"/);
  assert.doesNotMatch(statusAction, /Complete the current specialist review revision/);
  assert.doesNotMatch(statusAction, /specialistReview/);
});

test("course creation and editing always use editorial review", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");

  assert.doesNotMatch(action, /review_requirement: z\.enum\(\["editorial", "specialist"\]\)/);
  assert.ok((action.match(/review_requirement: "editorial"/g) || []).length >= 2);
});

test("training authoring UI no longer exposes specialist review gates", async () => {
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const newCourse = await readFile("src/app/workspace/admin/training/new/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");

  assert.doesNotMatch(coursePage, /name="review_requirement"/);
  assert.doesNotMatch(coursePage, /Specialist sign-off required before publishing/);
  assert.doesNotMatch(newCourse, /name="review_requirement"/);
  assert.doesNotMatch(inventory, /Specialist reviews/);
  assert.doesNotMatch(inventory, /Specialist review required/);
  assert.match(inventory, /Editorial QA before release/);
});
