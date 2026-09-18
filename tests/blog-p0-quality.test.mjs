import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("blog rendering only emits update signals after a real date change", () => {
  const article = source("src/components/blog-article.tsx");
  const page = source("src/app/blog/[slug]/page.tsx");

  assert.match(article, /const hasMeaningfulUpdate = post\.updatedAt !== post\.publishedAt/);
  assert.match(article, /const articleDateLabel = hasMeaningfulUpdate \? "Updated" : "Published"/);
  assert.match(page, /\.\.\.\(hasMeaningfulUpdate \? \{ modifiedTime: post\.updatedAt \} : \{\}\)/);
  assert.match(page, /\.\.\.\(post\.updatedAt !== post\.publishedAt \? \{ dateModified: post\.updatedAt \} : \{\}\)/);
});

test("blog content no longer depends on a runtime $5 pricing sanitizer", () => {
  const blog = source("src/lib/blog.ts");
  assert.match(blog, /export const BLOG_POSTS: BlogPost\[\] = RAW_BLOG_POSTS;/);
  assert.doesNotMatch(blog, /containsStaleFiveDollarFloor/);
  assert.doesNotMatch(blog, /CURRENT_PRICING_FAQ/);
});

test("legacy archive has no unresolved numeric citation placeholders or false 2026 HIPAA mandates", () => {
  const archive = source("src/lib/archive-posts.ts");
  assert.doesNotMatch(archive, /\[[0-9]+(?:\.[0-9]+)+\]/);
  assert.doesNotMatch(archive, /2026 HIPAA updates/i);
  assert.doesNotMatch(archive, /100% HIPAA compliant/i);
  assert.doesNotMatch(archive, /revoke[^<]{0,80}within one hour/i);
  assert.match(archive, /HHS: HIPAA Security Rule/);
});
