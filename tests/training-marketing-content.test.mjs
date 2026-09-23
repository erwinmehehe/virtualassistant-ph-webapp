import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923101500_write_marketing_va_training.sql";

test("Marketing VA course is fully written but remains draft", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /where slug = 'marketing-virtual-assistant'/);
  assert.match(sql, /set estimated_minutes = 360/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.match(sql, /is_published = false/);
  assert.match(sql, /reviewed_by = null/);
  assert.match(sql, /last_reviewed_at = null/);
});

test("Marketing VA has twelve detailed thirty-minute lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.equal((sql.match(/update public\.training_lessons l/g) || []).length, 12);
  assert.equal((sql.match(/estimated_minutes = 30/g) || []).length, 12);

  for (const slug of [
    "how-marketing-work-moves-from-brief-to-campaign",
    "brand-claims-approvals-and-source-of-truth",
    "content-calendars-briefs-and-production-tracking",
    "asset-coordination-and-quality-assurance",
    "email-campaign-administration",
    "crm-segments-tags-and-campaign-data-hygiene",
    "campaign-launch-checklists-and-cross-channel-coordination",
    "community-lead-and-response-routing",
    "marketing-reporting-and-basic-performance-interpretation",
    "responsible-ai-in-marketing-operations",
    "agency-and-in-house-handoffs",
    "composite-marketing-va-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing Marketing VA lesson: " + slug);
  }
});

test("Marketing VA content uses supported blocks and operational controls", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /"type":"scenario"/);
  assert.match(sql, /"type":"callout"/);
  assert.match(sql, /"type":"steps"/);
  assert.match(sql, /"type":"list"/);
  assert.match(sql, /"type":"paragraph"/);
  assert.doesNotMatch(sql, /"type":"text"/);
  assert.match(sql, /Do not manufacture the brief/i);
  assert.match(sql, /If the source is unclear, the claim is not ready/i);
  assert.match(sql, /Do not upload random contacts/i);
  assert.match(sql, /Correlation is not automatically causation/i);
  assert.match(sql, /AI is useful for acceleration, not authority/i);
  assert.match(sql, /Final practice: coordinate a marketing campaign/i);
});

test("Marketing VA final assessment tests real campaign work", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /prioritized launch-risk list/i);
  assert.match(sql, /founder campaign-status update/i);
  assert.match(sql, /corrected CRM segment definition/i);
  assert.match(sql, /customer-complaint routing note/i);
  assert.match(sql, /post-launch performance report/i);
  assert.match(sql, /unsupported claims/i);
  assert.match(sql, /assessment_type = 'practical'/);
  assert.match(sql, /pass_score = null/);
  assert.match(sql, /is_published = false/);
});
