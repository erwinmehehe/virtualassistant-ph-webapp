import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924085500_refresh_australian_bookkeeping.sql";

test("bookkeeping course teaches current TPB BAS-service boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /entering data, coding transactions from instructions already provided, processing payments and preparing bank reconciliations are not BAS services/i);
  assert.match(sql, /working out or advising on BAS-related liabilities or obligations/i);
  assert.match(sql, /payroll work that interprets taxation law can be BAS services/i);
  assert.match(sql, /Software access is not professional authority/);
});

test("source-document lesson covers Australian tax-invoice and record evidence controls", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /GST records to support the income, expenses and GST amounts reported or claimed/i);
  assert.match(sql, /kept for five years/i);
  assert.match(sql, /tax invoices have specific information requirements/i);
  assert.match(sql, /invoice over \$1,000/i);
  assert.match(sql, /Fix the evidence, not the document/);
});

test("AP workflow independently verifies supplier bank changes", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /independent verification/i);
  assert.match(sql, /separate from the authoriser/i);
  assert.match(sql, /A changed bank account is a control event/);
  assert.match(sql, /\$14,800 payment/);
});

test("AR workflow separates disputes from routine collections and concessions", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /documented dispute/i);
  assert.match(sql, /credits, refunds, write-offs, payment plans/i);
  assert.match(sql, /Collections admin is not debt-policy authority/);
  assert.match(sql, /three instalments/i);
});

test("reconciliation lesson refuses to force uncertain transactions to zero", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /software suggestions as suggestions/i);
  assert.match(sql, /Do not create an expense, transfer or GST code simply to clear the feed/i);
  assert.match(sql, /Zero unreconciled is not the goal if the evidence is wrong/i);
  assert.match(sql, /\$2,450 bank payment/i);
});

test("payroll lesson reflects current Payday Super and Fair Work record rules", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Payday Super started on 1 July 2026/i);
  assert.match(sql, /12% of qualifying earnings/i);
  assert.match(sql, /within seven business days/i);
  assert.match(sql, /pay slips within one working day/i);
  assert.match(sql, /seven years/i);
  assert.match(sql, /returned super contribution/i);
});

test("month-end lesson prepares BAS evidence without making BAS decisions", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /G1 total sales, 1A GST on sales and 1B GST on purchases/i);
  assert.match(sql, /The pack supports the BAS decision; it does not replace it/i);
  assert.match(sql, /GST-sensitive questions/i);
  assert.match(sql, /Payday Super exceptions/i);
  assert.match(sql, /authorised reviewer/i);
});

test("final assessment uses an Australia-specific mixed finance queue", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbour Field Services finance queue/);
  assert.match(sql, /Australian bookkeeping authority matrix/);
  assert.match(sql, /2026 payroll controls/);
  assert.match(sql, /Course versus software boundary/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("course stays editorial-only and product-neutral", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
  assert.match(sql, /Xero Workflows and MYOB Workflows own product-specific/i);
});

test("refresh preserves stable lesson slugs and does not add a public course route", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "australian-bookkeeping-workflow-gst-bas-and-role-boundaries",
    "source-documents-invoices-bills-receipts-and-data-quality",
    "accounts-payable-approvals-and-payment-preparation",
    "accounts-receivable-invoicing-credits-and-debtor-follow-up",
    "bank-reconciliation-preparation-and-exception-management",
    "payroll-stp-super-and-leave-administration-handoffs",
    "month-end-preparation-reports-and-accountant-handoff",
    "australian-bookkeeping-composite-admin-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing stable lesson slug: " + slug);
  }

  assert.doesNotMatch(sql, /insert\s+into\s+public\.training_courses/i);
  assert.doesNotMatch(sql, /\/training\/courses\//);
});
