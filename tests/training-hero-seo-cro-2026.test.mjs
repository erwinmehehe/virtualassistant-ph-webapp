import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageFile = "src/app/training/page.tsx";
const cssFile = "src/app/training-landing.css";

test("training hero uses one exact H1 and aligned meta/social title", async () => {
  const page = await readFile(pageFile, "utf8");
  const headings = page.match(/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/g) || [];
  assert.deepEqual(headings, ["<h1>Virtual Assistant Training Philippines</h1>"]);
  assert.match(page, /const META_TITLE = "Virtual Assistant Training Philippines \| Free Certificates"/);
  assert.match(page, /title: \{ absolute: META_TITLE \}/);
  assert.match(page, /openGraph: \{[\s\S]*?title: META_TITLE/);
  assert.match(page, /twitter: \{[\s\S]*?title: META_TITLE/);
});

test("hero makes the free path and returning learner journey clear", async () => {
  const [page, css] = await Promise.all([readFile(pageFile, "utf8"), readFile(cssFile, "utf8")]);
  assert.match(page, /className="tr-hero-value"/);
  assert.match(page, /className="tr-hero-lede"/);
  assert.match(page, /Training is completely separate from hiring/);
  assert.match(page, /data-cta-position="hero"/);
  assert.match(page, /data-cta-position="hero_foundations"/);
  assert.match(page, /trainingJoinHref\("virtual-assistant-foundations"\)/);
  assert.match(page, /trainingCourseDestination\("virtual-assistant-foundations"\)/);
  assert.match(page, /const LOGIN_HREF/);
  assert.doesNotMatch(page, /<Sparkles/);
  assert.match(css, /\.tr-path-start-cta:focus-visible/);
});
