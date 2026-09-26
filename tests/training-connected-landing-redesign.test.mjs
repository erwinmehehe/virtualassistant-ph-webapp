import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";
const siteNavPath = "src/components/site-nav.tsx";
const trainingHeaderPath = "src/components/training-site-header.tsx";

test("public training uses the primary site navigation and exposes Training globally", async () => {
  const [page, nav, trainingHeader] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(siteNavPath, "utf8"),
    readFile(trainingHeaderPath, "utf8"),
  ]);

  assert.match(page, /import \{ SiteHeader \} from "@\/components\/site-header"/);
  assert.match(page, /<SiteHeader context="training"\/>/);
  assert.doesNotMatch(page, /TrainingSiteHeader/);

  assert.match(nav, /<Link href="\/training">Training<\/Link>/);
  assert.match(nav, /<Link href="\/training">Free VA Training<\/Link>/);
  assert.match(nav, /actionContext === "training"/);
  assert.match(nav, /Training login/);
  assert.match(nav, /Start free training/);

  // Keep the specialised training header only for auth/join continuity.
  assert.match(trainingHeader, /<SiteNav/);
  assert.match(trainingHeader, /mode="training"/);
});

test("training landing does not render a second disconnected navigation bar", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.doesNotMatch(page, /className="tr-page-nav"/);
  assert.doesNotMatch(css, /\.tr-page-nav/);
  assert.match(page, /id="course-library"/);
  assert.match(page, /id="how-training-works"/);
  assert.match(page, /id="certificate"/);
  assert.match(page, /id="faq"/);
  assert.match(css, /scroll-margin-top: 96px/);
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
