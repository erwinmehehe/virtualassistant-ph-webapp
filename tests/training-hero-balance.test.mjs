import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";

test("training hero keeps proof in the eyebrow and uses a shorter value headline", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Free VA training · \{totalCourseCount\} courses available/);
  assert.match(page, /Build practical VA skills\./);
  assert.match(page, /Earn verified certificates\./);
  assert.match(page, /Learn → practise → prove it/);
  assert.doesNotMatch(page, /\{totalCourseCount\} free VA courses\./);
  assert.doesNotMatch(page, /Practical skills\. Verified certificates\./);
});

test("desktop hero proportions prevent the headline and flow card from overpowering each other", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /padding: 64px 0 56px/);
  assert.match(css, /grid-template-columns: minmax\(0, 1\.12fr\) minmax\(400px, \.88fr\)/);
  assert.match(css, /font-size: clamp\(2\.65rem, 4\.35vw, 4rem\)/);
  assert.match(css, /max-width: 510px/);
  assert.match(css, /justify-self: end/);
  assert.match(css, /@media \(max-width: 1280px\) and \(min-width: 1081px\)/);
});

test("phone hero remains intentionally smaller than the previous oversized treatment", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /font-size: clamp\(2\.15rem, 10\.8vw, 2\.85rem\)/);
  assert.match(css, /line-height: 1\.03/);
});
