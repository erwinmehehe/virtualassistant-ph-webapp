import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924111500_add_ops_pm_worked_examples.sql";

test("worked examples cover the highest-judgment Operations lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "processes-inputs-outputs-owners-and-controls",
    "operational-data-quality-and-reconciliation",
    "kpi-reporting-and-exception-summaries",
    "incident-coordination-and-business-continuity-handoffs",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing Operations worked example: " + slug);
  }
});

test("worked examples cover the highest-judgment Project Management lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "projects-scope-deliverables-and-success-criteria",
    "tasks-dependencies-milestones-and-estimates",
    "risks-issues-dependencies-and-escalation",
    "scope-changes-requests-and-change-control",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing PM worked example: " + slug);
  }
});

test("examples model reasoning without replacing learner practice", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type', 'callout'/);
  assert.match(sql, /Worked example:/);
  assert.match(sql, /where b2\.block->>'type' = 'exercise'/);
  assert.match(sql, /where b\.ord < ex\.exercise_ord/);
  assert.match(sql, /where b\.ord >= ex\.exercise_ord/);
});

test("worked examples stay idempotent and preserve lesson identity", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /existing->>'title' = t\.example_title/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_courses/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
});
