import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260923232000_prepare_property_mortgage_specialist_review.sql";

test("property and mortgage courses remain draft behind specialist review", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(sql.includes(slug), "Missing review-ready course: " + slug);
  }

  assert.match(sql, /review_requirement = 'specialist'/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.doesNotMatch(sql, /status = 'published'/);
});

test("editorial review marks lessons and practical assessments ready without granting specialist approval", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /is_published = true/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /specialist_reviewed_by = null/);
  assert.match(sql, /specialist_reviewer_role = null/);
  assert.match(sql, /specialist_review_notes = null/);
  assert.match(sql, /specialist_reviewed_at = null/);
});

test("review queue rows exist without inventing a specialist reviewer", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /insert into public\.training_specialist_reviews/);
  assert.match(sql, /'in_progress'/);
  assert.match(sql, /assigned_revision/);
  assert.match(sql, /on conflict \(course_id\) do nothing/);
  assert.doesNotMatch(sql, /assigned_reviewer_name\s*,/);
});

test("existing source curricula are practical and scenario-based", async () => {
  const property = await readFile(
    "supabase/migrations/20260923062700_build_property_management_australia.sql",
    "utf8",
  );
  const mortgage = await readFile(
    "supabase/migrations/20260923062800_build_mortgage_broking_australia.sql",
    "utf8",
  );

  for (const [name, sql] of [["property", property], ["mortgage", mortgage]]) {
    assert.equal((sql.match(/insert into public\.training_lessons/g) || []).length, 8, name + " lesson count");
    assert.equal((sql.match(/"type":"scenario"/g) || []).length, 8, name + " scenario count");
    assert.equal((sql.match(/insert into public\.training_assessments/g) || []).length, 1, name + " assessment count");
    assert.match(sql, /Final Work Simulation/);
  }
});
