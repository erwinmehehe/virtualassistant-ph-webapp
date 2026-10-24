import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const file = readFileSync(join(root, "src/lib/blog-aeo-guides.ts"), "utf8");
const marker = "export const BLOG_AEO_GUIDES: BlogPost[] = ";
const markerIndex = file.indexOf(marker);
assert.ok(markerIndex >= 0, "Expected the AEO guide collection marker");
const posts = JSON.parse(file.slice(markerIndex + marker.length, file.lastIndexOf(";")));

function words(value) {
  return (String(value || "").match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g) || []).length;
}

test("four original buyer AEO guides are registered with unique canonical intent", () => {
  const expectedSlugs = [
    "ai-vs-human-virtual-assistant",
    "virtual-assistant-paid-trial-tasks",
    "virtual-assistant-kpi-scorecard",
    "virtual-assistant-sop-template",
  ];
  assert.deepEqual(posts.map((post) => post.slug).sort(), expectedSlugs.sort());
  assert.equal(new Set(posts.map((post) => post.title)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.metaTitle)).size, posts.length);
  const index = readFileSync(join(root, "src/lib/blog.ts"), "utf8");
  assert.match(index, /import \{ BLOG_AEO_GUIDES \} from/);
  assert.match(index, /BLOG_POSTS\.push\(\.\.\.BLOG_AEO_GUIDES\)/);
});

test("AEO guides have direct answers, substantive examples and good cross-links", () => {
  for (const post of posts) {
    assert.ok(words(post.quickAnswer) >= 35 && words(post.quickAnswer) <= 100, post.slug + ": answer length");
    assert.ok(post.quickAnswerQuestion.endsWith("?"), post.slug + ": answer question");
    assert.ok(post.metaTitle.length <= 60, post.slug + ": title length");
    assert.ok(post.description.length >= 120 && post.description.length <= 160, post.slug + ": description length");
    assert.ok(post.sections.length >= 6, post.slug + ": sections");
    assert.ok(post.sections.some((section) => section.table || section.numbered), post.slug + ": practical evidence");
    assert.ok(post.faqs.length >= 6, post.slug + ": FAQs");
    assert.ok(post.internalLinks.length >= 5, post.slug + ": links");
    assert.ok(post.internalLinks.some((link) => link.href === "/blog/topic/" + post.topic), post.slug + ": topic hub");
    assert.ok(post.internalLinks.filter((link) => link.href.startsWith("/blog/") && !link.href.startsWith("/blog/topic/")).length >= 2, post.slug + ": article links");
    assert.ok(post.internalLinks.some((link) => link.href === "/hire"), post.slug + ": hiring CTA");
    assert.ok(!/[\u2014\u2013]/.test(JSON.stringify(post)), post.slug + ": no em/en dash");
    assert.ok(post.reviewNote, post.slug + ": editorial qualification");
  }
});

test("the resource templates referenced from the guides are present", () => {
  for (const asset of [
    "virtual-assistant-paid-trial-rubric.csv",
    "virtual-assistant-kpi-scorecard.csv",
    "virtual-assistant-sop-template.txt",
  ]) {
    assert.ok(existsSync(join(root, "public/downloads", asset)), "Missing download: " + asset);
    assert.ok(posts.some((post) => post.internalLinks.some((link) => link.href === "/downloads/" + asset)), "No article links to " + asset);
  }
});
