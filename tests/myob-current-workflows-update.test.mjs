import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260923223500_update_myob_current_workflows.sql";

test("MYOB bank training reflects current AI-assisted matching workflow", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /AI-driven category suggestions/i);
  assert.match(sql, /automatically matched/i);
  assert.match(sql, /suggested a match/i);
  assert.match(sql, /approved bank rules/i);
  assert.match(sql, /Automation is not authority/);
  assert.match(sql, /matching and reconciliation are not the same thing/i);
});

test("MYOB bank training keeps realistic reconciliation exceptions visible", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "duplicates",
    "transfers",
    "refunds",
    "merchant settlements",
    "grouped payments",
    "payroll payments",
    "bank fees",
    "wrong entity",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"));
  }

  assert.match(sql, /customer invoice/i);
  assert.match(sql, /internal transfer/i);
  assert.match(sql, /combine several customer payments/i);
});

test("MYOB payroll lesson is current for Payday Super and STP authority", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Since 1 July 2026/i);
  assert.match(sql, /Payday Super/i);
  assert.match(sql, /reaching employees' super funds within the required timeframe/i);
  assert.match(sql, /STP declarer/i);
  assert.match(sql, /Creation is not authorisation/i);
  assert.match(sql, /Pay Super user/i);
  assert.match(sql, /administrators or authorisers/i);
});

test("MYOB payroll update does not turn software access into statutory authority", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Do not determine qualifying earnings/i);
  assert.match(sql, /super eligibility/i);
  assert.match(sql, /award interpretation/i);
  assert.match(sql, /Do not add yourself as a declarer/i);
  assert.match(sql, /Do not authorise a Pay Super payment unless/i);
  assert.match(sql, /rejected, returned, delayed, or unmatched super payments/i);
});

test("MYOB final simulation covers current workflows and keeps the 80 percent gate", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /bank-feed matching and AI-driven suggestions/i);
  assert.match(sql, /GST\/BAS-sensitive reports/i);
  assert.match(sql, /payroll\/STP handoff/i);
  assert.match(sql, /Payday Super timing and payment exceptions/i);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("MYOB course stays published with fresh editorial review metadata", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /last_reviewed_at = now\(\)/);
  assert.match(sql, /where slug = 'myob-workflows-for-virtual-assistants'/);
  assert.match(sql, /and status = 'published'/);
  assert.doesNotMatch(sql, /status = 'draft'/);
});
