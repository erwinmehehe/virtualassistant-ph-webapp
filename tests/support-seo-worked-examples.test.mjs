import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924114500_add_support_seo_worked_examples.sql";

test("worked examples cover the highest-judgment Customer Support lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "ticket-triage-priority-and-routing",
    "using-a-knowledge-base-without-copy-paste-support",
    "troubleshooting-boundaries-and-escalation",
    "complaints-angry-customers-and-de-escalation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing support worked example: " + slug);
  }
});

test("worked examples cover the highest-judgment SEO lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "keywords-topics-entities-and-cannibalization",
    "canonicals-indexability-redirects-and-sitemap-basics",
    "google-search-console-and-performance-analysis",
    "seo-qa-reporting-and-change-validation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing SEO worked example: " + slug);
  }
});

test("worked examples are inserted immediately before practice tasks", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type', 'callout'/);
  assert.match(sql, /Worked example:/);
  assert.match(sql, /where b2\.block->>'type' = 'exercise'/);
  assert.match(sql, /where b\.ord < ex\.exercise_ord/);
  assert.match(sql, /where b\.ord >= ex\.exercise_ord/);
});

test("worked examples are idempotent and preserve learner progress", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /existing->>'title' = t\.example_title/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
});
