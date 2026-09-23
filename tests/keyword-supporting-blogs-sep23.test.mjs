import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path}: marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

const posts = () => parseArray("src/lib/blog-keyword-support-guides.ts", "export const BLOG_KEYWORD_SUPPORT_GUIDES: BlogPost[] = ");

test("keyword-support batch owns six informational or comparison intents", () => {
  const items = posts();
  assert.deepEqual(items.map((post) => post.slug), [
    "technical-virtual-assistant-vs-it-virtual-assistant",
    "virtual-assistant-email-management-tasks-sops",
    "gohighlevel-virtual-assistant-tasks",
    "hubspot-virtual-assistant-tasks",
    "salesforce-virtual-assistant-tasks",
    "what-does-a-logistics-virtual-assistant-do"
  ]);

  for (const post of items) {
    assert.ok(["informational", "comparison"].includes(post.intent), `${post.slug}: must stay non-commercial`);
    assert.ok(post.metaTitle.length >= 40 && post.metaTitle.length <= 60, `${post.slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 140 && post.description.length <= 160, `${post.slug}: meta description length ${post.description.length}`);
    assert.ok(post.sections.length >= 6, `${post.slug}: needs useful long-form depth`);
    assert.ok(post.faqs.length >= 4, `${post.slug}: needs at least four FAQs`);
    assert.ok(post.internalLinks.length >= 5, `${post.slug}: needs at least five internal links`);
    assert.ok(post.internalLinks.some((link) => link.href === `/blog/topic/${post.topic}`), `${post.slug}: missing topic hub`);
    assert.equal(post.publishedAt, "2026-09-23");
    assert.equal(post.updatedAt, "2026-09-23");
  }
});

test("service-support posts point to the existing commercial service owners", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));
  const expected = new Map([
    ["technical-virtual-assistant-vs-it-virtual-assistant", "technical-virtual-assistant"],
    ["virtual-assistant-email-management-tasks-sops", "email-management-virtual-assistant"],
    ["what-does-a-logistics-virtual-assistant-do", "logistics-virtual-assistant"]
  ]);

  for (const [slug, serviceSlug] of expected) {
    const post = bySlug.get(slug);
    assert.equal(post.serviceSlug, serviceSlug);
    assert.ok(post.internalLinks.some((link) => link.href === `/service/${serviceSlug}`));
    assert.equal(post.softwareSlug, undefined);
  }

  const technical = bySlug.get("technical-virtual-assistant-vs-it-virtual-assistant");
  assert.ok(technical.internalLinks.some((link) => link.href === "/service/it-virtual-assistant"));
});

test("software-support posts point to the correct software canonicals", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));
  const expected = new Map([
    ["gohighlevel-virtual-assistant-tasks", "gohighlevel-virtual-assistant"],
    ["hubspot-virtual-assistant-tasks", "hubspot-virtual-assistant"],
    ["salesforce-virtual-assistant-tasks", "salesforce-virtual-assistant"]
  ]);

  for (const [slug, softwareSlug] of expected) {
    const post = bySlug.get(slug);
    assert.equal(post.softwareSlug, softwareSlug);
    assert.ok(post.internalLinks.some((link) => link.href === `/software/${softwareSlug}`));
    assert.equal(post.serviceSlug, undefined);
  }
});

test("software pages surface software-linked supporting guides", () => {
  const blog = source("src/lib/blog.ts");
  const route = source("src/app/software/[slug]/page.tsx");
  const article = source("src/components/blog-article.tsx");

  assert.match(blog, /export function softwareBlogPosts\(softwareSlug: string/);
  assert.match(route, /softwareBlogPosts\(page\.slug, 4\)/);
  assert.match(route, /relatedGuides\.map/);
  assert.match(route, /blogHref\(guide\)/);
  assert.match(article, /post\.softwareSlug \? getSoftwarePage\(post\.softwareSlug\)/);
  assert.match(article, /blog_software_click/);
});

test("SEO audits include the keyword-support corpus and validate software relationships", () => {
  const quality = source("scripts/check-blog-quality.mjs");
  const clusters = source("scripts/check-content-clusters.mjs");
  const overlap = source("scripts/audit-content-intent-overlap.mjs");

  for (const audit of [quality, clusters, overlap]) {
    assert.match(audit, /blog-keyword-support-guides\.ts/);
    assert.match(audit, /BLOG_KEYWORD_SUPPORT_GUIDES/);
  }

  assert.match(quality, /softwareSlugs/);
  assert.match(quality, /missing canonical software-page link/);
  assert.match(clusters, /missing canonical software link/);
  assert.match(overlap, /blog-software/);
  assert.match(overlap, /same-software article has no strong editorial-family separator/);
});

test("software task guides remain distinct from hire-intent software pages", () => {
  const items = posts();
  for (const slug of [
    "gohighlevel-virtual-assistant-tasks",
    "hubspot-virtual-assistant-tasks",
    "salesforce-virtual-assistant-tasks"
  ]) {
    const post = items.find((item) => item.slug === slug);
    assert.match(post.slug, /-tasks$/);
    assert.equal(post.intent, "informational");
    assert.doesNotMatch(post.metaTitle.toLowerCase(), /\bhire\b/);
    assert.doesNotMatch(post.title.toLowerCase(), /^hire\b/);
  }
});
