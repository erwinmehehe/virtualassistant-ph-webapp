import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Australian specialisation CTA uses path-specific progress plus the persisted selection", async () => {
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const config = await readFile("src/lib/training-specializations.ts", "utf8");

  assert.match(page, /SHARED_AUSTRALIA_COURSES/);
  assert.match(page, /startSignals/);
  assert.match(page, /signalCourses\.some/);
  assert.match(page, /pathSelected/);
  assert.match(page, /Continue path/);
  assert.match(page, /Start path/);
  assert.match(page, /Switch path/);

  assert.match(config, /australian-trades-administration/);
  assert.match(config, /property-management-administration-australia/);
  assert.match(config, /ndis-administration-fundamentals/);
  assert.match(config, /mortgage-broking-administration-australia/);
});

test("shared prerequisites do not make every Australian path active", async () => {
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const config = await readFile("src/lib/training-specializations.ts", "utf8");

  assert.match(config, /"virtual-assistant-foundations"/);
  assert.match(config, /"australian-va-fundamentals"/);
  assert.match(page, /const signalCourses = published\.filter/);
  assert.match(page, /learnerPreferences\?\.australiaSpecialization/);
  assert.doesNotMatch(page, /const pathStarted = published\.some/);
});

test("Australian specialisation copy is calmer and avoids availability counters", async () => {
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.match(page, /Choose one specialisation/);
  assert.match(page, /Shared foundations count across every path/);
  assert.match(page, /Not started/);
  assert.match(page, /In progress/);
  assert.doesNotMatch(page, /5\/5 available/);
  assert.doesNotMatch(page, /4\/4 available/);
  assert.doesNotMatch(page, />Available</);
});

test("Australian specialisation design uses quiet cards and active-only emphasis", async () => {
  const css = await readFile("src/app/workspace/training/training-home.css", "utf8");

  assert.match(css, /\.training-australia-heading h2/);
  assert.match(css, /font-size: 18px/);
  assert.match(css, /\.training-specialization\.is-progress/);
  assert.match(css, /\.training-specialization-start/);
  assert.match(css, /\.training-specialization-icon/);
  assert.match(css, /\.training-specialization-next/);
});
