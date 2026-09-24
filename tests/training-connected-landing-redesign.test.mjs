import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";
const siteNavPath = "src/components/site-nav.tsx";
const trainingHeaderPath = "src/components/training-site-header.tsx";

test("training is a shared site-nav mode instead of a separate microsite header", async () => {
  const [header, nav] = await Promise.all([
    readFile(trainingHeaderPath, "utf8"),
    readFile(siteNavPath, "utf8"),
  ]);

  assert.match(header, /<SiteNav/);
  assert.match(header, /mode="training"/);
  assert.match(nav, /mode\?: "default" \| "training"/);
  assert.match(nav, /training-connected-nav/);
  assert.match(nav, /training-nav-context/);
  assert.match(nav, /href="\/for-virtual-assistants"/);
  assert.match(nav, /href="\/jobs"/);
  assert.match(nav, /href="\/blog"/);
});

test("training landing has a sticky local navigation tied to real sections", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /className="tr-page-nav"/);
  assert.match(page, /href="#course-library"/);
  assert.match(page, /href="#how-training-works"/);
  assert.match(page, /href="#certificate"/);
  assert.match(page, /href="#faq"/);
  assert.match(page, /id="how-training-works"/);
  assert.match(page, /id="certificate"/);

  assert.match(css, /\.tr-page-nav \{[\s\S]*position: sticky/);
  assert.match(css, /top: 74px/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.tr-page-nav[\s\S]*top: 66px/);
});

test("hero uses a product-like learning path preview instead of the old dark process box", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /tr-path-preview/);
  assert.match(page, /Recommended learning path/);
  assert.match(page, /Virtual Assistant Foundations/);
  assert.match(page, /heroCourses\.map/);
  assert.match(page, /Pass the final check and receive a verified certificate/);
  assert.doesNotMatch(page, /tr-flow-card/);

  assert.match(css, /\.tr-path-preview \{/);
  assert.match(css, /\.tr-path-chips \{/);
  assert.match(css, /\.tr-path-outcome \{/);
  assert.doesNotMatch(css, /\.tr-flow-card \{/);
});

test("course cards use summaries and aligned visual hierarchy", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /tr-course-summary/);
  assert.match(css, /\.tr-course-card \{[\s\S]*display: flex/);
  assert.match(css, /min-height: 230px/);
  assert.match(css, /\.tr-course-card::before/);
  assert.match(css, /-webkit-line-clamp: 2/);
  assert.match(css, /\.tr-course-card:hover/);
});
