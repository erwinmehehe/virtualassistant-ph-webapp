import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("industry detail pages use the services-for-industry search intent", () => {
  const page = source("src/app/industries/[slug]/page.tsx");
  assert.match(page, /industrySeoTitle\(industry\)/);
  assert.match(page, /Virtual Assistant Services for/);
  assert.doesNotMatch(page, /title: \{ absolute: industry\.metaTitle \}/);
  assert.doesNotMatch(page, /`philippines \$\{industry\.primaryKeyword\}`/);
});

test("industry workflows no longer repeat the old generic filler", () => {
  const page = source("src/app/industries/[slug]/page.tsx");
  assert.match(page, /industryWorkflowDescription\(page, item\)/);
  assert.doesNotMatch(page, /Document the inputs, expected output, turnaround, and escalation rule for this workflow before handing it over\./);
});

test("priority industry pages have reviewed operational copy", () => {
  const content = source("src/lib/industry-seo-content.ts");
  for (const slug of [
    "law-firms",
    "real-estate-agents",
    "medical-practices",
    "financial-advisors",
    "property-management-companies",
    "healthcare-dental",
    "home-local-services"
  ]) {
    assert.match(content, new RegExp(`"${slug}"`), `${slug} must have dedicated industry content`);
  }
  assert.match(content, /seoLabel: "Law Firms & Lawyers"/);
  assert.match(content, /Virtual Assistant Services for \$\{label\}/);
  assert.match(content, /first30Days/);
  assert.match(content, /metrics/);
  assert.match(content, /toolDetails/);
});

test("industry hub uses the same SEO positioning as detail pages", () => {
  const hub = source("src/app/industries/page.tsx");
  assert.match(hub, /title: "Virtual Assistant Services by Industry"/);
  assert.match(hub, /industrySeoTitle\(industry\)/);
  assert.match(hub, /industryMetaDescription\(industry\)/);
  assert.doesNotMatch(hub, /Hire Virtual Assistants by Industry Philippines/);
});
