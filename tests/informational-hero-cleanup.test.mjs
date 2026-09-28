import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const INFORMATIONAL_PAGES = [
  "../src/app/about/page.tsx",
  "../src/app/faq/page.tsx",
  "../src/app/how-vetting-works/page.tsx",
  "../src/app/managed-vs-direct-hire/page.tsx",
  "../src/app/software/page.tsx",
  "../src/app/blog/topic/[slug]/page.tsx",
];

test("informational marketing pages do not embed lead forms in the hero", async () => {
  for (const relativePath of INFORMATIONAL_PAGES) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(source, /DiscoveryCallCard|HiringBriefForm/, relativePath);
  }
});

test("MarketingHero supports a clean form-free layout", async () => {
  const source = await readFile(new URL("../src/components/marketing-hero.tsx", import.meta.url), "utf8");
  assert.match(source, /form\?: ReactNode/);
  assert.match(source, /va-marketing-hero-solo/);
});
