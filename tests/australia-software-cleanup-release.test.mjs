import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cleanupPath = "supabase/migrations/20260923215500_consolidate_australia_course_notices.sql";
const releasePath = "supabase/migrations/20260923220000_release_australia_software_training.sql";

test("Australia cleanup consolidates repeated lesson warnings into course-level notices", async () => {
  const sql = await readFile(cleanupPath, "utf8");

  for (const slug of [
    "servicem8-for-virtual-assistants",
    "cliniko-for-virtual-assistants",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(sql.includes(slug), "Missing cleanup target: " + slug);
  }

  assert.match(sql, /item\.value->>'title' in \('Keep this current', 'Local rules matter'\)/);
  assert.match(sql, /trademark_disclaimer = case slug/);
  assert.match(sql, /Product interfaces and features change/);
  assert.match(sql, /Residential tenancy, licensing, notices, bonds/);
  assert.match(sql, /Australian credit law, lender policy/);
});

test("later editorial-only release retires the temporary Australia specialist gate", async () => {
  const cleanup = await readFile(cleanupPath, "utf8");
  const finalRelease = await readFile("supabase/migrations/20260924000000_remove_all_course_specialist_gates.sql", "utf8");

  assert.match(cleanup, /review_requirement = 'specialist'/);
  assert.match(finalRelease, /review_requirement = 'editorial'/);
  assert.match(finalRelease, /where review_requirement = 'specialist'/);
  assert.match(finalRelease, /status = 'published'/);
});

test("software release refuses repeated boilerplate and requires practical assessments", async () => {
  const sql = await readFile(releasePath, "utf8");

  assert.match(sql, /Repeated per-lesson currency boilerplate remains/);
  assert.match(sql, /Every Australia software course needs one substantive course-level notice/);
  assert.match(sql, /assessment_type = 'practical'/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /status = 'published'/);
  assert.match(sql, /content_version = greatest\(content_version, 3\)/);

  for (const slug of [
    "servicem8-for-virtual-assistants",
    "cliniko-for-virtual-assistants",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
  ]) {
    assert.ok(sql.includes(slug), "Missing software release target: " + slug);
  }

  for (const slug of [
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.equal(
      sql.includes(slug),
      false,
      "Regulated course must not be released without specialist review: " + slug,
    );
  }
});

test("learner and admin UI present the field as one course-level notice", async () => {
  const learner = await readFile("src/app/workspace/training/courses/[slug]/page.tsx", "utf8");
  const editor = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const newCourse = await readFile("src/app/workspace/admin/training/new/page.tsx", "utf8");
  const inventory = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");

  assert.match(learner, /<strong>Course notice\.<\/strong>/);
  assert.match(editor, /Course notice \/ affiliation disclosure/);
  assert.match(newCourse, /Course notice \/ affiliation disclosure/);
  assert.match(inventory, /Course notice recorded/);
});
