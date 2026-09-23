import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923122000_write_sales_lead_generation_va_training.sql";

test("Sales and Lead Generation course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Sales & Lead Generation Virtual Assistant/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  const lessonIds = new Set(seed.match(/22000007-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Sales course protects prospect trust and CRM integrity", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Never continue automation after a clear opt-out/i);
  assert.match(seed, /Do not make outreach deceptive/i);
  assert.match(seed, /Do not move a deal stage just to make pipeline reports look healthier/i);
  assert.match(seed, /Do not overbook to hit a metric/i);
});

test("Sales final assessment tests real sales-support work", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Harborline Growth Partners/);
  assert.match(seed, /ethical sales-support judgment and work output rather than sales trivia/i);
  assert.match(seed, /apply suppression rules/i);
  assert.match(seed, /produce a short funnel report/i);
});
