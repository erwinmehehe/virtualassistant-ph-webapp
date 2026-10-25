import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("analytics no longer sends navigation or clickstream requests", async () => {
  const [layout, client, candidate] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/components/analytics.tsx"),
    read("src/components/client-candidate-view-tracker.tsx"),
  ]);
  assert.doesNotMatch(layout, /<Analytics\/>/);
  assert.match(client, /return null/);
  assert.match(candidate, /return null/);
  assert.doesNotMatch(client + candidate, /sendBeacon|fetch\(|IntersectionObserver|gtag\(/);
});

test("retired API returns 204 for cached old client requests with no Supabase work", async () => {
  const route = await read("src/app/api/analytics/route.ts");
  assert.match(route, /status: 204/);
  assert.doesNotMatch(route, /analytics_events|enforceActionRateLimit|createClient|createAdminClient/);
});
