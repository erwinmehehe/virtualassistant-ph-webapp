import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const executivePath =
  "supabase/migrations/20260924130000_finish_executive_assessment_quality.sql";
const opsPmPath =
  "supabase/migrations/20260924110000_deepen_operations_project_training.sql";
const supportSeoPath =
  "supabase/migrations/20260924113000_deepen_support_seo_training.sql";
const opsPmExamplesPath =
  "supabase/migrations/20260924111500_add_ops_pm_worked_examples.sql";
const supportSeoExamplesPath =
  "supabase/migrations/20260924114500_add_support_seo_worked_examples.sql";

test("Executive receives four expert worked examples before learner exercises", async () => {
  const sql = await readFile(executivePath, "utf8");
  assert.equal((sql.match(/Worked example:/g) || []).length, 4);
  assert.match(sql, /b\.ord < ex\.exercise_ord/);
  assert.match(sql, /b\.ord >= ex\.exercise_ord/);

  for (const lesson of [
    "confidentiality-judgment-and-authority",
    "complex-calendar-management",
    "meeting-preparation-agendas-and-briefing-notes",
    "changes-disruptions-and-contingency-handoffs",
  ]) {
    assert.ok(sql.includes("'" + lesson + "'"), "Missing Executive example: " + lesson);
  }
});

test("Executive final assessment has a course-specific 100-point rubric and evidence", async () => {
  const sql = await readFile(executivePath, "utf8");

  for (const output of [
    "prioritised and classified executive work queue",
    "repaired calendar plan",
    "bank-detail verification hold",
    "investor briefing note",
    "travel-disruption options note",
    "end-of-day handoff",
  ]) {
    assert.match(sql, new RegExp(output, "i"), "Missing Executive assessment output: " + output);
  }

  for (const weight of ['"weight":20','"weight":20','"weight":15','"weight":20','"weight":15','"weight":10']) {
    assert.ok(sql.includes(weight));
  }

  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /r->>'id' = 'travel_finance'/);
  assert.match(sql, /"id":"travel_finance"/);
});

test("Operations and Project Management stay locked to course-specific assessment quality", async () => {
  const sql = await readFile(opsPmPath, "utf8");

  for (const marker of [
    "Daily operations control board",
    "KPI variance brief",
    "One-page project charter",
    "RAID + decision register",
    "Formal onboarding-video change request",
    "hard_fail",
  ]) {
    assert.ok(sql.includes(marker), "Missing Ops/PM assessment marker: " + marker);
  }

  assert.ok((sql.match(/resource_pack =/g) || []).length >= 2);
  assert.ok((sql.match(/rubric =/g) || []).length >= 2);
});

test("Customer Support and SEO stay locked to course-specific assessment quality", async () => {
  const sql = await readFile(supportSeoPath, "utf8");

  for (const marker of [
    "Six-plus-ticket triage board",
    "QA scorecard and coaching note",
    "Intent/cannibalization map",
    "SEO implementation/change-validation log",
    "AI-assisted SEO verification log",
    "hard_fail",
  ]) {
    assert.ok(sql.includes(marker), "Missing Support/SEO assessment marker: " + marker);
  }

  assert.ok((sql.match(/resource_pack=/g) || []).length >= 2);
  assert.ok((sql.match(/rubric=/g) || []).length >= 2);
});

test("Operations, Project Management, Support, and SEO retain expert examples", async () => {
  const [opsPm, supportSeo] = await Promise.all([
    readFile(opsPmExamplesPath, "utf8"),
    readFile(supportSeoExamplesPath, "utf8"),
  ]);

  assert.equal((opsPm.match(/Worked example:/g) || []).length, 8);
  assert.equal((supportSeo.match(/Worked example:/g) || []).length, 8);
});

test("final-five quality pass preserves learner progress and submissions", async () => {
  const sql = await readFile(executivePath, "utf8");

  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_assessment_submissions/i);
  assert.doesNotMatch(sql, /status = 'draft'/i);
  assert.doesNotMatch(sql, /is_published = false/i);
});
