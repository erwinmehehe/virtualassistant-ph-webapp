import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("navigation conversions stay in GA4 without first-party Vercel beacons", async () => {
  const [layout, client, candidate] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/components/analytics.tsx"),
    read("src/components/client-candidate-view-tracker.tsx"),
  ]);
  assert.match(layout, /<Analytics\/>/);
  assert.match(layout, /ga4-init/);
  assert.match(client, /forwardToGa4/);
  assert.match(client, /sendMany\(events\)/);
  assert.match(client, /if \(pathname === "\/pricing"\)/);
  assert.match(client, /if \(pathname === "\/hire"\)/);
  assert.match(client, /event\.startsWith\("training_"\)/);
  assert.match(candidate, /return null/);
  assert.doesNotMatch(client + candidate, /sendBeacon|fetch\(|IntersectionObserver/);
});

test("retired API acknowledges cached clients without Supabase operations", async () => {
  const route = await read("src/app/api/analytics/route.ts");
  assert.match(route, /status: 204/);
  assert.doesNotMatch(route, /analytics_events|enforceActionRateLimit|createClient|createAdminClient/);
});
