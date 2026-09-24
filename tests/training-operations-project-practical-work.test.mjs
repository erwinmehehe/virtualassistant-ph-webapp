import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924113000_operations_project_practical_work.sql";

test("Operations and Project Management practical migration covers all 24 published lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  const operationsIds = new Set(
    sql.match(/22000012-0000-4000-8000-0000000000\d{2}/g) || [],
  );
  const projectIds = new Set(
    sql.match(/22000013-0000-4000-8000-0000000000\d{2}/g) || [],
  );

  assert.equal(operationsIds.size, 12);
  assert.equal(projectIds.size, 12);
  assert.match(sql, /where l\.is_published = true/);
});

test("Operations practical work produces real operating artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Operations process map",
    "Operations exception queue",
    "SOP drafting template",
    "Daily operations control board",
    "Vendor control log",
    "Blocker and escalation log",
    "Reconciliation discrepancy sheet",
    "KPI variance investigation",
    "Bottleneck experiment brief",
    "Automation change brief",
    "Operations incident log",
    "Final operations simulation pack",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Operations artifact: " + phrase);
  }
});

test("Project Management practical work produces real project controls", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Project charter",
    "Project decision-rights matrix",
    "Project plan and dependency map",
    "Project replan",
    "Project board",
    "Decision and action log",
    "RAID register",
    "Weekly project status report",
    "Scope-change request",
    "Acceptance and rework checklist",
    "Project handoff and stakeholder update",
    "Final project simulation pack",
  ]) {
    assert.ok(sql.includes(phrase), "Missing PM artifact: " + phrase);
  }
});

test("final simulations teach the Operations versus Project Management boundary", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(
    sql,
    /Recurring BAU work stays in the Operations control system/i,
  );
  assert.match(
    sql,
    /Finite project scope, milestone, and change decisions are routed to Project Management/i,
  );
  assert.match(
    sql,
    /Finite project work stays inside the project control system/i,
  );
  assert.match(
    sql,
    /Recurring BAU exceptions are routed to Operations/i,
  );
});

test("practical work uses existing exercise, template, and checklist block types safely", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'type', 'template'/);
  assert.match(sql, /'type', 'checklist'/);
  assert.match(sql, /l\.content \|\| jsonb_build_array/);
  assert.match(sql, /where block->>'type' = 'exercise'/);

  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
});

test("requested hands-on curriculum outputs are all represented", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "exception queue",
    "daily operations control board",
    "SOP",
    "process map",
    "KPI variance",
    "blocker and escalation log",
    "project plan and dependency map",
    "RAID register",
    "scope-change request",
    "weekly project status report",
    "stakeholder update",
    "decision log",
    "handoff",
    "Final simulation",
  ]) {
    assert.ok(
      sql.toLowerCase().includes(phrase.toLowerCase()),
      "Missing requested practical output: " + phrase,
    );
  }
});
