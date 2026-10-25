import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("first-party page views use one general entry per tab but retain every blog view", async () => {
  const client = await read("src/components/analytics.tsx");
  const start = client.indexOf("const FIRST_PARTY_PAGE_VIEW_SESSION_KEY");
  const end = client.indexOf("function sendMany(", start);
  assert.ok(start >= 0 && end > start, "Page view guard must be present before analytics sender");

  const js = ts.transpileModule(client.slice(start, end), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const load = new Function("window", js + "\nreturn shouldRecordFirstPartyPageView;");

  const stored = new Map();
  const browser = {
    sessionStorage: {
      getItem(key) { return stored.get(key) ?? null; },
      setItem(key, value) { stored.set(key, value); },
    },
  };
  const shouldRecord = load(browser);
  assert.equal(shouldRecord("/"), true, "Record a first-party landing view");
  assert.equal(shouldRecord("/services"), false, "Do not beacon on every SPA route transition");
  assert.equal(shouldRecord("/blog/first-guide"), true, "Keep blog-to-lead attribution");
  assert.equal(shouldRecord("/blog/another-guide"), true, "Keep each blog navigation");
  assert.equal(shouldRecord("/pricing"), false, "Pricing-view conversion is a separate event");

  const newTab = load({ sessionStorage: {
    getItem: () => null,
    setItem: () => {},
  } });
  assert.equal(newTab("/hire"), true, "A new tab still records its entry");

  const blockedStorage = load({
    get sessionStorage() { throw new Error("storage disabled"); },
  });
  assert.equal(blockedStorage("/blog/guide"), true, "Blog attribution survives disabled storage");
  assert.equal(blockedStorage("/services"), false, "Avoid nonessential writes when storage is unavailable");

  assert.match(client, /event !== "page_view" \|\| shouldRecordFirstPartyPageView\(window\.location\.pathname\)/);
  for (const event of ["pricing_view", "hire_page_view", "candidate_view", "booking_click"]) {
    assert.ok(client.includes('"' + event + '"'), event + " must remain tracked");
  }
  assert.match(client, /for \(const \{ event, metadata \} of events\) forwardToGa4\(event, metadata\);/);
});

test("sitemap uses session-free, hourly cached anonymous reads and retains public job URLs", async () => {
  const sitemap = await read("src/app/sitemap.ts");
  assert.match(sitemap, /import \{ createPublicClient \} from "@\/lib\/supabase\/public";/);
  assert.match(sitemap, /export const revalidate = 3600;/);
  assert.match(sitemap, /const supabase = createPublicClient\(\);/);
  assert.doesNotMatch(sitemap, /supabase\/server|cookies\(|headers\(|force-dynamic/);
  assert.match(sitemap, /if \(supabase\) \{/);
  assert.match(sitemap, /\.from\("public_jobs"\)/);
  assert.match(sitemap, /\.gt\("expires_at", jobCutoff\)/);
  assert.match(sitemap, /\.range\(from, from \+ JOB_PAGE_SIZE - 1\)/);
  assert.match(sitemap, /url: \`\$\{base\}\/jobs\/\$\{job\.slug \|\| job\.id\}\`/);
  assert.match(sitemap, /PUBLIC_SEO_ROUTES/);
  assert.match(sitemap, /BLOG_POSTS/);
});

test("per-user workspace badge caches refresh every minute without changing access scope", async () => {
  const badges = await read("src/lib/workspace-badges.ts");
  assert.equal((badges.match(/revalidate: 60/g) || []).length, 2);
  assert.doesNotMatch(badges, /revalidate: 15/);
  assert.match(badges, /getCachedRoleBadges\(role, userId\)/);
  assert.match(badges, /admin\.rpc\("workspace_badges", \{ p_role: role, p_user_id: userId \}\)/);
  assert.match(badges, /getWorkspaceBadgeResult = cache\(/);
  assert.match(badges, /\.eq\("client_id", userId\)/);
  assert.match(badges, /recruiter_id\.eq\.\$\{userId\}/);
});

test("admin analytics explicitly distinguishes first-party counts from GA4 total page views", async () => {
  const dashboard = await read("src/app/workspace/admin/analytics/page.tsx");
  assert.match(dashboard, /Tracked entry\/blog views/);
  assert.match(dashboard, /use GA4 for all page views/);
  assert.match(dashboard, /const blogSessions = new Set/);
  assert.match(dashboard, /const blogPageViews = blogViews\.filter/);
});


test("high-volume low-intent signals are GA4-only and no longer invoke Supabase", async () => {
  const client = await read("src/components/analytics.tsx");
  const route = await read("src/app/api/analytics/route.ts");

  assert.match(client, /const GA4_ONLY_EVENTS = new Set\(\["form_start", "login_submit"\]\)/);
  assert.match(client, /!GA4_ONLY_EVENTS\.has\(event\)/);
  assert.match(client, /for \(const \{ event, metadata \} of events\) forwardToGa4\(event, metadata\);/);
  assert.match(client, /send\("form_start"/);
  assert.match(client, /data\.track/);

  const allowed = route.split("const fixedEvents = new Set([")[1]?.split("]);")[0] ?? "";
  assert.ok(allowed.length > 0);
  assert.doesNotMatch(allowed, /"form_start"|"login_submit"/);
  assert.match(allowed, /"booking_click"/);
  assert.match(allowed, /"role_brief_submit"/);
  assert.match(route, /!allowedEvent\(parsed\.data\.event\)/);
  assert.ok(route.indexOf("!allowedEvent(parsed.data.event)") < route.indexOf('enforceActionRateLimit("public_analytics:ip"'), "Stale beacons must be rejected before RPC");
});
