import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923114500_write_operations_va_training.sql";

test("Operations VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Operations Virtual Assistant/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);

  const lessonIds = new Set(seed.match(/22000012-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Operations course teaches process ownership and controls", async () => {
  const seed = await readFile(seedPath, "utf8");
  for (const phrase of [
    "Trigger",
    "Input",
    "Output",
    "Owner",
    "SOP",
    "Recurring task",
    "Reconciliation",
    "KPI",
    "bottleneck",
    "automation",
    "incident",
    "Summit Service Group",
  ]) {
    assert.ok(seed.toLowerCase().includes(phrase.toLowerCase()), phrase + " missing");
  }
});

test("Operations course preserves approval and change-control boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Do not negotiate authority you do not have/i);
  assert.match(seed, /Do not automate a broken process first/i);
  assert.match(seed, /Automation should fail visibly/i);
  assert.match(seed, /should not take technical, legal, security, financial, or public-communications authority/i);
});

test("Operations final assessment tests real operating work", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /The assessment tests operational judgment and work output rather than process trivia/i);
  assert.match(seed, /decision-ready manager summary/i);
  assert.match(seed, /end-of-shift handoff/i);
  assert.match(seed, /process dependencies/i);
});
