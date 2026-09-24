import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924124500_next_five_worked_examples_assessments.sql";

test("the five-course pass adds twenty high-judgment worked examples", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const titles = sql.match(/Worked example:/g) || [];
  assert.equal(titles.length, 20);
  assert.match(sql, /ex\.exercise_ord/);
  assert.match(sql, /b\.ord < ex\.exercise_ord/);
  assert.match(sql, /b\.ord >= ex\.exercise_ord/);
});

test("each target course receives four worked examples", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const examplesBlock = sql.split("),\ntargets as (")[0];

  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
    "airbnb-short-term-rental-virtual-assistant",
  ]) {
    const count = examplesBlock.split("'" + slug + "'").length - 1;
    assert.equal(count, 4, slug + " should have four worked examples");
  }
});

test("final assessments get course-specific rubrics with hard-fail boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const label of [
    "Licensed, legal and commercial boundaries",
    "Clinical scope and privacy protection",
    "Accounting, tax and payment-authority boundaries",
    "Statutory, tax and payment-authority boundaries",
    "Safety and commercial-authority boundaries",
  ]) {
    assert.ok(sql.includes(label), "Missing rubric boundary: " + label);
  }

  assert.ok((sql.match(/"hard_fail":true/g) || []).length >= 5);
});

test("assessment evidence packs are enriched idempotently", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const id of [
    "real_estate_casefile",
    "clinic_workflow",
    "month_end",
    "payroll_calendar",
    "guest_queue",
  ]) {
    assert.ok(sql.includes("'" + id + "'"), "Missing evidence resource: " + id);
    assert.match(
      sql,
      new RegExp("where r->>'id' = '" + id + "'"),
      "Missing duplicate guard: " + id,
    );
  }
});

test("assessment instructions require concrete outputs rather than trivia", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "listing-fact QA record",
    "clinical escalation note",
    "reconciliation discrepancy sheet",
    "pre-payroll variance review",
    "turnover readiness board",
  ]) {
    assert.ok(sql.includes(phrase), "Missing assessment output: " + phrase);
  }
});

test("the pass preserves learner progress and submission history", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_assessment_submissions/i);
  assert.doesNotMatch(sql, /update public\.training_assessment_submissions/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
});
