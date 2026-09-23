import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const seedPath = "supabase/migrations/20260923062600_build_ndis_admin_training.sql";
const refreshPath = "supabase/migrations/20260923230500_prepare_ndis_training_for_specialist_review.sql";

test("NDIS course remains specialist-gated and draft", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /review_requirement = 'specialist'/);
  assert.match(sql, /specialist_reviewed_by = null/);
  assert.match(sql, /specialist_reviewer_role = null/);
  assert.match(sql, /specialist_review_notes = null/);
  assert.match(sql, /specialist_reviewed_at = null/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.doesNotMatch(sql, /status = 'published'/);
});

test("NDIS source course keeps ten scenario-based lessons and one practical assessment", async () => {
  const seed = await readFile(seedPath, "utf8");

  assert.equal((seed.match(/insert into public\.training_lessons/g) || []).length, 10);
  assert.equal((seed.match(/"type":"scenario"/g) || []).length, 10);
  assert.equal((seed.match(/insert into public\.training_assessments/g) || []).length, 1);
  assert.match(seed, /NDIS Administration Final Work Simulation/);
});

test("2026 registration lesson distinguishes SIL, digital platforms, and paused support-coordination reform", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /0138 Assistance with supported independent living/);
  assert.match(sql, /0137 Providing a NDIS digital platform service/);
  assert.match(sql, /support coordination was identified separately but is currently paused/i);
  assert.match(sql, /submitted application is not the same as an approved registration decision/i);
  assert.match(sql, /Tracking is not compliance advice/);
});

test("service-agreement lesson keeps agreement and negotiation boundaries current", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /written agreements are mandatory for specialist disability accommodation/i);
  assert.match(sql, /proposed changes to existing service-agreement prices must be discussed with participants and agreed/i);
  assert.match(sql, /Coordinate, do not negotiate/);
  assert.match(sql, /Treating silence as agreement to a price change/);
});

test("NDIS pricing lesson uses the 2026 schedule and evidence-based exception workflow", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /pricing schedule effective 1 July 2026/i);
  assert.match(sql, /support item numbers, names, units/i);
  assert.match(sql, /national, remote, and very remote pricing information/i);
  assert.match(sql, /Do not make the claim fit/);
  assert.match(sql, /Using the 2025-26 price when a 2026-27 source applies/);
});

test("incident lesson teaches escalation timing without making the VA the reportability decision maker", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /within 24 hours/i);
  assert.match(sql, /within 5 business days/i);
  assert.match(sql, /Unauthorised restrictive practice/i);
  assert.match(sql, /Escalate first, classify second/);
  assert.match(sql, /Do not decide whether the matter is legally reportable/i);
  assert.match(sql, /participant's wording/i);
});

test("NDIS course is editorially ready for specialist review without learner release", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /is_published = true/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /review_requirement = 'specialist'/);
});

test("NDIS assessment tests real administrative judgment and explicit escalation", async () => {
  const sql = await readFile(refreshPath, "utf8");

  for (const phrase of [
    "participant privacy and authority",
    "service-agreement version control",
    "2026 price-change evidence",
    "claim and billing exceptions",
    "current SIL and digital-platform registration awareness",
    "incident escalation",
  ]) {
    assert.match(sql, new RegExp(phrase, "i"));
  }

  assert.match(sql, /Do not provide funding, legal, clinical, support-planning, pricing, registration, incident-reportability/i);
});

test("substantive NDIS edits invalidate stale specialist evidence and revision assignment", async () => {
  const sql = await readFile(refreshPath, "utf8");

  assert.match(sql, /review_revision = review\.review_revision \+ 1/);
  assert.match(sql, /assigned_revision = null/);
  assert.match(sql, /decision = 'in_progress'/);
  assert.match(sql, /event_type/);
  assert.match(sql, /'invalidated'/);
  assert.match(sql, /A fresh specialist review is required/);
});

test("NDIS training remains private-LMS only", async () => {
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");
  const dashboard = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.doesNotMatch(publicTraining, /\/training\/courses\/ndis-administration-fundamentals/);
  assert.match(dashboard, /ndis-administration-fundamentals/);
});
