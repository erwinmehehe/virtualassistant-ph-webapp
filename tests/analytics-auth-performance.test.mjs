import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/analytics/route.ts", "utf8");
const product = readFileSync("src/lib/product-events.ts", "utf8");

test("retired analytics endpoint acknowledges cached clients without database or auth", () => {
  assert.match(route, /export async function POST\(\)/);
  assert.match(route, /status: 204/);
  for (const forbidden of ["createAdminClient", "getClaims", "enforceActionRateLimit", "analytics_events", "readRequestJson", "console.error"]) {
    assert.ok(!route.includes(forbidden), forbidden + " must not execute");
  }
});

test("optional product-event helper is inert but compatible with existing calls", () => {
  assert.match(product, /export async function recordProductEvent\(/);
  assert.doesNotMatch(product, /createAdminClient|from\("analytics_events"\)|getClaims\(/);
});
