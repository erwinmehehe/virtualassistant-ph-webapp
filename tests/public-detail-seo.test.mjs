import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const startMarker = text.indexOf(marker);
  assert.ok(startMarker >= 0, `${path} marker missing`);
  const start = text.indexOf("[", startMarker + marker.length);
  const end = text.indexOf("];", start);
  return JSON.parse(text.slice(start, end + 1));
}

test("service and industry metadata stays unique and within search-friendly limits", () => {
  const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");

  for (const [label, rows] of [["service", services], ["industry", industries]]) {
    const titles = new Set();
    const descriptions = new Set();
    for (const row of rows) {
      assert.ok(row.metaTitle.length <= 60, `${label} ${row.slug} title is ${row.metaTitle.length} characters`);
      assert.ok(row.metaDescription.length <= 160, `${label} ${row.slug} description is ${row.metaDescription.length} characters`);
      assert.ok(row.metaDescription.length >= 90, `${label} ${row.slug} description is too short`);
      assert.ok(!titles.has(row.metaTitle), `${label} ${row.slug} has duplicate meta title`);
      assert.ok(!descriptions.has(row.metaDescription), `${label} ${row.slug} has duplicate meta description`);
      titles.add(row.metaTitle);
      descriptions.add(row.metaDescription);
    }
  }
});

test("service pages preserve the long-form sections that support search intent", () => {
  const page = source("src/app/service/[slug]/page.tsx");
  for (const section of ["How the role works", "First 30 days", "Common hiring mistakes", "Managing the role", "Interview guide", "Frequently asked questions"]) {
    assert.ok(page.includes(section), `service template is missing ${section}`);
  }
  assert.match(page, /BreadcrumbList/);
  assert.match(page, /FAQPage/);
  assert.match(page, /canonicalPath/);
});

test("final visual layer keeps service and industry cards compact on mobile", () => {
  const css = source("src/app/site-redesign-final.css");
  assert.match(css, /service-avoid-section/);
  assert.match(css, /industry-conversion-hero-grid/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /grid-template-columns:1fr!important/);
});
