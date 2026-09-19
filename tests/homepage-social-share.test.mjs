import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage metadata declares explicit OG and Twitter share images", async () => {
  const page = await read("src/app/page.tsx");

  assert.match(page, /canonicalUrl\("\/opengraph-image"\)/);
  assert.match(page, /width: 1200/);
  assert.match(page, /height: 630/);
  assert.match(page, /canonicalUrl\("\/twitter-image"\)/);
  assert.match(page, /card: "summary_large_image"/);
});

test("site share image is light branded and conversion focused", async () => {
  const image = await read("src/app/opengraph-image.tsx");
  const twitter = await read("src/app/twitter-image.tsx");

  assert.match(image, /Hire Vetted/);
  assert.match(image, /Filipino VAs/);
  assert.match(image, /Recruiter-screened/);
  assert.match(image, /Flexible remote hiring/);
  assert.match(image, /width: 1200, height: 630/);
  assert.doesNotMatch(image, /background: "#0b1b34"/);
  assert.match(twitter, /import OpengraphImage/);
});
