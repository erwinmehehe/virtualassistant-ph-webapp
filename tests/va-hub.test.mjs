import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the public VA hub connects learning, profile, jobs, and workspace", async () => {
  const page = await readFile("src/app/for-virtual-assistants/page.tsx", "utf8");
  assert.match(page, /getPublishedTrainingCourses/);
  assert.match(page, /href="\/training"/);
  assert.match(page, /href="\/auth\/join\/va"/);
  assert.match(page, /href="\/jobs"/);
  assert.match(page, /Open your VA workspace/);
  assert.match(page, /Start with a course that is actually live/);
});

test("public training cards only come from published database courses", async () => {
  const training = await readFile("src/lib/public-training.ts", "utf8");
  assert.match(training, /\.eq\("status", "published"\)/);
  assert.match(training, /\.eq\("is_published", true\)/);
  assert.match(training, /lesson_count/);
  assert.match(training, /recommended_order/);
});

test("site navigation has one VA hub entry instead of duplicated apply links", async () => {
  const nav = await readFile("src/components/site-nav.tsx", "utf8");
  assert.match(nav, /href="\/for-virtual-assistants">For VAs/);
  assert.match(nav, /href="\/for-virtual-assistants">VA hub/);
  assert.doesNotMatch(nav, /<Link href="\/auth\/join\/va">Apply as a VA<\/Link>/);
  assert.doesNotMatch(nav, /<Link href="\/for-virtual-assistants">For Virtual Assistants<\/Link>/);
  assert.match(nav, /Free VA training/);
});
