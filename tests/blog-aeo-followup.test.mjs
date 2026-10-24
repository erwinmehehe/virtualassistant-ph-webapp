import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function data(file, marker) {
  const value = readFileSync(join(root, file), "utf8");
  const start = value.indexOf(marker);
  assert.ok(start >= 0, file + " missing export marker");
  return JSON.parse(value.slice(start + marker.length, value.lastIndexOf(";")));
}
const posts = data("src/lib/blog-aeo-followup-guides.ts", "export const BLOG_AEO_FOLLOWUP_GUIDES: BlogPost[] = ");
const archives = data("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
const patches = data("src/lib/blog-gsc-editorial-refreshes.ts", "export const GSC_EDITORIAL_PATCHES: GscEditorialPatch[] = ");
const words = (s) => (String(s || "").match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g) || []).length;
const totalWords = (post) => post.sections.reduce((count, section) => count
  + words(section.heading)
  + words((section.paragraphs || []).join(" "))
  + words((section.bullets || []).join(" "))
  + words((section.numbered || []).join(" "))
  + (section.table ? words(JSON.stringify(section.table)) : 0), 0)
  + post.faqs.reduce((count, faq) => count + words(faq.question) + words(faq.answer), 0);

test("five original AEO follow-ups have distinct intents and canonical-ready fields", () => {
  const expected = [
    "virtual-assistant-offboarding-checklist",
    "when-to-hire-first-virtual-assistant",
    "filipino-virtual-assistant-us-australia-hours",
    "virtual-assistant-job-scams-philippines",
    "filipino-va-contractor-vs-employee",
  ];
  assert.deepEqual(posts.map((post) => post.slug).sort(), expected.sort());
  assert.equal(new Set(posts.map((post) => post.title)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.metaTitle)).size, posts.length);
  for (const post of posts) {
    assert.ok(totalWords(post) >= 1000, post.slug + " is too short");
    assert.ok(post.metaTitle.length <= 60, post.slug + " has a long meta title");
    assert.ok(post.description.length >= 120 && post.description.length <= 160, post.slug + " description length");
    assert.ok(words(post.quickAnswer) >= 35 && words(post.quickAnswer) <= 100, post.slug + " quick answer");
    assert.ok(post.quickAnswerQuestion.endsWith("?"), post.slug + " question");
    assert.ok(post.faqs.length >= 6, post.slug + " needs FAQs");
    assert.ok(post.sections.length >= 6, post.slug + " needs substantial sections");
    assert.ok(post.sections.some((section) => section.numbered || section.table), post.slug + " needs practical examples");
    assert.ok(post.internalLinks.length >= 5, post.slug + " internal links");
    assert.ok(post.internalLinks.some((link) => link.href === "/blog/topic/" + post.topic), post.slug + " topic hub");
    assert.ok(post.internalLinks.filter((link) => link.href.startsWith("/blog/") && !link.href.startsWith("/blog/topic/")).length >= 2, post.slug + " nearby articles");
    assert.ok((post.sources || []).length >= 2, post.slug + " source references");
    assert.ok(post.reviewNote, post.slug + " editorial note");
    assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(post)), post.slug + " prohibited dash");
  }
  const legal = posts.find((post) => post.slug === "filipino-va-contractor-vs-employee");
  assert.match(legal.reviewNote, /PRE-PUBLICATION LEGAL REVIEW REQUIRED/);
});

test("archive refreshes stay on their original slug and receive substantive distinct material", () => {
  const updated = [
    ["general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines", "Which paid work sample"],
    ["get-paid-virtual-assistant-philippines", "How do you verify payment instructions"],
    ["hourly-rates-for-filipino-virtual-project-manager", "What project-management work sample"],
    ["how-to-pay-a-filipino-virtual-assistant-directly", "How do you reconcile a direct VA payment"],
  ];
  for (const [slug, question] of updated) {
    const post = archives.find((item) => item.slug === slug);
    assert.ok(post, slug + " is missing");
    assert.ok(post.html.includes(question), slug + " missing AEO section");
    assert.equal(post.updatedDate, "October 24, 2026", slug + " date");
    assert.ok(post.metaTitle.length <= 60, slug + " long title");
    assert.ok(post.metaDescription.length >= 120 && post.metaDescription.length <= 160, slug + " meta description");
  }
});

test("GSC refreshes apply only to existing structured blog owners", () => {
  assert.deepEqual(patches.map((p) => p.slug).sort(), [
    "average-hourly-rate-virtual-assistants-philippines",
    "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
  ].sort());
  const structuredSource = readFileSync(join(root, "src/lib/blog-content.ts"), "utf8");
  for (const patch of patches) {
    assert.ok(structuredSource.includes('"slug": "' + patch.slug + '"'), "Missing structured canonical " + patch.slug);
    assert.ok(patch.metaTitle.length <= 60 && patch.description.length >= 120 && patch.description.length <= 160, patch.slug + " bad metadata");
  }
  const benefits = patches.find((item) => item.slug.startsWith("do-i-need-to-pay-sss"));
  assert.ok(benefits.additionalSections.length >= 1, "Benefits upgrade needs meaningful new answer content");
  assert.ok(benefits.additionalSources.some((item) => item.href.includes("sss.gov.ph")), "Official source required");
});

test("blog registration and content checks include next-wave articles", () => {
  const index = readFileSync(join(root, "src/lib/blog.ts"), "utf8");
  assert.match(index, /BLOG_POSTS\.push\(\.\.\.BLOG_AEO_FOLLOWUP_GUIDES\)/);
  assert.match(index, /BLOG_POSTS\[index\] = applyGscEditorialPatch/);
  const check = readFileSync(join(root, "scripts/check-blog-quality.mjs"), "utf8");
  assert.match(check, /readPostArray\(aeoFollowupGuidesPath/);
});

test("offboarding and first-hire worksheets are accessible from articles", () => {
  const downloads = [
    "virtual-assistant-offboarding-checklist.csv",
    "first-virtual-assistant-task-audit.csv",
  ];
  for (const filename of downloads) {
    const path = join(root, "public/downloads", filename);
    assert.ok(existsSync(path), "Missing " + filename);
    const csv = readFileSync(path, "utf8").trim().split(/\r?\n/);
    const columns = csv[0].split(",").length;
    assert.ok(columns >= 5 && csv.length >= 5, filename + " too small");
    for (const row of csv.slice(1)) assert.equal(row.split(",").length, columns, filename + " malformed row");
    assert.ok(posts.some((post) => post.internalLinks.some((link) => link.href === "/downloads/" + filename)), filename + " not linked");
  }
});
