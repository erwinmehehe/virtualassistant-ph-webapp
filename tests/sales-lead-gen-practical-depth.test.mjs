import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924121500_sales_lead_gen_practical_depth.sql";

test("Sales and Lead Generation gets one first-class practical set for all 12 lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  const ids = new Set(
    sql.match(/22000007-0000-4000-8000-0000000000\d{2}/g) || [],
  );
  assert.equal(ids.size, 12);

  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'type', 'template'/);
  assert.match(sql, /'type', 'checklist'/);
  assert.match(sql, /block->>'type' not in \('exercise','template','checklist'\)/);
  assert.match(sql, /block->>'text' = 'Work product drill'/);
});

test("Sales practical work covers the real operating artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const artifact of [
    "ICP and funnel-stage matrix",
    "Prospect data-quality audit",
    "Prospect research sheet",
    "CRM dedupe and enrichment plan",
    "Outreach personalisation brief",
    "Reply triage and sequence-control board",
    "Qualification and discovery handoff",
    "Appointment-setting and no-show record",
    "CRM stage and handoff correction log",
    "Sales funnel and data-quality report",
    "Sensitive sales reply and escalation log",
    "Harborline sales-support control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing Sales artifact: " + artifact);
  }
});

test("Sales practical work preserves prospect trust and delegated authority", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Suppression and opt-out history survives the merge",
    "Sending authority and approval state are explicit",
    "A clear opt-out immediately stops outreach",
    "The VA does not negotiate",
    "Pricing exceptions, technical claims, privacy concerns, and negotiations stay with authorised owners",
    "Suppression and do-not-contact records are protected",
  ]) {
    assert.ok(sql.includes(phrase), "Missing trust/authority control: " + phrase);
  }
});

test("Sales practical migration does not reset learner progress or assessments", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /c\.slug = 'sales-lead-generation-virtual-assistant'/);
  assert.match(sql, /l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_assessment_submissions/i);
  assert.doesNotMatch(sql, /update public\.training_assessments/i);
});
