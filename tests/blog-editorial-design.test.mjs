import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("current blog posts use the editorial layout without embedded lead forms", () => {
  const article = read("src/components/blog-article.tsx");

  assert.match(article, /blog-editorial-page/);
  assert.match(article, /blog-mobile-toc/);
  assert.match(article, /Browse vetted Virtual Assistants/);
  assert.doesNotMatch(article, /ServiceMatchForm/);
  assert.doesNotMatch(article, /RoleBriefForm/);
  assert.doesNotMatch(article, /blog-match-section/);
});

test("archived blog posts no longer render an embedded brief form", () => {
  const article = read("src/components/archive-article.tsx");

  assert.match(article, /archive-editorial-page/);
  assert.match(article, /Browse vetted Virtual Assistants/);
  assert.doesNotMatch(article, /RoleBriefForm/);
  assert.doesNotMatch(article, /<form/);
});

test("blog editorial styling includes responsive article and mobile navigation rules", () => {
  const css = read("src/app/blog-editorial.css");
  const layout = read("src/app/layout.tsx");

  assert.match(layout, /blog-editorial\.css/);
  assert.match(css, /\.blog-editorial-layout/);
  assert.match(css, /\.blog-mobile-toc/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
