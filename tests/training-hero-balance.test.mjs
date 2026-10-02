import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";

test("training hero keeps proof in the eyebrow and uses a shorter value headline", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /FREE TRAINING FOR FILIPINO VAs/);
  assert.match(page, /Build skills\. Get hired\./);
  assert.match(page, /Grow your future\./);
  assert.match(page, /Hi! I’m Kiro/);
  assert.match(page, /Start Learning Now/);
  assert.match(page, /Explore All Courses/);
  assert.doesNotMatch(page, /\{totalCourseCount\} free VA courses\./);
});

test("desktop hero proportions prevent the headline and flow card from overpowering each other", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.tr-reference-hero \{/);
  assert.match(css, /grid-template-columns: minmax\(0, \.92fr\) minmax\(430px, 1\.08fr\)/);
  assert.match(css, /font-size: clamp\(3rem, 5\.1vw, 4\.7rem\)/);
  assert.match(css, /\.tr-reference-kiro \{/);
  assert.match(css, /\.tr-reference-speech \{/);
  assert.match(css, /@media \(max-width: 1080px\)/);
});

test("phone hero remains intentionally smaller than the previous oversized treatment", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /font-size: clamp\(2\.35rem,12vw,3\.15rem\)/);
  assert.match(css, /line-height: 1/);
});
