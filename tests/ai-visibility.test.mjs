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
  assert.match(cron, /\.in\("status", \["published", "closed"\]\)/);
  assert.match(cron, /\.gte\("updated_at", since\)/);
  assert.match(cron, /runIndexNowSubmission\(admin\)/);
});

test("one Organization entity, referenced by every page that names us", () => {
  const org = source("src/lib/organization.ts");
  const home = source("src/app/page.tsx");

  assert.match(org, /linkedin\.com\/company\/virtualassistantphilippines/);
  assert.match(home, /sameAs: ORGANIZATION_SAME_AS/);
  assert.match(home, /"@id": organizationId\(base\)/);

  // No page may declare a second, unlinked Organization for us.
  for (const path of [
    "src/app/service/[slug]/page.tsx",
    "src/app/industries/[slug]/page.tsx",
    "src/app/software/[slug]/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/jobs/[id]/page.tsx"
  ]) {
    const page = source(path);
    assert.match(page, /organizationRef\(base\)/, `${path} should reference the canonical organization`);
    assert.doesNotMatch(page, /"@type": "Organization", name: "VirtualAssistant\.com\.ph"/, `${path} still declares its own organization`);
  }
});
