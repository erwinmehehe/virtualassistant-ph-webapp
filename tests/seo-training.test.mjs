import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923132000_write_seo_va_training.sql";

test("SEO Virtual Assistant course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /SEO Virtual Assistant/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);

  const lessonIds = new Set(seed.match(/22000011-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("SEO training teaches evidence-based research and technical triage", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Do not invent search volume/i);
  assert.match(seed, /SERP analysis tells you what search intent looks like in practice/i);
  assert.match(seed, /Technical SEO triage begins with the exact URL state/i);
  assert.match(seed, /Do not diagnose from a crawler label alone/i);
});

test("SEO training covers on-page, internal linking, GSC, and live QA", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Titles and headings should clarify the page/i);
  assert.match(seed, /Never recommend a link without checking the source page/i);
  assert.match(seed, /Search Console shows observed search performance/i);
  assert.match(seed, /Never mark work complete because a ticket was closed/i);
});

test("SEO training includes responsible AI boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /AI output is not audit evidence/i);
  assert.match(seed, /Inventing keyword volume, traffic, difficulty, rankings, backlinks, or conversion data/i);
  assert.match(seed, /Do not paste private analytics exports/i);
});

test("SEO final assessment tests practical work output instead of trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /BrightPath Accounting/);
  assert.match(seed, /Separate verified evidence from assumptions/i);
  assert.match(seed, /client-ready handoff/i);
  assert.match(seed, /define how each implemented change should be validated/i);
});


test("SEO course has a reviewed release migration", async () => {
  const release = await readFile("supabase/migrations/20260923134500_release_seo_va_training.sql", "utf8");
  assert.match(release, /is_published = true/);
  assert.match(release, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(release, /pass_score = 80/);
  assert.match(release, /status = 'published'/);
  assert.match(release, /slug = 'seo-virtual-assistant'/);
});
