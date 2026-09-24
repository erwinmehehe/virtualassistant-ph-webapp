import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924123000_next_five_course_practical_depth.sql";

const expected = {
  "real-estate-virtual-assistant": 12,
  "medical-healthcare-virtual-assistant": 12,
  "bookkeeping-administration": 12,
  "payroll-administration": 12,
  "airbnb-short-term-rental-virtual-assistant": 12,
};

test("the next five courses each receive 12 practical specifications", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const [slug, count] of Object.entries(expected)) {
    const occurrences = sql.split("'" + slug + "'").length - 1;
    assert.ok(
      occurrences >= count + 1,
      slug + " should have at least " + count + " specs plus course update scope",
    );
  }
});

test("all five courses use one exercise, template, and checklist system", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
  assert.match(sql, /block->>'type' not in \('exercise','template','checklist'\)/);
  assert.match(sql, /e\.block->>'text' = 'Work product drill'/);

  for (const label of [
    "Real-estate admin QA",
    "Healthcare admin QA",
    "Bookkeeping admin QA",
    "Payroll admin QA",
    "Short-term rental operations QA",
  ]) {
    assert.ok(sql.includes(label), "Missing QA system: " + label);
  }
});

test("practical artifacts cover the major operating workflows", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const artifact of [
    "listing launch control board",
    "contract-to-close milestones",
    "referral chain-of-custody",
    "claim status",
    "payment batch",
    "reconciliation discrepancy",
    "timesheet exception queue",
    "pre-payroll variance review",
    "turnover readiness board",
    "multi-property shift handoff",
  ]) {
    assert.match(sql, new RegExp(artifact, "i"), "Missing practical artifact: " + artifact);
  }
});

test("regulated and high-trust boundaries stay explicit", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "licensed decisions stay with authorised staff",
    "Clinical judgment, diagnosis, treatment",
    "Accounting, tax, coding, payment-authorisation",
    "Tax, statutory, classification, final payroll",
    "Safety, access, refund, compensation, pricing",
  ]) {
    assert.ok(sql.includes(phrase), "Missing boundary control: " + phrase);
  }
});

test("the migration preserves learner progress and assessment state", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_assessment_submissions/i);
  assert.doesNotMatch(sql, /update public\.training_assessments/i);
});
