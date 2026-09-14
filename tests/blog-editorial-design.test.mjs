import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("current blog posts use the editorial layout without embedded lead forms", () => {
  const article = read("src/components/blog-article.tsx");

  assert.match(article, /blog-editorial-page/);
  assert.match(article, /blog-mobile-toc/);
  assert.match(article, /<BlogFeaturedVisual/);
  assert.match(article, /Browse vetted Virtual Assistants/);
  assert.doesNotMatch(article, /ServiceMatchForm/);
  assert.doesNotMatch(article, /RoleBriefForm/);
  assert.doesNotMatch(article, /blog-match-section/);
  assert.doesNotMatch(article, /blog-editorial-hero-actions/);
});

test("archived blog posts keep the editorial treatment without a hero form", () => {
  const article = read("src/components/archive-article.tsx");

  assert.match(article, /archive-editorial-page/);
  assert.match(article, /<BlogFeaturedVisual/);
  assert.match(article, /Browse vetted Virtual Assistants/);
  assert.doesNotMatch(article, /RoleBriefForm/);
  assert.doesNotMatch(article, /<form/);
  assert.doesNotMatch(article, /blog-editorial-hero-actions/);
});

test("blog topic artwork covers every editorial topic", () => {
  const visual = read("src/components/blog-featured-visual.tsx");

  for (const topic of [
    "hiring",
    "pricing",
    "managing",
    "philippines",
    "seo-marketing",
    "ecommerce",
    "real-estate",
    "healthcare",
    "legal",
    "finance-bookkeeping"
  ]) {
    assert.match(visual, new RegExp(`(?:\\"|^)${topic}(?:\\"|:)`));
  }

  assert.match(visual, /role="img"/);
  assert.match(visual, /Featured illustration for/);
});

test("blog editorial styling includes responsive article, topic artwork and mobile navigation rules", () => {
  const css = read("src/app/blog-editorial.css");
  const artworkCss = read("src/app/blog-featured-visual.css");
  const layout = read("src/app/layout.tsx");

  assert.match(layout, /blog-editorial\.css/);
  assert.match(layout, /blog-featured-visual\.css/);
  assert.match(css, /\.blog-editorial-layout/);
  assert.match(css, /\.blog-mobile-toc/);
  assert.match(artworkCss, /\.blog-editorial-hero-grid/);
  assert.match(artworkCss, /\.blog-featured-visual/);
  assert.match(artworkCss, /blog-featured-legal/);
  assert.match(artworkCss, /@media \(max-width: 640px\)/);
  assert.match(artworkCss, /prefers-reduced-motion/);
});
