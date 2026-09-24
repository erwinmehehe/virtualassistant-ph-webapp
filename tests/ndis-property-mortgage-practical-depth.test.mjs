import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924171500_deepen_ndis_property_mortgage_practical_training.sql";

const lessonSlugs = {
  "ndis-administration-fundamentals": [
    "ndis-ecosystem-participants-providers-and-va-boundaries",
    "2026-provider-registration-changes-and-sil-administration-awareness",
    "participant-intake-consent-privacy-and-record-setup",
    "service-agreements-and-administrative-change-tracking",
    "rosters-support-logs-case-notes-and-evidence-administration",
    "ndis-invoices-plan-management-types-and-payment-requests",
    "pricing-cancellations-travel-and-billing-exceptions",
    "complaints-incidents-safeguarding-and-escalation",
    "ndis-admin-qa-record-integrity-and-provider-handoffs",
    "ndis-administration-composite-work-simulation",
  ],
  "property-management-administration-australia": [
    "australian-property-management-operating-model-and-va-boundaries",
    "owner-tenant-property-and-privacy-data-administration",
    "leasing-enquiries-applications-and-anti-discrimination-boundaries",
    "rent-arrears-receipts-and-financial-administration",
    "maintenance-emergencies-contractors-and-owner-approvals",
    "inspections-access-notices-and-calendar-coordination",
    "renewals-vacates-bonds-and-handover-administration",
    "property-management-australia-composite-simulation",
  ],
  "mortgage-broking-administration-australia": [
    "australian-mortgage-broking-model-licensing-and-va-boundaries",
    "client-enquiry-identity-privacy-and-document-intake",
    "fact-find-data-entry-requirements-objectives-and-financial-position-support",
    "product-and-lender-research-support-without-recommendation",
    "application-packaging-submission-and-lender-conditions",
    "valuations-conditional-approval-documents-and-pre-settlement-tracking",
    "settlement-post-settlement-crm-and-referral-administration",
    "mortgage-broking-administration-australia-composite-simulation",
  ],
};

test("all 26 lessons receive first-class practical work", async () => {
  const sql = await readFile(migrationPath, "utf8");

  let count = 0;
  for (const slugs of Object.values(lessonSlugs)) {
    for (const slug of slugs) {
      assert.ok(sql.includes("'" + slug + "'"), "Missing practical spec: " + slug);
      count += 1;
    }
  }
  assert.equal(count, 26);
  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
});

test("NDIS work covers authority registration evidence claims pricing incidents and provider QA", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "NDIS provider authority and handoff map",
    "2026 registration evidence and status tracker",
    "participant authority and privacy queue",
    "service-agreement version and change-control log",
    "roster and delivered-support evidence queue",
    "invoice and payment-pathway exception tracker",
    "pricing and billing exception workpaper",
    "complaint and incident escalation log",
    "NDIS provider admin control board",
    "Evergreen Supports NDIS admin desk",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing NDIS artifact: " + phrase);
  }
  assert.match(sql, /submitted is not approved/i);
  assert.match(sql, /do not make the claim fit/i);
  assert.match(sql, /escalate first, classify second/i);
});

test("property work is jurisdiction-first and evidence-led", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "property jurisdiction and authority matrix",
    "rental-application fairness and privacy queue",
    "rent-ledger and arrears evidence tracker",
    "maintenance risk and contractor queue",
    "inspection and entry-notice control sheet",
    "renewal, vacate, and bond evidence register",
    "Harbourview mixed-jurisdiction property desk",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing property artifact: " + phrase);
  }
  assert.match(sql, /administrative completeness is not tenant selection/i);
  assert.match(sql, /a ledger is evidence, not legal authority/i);
  assert.match(sql, /a calendar event is not permission to enter/i);
  assert.match(sql, /evidence first, entitlement second/i);
});

test("mortgage work preserves source facts and broker-only credit judgments", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "mortgage-administration authority matrix",
    "secure mortgage document-intake checklist",
    "fact-find contradiction and evidence log",
    "dated lender research table",
    "application readiness and disclosure tracker",
    "valuation and conditional-approval control board",
    "settlement and post-settlement handoff",
    "Southern Cross Mortgage file desk",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"), "Missing mortgage artifact: " + phrase);
  }
  assert.match(sql, /data entry is not a serviceability edit/i);
  assert.match(sql, /recommendations belong to the broker/i);
  assert.match(sql, /conditional is conditional/i);
  assert.match(sql, /successful settlement needs authoritative confirmation/i);
});

test("all three finals use connected evidence packs and hard-fail boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Evergreen Supports NDIS Administration Final Work Simulation/);
  assert.match(sql, /Harbourview Property Management Australia Final Work Simulation/);
  assert.match(sql, /Southern Cross Mortgage Administration Final Work Simulation/);
  assert.equal((sql.match(/"hard_fail":true/g) || []).length, 3);
  assert.ok((sql.match(/pass_score = 80/g) || []).length >= 3);
  assert.ok((sql.match(/resource_pack =/g) || []).length >= 3);
});

test("the practical-depth migration does not restore specialist review gates", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.doesNotMatch(sql, /review_requirement\s*=\s*'specialist'/i);
  assert.doesNotMatch(sql, /status\s*=\s*'draft'/i);
  assert.doesNotMatch(sql, /published_at\s*=\s*null/i);
  assert.doesNotMatch(sql, /specialist_reviewed_by\s*=\s*null/i);
});

test("learner history and published lesson identities are preserved", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
});
