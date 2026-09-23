import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const page = source("src/app/training/page.tsx");
const catalogue = source("src/lib/training-catalogue.ts");

test("the public training page targets the search term and is indexable", () => {
  assert.match(page, /title: "Virtual Assistant Training Philippines \| Free VA Course"/);
  assert.match(page, /virtual assistant training philippines/);
  assert.match(page, /canonicalPath\("\/training"\)/);
  // It must be in the sitemap, or nobody finds the one public door.
  assert.match(source("src/lib/public-seo-routes.ts"), /path: "\/training"/);
});

test("the catalogue is derived from what we already sell, not invented", () => {
  assert.match(catalogue, /softwarePages\.map/);
  assert.match(catalogue, /href: `\/software\/\$\{page\.slug\}`/);
  assert.match(catalogue, /href: `\/industries\/\$\{industry\.slug\}`/);
});

test("only courses that exist are offered as available", () => {
  // Exactly one course is open today; the rest must say so.
  assert.match(catalogue, /status: "open"/);
  assert.equal((catalogue.match(/status: "open"/g) || []).length, 1);
  assert.match(page, /STATUS_LABEL\[course\.status\]/);
  assert.match(catalogue, /planned: "Planned"/);
});

test("the VA page never leads with the client CTA", () => {
  const footerCta = source("src/components/footer-cta.tsx");
  // /training is excluded from the hire-a-VA band, which addresses buyers.
  assert.ok(footerCta.includes("/training"), "footer CTA should skip /training");
});
