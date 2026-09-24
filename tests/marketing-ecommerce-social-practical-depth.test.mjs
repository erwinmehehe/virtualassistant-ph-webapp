import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924120000_marketing_ecommerce_social_practical_depth.sql";

test("Marketing gets lesson-specific practical work across all 12 lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const count = (sql.match(/'marketing-virtual-assistant'/g) || []).length;
  assert.ok(count >= 13, "Expected 12 Marketing practice specs plus course-scope update");

  for (const artifact of [
    "Campaign control brief",
    "Marketing claim register",
    "Campaign production board",
    "Marketing asset QA sheet",
    "Campaign launch control sheet",
    "Final marketing simulation QA",
  ]) {
    assert.ok(sql.includes(artifact), "Missing Marketing artifact: " + artifact);
  }
});

test("E-commerce gets lesson-specific practical work across all 12 lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const count = (sql.match(/'ecommerce-virtual-assistant'/g) || []).length;
  assert.ok(count >= 13, "Expected 12 E-commerce practice specs plus course-scope update");

  for (const slug of [
    "how-an-online-store-operates",
    "products-variants-skus-and-source-data",
    "order-processing-and-exception-tracking",
    "returns-refunds-exchanges-and-policy-based-support",
    "inventory-monitoring-and-reorder-administration",
    "composite-e-commerce-va-work-simulation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing E-commerce practice: " + slug);
  }
});

test("Social Media promotes existing drills instead of bolting on duplicate practice", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /c\.slug = 'social-media-virtual-assistant'/);
  assert.match(sql, /b->>'text' = 'Work product drill'/);
  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /Social media operations work product/);
  assert.match(sql, /Social media QA/);
  assert.match(sql, /block->>'type' not in \('exercise','template','checklist'\)/);
});

test("the practical-depth migration replaces generic practice without resetting learners", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /filter \(where b\.block->>'type' not in \('exercise','template','checklist'\)\)/);
  assert.match(sql, /l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_assessment_submissions/i);
});

test("the new batch is scoped only to Marketing, E-commerce, and Social Media", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "marketing-virtual-assistant",
    "ecommerce-virtual-assistant",
    "social-media-virtual-assistant",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing course scope: " + slug);
  }

  for (const slug of [
    "customer-support-virtual-assistant",
    "seo-virtual-assistant",
    "operations-virtual-assistant",
    "project-management-for-virtual-assistants",
  ]) {
    assert.ok(!sql.includes("'" + slug + "'"), "Unexpected stale course scope: " + slug);
  }
});
