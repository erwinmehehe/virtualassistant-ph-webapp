import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924161500_deepen_cliniko_practical_training.sql";

test("all seven published Cliniko lessons receive software-specific practical artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "cliniko-practice-workflow-and-va-permissions",
    "patient-records-forms-and-administrative-data-quality",
    "appointments-appointment-types-and-practitioner-calendars",
    "confirmations-sms-and-email-reminders-and-follow-up-messages",
    "creating-and-sending-cliniko-invoices",
    "payments-outstanding-invoices-and-xero-handoff",
    "cliniko-admin-qa-and-composite-va-simulation",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing Cliniko lesson spec: " + slug);
  }

  for (const artifact of [
    "Cliniko access and authority matrix",
    "Cliniko patient identity-resolution log",
    "Cliniko appointment decision sheet",
    "Cliniko reminder and form exception log",
    "Cliniko invoice pre-send QA worksheet",
    "Cliniko payment and Xero handoff log",
    "Harbour Allied Health Cliniko control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing Cliniko artifact: " + artifact);
  }

  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
});

test("Cliniko judgment-heavy lessons include expert worked examples", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Identity conflict: do not merge from a near match",
    "Scheduling judgment: protect the service rule",
    "Invoice judgment: verify the output before changing data",
    "Payment judgment: evidence is not the same as allocation authority",
  ]) {
    assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);
  }

  assert.match(sql, /does not relabel the visit as a follow-up/i);
  assert.match(sql, /holds the send and escalates/i);
  assert.match(sql, /places the patient reminder on hold/i);
});

test("the final Cliniko simulation uses one connected allied-health practice", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbour Allied Health Cliniko Final Work Simulation/);
  assert.match(sql, /one connected fictional allied-health practice/i);
  assert.match(sql, /Patient and appointment queue/);
  assert.match(sql, /Reminder and form evidence/);
  assert.match(sql, /Invoice and payment evidence/);
  assert.match(sql, /Billing and Xero handoff rules/);
  assert.match(sql, /HAH-2048/);
  assert.match(sql, /Xero receipt 165 awaiting reconciliation/);
  assert.match(sql, /pass_score = 80/);
});

test("Cliniko capstone rubric tests evidence, judgment, boundaries, QA, and handoff", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Cliniko evidence accuracy",
    "Patient and scheduling judgment",
    "Invoice, payment, and Xero handoff",
    "Privacy, clinical, and authority boundaries",
    "QA and audit trail",
    "End-of-shift handoff",
    '"hard_fail":true',
  ]) {
    assert.ok(sql.includes(phrase), "Missing assessment criterion: " + phrase);
  }
});

test("Cliniko deepening preserves learner history and publication state", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /status = 'draft'/i);
});
