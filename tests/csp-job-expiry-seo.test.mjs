import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production CSP removes eval and blocks inline script attributes", async () => {
  const config = await read("next.config.ts");

  assert.match(config, /allowUnsafeEval = process\.env\.NODE_ENV === "development"/);
  assert.match(config, /script-src 'self' 'unsafe-inline'\$\{allowUnsafeEval\}/);
  assert.match(config, /script-src-attr 'none'/);
  assert.doesNotMatch(
    config,
    /script-src 'self' 'unsafe-inline' 'unsafe-eval' https:\/\/challenges\.cloudflare\.com/,
  );
  assert.match(config, /https:\/\/www\.googletagmanager\.com/);
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
});

test("job publication lifecycle expires public listings after 30 days", async () => {
  const migration = await read("supabase/migrations/20260924234500_job_publication_expiry_lifecycle.sql");

  assert.match(migration, /add column if not exists expires_at timestamptz/);
  assert.match(migration, /interval '30 days'/);
  assert.match(migration, /jobs_set_publication_window/);
  assert.match(migration, /j\.expires_at > now\(\)/);
  assert.match(migration, /with \(security_invoker = true, security_barrier = true\)/);
  assert.match(migration, /grant select on table public\.public_jobs to anon, authenticated, service_role/);
});

test("public JobPosting schema exposes validThrough and stale pages stay noindex", async () => {
  const page = await read("src/app/jobs/[id]/page.tsx");

  assert.match(page, /validThrough: job\.expires_at \|\| undefined/);
  assert.match(page, /Applications close \{dateShort\(job\.expires_at\)\}/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /from\("public_jobs"\)/);
});

test("sitemap explicitly excludes expired jobs", async () => {
  const sitemap = await read("src/app/sitemap.ts");

  assert.match(sitemap, /select\("id,slug,published_at,expires_at"\)/);
  assert.match(sitemap, /\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/);
});

test("maintenance closes expired roles before reminders and submits closures to IndexNow", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");

  assert.match(maintenance, /async function runExpiredJobCleanup/);
  assert.match(maintenance, /\.lte\("expires_at", now\)/);
  assert.match(maintenance, /update\(\{ status: "closed", closed_at: now, updated_at: now \}\)/);

  const expiryIndex = maintenance.indexOf('runMaintenanceTask("expired job cleanup"');
  const reminderIndex = maintenance.indexOf('runMaintenanceTask("workflow reminders"');
  assert.ok(expiryIndex >= 0 && reminderIndex > expiryIndex);

  assert.match(maintenance, /\.in\("status", \["published", "closed"\]\)/);
  assert.match(maintenance, /\.gte\("updated_at", since\)/);
});

test("manual client closure invalidates public job surfaces", async () => {
  const actions = await read("src/app/actions/jobs.ts");
  const start = actions.indexOf("export async function closeJobAction");
  const end = actions.indexOf("export async function acceptCommercialTermsAction", start);
  const block = actions.slice(start, end);

  assert.match(block, /select\("id,title,slug"\)/);
  assert.match(block, /updated_at: now/);
  assert.match(block, /revalidatePath\("\/jobs"\)/);
  assert.match(block, /revalidatePath\(\`\/jobs\/\$\{job\.slug \|\| id\}\`\)/);
});
