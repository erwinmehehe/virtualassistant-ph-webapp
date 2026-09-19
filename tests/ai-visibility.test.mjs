import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("assistant crawlers are allowed by name and private surfaces stay closed", () => {
  const robots = source("src/app/robots.ts");

  for (const bot of ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bingbot"]) {
    assert.match(robots, new RegExp(`"${bot}"`));
  }
  // Every named rule reuses one disallow list, so a private path cannot be
  // closed to Google and left open to an assistant.
  assert.match(robots, /const DISALLOW = \["\/workspace\/", "\/auth\/", "\/api\/"\]/);
  assert.match(robots, /AI_CRAWLERS\.map\(\(userAgent\) => \(\{ userAgent, allow: "\/", disallow: DISALLOW \}\)\)/);
});

test("IndexNow submits only changed URLs and stays off until it is configured", () => {
  const lib = source("src/lib/indexnow.ts");
  const keyRoute = source("src/app/indexnow-key.txt/route.ts");
  const cron = source("src/app/api/cron/maintenance/route.ts");

  assert.match(lib, /\/\^\[a-f0-9\]\{8,128\}\$\/i/);
  assert.match(lib, /indexnow_not_configured/);
  assert.match(lib, /url\.startsWith\(`\$\{base\}\/`\)/);
  assert.match(keyRoute, /if \(!key\) return new Response\("Not found", \{ status: 404 \}\)/);

  // Only pages that changed in the last day are sent.
  assert.match(cron, /const since = daysAgo\(1\)/);
  assert.match(cron, /\(post\.updatedAt \|\| post\.publishedAt\) >= since/);
  assert.match(cron, /\.gte\("published_at", since\)/);
  assert.match(cron, /runIndexNowSubmission\(admin\)/);
});
