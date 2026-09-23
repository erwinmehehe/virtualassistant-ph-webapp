import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260923222500_update_xero_jax_reconciliation_training.sql";

test("published Xero bank-reconciliation lesson reflects current JAX workflow", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /JAX/);
  assert.match(sql, /automatically reconcili/i);
  assert.match(sql, /suggested a match/i);
  assert.match(sql, /supported plans and settings/i);
  assert.match(sql, /Automation is not authority/);
  assert.match(sql, /authorised finance reviewer/i);
  assert.match(sql, /source evidence/i);
});

test("Xero reconciliation training covers realistic exception handling", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "duplicates",
    "transfers",
    "split payments",
    "bank fees",
    "owner transactions",
    "private-use elements",
    "changed supplier details",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"));
  }

  assert.match(sql, /internal transfer/i);
  assert.match(sql, /customer deposit/i);
  assert.match(sql, /different amount from the bill on file/i);
});

test("Xero update keeps accounting and tax authority outside the VA role", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Do not approve a reconciliation solely because Xero or JAX completed or suggested it/i);
  assert.match(sql, /GST\/BAS-sensitive exceptions/);
  assert.match(sql, /bookkeeper, accountant, BAS agent, payroll owner/i);
  assert.match(sql, /Do not treat Xero automation or suggested coding as accounting, tax, BAS, payroll, or payment authority/i);
});

test("Xero final simulation remains published with the 80 percent gate", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /bank-feed and JAX reconciliation review/);
  assert.match(sql, /month-end reporting/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("Xero course stays published and receives fresh editorial review metadata", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /last_reviewed_at = now\(\)/);
  assert.match(sql, /where slug = 'xero-workflows-for-virtual-assistants'/);
  assert.match(sql, /and status = 'published'/);
  assert.doesNotMatch(sql, /status = 'draft'/);
});
