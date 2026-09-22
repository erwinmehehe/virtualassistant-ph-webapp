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

test("GSC-visible legacy SEO URLs redirect to live canonicals", () => {
  const config = source("next.config.ts");
  const expected = [
    ["/how-to-pay-a-virtual-assistant-in-the-philippines-in-depth-2026-guide", "/blog/how-to-pay-a-filipino-virtual-assistant-directly"],
    ["/seo-virtual-assistant-philippines-guide", "/service/seo"],
    ["/how-much-to-pay-a-filipino-virtual-assistant-2026-guide", "/how-much-virtual-assistant-philippines"],
    ["/blog/how-much-do-filipino-virtual-assistants-typically-charge-per-hour", "/average-hourly-rate-virtual-assistants-philippines"]
  ];
  for (const [from, to] of expected) {
    assert.ok(config.includes(`source: "${from}", destination: "${to}", permanent: true`), `${from}: redirect missing`);
  }
});

test("priority structured posts have clean query-focused metadata", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const expected = new Map([
    ["average-hourly-rate-virtual-assistants-philippines", "Virtual Assistant Hourly Rate Philippines: 2026 Guide"],
    ["virtual-assistant-salary-philippines", "Virtual Assistant Salary Philippines 2026 | Pay Guide"],
    ["dental-virtual-assistant-interview-questions", "Dental Virtual Assistant Interview Questions | Philippines"],
    ["medical-virtual-assistant-interview-questions", "Medical Virtual Assistant Interview Questions | Philippines"],
    ["what-does-a-cold-calling-virtual-assistant-do", "What Does a Cold Calling Virtual Assistant Do? | Philippines"]
  ]);
  for (const [slug, title] of expected) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.equal(post.metaTitle, title);
    assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 60, `${slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 140 && post.description.length <= 160, `${slug}: meta description length ${post.description.length}`);
    const expectedDate = slug === "medical-virtual-assistant-interview-questions" ? "2026-09-19" : "2026-09-22";
    assert.equal(post.updatedAt, expectedDate);
  }
  const rate = posts.find((item) => item.slug === "average-hourly-rate-virtual-assistants-philippines");
  const salary = posts.find((item) => item.slug === "virtual-assistant-salary-philippines");
  assert.doesNotMatch(JSON.stringify(rate), /Includes practical b\./);
  assert.doesNotMatch(JSON.stringify(rate), /Pricing pricing|For Pricing, the useful pricing question/);
  assert.doesNotMatch(JSON.stringify(salary), /For pricing decisions|For this pricing decision|Pricing pricing|For Pricing, the useful pricing question/);
});

test("priority retained guides can optimize SERP metadata without changing their H1", () => {
  const posts = parseArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const slugs = [
    "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
    "get-paid-virtual-assistant-philippines",
    "how-to-pay-a-filipino-virtual-assistant-directly",
    "hourly-rates-for-filipino-virtual-project-manager",
    "how-to-become-bookkeeping-virtual-assistant"
  ];
  for (const slug of slugs) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.ok(post.metaTitle && post.metaTitle.length >= 45 && post.metaTitle.length <= 60, `${slug}: invalid meta title`);
    assert.ok(post.metaDescription && post.metaDescription.length >= 140 && post.metaDescription.length <= 160, `${slug}: invalid meta description`);
    const expectedDate = ["get-paid-virtual-assistant-philippines", "how-to-pay-a-filipino-virtual-assistant-directly", "hourly-rates-for-filipino-virtual-project-manager", "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines"].includes(slug)
      ? "September 22, 2026"
      : "September 20, 2026";
    assert.equal(post.updatedDate, expectedDate);
  }
  const page = source("src/app/blog/[slug]/page.tsx");
  assert.match(page, /archived\.metaTitle \|\| archived\.title/);
  assert.match(page, /archived\.metaDescription \|\| archived\.excerpt\.slice\(0, 160\)/);
});
