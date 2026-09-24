import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924084500_refresh_australian_allied_health.sql";

test("allied health course stays the Australia-specific practice operations layer", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Australia-specific allied health practice-operations training/i);
  assert.match(sql, /Cliniko-specific.*belongs in the Cliniko for Virtual Assistants course/i);
  assert.match(sql, /Detailed NDIS provider administration belongs in the NDIS Administration Fundamentals course/i);
});

test("privacy lesson uses current 2026 OAIC data minimisation guidance", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /OAIC updated APP 3 guidance in May 2026/i);
  assert.match(sql, /data minimisation/i);
  assert.match(sql, /reasonably necessary/i);
  assert.match(sql, /Minimum necessary beats maximum convenient/i);
  assert.match(sql, /wrong patient/i);
});

test("intake workflow separates administrative completeness from clinical decisions", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Completeness is not clinical readiness/i);
  assert.match(sql, /Search for the patient before creating a new record/i);
  assert.match(sql, /Preserve patient wording/i);
  assert.match(sql, /pain much worse today/i);
});

test("referral lesson teaches current GPCCMP administration and transition rules", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /five individual allied health.*services per calendar year/i);
  assert.match(sql, /18 months from the first service date/i);
  assert.match(sql, /before 1 July 2025/i);
  assert.match(sql, /until 30 June 2027/i);
  assert.match(sql, /do not pre-fill a referral/i);
  assert.match(sql, /Referral administration is not referral interpretation/i);
});

test("scheduling and recall workflows route worsening symptoms instead of triaging independently", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Calendar availability does not determine clinical urgency/i);
  assert.match(sql, /worsening or alarming symptoms/i);
  assert.match(sql, /Recall timing comes from the practitioner or protocol/i);
  assert.match(sql, /symptoms have become much worse/i);
});

test("billing lesson separates private Medicare NDIS and complaint workflows", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Private:/);
  assert.match(sql, /Medicare:/);
  assert.match(sql, /NDIS self-managed:/);
  assert.match(sql, /NDIS plan-managed:/);
  assert.match(sql, /NDIS NDIA-managed:/);
  assert.match(sql, /Ahpra regulates individual registered practitioners/i);
  assert.match(sql, /Route funding and complaints; do not adjudicate them/i);
});

test("final assessment uses a realistic mixed practice queue and 80 percent pass score", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbour Allied Health morning queue/);
  assert.match(sql, /Practice appointment and referral rules/);
  assert.match(sql, /Funding workflow reference/);
  assert.match(sql, /Course and software boundary/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("allied health release remains editorial only", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("refresh preserves stable lesson slugs and avoids new public training routes", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "how-australian-allied-health-practices-operate",
    "australian-privacy-and-health-information-for-practice-admin",
    "patient-intake-forms-and-demographic-checks",
    "referrals-documents-and-practitioner-handoffs",
    "scheduling-appointment-types-reminders-and-no-shows",
    "recalls-waitlists-and-routine-patient-messages",
    "billing-administration-funding-pathways-and-outstanding-accounts",
    "australian-allied-health-composite-admin-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing stable lesson slug: " + slug);
  }

  assert.doesNotMatch(sql, /insert\s+into\s+public\.training_courses/i);
  assert.doesNotMatch(sql, /\/training\/courses\//);
});
