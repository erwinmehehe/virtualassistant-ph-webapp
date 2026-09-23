import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923053000_write_real_estate_va_training.sql";

test("Real Estate VA course is fully written but remains draft", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /where slug = 'real-estate-virtual-assistant'/);
  assert.match(sql, /set estimated_minutes = 360/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.match(sql, /is_published = false/);
  assert.match(sql, /reviewed_by = null/);
  assert.match(sql, /last_reviewed_at = null/);
});

test("Real Estate VA has twelve detailed thirty-minute lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const lessonUpdates = sql.match(/update public\.training_lessons l/g) || [];
  assert.equal(lessonUpdates.length, 12);
  const thirtyMinuteUpdates = sql.match(/estimated_minutes = 30/g) || [];
  assert.equal(thirtyMinuteUpdates.length, 12);

  for (const slug of [
    "how-real-estate-businesses-and-teams-work",
    "the-real-estate-client-and-transaction-journey",
    "lead-intake-qualification-support-and-crm-hygiene",
    "follow-up-workflows-and-database-management",
    "listing-coordination-and-asset-checklists",
    "property-information-documents-and-quality-checks",
    "inspections-viewings-and-appointment-coordination",
    "buyer-seller-tenant-and-vendor-updates",
    "contract-to-close-administration-boundaries",
    "maintenance-and-property-management-support",
    "real-estate-reporting-and-daily-handoffs",
    "composite-real-estate-va-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing Real Estate lesson: " + slug);
  }
});

test("Real Estate training includes practical scenarios and clear boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /"type":"scenario"/);
  assert.match(sql, /The boundary rule/);
  assert.match(sql, /do not provide legal advice/i);
  assert.match(sql, /unauthorized negotiation/i);
  assert.match(sql, /Maintenance requests need structure/);
  assert.match(sql, /CRM hygiene standards/);
  assert.match(sql, /Final practice: run a realistic real-estate admin day/);
});

test("Real Estate final assessment tests workflow judgment rather than trivia", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /prioritized work queue/i);
  assert.match(sql, /property-data discrepancy escalation/i);
  assert.match(sql, /maintenance ticket/i);
  assert.match(sql, /end-of-day handoff/i);
  assert.match(sql, /assessment_type = 'practical'/);
  assert.match(sql, /pass_score = null/);
  assert.match(sql, /is_published = false/);
});
