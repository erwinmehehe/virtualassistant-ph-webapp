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

const posts = () => parseArray("src/lib/blog-candidate-gap-guides.ts", "export const BLOG_CANDIDATE_GAP_GUIDES: BlogPost[] = ");

test("fresh keyword-gap batch owns six distinct candidate intents", () => {
  const items = posts();
  assert.deepEqual(items.map((post) => post.slug), [
    "how-to-start-a-virtual-assistant-business",
    "legit-virtual-assistant-jobs",
    "virtual-assistant-jobs-for-moms",
    "virtual-assistant-portfolio-sample",
    "virtual-assistant-cover-letter",
    "best-laptop-for-virtual-assistant"
  ]);

  for (const post of items) {
    assert.equal(post.intent, "informational");
    assert.equal(post.topic, "hiring");
    assert.ok(post.metaTitle.length >= 40 && post.metaTitle.length <= 60, `${post.slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 140 && post.description.length <= 160, `${post.slug}: meta description length ${post.description.length}`);
    assert.ok(post.sections.length >= 6, `${post.slug}: needs useful long-form depth`);
    assert.ok(post.faqs.length >= 4, `${post.slug}: needs four FAQs`);
    assert.ok(post.internalLinks.length >= 5, `${post.slug}: needs five internal links`);
    assert.ok(post.internalLinks.some((link) => link.href === "/blog/topic/hiring"), `${post.slug}: missing hiring topic hub`);
    assert.doesNotMatch(JSON.stringify(post), /[—–]/);
  }
});

test("candidate guides remain separate from existing jobs and training owners", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));

  assert.ok(bySlug.get("legit-virtual-assistant-jobs").internalLinks.some((link) => link.href === "/jobs"));
  assert.ok(bySlug.get("virtual-assistant-jobs-for-moms").internalLinks.some((link) => link.href === "/blog/part-time-virtual-assistant-jobs-philippines"));
  assert.ok(bySlug.get("virtual-assistant-portfolio-sample").internalLinks.some((link) => link.href === "/blog/virtual-assistant-interview-questions"));
  assert.ok(bySlug.get("virtual-assistant-cover-letter").internalLinks.some((link) => link.href === "/blog/virtual-assistant-portfolio-sample"));
  assert.ok(bySlug.get("how-to-start-a-virtual-assistant-business").internalLinks.some((link) => link.href === "/blog/virtual-assistant-side-hustle-philippines"));
  assert.ok(bySlug.get("best-laptop-for-virtual-assistant").internalLinks.some((link) => link.href === "/blog/virtual-assistant-tools"));

  for (const post of posts()) {
    assert.equal(post.serviceSlug, undefined);
    assert.equal(post.softwareSlug, undefined);
  }
});

test("portfolio and cover letter guides emphasize truthful evidence", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));
  const portfolio = JSON.stringify(bySlug.get("virtual-assistant-portfolio-sample"));
  const cover = JSON.stringify(bySlug.get("virtual-assistant-cover-letter"));
  assert.match(portfolio, /practice work|dummy data|confidential/i);
  assert.match(cover, /cannot prove|real experience|truthful|practice/i);
});

test("legit jobs guide covers verification without promising certainty", () => {
  const body = JSON.stringify(posts().find((post) => post.slug === "legit-virtual-assistant-jobs"));
  assert.match(body, /verify|company|recruiter|payment|sensitive/i);
  assert.match(body, /cannot guarantee|no checklist can guarantee/i);
  assert.doesNotMatch(body, /guaranteed legitimate|100% legit/i);
});

test("candidate gap corpus is wired into blog and SEO audits", () => {
  const blog = source("src/lib/blog.ts");
  const quality = source("scripts/check-blog-quality.mjs");
  const clusters = source("scripts/check-content-clusters.mjs");
  const overlap = source("scripts/audit-content-intent-overlap.mjs");

  assert.match(blog, /BLOG_CANDIDATE_GAP_GUIDES/);
  for (const audit of [quality, clusters, overlap]) {
    assert.match(audit, /blog-candidate-gap-guides\.ts/);
    assert.match(audit, /BLOG_CANDIDATE_GAP_GUIDES/);
  }
});
