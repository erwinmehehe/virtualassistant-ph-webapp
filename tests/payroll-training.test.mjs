import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923133000_write_payroll_va_training.sql";

test("Payroll Administration VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Payroll Administration for Virtual Assistants/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);

  const lessonIds = new Set(seed.match(/22000014-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Payroll training protects privacy, approvals, and separation of duties", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Payroll data is highly sensitive/i);
  assert.match(seed, /Never verify a bank change by replying to the same suspicious message/i);
  assert.match(seed, /Approval separates preparation from authorization/i);
  assert.match(seed, /A changed payroll file needs renewed approval/i);
});

test("Payroll training keeps statutory and tax decisions outside the VA role", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Country rules are not interchangeable/i);
  assert.match(seed, /should not invent rates or give tax, legal, or payroll advice/i);
  assert.match(seed, /Do not promise an off-cycle payment/i);
});

test("Payroll training covers practical payroll controls and handoffs", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Pre-payroll checks catch expensive mistakes before release/i);
  assert.match(seed, /Exception cleared means explained, not ignored/i);
  assert.match(seed, /Post-payroll reporting creates a clean handoff/i);
  assert.match(seed, /A payroll calendar prevents deadline surprises/i);
});

test("Payroll final assessment tests work output instead of trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Harbor & Field Services/);
  assert.match(seed, /missing approvals and sensitive data safely/i);
  assert.match(seed, /finance\/payroll-specialist handoff/i);
  assert.match(seed, /do not authorize payments outside the approved role/i);
});
