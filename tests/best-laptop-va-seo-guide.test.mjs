import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = () => readFile("src/lib/seo-resource-pages.ts", "utf8");
const editorial = () => readFile("src/lib/editorial-seo-guides.ts", "utf8");
const dates = () => readFile("src/lib/seo-resource-dates.ts", "utf8");

test("best laptop guide targets the Philippines purchase-intent cluster", async () => {
  const text = await source();
  const start = text.indexOf('slug: "best-laptop-for-virtual-assistant"');
  const end = text.indexOf('slug: "freelance-platforms-for-virtual-assistants"', start);
  const article = text.slice(start, end);

  assert.match(article, /Best Laptop for Virtual Assistant Work in the Philippines \(2026\)/);
  assert.match(article, /best laptop for virtual assistant philippines/);
  assert.match(article, /virtual assistant laptop requirements/);
  assert.match(article, /windows vs mac for virtual assistant/);
  assert.match(article, /16 GB RAM/);
  assert.match(article, /512 GB SSD/);
});

test("best laptop guide answers major SERP sub-intents with comparison tables", async () => {
  const text = await source();
  const start = text.indexOf('slug: "best-laptop-for-virtual-assistant"');
  const end = text.indexOf('slug: "freelance-platforms-for-virtual-assistants"', start);
  const article = text.slice(start, end);

  for (const phrase of [
    "8 GB vs 16 GB RAM",
    "Windows vs Mac vs Chromebook",
    "Laptop requirements by Virtual Assistant niche",
    "Current laptop families worth comparing in the Philippines",
    "How much should a Filipino VA budget for a laptop?",
    "Buying used or refurbished",
    "Philippines-specific setup",
  ]) {
    assert.ok(article.includes(phrase), "Missing laptop-search intent: " + phrase);
  }

  assert.ok((article.match(/table:\s*\{/g) || []).length >= 5);
  assert.match(article, /Below ₱30,000/);
  assert.match(article, /₱30,000-₱45,000/);
  assert.match(article, /MacBook Air with Apple M-series/);
});

test("best laptop guide uses current official references and an explicit review note", async () => {
  const text = await source();
  const start = text.indexOf('slug: "best-laptop-for-virtual-assistant"');
  const end = text.indexOf('slug: "freelance-platforms-for-virtual-assistants"', start);
  const article = text.slice(start, end);

  assert.match(article, /Windows 11 system requirements/);
  assert.match(article, /Zoom: desktop app system requirements/);
  assert.match(article, /Google Meet: device and hardware requirements/);
  assert.match(article, /MacBook Air technical specifications/);
  assert.match(article, /Employer requirements override this general guide/);
});

test("editorial conversion preserves rich laptop tables sources and Oct 4 modified date", async () => {
  const [editorialText, datesText] = await Promise.all([editorial(), dates()]);

  assert.match(editorialText, /numbered: section\.numbered/);
  assert.match(editorialText, /table: section\.table/);
  assert.match(editorialText, /sources: page\.sources/);
  assert.match(editorialText, /best-laptop-for-virtual-assistant" \? "2026-10-04"/);
  assert.match(datesText, /"best-laptop-for-virtual-assistant": "2026-10-04"/);
});


test("best laptop guide uses canonical internal links", async () => {
  const text = await source();
  const start = text.indexOf('slug: "best-laptop-for-virtual-assistant"');
  const end = text.indexOf('slug: "freelance-platforms-for-virtual-assistants"', start);
  const article = text.slice(start, end);

  assert.match(article, /\/resources\/best-tools-for-virtual-assistants/);
  assert.doesNotMatch(article, /\/blog\/virtual-assistant-tools/);
  assert.match(article, /\/blog\/virtual-assistant-requirements-philippines/);
  assert.match(article, /\/blog\/how-to-become-a-virtual-assistant-philippines/);
  assert.match(article, /\/blog\/virtual-assistant-skills/);
});
