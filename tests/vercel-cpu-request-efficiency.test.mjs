import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("all optional tracking and GA4 are fully disabled", async () => {
  const [layout, client, route, product, candidate] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/components/analytics.tsx"),
    read("src/app/api/analytics/route.ts"),
    read("src/lib/product-events.ts"),
    read("src/components/client-candidate-view-tracker.tsx"),
  ]);
  assert.doesNotMatch(layout, /gtag|<Analytics|<AttributionTracker/);
  assert.match(client, /return null/);
  assert.match(candidate, /return null/);
  assert.match(route, /status: 204/);
  assert.doesNotMatch(route, /analytics_events|createAdminClient|enforceActionRateLimit/);
  assert.match(product, /export async function recordProductEvent/);
  assert.doesNotMatch(product, /analytics_events|createAdminClient/);
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

test("admin first-party dashboard and website visit funnel are retired, saved records kept", async () => {
  const [dashboard, sales, salesDashboard, training, trainingPage, nav] = await Promise.all([
    read("src/app/workspace/admin/analytics/page.tsx"),
    read("src/lib/sales-analytics.ts"),
    read("src/components/sales-analytics-dashboard.tsx"),
    read("src/lib/training.ts"),
    read("src/app/workspace/admin/training/page.tsx"),
    read("src/components/app-nav-links.tsx"),
  ]);
  assert.match(dashboard, /redirect\("\/workspace\/admin\/today"\)/);
  assert.doesNotMatch(nav, /"\/workspace\/admin\/analytics"/);
  assert.doesNotMatch(sales, /recruiter_conversion_summary/);
  assert.doesNotMatch(salesDashboard, /Website → client funnel/);
  assert.match(salesDashboard, /Verified conversion control/);
  assert.doesNotMatch(training, /\.from\("analytics_events"\)/);
  assert.doesNotMatch(trainingPage, /Learner completion funnel|Checkpoint failure/);
  assert.match(trainingPage, /Completion within 7 and 14 days/);
});
