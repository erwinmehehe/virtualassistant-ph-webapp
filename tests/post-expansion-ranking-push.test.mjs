import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("ranking push is limited to existing GSC-proven canonical owners", () => {
  const plan = JSON.parse(source("data/seo-ranking-push-2026-09-22.json"));
  assert.equal(plan.newUrlPolicy.action, "defer-unverified-gaps");
  assert.ok(plan.targets.length >= 7);
  const canonicals = plan.targets.map((target) => target.canonical);
  assert.equal(new Set(canonicals).size, canonicals.length);
  for (const target of plan.targets) {
    assert.equal(target.status, "strengthen-existing");
    assert.ok(target.impressions > 0, `${target.canonical}: missing impressions`);
    assert.ok(target.position >= 4 && target.position <= 20, `${target.canonical}: not a positions 4-20 opportunity`);
    assert.ok(target.actions.length >= 2, `${target.canonical}: missing actions`);
  }
});

test("priority link graph reinforces the near-page-one owners", () => {
  const links = source("src/lib/seo-priority-links.ts");
  const expected = [
    "/average-hourly-rate-virtual-assistants-philippines",
    "/blog/virtual-assistant-salary-philippines",
    "/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
    "/blog/get-paid-virtual-assistant-philippines",
    "/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
    "/blog/hourly-rates-for-filipino-virtual-project-manager",
    "/blog/how-to-pay-a-filipino-virtual-assistant-directly"
  ];
  for (const path of expected) assert.ok(links.includes(path), `${path}: missing from priority link graph`);
  assert.match(links, /"general-virtual-assistant": \[GENERAL_VS_EXECUTIVE, RATE_GUIDE, SALARY_GUIDE\]/);
  assert.match(links, /"executive-virtual-assistant": \[GENERAL_VS_EXECUTIVE, RATE_GUIDE, SALARY_GUIDE\]/);
  assert.match(links, /"project-coordination": \[PROJECT_MANAGER_RATES, RATE_GUIDE, PRICING_HUB\]/);
});

test("near-page-one archive guides now answer the query earlier", () => {
  const archive = source("src/lib/archive-posts.ts");
  assert.ok(archive.includes("General Virtual Assistant vs Executive Virtual Assistant at a glance"));
  assert.ok(archive.includes("How do Virtual Assistants in the Philippines get paid?"));
  assert.ok(archive.includes("a Virtual Project Manager rate in the Philippines should be budgeted from scope"));
  assert.ok(archive.includes("What is the best way to pay a Filipino Virtual Assistant?"));

  for (const slug of [
    "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
    "get-paid-virtual-assistant-philippines",
    "hourly-rates-for-filipino-virtual-project-manager",
    "how-to-pay-a-filipino-virtual-assistant-directly"
  ]) {
    const start = archive.indexOf(`"slug": "${slug}"`);
    assert.ok(start >= 0, `${slug}: missing`);
    const end = archive.indexOf("\n  },", start);
    const block = archive.slice(start, end);
    const expectedDate = "September 23, 2026";
    assert.ok(block.includes(`"updatedDate": "${expectedDate}"`), `${slug}: updated date not refreshed`);
  }
});

test("production audit checks the release-critical SEO signals", () => {
  const audit = source("scripts/audit-seo-production.mjs");
  const required = [
    "/sitemap.xml",
    "missing canonical",
    "robots meta contains noindex",
    "expected exactly one H1",
    "missing meta description",
    "missing viewport meta",
    "unexpected redirect",
    'path.startsWith("/service/")',
    'path.startsWith("/resources/")',
    'path.startsWith("/software/")'
  ];
  for (const marker of required) assert.ok(audit.includes(marker), `production audit missing: ${marker}`);

  const pkg = JSON.parse(source("package.json"));
  assert.equal(pkg.scripts["seo:production-audit"], "node scripts/audit-seo-production.mjs");
  assert.equal(pkg.scripts["seo:ranking-check"], "node --test tests/post-expansion-ranking-push.test.mjs");
});
