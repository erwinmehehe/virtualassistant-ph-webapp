import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923094000_write_executive_va_training.sql";

test("Executive VA course is fully written but remains draft", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /where slug = 'executive-virtual-assistant'/);
  assert.match(sql, /set estimated_minutes = 360/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.match(sql, /is_published = false/);
  assert.match(sql, /reviewed_by = null/);
  assert.match(sql, /last_reviewed_at = null/);
});

test("Executive VA has twelve detailed thirty-minute lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const lessonUpdates = sql.match(/update public\.training_lessons l/g) || [];
  assert.equal(lessonUpdates.length, 12);
  const thirtyMinuteUpdates = sql.match(/estimated_minutes = 30/g) || [];
  assert.equal(thirtyMinuteUpdates.length, 12);

  for (const slug of [
    "the-executive-assistant-operating-model",
    "confidentiality-judgment-and-authority",
    "executive-inbox-triage-and-drafting",
    "complex-calendar-management",
    "meeting-preparation-agendas-and-briefing-notes",
    "minutes-actions-and-stakeholder-follow-up",
    "travel-planning-and-itinerary-administration",
    "changes-disruptions-and-contingency-handoffs",
    "priority-management-and-decision-queues",
    "research-briefs-and-executive-summaries",
    "daily-operating-rhythm-and-end-of-day-handoffs",
    "composite-executive-va-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing Executive VA lesson: " + slug);
  }
});

test("Executive VA content uses supported blocks and practical judgment", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /"type":"scenario"/);
  assert.match(sql, /"type":"callout"/);
  assert.match(sql, /"type":"steps"/);
  assert.match(sql, /"type":"list"/);
  assert.match(sql, /"type":"paragraph"/);
  assert.doesNotMatch(sql, /"type":"text"/);
  assert.match(sql, /Do not confuse initiative with authority/i);
  assert.match(sql, /minimum-necessary rule/i);
  assert.match(sql, /Urgent is not the same as important/i);
  assert.match(sql, /AI can accelerate research, but it cannot be the evidence/i);
  assert.match(sql, /Final practice: run an executive-support day/i);
});

test("Executive VA final assessment tests real work instead of trivia", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /prioritized and classified work queue/i);
  assert.match(sql, /payment-verification escalation note/i);
  assert.match(sql, /investor briefing-note outline/i);
  assert.match(sql, /travel-contingency options/i);
  assert.match(sql, /decision-ready executive queue items/i);
  assert.match(sql, /end-of-day handoff/i);
  assert.match(sql, /assessment_type = 'practical'/);
  assert.match(sql, /pass_score = null/);
  assert.match(sql, /is_published = false/);
});
