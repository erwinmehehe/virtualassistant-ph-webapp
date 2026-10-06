import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexing = readFileSync("src/lib/google-indexing.ts", "utf8");
const actions = readFileSync("src/app/actions/jobs.ts", "utf8");
const jobDetail = readFileSync("src/app/jobs/[id]/page.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const backfill = readFileSync("scripts/google-indexing-backfill.mjs", "utf8");

test("Google Indexing API integration is restricted to individual job URLs", () => {
  assert.match(indexing, /\^\\\/jobs\\\/\[\^\/\]\+\\\/?\$/);
  assert.match(indexing, /different origin/);
  assert.match(indexing, /URL_UPDATED/);
  assert.match(indexing, /URL_DELETED/);
  assert.match(backfill, /JobPosting/);
  assert.doesNotMatch(backfill, /URL_UPDATED.*service|URL_UPDATED.*blog|URL_UPDATED.*industr/i);
});

test("published and closed job actions notify Google without blocking the product flow", () => {
  assert.match(actions, /notifyGoogleIndexingBestEffort/);
  assert.match(actions, /"URL_UPDATED"/);
  assert.match(actions, /"URL_DELETED"/);
});

test("retired job URLs return 404 before URL_DELETED notification", () => {
  assert.doesNotMatch(jobDetail, /permanentRedirect\("\/jobs\?closed=1"\)/);
  assert.match(jobDetail, /notFound\(\)/);
});

test("SEO maintenance commands are exposed", () => {
  assert.equal(packageJson.scripts["seo:crawl"], "node scripts/crawl-sitemap.mjs");
  assert.equal(packageJson.scripts["seo:index-jobs"], "node scripts/google-indexing-backfill.mjs");
});
