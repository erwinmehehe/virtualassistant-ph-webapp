import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923122500_write_bookkeeping_administration_va_training.sql";

test("Bookkeeping Administration course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Bookkeeping Administration for Virtual Assistants/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  const lessonIds = new Set(seed.match(/22000006-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Bookkeeping course protects payment controls and professional boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Do not cross into unsupported advice/i);
  assert.match(seed, /Never verify a bank change using the same message that requested it/i);
  assert.match(seed, /Preparing a payment is not the same as authorising it/i);
  assert.match(seed, /Do not force the reconciliation/i);
  assert.match(seed, /Reporting is not advice/i);
});

test("Bookkeeping final assessment tests administrative control, not trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Cedar Lane Services/);
  assert.match(seed, /administrative control and work output rather than bookkeeping trivia/i);
  assert.match(seed, /Do not provide tax, accounting, payroll, statutory, or other professional advice/i);
  assert.match(seed, /prepare reconciliation evidence/i);
});
