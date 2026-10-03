import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public navigation prioritizes software and removes redundant explainer links", async () => {
  const nav = await read("src/components/site-nav.tsx");

  assert.match(nav, /<Link href="\/software">Software<\/Link>/);
  assert.doesNotMatch(nav, /<Link href="\/how-vetting-works">How it works<\/Link>/);
  assert.doesNotMatch(nav, /<Link href="\/pricing">Pricing<\/Link>/);

  // Keep the same information architecture in the mobile drawer.
  assert.ok((nav.match(/href="\/software"/g) || []).length >= 2);
});
