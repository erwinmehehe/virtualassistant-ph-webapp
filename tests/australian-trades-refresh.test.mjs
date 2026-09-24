import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924083500_refresh_australian_trades_administration.sql";

test("trades course owns the complete lead-to-review operating flow", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const stage of [
    "Enquiry:",
    "Triage:",
    "Booking:",
    "Quote:",
    "Quote follow-up:",
    "Field work:",
    "Completion:",
    "Invoice:",
    "Payment:",
    "Review and handoff:",
  ]) {
    assert.ok(sql.includes(stage), "Missing workflow stage: " + stage);
  }

  assert.match(sql, /Every open item needs a next action/);
  assert.match(sql, /Every exception needs an owner/);
});

test("safety triage preserves customer wording and escalates instead of diagnosing", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /shock, burns and fire/i);
  assert.match(sql, /wet surroundings can increase risk/i);
  assert.match(sql, /preserve the customer's exact words/i);
  assert.match(sql, /Escalate risk, do not diagnose it/);
  assert.match(sql, /water is entering the ceiling beside a light fitting/i);
});

test("dispatch requires capability travel duration service area and access", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /service-area and travel rules/i);
  assert.match(sql, /realistic travel and handover buffers/i);
  assert.match(sql, /Capability before availability/);
  assert.match(sql, /An empty calendar slot is not capacity/);
});

test("quote workflow controls accepted terms revisions and variations", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /accepted quote can form a binding agreement/i);
  assert.match(sql, /version identifier|version history/i);
  assert.match(sql, /revision or variation path/i);
  assert.match(sql, /Do not negotiate by accident/);
  assert.match(sql, /deposit\/approval rule/i);
});

test("customer workflow keeps complaints and unresolved return work visible", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Australian Consumer Law/i);
  assert.match(sql, /due care and skill/i);
  assert.match(sql, /preserve the customer's wording/i);
  assert.match(sql, /Do not close the job or request a review while a return visit, complaint, safety concern or disputed scope remains open/i);
  assert.match(sql, /Admin can coordinate a remedy without deciding it/);
});

test("supplier workflow keeps blocked jobs alive until parts trigger return work", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /waiting-on-parts job needs an owner/i);
  assert.match(sql, /Never accept a technical substitute/i);
  assert.match(sql, /create the return-visit scheduling action/i);
});

test("closeout teaches current ATO record discipline and ACCC review integrity", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /ATO requires invoices and records/i);
  assert.match(sql, /online reviews should be genuine and independent/i);
  assert.match(sql, /Never write the review for the customer/i);
  assert.match(sql, /positive rating/i);
  assert.match(sql, /Review request is not review manipulation/);
});

test("capstone tests ServiceM8 to Xero cross-system operations without duplicating software courses", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbourline Electrical & Plumbing/);
  assert.match(sql, /ServiceM8 for jobs and Xero for accounting/i);
  assert.match(sql, /do not need to reproduce software-specific steps/i);
  assert.match(sql, /Cross-system handoff rule/);
  assert.match(sql, /Software-specific button execution belongs in the ServiceM8 and Xero\/MYOB courses/);
});

test("final assessment is practical editorial-only and retains 80 percent pass score", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbourline morning operations queue/);
  assert.match(sql, /Technician and operating constraints/);
  assert.match(sql, /Customer and commercial rules/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("trades course remains private and the Australia path still links ServiceM8 and Xero", async () => {
  const specializations = await readFile("src/lib/training-specializations.ts", "utf8");
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");

  assert.match(specializations, /australian-trades-administration/);
  assert.match(specializations, /servicem8-for-virtual-assistants/);
  assert.match(specializations, /xero-workflows-for-virtual-assistants/);
  assert.doesNotMatch(publicTraining, /\/training\/courses\/australian-trades-administration/);
});
