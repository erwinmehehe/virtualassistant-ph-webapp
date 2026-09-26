import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";
const siteNavPath = "src/components/site-nav.tsx";
const trainingHeaderPath = "src/components/training-site-header.tsx";
const sectionObserverPath = "src/components/training-section-observer.tsx";
const navCssPath = "src/app/nav-cro.css";

test("training uses one connected site-nav instead of a separate microsite menu", async () => {
  const [header, nav, observer, navCss] = await Promise.all([
    readFile(trainingHeaderPath, "utf8"),
    readFile(siteNavPath, "utf8"),
    readFile(sectionObserverPath, "utf8"),
    readFile(navCssPath, "utf8"),
  ]);

  assert.match(header, /<SiteNav/);
  assert.match(header, /mode="training"/);
  assert.match(nav, /mode\?: "default" \| "training"/);
  assert.match(nav, /training-connected-nav/);
  assert.match(nav, /training-nav-context/);
  assert.match(nav, /TrainingSectionObserver/);
  assert.match(nav, /data-section="course-library"/);
  assert.match(nav, /href="\/training#course-library"/);
  assert.match(nav, /href="\/training#how-training-works"/);
  assert.match(nav, /href="\/training#certificate"/);
  assert.match(nav, /href="\/training#faq"/);
  assert.doesNotMatch(nav, />VA jobs<\/Link>/);
  assert.doesNotMatch(nav, />Browse VA jobs<\/Link>/);
  assert.doesNotMatch(nav, />For Virtual Assistants<\/Link>/);
  assert.doesNotMatch(nav, />VA guides<\/Link>/);

  assert.match(observer, /requestAnimationFrame/);
  assert.match(observer, /aria-current/);
  assert.match(observer, /getBoundingClientRect/);
  assert.match(navCss, /training-section-link\.is-active/);
  assert.match(navCss, /@media \(max-width: 680px\)[\s\S]*va-mobile-drawer > summary span[\s\S]*display: none/);
});

test("training landing does not render a second disconnected navigation bar", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /export const revalidate = 0/);
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
