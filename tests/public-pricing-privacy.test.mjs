import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public pricing does not expose the internal managed-service markup", () => {
  const pricing = read("src/app/pricing/page.tsx");

  assert.match(pricing, /Ongoing managed support/);
  assert.match(pricing, /Role-based quote/);
  assert.doesNotMatch(pricing, /managedMarkup/);
  assert.doesNotMatch(pricing, /Ongoing service margin/);
  assert.doesNotMatch(pricing, /Managed-service margin/);
});

test("public pricing keeps the one-time direct-hire fee at the canonical business setting", () => {
  const pricing = read("src/app/pricing/page.tsx");
  const settings = read("src/lib/business-settings.ts");

  assert.match(pricing, /money\(placementFee\)/);
  assert.match(pricing, /one-time \{money\(placementFee\)\} placement fee/);
  assert.match(pricing, /<VaCostCalculator placementFee=\{placementFee\}\/>/);
  assert.match(settings, /placementFee: 350/);
  assert.match(settings, /default_placement_fee \?\? fallback\.placementFee/);
});
