import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("2026 VA rate report publishes only the verified aggregate snapshot", () => {
  const data = source("src/lib/va-rate-report-2026.ts");

  assert.match(data, /totalProfiles: 137/);
  assert.match(data, /profilesWithRate: 93/);
  assert.match(data, /profilesWithTools: 66/);
  assert.match(data, /profilesWithSkills: 82/);
  assert.match(data, /median: 5/);
  assert.match(data, /p75: 7/);
  assert.match(data, /currentProfileMinimumRate: 6/);
  assert.doesNotMatch(data, /full_name|user_id|email|resume_path|linkedin_url|portfolio_url/);
});

test("rate report explains sample limitations and preferred-rate methodology", () => {
  const page = source("src/app/research/virtual-assistant-rates-philippines-2026/page.tsx");

  assert.match(page, /Virtual Assistant Rate & Skills Report Philippines 2026/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /DataDownload/);
  assert.match(page, /virtual-assistant-rates-philippines-2026\.csv/);
  assert.match(page, /not a statistically representative survey of all Filipino Virtual Assistants/);
  assert.match(page, /preferred profile rates are asking preferences/);
  assert.match(page, /current profile form requires at least USD/);
  assert.match(page, /specialty rows with fewer than five rate-reporting profiles are not published/);
});

test("rate report is discoverable without competing with the commercial rate guide", () => {
  const routes = source("src/lib/public-seo-routes.ts");
  const sitemap = source("src/app/sitemap.ts");
  const homepage = source("src/components/homepage-sections.tsx");
  const footer = source("src/components/site-footer.tsx");
  const authority = source("src/lib/seo-priority-links.ts");

  for (const text of [routes, homepage, footer, authority]) {
    assert.match(text, /\/research\/virtual-assistant-rates-philippines-2026/);
  }

  assert.match(routes, /lastModified: "2026-09-22"/);
  assert.match(sitemap, /route\.lastModified/);
  assert.match(sitemap, /archiveUpdatedIso\(post\)/);
  assert.match(authority, /"average-hourly-rate-virtual-assistants-philippines": \[RATE_REPORT\]/);
  assert.match(authority, /href: "\/average-hourly-rate-virtual-assistants-philippines"/);
});
