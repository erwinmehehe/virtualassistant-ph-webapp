import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("SEO resources expose truthful per-page freshness dates", async () => {
  const dates = await import("../src/lib/seo-resource-dates.ts");

  assert.equal(
    dates.seoResourcePublishedAt("virtual-assistant-job-description"),
    "2026-09-22"
  );
  assert.equal(
    dates.seoResourceUpdatedAt("virtual-assistant-job-description"),
    "2026-09-23"
  );
  assert.equal(
    dates.seoResourceUpdatedAt("virtual-assistant-interview-questions"),
    "2026-09-22"
  );

  const sitemap = source("src/app/sitemap.ts");
  assert.match(sitemap, /lastModified: seoResourceUpdatedAt\(page\.slug\)/);
  assert.doesNotMatch(
    sitemap,
    /SEO_RESOURCE_PAGES[\s\S]*lastModified: "2026-09-22"/
  );

  const resourcePage = source("src/app/resources/[slug]/page.tsx");
  assert.match(
    resourcePage,
    /datePublished: seoResourcePublishedAt\(page\.slug\)/
  );
  assert.match(
    resourcePage,
    /dateModified: seoResourceUpdatedAt\(page\.slug\)/
  );
});
