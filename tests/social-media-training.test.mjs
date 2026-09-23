import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923125500_write_social_media_va_training.sql";

test("Social Media VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Social Media Virtual Assistant/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);
  const lessonIds = new Set(seed.match(/22000009-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Social Media course protects approval, claims, privacy, and rights boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Approval must apply to the final version/i);
  assert.match(seed, /Do not announce pricing, policy, partnerships, product claims/i);
  assert.match(seed, /Do not ask customers to post private data publicly/i);
  assert.match(seed, /Receiving a file does not automatically grant the brand unlimited rights/i);
});

test("Social Media course includes responsible AI and platform-change awareness", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Social platforms regularly change publishing options/i);
  assert.match(seed, /Do not upload confidential client, customer, employee, or campaign data into unapproved AI tools/i);
  assert.match(seed, /AI output is a draft, not proof/i);
});

test("Social Media final assessment tests real operations rather than platform trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /North & Pine Home/);
  assert.match(seed, /social-media operations judgment and work output rather than platform trivia/i);
  assert.match(seed, /creator usage-rights questions/i);
  assert.match(seed, /reporting and handoff plan/i);
});


test("Social Media course has a reviewed release migration", async () => {
  const release = await readFile("supabase/migrations/20260923142000_release_social_media_va_training.sql", "utf8");
  assert.match(release, /is_published = true/);
  assert.match(release, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(release, /pass_score = 80/);
  assert.match(release, /status = 'published'/);
  assert.match(release, /slug = 'social-media-virtual-assistant'/);
});
