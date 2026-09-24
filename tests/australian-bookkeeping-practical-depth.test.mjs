import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924190000_deepen_australian_bookkeeping_practical_training.sql";

const lessonSlugs = [
  "australian-bookkeeping-workflow-gst-bas-and-role-boundaries",
  "source-documents-invoices-bills-receipts-and-data-quality",
  "accounts-payable-approvals-and-payment-preparation",
  "accounts-receivable-invoicing-credits-and-debtor-follow-up",
  "bank-reconciliation-preparation-and-exception-management",
  "payroll-stp-super-and-leave-administration-handoffs",
  "month-end-preparation-reports-and-accountant-handoff",
  "australian-bookkeeping-composite-admin-simulation",
];

test("all eight Australian bookkeeping lessons receive first-class practical work", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of lessonSlugs) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing practical spec: " + slug);
  }

  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
});

test("the course produces Australia-specific bookkeeping artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const artifact of [
    "Australian bookkeeping authority and handoff map",
    "Australian source-document and duplicate-risk register",
    "Australian AP approval and payment-control sheet",
    "Australian AR dispute and follow-up queue",
    "Australian bank-reconciliation exception worksheet",
    "Australian payroll, STP and Payday Super exception handoff",
    "Australian month-end and BAS reviewer pack",
    "Harbour Field Services Australian bookkeeping control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing artifact: " + artifact);
  }
});

test("worked examples target the highest-judgment bookkeeping risks", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "handle the books",
    "fix the workflow, not the supplier document",
    "emailed bank change is a control event",
    "payment-plan request is not routine reminder administration",
    "zero unreconciled is not the goal",
    "returned contribution stays an exception",
    "pack supports the decision; it does not replace it",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing worked example: " + phrase);
  }
});

test("practical work preserves regulated and finance authority boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "BAS, tax, accounting, payroll, payment and statutory judgment",
    "payment preparation and payment authorisation remain distinct",
    "does not alter the original supplier document",
    "credits, refunds, write-offs and payment plans require authorised decisions",
    "does not decide tax, award, leave, termination, STP or super statutory treatment",
    "does not change GST/accounting treatment to make reports look normal",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing boundary control: " + phrase);
  }
});

test("the connected practical layer preserves learner history and publication state", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /update public\.training_assessments/i);
  assert.doesNotMatch(sql, /review_requirement\s*=\s*'specialist'/i);
  assert.doesNotMatch(sql, /status\s*=\s*'draft'/i);
});
