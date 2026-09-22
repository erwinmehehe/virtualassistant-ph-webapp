import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path}: marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.indexOf("\n];", start);
  return JSON.parse(text.slice(start, end + 2));
}

test("all service pages use reviewed full-role meta descriptions", () => {
  const serviceSource = source("src/lib/service-pages.ts");
  const pages = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  assert.equal(pages.length, 74);
  assert.match(serviceSource, /return page\.metaDescription\.replace/);
  assert.doesNotMatch(serviceSource, /replace\([^\n]+Virtual Assistant[^\n]+" VA"/);

  for (const page of pages) {
    assert.ok(page.metaDescription.length >= 140 && page.metaDescription.length <= 160,
      `${page.slug}: meta description length ${page.metaDescription.length}`);
    assert.doesNotMatch(page.metaDescription, /\bVA\b/, `${page.slug}: avoid VA abbreviations in SERP copy`);
  }

  const seo = pages.find((page) => page.slug === "seo");
  assert.ok(seo, "SEO service page missing");
  assert.match(seo.metaDescription, /SEO Virtual Assistant/);
  assert.doesNotMatch(seo.metaDescription, /SEO VA/);
});

test("all industry pages keep a custom hero intro", () => {
  const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
  const enhancements = source("src/lib/industry-seo-content.ts");
  assert.equal(industries.length, 33);

  for (const industry of industries) {
    const key = `  "${industry.slug}": {`;
    const index = enhancements.indexOf(key);
    assert.ok(index >= 0, `${industry.slug}: SEO enhancement missing`);
    const next = enhancements.indexOf("\n  \"", index + key.length);
    const block = enhancements.slice(index, next >= 0 ? next : enhancements.indexOf("\n};", index));
    assert.match(block, /heroIntro:/, `${industry.slug}: custom hero intro missing`);
  }
});
