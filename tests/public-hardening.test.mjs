import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("default public metadata includes branded Open Graph and Twitter imagery", async () => {
  const [layout, og, twitter] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/app/opengraph-image.tsx"),
    read("src/app/twitter-image.tsx"),
  ]);

  assert.match(layout, /lang="en-US"/);
  assert.match(layout, /url: "\/opengraph-image"/);
  assert.match(layout, /images: \["\/twitter-image"\]/);
  assert.match(og, /1200/);
  assert.match(og, /630/);
  assert.match(twitter, /OpengraphImage/);
});

test("public Core Web Vitals are measured without losing CLS precision", async () => {
  const analytics = await read("src/components/analytics.tsx");
  assert.match(analytics, /useReportWebVitals\(reportWebVital\)/);
  assert.match(analytics, /surface: pathname\.startsWith\("\/workspace"\) \? "workspace" : "public"/);
  assert.match(analytics, /metric\.name === "CLS"/);
  assert.doesNotMatch(analytics, /function reportWorkspaceVital/);
});

test("public accessibility defaults include keyboard focus and reduced motion", async () => {
  const [styles, nav, cta, avatar] = await Promise.all([
    read("src/app/public-foundation.css"),
    read("src/components/site-nav.tsx"),
    read("src/components/floating-cta.tsx"),
    read("src/components/public-avatar.tsx"),
  ]);

  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /\.skip-link:focus-visible/);
  assert.match(nav, /aria-label="Navigation menu"/);
  assert.match(cta, /aria-label="Dismiss contact prompt"/);
  assert.match(avatar, /width=\{pixels\}/);
  assert.match(avatar, /height=\{pixels\}/);
  assert.match(avatar, /loading="lazy"/);
});

test("public styles no longer load the retired showcase or duplicate final-pass files", async () => {
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /public-foundation\.css/);
  assert.doesNotMatch(layout, /homepage-showcase\.css/);
  assert.doesNotMatch(layout, /floating-cta-final\.css/);
  assert.doesNotMatch(layout, /homepage-why-choose\.css/);
});

test("public lead intake is protected by a database-backed concurrent rate limit", async () => {
  const migration = await read("supabase/migrations/20260914092916_harden_public_lead_intake_rate_limit.sql");
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /created_at >= now\(\) - interval '10 minutes'/);
  assert.match(migration, /recent_count >= 8/);
  assert.match(migration, /client_discovery_booking/);
  assert.match(migration, /lead_intake_email_created_rate_idx/);
});
