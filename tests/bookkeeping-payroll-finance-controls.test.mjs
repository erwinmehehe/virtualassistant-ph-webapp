import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactPath =
  "supabase/migrations/20260924131000_finish_bookkeeping_payroll_artifacts.sql";
const evidencePath =
  "supabase/migrations/20260924131500_deepen_bookkeeping_payroll_evidence.sql";

test("Bookkeeping gets 12 lesson-specific reusable finance-control artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");
  for (const phrase of [
    "Bookkeeping authority and responsibility matrix",
    "Financial access and change-control log",
    "Source-document and duplicate-exception register",
    "Coding and accounting reviewer query sheet",
    "Accounts payable control queue",
    "Payment batch preflight and release-boundary sheet",
    "Accounts receivable status and exception tracker",
    "Debtor follow-up and dispute queue",
    "Bank reconciliation discrepancy sheet",
    "Month-end readiness control checklist",
    "Finance administration exception and reporting pack",
    "Cedar Lane bookkeeping control-desk portfolio",
  ]) assert.ok(sql.includes(phrase), "Missing Bookkeeping artifact: " + phrase);
});

test("Payroll gets 12 lesson-specific payroll-control artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");
  for (const phrase of [
    "Payroll authority and control matrix",
    "Payroll sensitive-data and bank-change control log",
    "Timesheet exception and cutoff queue",
    "Employee payroll change register",
    "Pay-input classification and exception sheet",
    "Statutory and tax query routing log",
    "Pre-payroll variance and go/no-go review",
    "Payroll late-change and reapproval control log",
    "Employee payroll query and correction case record",
    "Post-payroll reconciliation and finance handoff",
    "Payroll calendar and recurring control board",
    "Harbor & Field payroll control-desk portfolio",
  ]) assert.ok(sql.includes(phrase), "Missing Payroll artifact: " + phrase);
});

test("artifact pass replaces generic templates and checklists in-place", async () => {
  const sql = await readFile(artifactPath, "utf8");
  assert.match(sql, /when b\.block->>'type'='template'/);
  assert.match(sql, /when b\.block->>'type'='checklist'/);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
});

test("additional worked examples cover remaining finance judgment gaps", async () => {
  const sql = await readFile(artifactPath, "utf8");
  for (const phrase of [
    "duplicate risk needs more than one matching field",
    "historical coding is evidence, not permission",
    "a customer claim does not create a credit",
    "disputed debt follows a different path",
    "effective date controls which cycle is affected",
    "a familiar label can still need review",
    "explain the handoff, not the law",
    "finding an error does not authorise the payment fix",
  ]) assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);

  assert.match(sql, /b\.ord<ex\.exercise_ord/);
  assert.match(sql, /b\.ord>=ex\.exercise_ord/);
  assert.match(sql, /e->>'title'=t\.example_title/);
});

test("Bookkeeping capstone adds cross-file AR, coding, payment-control, and source evidence", async () => {
  const sql = await readFile(evidencePath, "utf8");
  for (const phrase of [
    "Cedar Lane AR and customer-status extract",
    "Cedar Lane coding-review sample",
    "Cedar Lane payment-preparation and approval matrix",
    "Cedar Lane source-document notes",
  ]) assert.ok(sql.includes(phrase), "Missing Bookkeeping evidence: " + phrase);
});

test("Payroll capstone adds timesheet, employee-change, pay-input, and post-payroll evidence", async () => {
  const sql = await readFile(evidencePath, "utf8");
  for (const phrase of [
    "Harbor & Field timesheet and cutoff detail",
    "Harbor & Field employee-change register",
    "Harbor & Field pay-input review sample",
    "Harbor & Field post-payroll reconciliation and employee-query file",
  ]) assert.ok(sql.includes(phrase), "Missing Payroll evidence: " + phrase);
});

test("assessment resources are idempotent and learner history is preserved", async () => {
  const sql = await readFile(evidencePath, "utf8");
  for (const id of [
    "ar_ledger","coding_queries","payment_controls","source_docs",
    "timesheet_detail","employee_changes","pay_components","post_payroll",
  ]) assert.ok(sql.includes("r->>'id'='"+id+"'"), "Missing duplicate guard: " + id);

  for (const path of [artifactPath, evidencePath]) {
    const body = await readFile(path, "utf8");
    assert.doesNotMatch(body, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(body, /insert into public\.training_courses/i);
  }
});
