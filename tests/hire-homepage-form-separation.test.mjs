import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("/hire does not duplicate the homepage hiring form", async () => {
  const source = await readFile(new URL("../src/app/hire/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /HiringBriefForm/);
  assert.doesNotMatch(source, /id="hire-form"/);
  assert.match(source, /Book a discovery call/);
  assert.match(source, /Browse vetted talent/);
});

test("homepage keeps the compact hiring form", async () => {
  const source = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<HiringBriefForm variant="general" sourcePath="\/" \/>/);
});
