import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924103000_catalog_curriculum_remediation.sql";

test("catalog remediation covers every published non-Executive course through a generic published-course selector", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /c\.status = 'published'/);
  assert.match(sql, /c\.slug not in \([\s\S]*'virtual-assistant-foundations'[\s\S]*'executive-virtual-assistant'/);
  assert.match(sql, /where b->>'type' = 'exercise'/);
});

test("catalog remediation turns existing scenarios into practice instead of duplicating the same task", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /max\(b\.ord\) filter \(where b\.block->>'type' = 'scenario'\)/);
  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'deliverable', s\.deliverable/);
  assert.match(sql, /Reusable work template/);
  assert.match(sql, /Before you submit/);
});

test("practice artifacts are role-specific across the catalog", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "SEO work product:",
    "Support work product:",
    "Operations work product:",
    "Project work product:",
    "Property admin work product:",
    "Healthcare admin work product:",
    "Finance admin work product:",
    "Marketing work product:",
    "Sales / lead-gen work product:",
    "E-commerce work product:",
    "Short-stay work product:",
    "Field-service work product:",
    "Australian VA work product:",
  ]) {
    assert.ok(sql.includes(phrase), "Missing role-specific practice template: " + phrase);
  }
});

test("module outcomes and spaced retrieval are added without creating more lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /What you should be able to do after this module/);
  assert.match(sql, /Recall before you continue/);
  assert.match(sql, /Without looking back/);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
});

test("Foundations repetition is cut and the capstone now tests every major foundation skill", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "inbox-management",
    "calendar-and-meeting-coordination",
    "drive-docs-and-file-organization",
    "spreadsheets-for-va-admin-work",
    "research-and-source-verification",
    "responsible-ai-for-va-work",
    "reading-briefs-sops-and-working-independently",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing Foundations dedupe target: " + slug);
  }

  assert.match(sql, /CRM cleanup and exception log/);
  assert.match(sql, /File-governance decision/);
  assert.match(sql, /Brief\/SOP interpretation/);
  assert.match(sql, /Conflicting client-list files/);
  assert.match(sql, /Service-booking SOP gap/);
});

test("catalog remediation preserves learner progress and published course identity", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  assert.doesNotMatch(sql, /delete from public\.training_courses/i);
  assert.doesNotMatch(sql, /insert into public\.training_courses/i);
  assert.doesNotMatch(sql, /insert into public\.training_modules/i);
  assert.doesNotMatch(sql, /status = 'draft'/);
});
