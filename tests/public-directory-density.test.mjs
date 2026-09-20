import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("browse and utility hubs use the compact header instead of a full marketing hero", () => {
  const pages = [
    "src/app/find-talent/page.tsx",
    "src/app/services/page.tsx",
    "src/app/industries/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/tools/page.tsx",
  ];

  for (const path of pages) {
    const source = read(path);
    assert.match(source, /CompactPageHeader/, `${path}: compact header missing`);
    assert.doesNotMatch(source, /<MarketingHero/, `${path}: full marketing hero should not render on a browse or utility hub`);
  }
});

test("compact public header stays responsive and action-focused", () => {
  const component = read("src/components/compact-page-header.tsx");
  const css = read("src/app/public-foundation.css");

  assert.match(component, /compact-page-header/);
  assert.match(component, /compact-page-actions/);
  assert.match(css, /\.compact-page-header\s*\{/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 520px\)/);
});


test("jobs directory uses its dedicated marketplace hero and SEO content", () => {
  const page = read("src/app/jobs/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(page, /jobs-market-hero/);
  assert.match(page, /Post a VA job/);
  assert.match(page, /Finding remote virtual assistant jobs in the Philippines/);
  assert.match(page, /FAQPage/);
  assert.match(page, /jobs-bottom-cta/);
  assert.match(css, /\.jobs-market-hero/);
  assert.match(css, /\.jobs-seo-section/);
});
