import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const seedPath = "supabase/migrations/20260923062400_build_xero_va_training.sql";
const cleanupPath = "supabase/migrations/20260923222000_prepare_xero_training_for_specialist_review.sql";

test("Xero course remains draft and now requires specialist review", async () => {
  const sql = await readFile(cleanupPath, "utf8");

  assert.match(sql, /where slug = 'xero-workflows-for-virtual-assistants'/);
  assert.match(sql, /review_requirement = 'specialist'/);
  assert.match(sql, /specialist_reviewed_by = null/);
  assert.match(sql, /specialist_reviewer_role = null/);
  assert.match(sql, /specialist_review_notes = null/);
  assert.match(sql, /specialist_reviewed_at = null/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.doesNotMatch(sql, /status = 'published'/);
});

test("Xero freshness boilerplate is consolidated at course level", async () => {
  const seed = await readFile(seedPath, "utf8");
  const cleanup = await readFile(cleanupPath, "utf8");

  assert.equal((seed.match(/"title":"Keep this current"/g) || []).length, 7);
  assert.match(cleanup, /block->>'title' = 'Keep this current'/);
  assert.match(cleanup, /verify interface-specific steps against current official Xero Australia documentation/i);
  assert.match(cleanup, /does not provide tax, BAS, accounting, payroll, or financial advice/i);
});

test("Xero source course has seven substantive scenario-based lessons", async () => {
  const seed = await readFile(seedPath, "utf8");

  assert.equal((seed.match(/insert into public\.training_lessons/g) || []).length, 7);
  assert.equal((seed.match(/"type":"scenario"/g) || []).length, 7);
  assert.equal((seed.match(/insert into public\.training_assessments/g) || []).length, 1);
  assert.match(seed, /Xero Workflows Final Work Simulation/);
});

test("bank reconciliation lesson is updated for current JAX review workflow", async () => {
  const cleanup = await readFile(cleanupPath, "utf8");

  assert.match(cleanup, /JAX/);
  assert.match(cleanup, /automatically reconciled/i);
  assert.match(cleanup, /suggested a match/i);
  assert.match(cleanup, /Automation is not authority/);
  assert.match(cleanup, /internal transfer/i);
  assert.match(cleanup, /source evidence/i);
  assert.match(cleanup, /authorised finance reviewer/i);
});

test("Xero assessment tests work output and keeps finance authority with specialists", async () => {
  const cleanup = await readFile(cleanupPath, "utf8");

  assert.match(cleanup, /access scope/);
  assert.match(cleanup, /approved sales invoicing/);
  assert.match(cleanup, /supplier bills/);
  assert.match(cleanup, /JAX reconciliation review/);
  assert.match(cleanup, /GST\/BAS-sensitive exceptions/);
  assert.match(cleanup, /payroll\/STP handoff/);
  assert.match(cleanup, /month-end reporting/);
  assert.match(cleanup, /pass_score = 80/);
  assert.match(cleanup, /is_published = false/);
});

test("Xero remains private-LMS only while specialist review is pending", async () => {
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");
  const dashboard = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const publishAction = await readFile("src/app/actions/training-admin.ts", "utf8");

  assert.doesNotMatch(publicTraining, /href=\{?\`?\/training\/courses/);
  assert.match(dashboard, /xero-workflows-for-virtual-assistants/);
  assert.match(publishAction, /review_requirement === "specialist"/);
  assert.match(publishAction, /Complete the required specialist review before publishing this course/);
});
