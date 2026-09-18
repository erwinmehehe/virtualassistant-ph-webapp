import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path} marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.indexOf("];", start);
  return JSON.parse(text.slice(start, end + 1));
}

test("industry detail pages separate the SERP title from the reviewed H1", () => {
  const page = source("src/app/industries/[slug]/page.tsx");
  const content = source("src/lib/industry-seo-content.ts");
  assert.match(page, /const title = industrySeoTitle\(industry\)/);
  assert.match(page, /const titleParts = \[page\.h1, "", ""\]/);
  assert.doesNotMatch(page, /seoTitle\.replace\(\/\^Virtual Assistant Services for/);
  assert.match(content, /export function industrySeoTitle\(industry: IndustryPage\) \{\s*return industry\.metaTitle;\s*\}/);
});

test("every industry page has reviewed SEO enhancement coverage", () => {
  const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
  const content = source("src/lib/industry-seo-content.ts");
  const enhancementSlugs = new Set([...content.matchAll(/^\s{2}"([^"]+)":\s*\{/gm)].map((match) => match[1]));
  assert.equal(enhancementSlugs.size, industries.length, "every industry must have a dedicated enhancement entry");
  for (const industry of industries) {
    assert.ok(enhancementSlugs.has(industry.slug), `${industry.slug} must have dedicated industry SEO content`);
  }
});

test("live industry titles and descriptions stay within SERP-friendly limits", () => {
  const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
  const content = source("src/lib/industry-seo-content.ts");
  assert.match(content, /export function industryMetaDescription\(industry: IndustryPage\) \{\s*return industry\.metaDescription;\s*\}/);

  const descriptions = [];
  for (const industry of industries) {
    assert.ok(industry.metaTitle.length <= 60, `${industry.slug} live title is ${industry.metaTitle.length} characters`);
    assert.ok(industry.metaTitle.length >= 35, `${industry.slug} live title is too short`);
    assert.ok(industry.metaDescription.length >= 90, `${industry.slug} live description is too short`);
    assert.ok(industry.metaDescription.length <= 160, `${industry.slug} live description is ${industry.metaDescription.length} characters`);
    descriptions.push(industry.metaDescription);
  }
  assert.equal(new Set(descriptions).size, descriptions.length, "industry live descriptions must be unique");
});

test("industry workflows no longer use the old one-size-fits-all filler", () => {
  const page = source("src/app/industries/[slug]/page.tsx");
  const content = source("src/lib/industry-seo-content.ts");
  assert.match(page, /industryWorkflowDescription\(page, item\)/);
  assert.match(content, /derivedWorkflowDescription/);
  assert.doesNotMatch(content, /Give \$\{workflow\} a clear owner/);
  assert.doesNotMatch(content, /Use \$\{tool\} only where it is part of the real workflow/);
});

test("generated industry headings use audience grammar instead of lower-cased labels", () => {
  const page = source("src/app/industries/[slug]/page.tsx");
  assert.match(page, /Which Virtual Assistant roles fit \$\{page\.audience\}/);
  assert.match(page, /How to hire a Virtual Assistant for \$\{page\.audience\}/);
  assert.doesNotMatch(page, /Which Virtual Assistant role does your \$\{page\.label\.toLowerCase\(\)\} team need/);
  assert.doesNotMatch(page, /How to hire a Virtual Assistant for \$\{page\.label\.toLowerCase\(\)\}/);
});

test("industry hub uses the same live SEO helpers as detail pages", () => {
  const hub = source("src/app/industries/page.tsx");
  assert.match(hub, /title: "Virtual Assistant Services by Industry"/);
  assert.match(hub, /industrySeoTitle\(industry\)/);
  assert.match(hub, /industryMetaDescription\(industry\)/);
});
