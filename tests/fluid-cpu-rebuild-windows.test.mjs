import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * Each ISR rebuild is a full server render billed as Fluid Active CPU, and
 * crawlers trigger one on nearly every expiry. These windows bound that cost;
 * shortening them should be a deliberate, measured decision.
 */
const read = (file) => fs.readFileSync(file, "utf8");
const seconds = (file) => Number(read(file).match(/export const revalidate = (\d+);/)?.[1]);

test("high-visibility public pages rebuild at most hourly", () => {
  for (const file of ["src/app/page.tsx", "src/app/services/page.tsx", "src/app/training/page.tsx", "src/app/pricing/page.tsx"]) {
    assert.ok(seconds(file) >= 3600, `${file} rebuilds more often than hourly`);
  }
});

test("high-count template pages rebuild at most every six hours", () => {
  for (const file of ["src/app/industries/page.tsx", "src/app/industries/[slug]/page.tsx", "src/app/service/[slug]/page.tsx"]) {
    assert.ok(seconds(file) >= 21600, `${file} rebuilds more often than every 6 hours`);
  }
});

test("pricing keeps its instant admin refresh despite the longer window", () => {
  assert.match(read("src/app/actions/settings.ts"), /revalidatePath\("\/pricing"\)/);
});

test("crawlers skip server-rendered filter variants but can still render the site", () => {
  const robots = read("src/app/robots.ts");
  for (const path of ["/jobs?", "/find-talent?", "/hire?", "/book-client-call?"]) {
    assert.ok(robots.includes(`"${path}"`), path);
  }
  // A blanket query block would also hide Vercel's ?dpl= JS/CSS from Googlebot.
  assert.doesNotMatch(robots, /"\/\*\?"/);
});
