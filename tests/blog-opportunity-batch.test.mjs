import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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

const opportunityPath = new URL("../src/lib/blog-opportunity-posts.ts", import.meta.url);

test("four uncovered blog intents have substantial canonical articles", () => {
  assert.equal(existsSync(opportunityPath), true, "opportunity blog module missing");
  const posts = parseArray("src/lib/blog-opportunity-posts.ts", "export const BLOG_OPPORTUNITY_POSTS: BlogPost[] = ");
  const expected = new Map([
    ["virtual-assistant-interview-questions", "Virtual Assistant Interview Questions and Answers"],
    ["sample-virtual-assistant-contract", "Sample Virtual Assistant Contract Philippines"],
    ["virtual-assistant-jobs-for-students-philippines", "Virtual Assistant Jobs for Students Philippines"],
    ["virtual-assistant-tools", "Best Virtual Assistant Tools by Workflow"]
  ]);

  assert.equal(posts.length, 4);
  for (const [slug, primaryPhrase] of expected) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.match(`${post.title} ${post.metaTitle}`, new RegExp(primaryPhrase, "i"), `${slug}: primary phrase missing`);
    assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 60, `${slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 150 && post.description.length <= 160, `${slug}: meta description length ${post.description.length}`);
    assert.ok(post.sections.length >= 6, `${slug}: needs at least six useful sections`);
    assert.ok(post.sections.reduce((total, section) => total + (section.paragraphs || []).join(" ").length + (section.bullets || []).join(" ").length + (section.numbered || []).join(" ").length, 0) >= 2800, `${slug}: content is too thin`);
    assert.ok(post.faqs.length >= 4, `${slug}: needs useful FAQs`);
    assert.ok(post.internalLinks.length >= 4, `${slug}: needs contextual internal links`);
  }

  const blog = source("src/lib/blog.ts");
  assert.match(blog, /BLOG_OPPORTUNITY_POSTS/);
});

test("candidate and buyer intent stay separated across the new articles", () => {
  assert.equal(existsSync(opportunityPath), true, "opportunity blog module missing");
  const posts = parseArray("src/lib/blog-opportunity-posts.ts", "export const BLOG_OPPORTUNITY_POSTS: BlogPost[] = ");
  const interview = posts.find((item) => item.slug === "virtual-assistant-interview-questions");
  const contract = posts.find((item) => item.slug === "sample-virtual-assistant-contract");
  const students = posts.find((item) => item.slug === "virtual-assistant-jobs-for-students-philippines");
  const tools = posts.find((item) => item.slug === "virtual-assistant-tools");

  assert.equal(interview.intent, "informational");
  assert.match(JSON.stringify(interview), /sample answers|answer framework/i);
  assert.doesNotMatch(JSON.stringify(interview), /questions to ask candidates/i);
  assert.equal(contract.intent, "compliance");
  assert.match(JSON.stringify(contract), /independent contractor|employment classification/i);
  assert.equal(students.intent, "informational");
  assert.match(JSON.stringify(students), /class schedule|study|student/i);
  assert.match(JSON.stringify(students), /scam/i);
  assert.equal(tools.intent, "informational");
  assert.match(JSON.stringify(tools), /workflow|source of truth/i);
  assert.doesNotMatch(JSON.stringify(tools), /every virtual assistant needs all/i);
});

test("GSC opportunity posts distinguish pay models and use current platform evidence", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const rate = posts.find((item) => item.slug === "average-hourly-rate-virtual-assistants-philippines");
  const salary = posts.find((item) => item.slug === "virtual-assistant-salary-philippines");
  const sss = posts.find((item) => item.slug === "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va");

  for (const post of [rate, salary, sss]) {
    assert.ok(post, "priority post missing");
    assert.equal(post.updatedAt, "2026-09-23");
  }
  assert.match(JSON.stringify(rate), /current platform minimum is \$6 per hour/i);
  assert.doesNotMatch(JSON.stringify(rate), /\$3\s*(?:-|–|to)\s*\$5/i);
  assert.ok(rate.internalLinks.some((link) => link.href === "/research/virtual-assistant-rates-philippines-2026"));
  assert.match(JSON.stringify(salary), /employee salary|independent contractor|client hiring cost/i);
  assert.ok(salary.internalLinks.some((link) => link.href === "/research/virtual-assistant-rates-philippines-2026"));
  assert.match(JSON.stringify(sss), /employment classification|employee|independent contractor/i);
});

test("retained GSC archive posts expose stronger decision and payment guidance", () => {
  const posts = parseArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const comparison = posts.find((item) => item.slug === "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines");
  const paid = posts.find((item) => item.slug === "get-paid-virtual-assistant-philippines");

  assert.equal(comparison.updatedDate, "September 23, 2026");
  assert.match(comparison.html, /decision table|at a glance/i);
  assert.match(comparison.html, /budget|cost/i);
  assert.equal(paid.updatedDate, "September 23, 2026");
  assert.match(paid.html, /comparison table/i);
  assert.match(paid.html, /fees|exchange rate/i);
  assert.match(paid.html, /sample-virtual-assistant-contract/);
});
