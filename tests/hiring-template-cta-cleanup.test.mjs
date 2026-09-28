import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const TEMPLATE_PAGES = [
  "../src/app/service/[slug]/page.tsx",
  "../src/app/industries/[slug]/page.tsx",
  "../src/app/software/[slug]/page.tsx",
];

test("service, industry, and software detail templates do not embed hiring forms", async () => {
  for (const relativePath of TEMPLATE_PAGES) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(source, /HiringBriefForm/, relativePath);
  }
});

test("service and industry templates route hiring CTAs to the dedicated hire flow", async () => {
  for (const relativePath of TEMPLATE_PAGES.slice(0, 2)) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, /hireHref/, relativePath);
    assert.doesNotMatch(source, /#hiring-brief/, relativePath);
  }
});

test("HiringHero supports form-free template heroes", async () => {
  const source = await readFile(new URL("../src/components/hiring-hero.tsx", import.meta.url), "utf8");
  assert.match(source, /form\?: ReactNode/);
  assert.match(source, /hh-grid-solo/);
});
