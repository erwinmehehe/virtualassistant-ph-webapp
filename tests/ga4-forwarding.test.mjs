import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("sitewide Google Analytics and custom analytics are not loaded", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  const analytics = readFileSync("src/components/analytics.tsx", "utf8");
  const config = readFileSync("next.config.ts", "utf8");

  for (const value of ["ga4-init", "gtag/js", "NEXT_PUBLIC_GA_MEASUREMENT_ID", "<Analytics", "<AttributionTracker"]) {
    assert.ok(!layout.includes(value), "Unexpected sitewide tracking: " + value);
  }
  assert.match(analytics, /return null/);
  assert.doesNotMatch(analytics, /sendBeacon|fetch\(|gtag|dataLayer|useEffect/);
  assert.doesNotMatch(config, /www\.googletagmanager\.com|www\.google-analytics\.com/);
});
