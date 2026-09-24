import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924164000_deepen_xero_myob_practical_training.sql";

test("Xero receives practical work across all seven published lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "xero-organisation-contacts-and-va-access-boundaries",
    "sales-invoices-credit-notes-and-customer-follow-up",
    "bills-receipts-and-accounts-payable-in-xero",
    "bank-feeds-matching-and-reconciliation-preparation",
    "gst-bas-and-australian-tax-awareness-in-xero",
    "payroll-stp-and-payroll-admin-handoffs-in-xero",
    "xero-reports-month-end-support-and-composite-simulation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing Xero practical spec: " + slug);
  }

  for (const artifact of [
    "Xero access and authority matrix",
    "Xero accounts-receivable exception queue",
    "Xero AP and supplier-document control sheet",
    "Xero/JAX reconciliation exception worksheet",
    "Xero GST/BAS exception register",
    "Xero payroll and STP exception handoff",
    "Brightline Services Xero month-end control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing Xero artifact: " + artifact);
  }
});

test("MYOB receives practical work across all six published lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "myob-business-file-contacts-and-access-boundaries",
    "sales-purchases-invoices-bills-and-source-documents",
    "banking-matching-and-reconciliation-preparation-in-myob",
    "gst-reports-bas-preparation-and-review-boundaries-in-myob",
    "myob-payroll-stp-super-and-employee-admin-handoff",
    "myob-reports-accountant-handoff-and-composite-simulation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing MYOB practical spec: " + slug);
  }

  for (const artifact of [
    "MYOB access and authority matrix",
    "MYOB sales and purchases control queue",
    "MYOB bank-feed and matching exception worksheet",
    "MYOB GST/BAS exception register",
    "MYOB payroll, STP, and Payday Super exception log",
    "Maple Works MYOB month-end control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing MYOB artifact: " + artifact);
  }
});

test("paired finance courses use exercise template and QA blocks", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
  assert.match(sql, /block->>'type' not in \('exercise','template','checklist'\)/);
});

test("worked examples target reconciliation GST payroll and month-end judgment", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "confidence is not evidence",
    "a recurring pattern can still be wrong",
    "a clean-looking report can still hide unresolved work",
    "automation can be plausible and still incomplete",
    "investigate the variance before touching codes",
    "software permission is not declarer or payment authority",
    "do not call the file clean while exceptions remain",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing worked example: " + phrase);
  }
});

test("Xero capstone is one connected Brightline Services month-end case", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Brightline Services Xero Final Work Simulation/);
  assert.match(sql, /one connected fictional Australian business/i);
  assert.match(sql, /Xero and JAX bank-feed exceptions/);
  assert.match(sql, /GST and payroll exception file/);
  assert.match(sql, /Month-end review notes/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
});

test("MYOB capstone is one connected Maple Works Australia month-end case", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Maple Works MYOB Final Work Simulation/);
  assert.match(sql, /MYOB banking exceptions/);
  assert.match(sql, /GST, payroll, STP, and super exceptions/);
  assert.match(sql, /Payday Super/);
  assert.match(sql, /STP declarer/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
});

test("the migration preserves learner history and current published lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /status = 'draft'/i);
});
