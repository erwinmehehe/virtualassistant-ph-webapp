import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923113000_write_customer_support_va_training.sql";

test("Customer Support VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Customer Support Virtual Assistants?/i);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = \'draft\'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);
  const lessonIds = new Set(seed.match(/22000010-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Customer Support course teaches real support operations", async () => {
  const seed = await readFile(seedPath, "utf8");
  for (const phrase of [
    "triage",
    "knowledge base",
    "Troubleshooting",
    "Refunds",
    "De-escalation",
    "SLA",
    "Quality Assurance",
    "CRM",
    "Northstar Home Co.",
  ]) assert.ok(seed.toLowerCase().includes(phrase.toLowerCase()), phrase + " missing");
});

test("Customer Support course protects policy, payment, and security boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Do not promise a refund, replacement, discount, deadline, or technical fix outside your authority/i);
  assert.match(seed, /Never promise first and seek approval later/i);
  assert.match(seed, /account compromise, fraud, or unauthorised access/i);
  assert.match(seed, /security and payment issues carefully/i);
});

test("Customer Support final assessment tests work output rather than trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /The assessment tests judgment and work output rather than support trivia/i);
  assert.match(seed, /Triage the queue, draft customer replies/i);
  assert.match(seed, /write CRM\/internal notes/i);
});


test("Customer Support course has a reviewed release migration", async () => {
  const release = await readFile("supabase/migrations/20260923135500_release_customer_support_va_training.sql", "utf8");
  assert.match(release, /is_published = true/);
  assert.match(release, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(release, /pass_score = 80/);
  assert.match(release, /status = 'published'/);
  assert.match(release, /slug = 'customer-support-virtual-assistant'/);
});
