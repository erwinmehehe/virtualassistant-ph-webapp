import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path}: marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];", text.length);
  return JSON.parse(text.slice(start, end + 1));
}

test("new onboarding and capacity guides answer distinct client decisions", () => {
  const posts = parseArray("src/lib/blog-hiring-guides.ts", "export const BLOG_HIRING_GUIDES: BlogPost[] = ");
  const expected = new Map([
    ["virtual-assistant-onboarding-checklist", "Virtual Assistant Onboarding Checklist"],
    ["how-many-hours-hire-virtual-assistant", "How Many Hours Should You Hire a Virtual Assistant"]
  ]);

  for (const [slug, phrase] of expected) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.match(`${post.title} ${post.metaTitle}`, new RegExp(phrase, "i"));
    assert.ok(post.metaTitle.length >= 50 && post.metaTitle.length <= 60, `${slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 150 && post.description.length <= 160, `${slug}: meta description length ${post.description.length}`);
    assert.equal(post.intent, "informational");
    assert.ok(post.sections.length >= 6, `${slug}: needs six decision-led sections`);
    assert.ok(post.sections.reduce((total, section) => total + JSON.stringify(section).length, 0) >= 2800, `${slug}: content too thin`);
    assert.ok(post.faqs.length >= 4, `${slug}: needs four FAQs`);
    assert.ok(post.internalLinks.length >= 5, `${slug}: needs five internal links`);
  }
});

test("onboarding guide covers access, milestones, feedback, and performance", () => {
  const posts = parseArray("src/lib/blog-hiring-guides.ts", "export const BLOG_HIRING_GUIDES: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "virtual-assistant-onboarding-checklist");
  const body = JSON.stringify(post);
  for (const requirement of [/pre-start/i, /least privilege|staged access/i, /first week/i, /30-day/i, /feedback/i, /performance/i]) {
    assert.match(body, requirement);
  }
});

test("hours guide calculates capacity instead of prescribing one schedule", () => {
  const posts = parseArray("src/lib/blog-hiring-guides.ts", "export const BLOG_HIRING_GUIDES: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "how-many-hours-hire-virtual-assistant");
  const body = JSON.stringify(post);
  for (const requirement of [/workload/i, /handling time/i, /buffer/i, /part-time/i, /full-time/i, /live coverage/i]) {
    assert.match(body, requirement);
  }
  assert.doesNotMatch(body, /every business (?:needs|should hire)/i);
});

test("existing job-description and freelancer canonicals gain decision depth", async () => {
  const resources = await import("../src/lib/seo-resource-pages.ts");
  const jobDescription = resources.seoResourceBySlug("virtual-assistant-job-description");
  assert.ok(jobDescription);
  assert.ok(jobDescription.sections.length >= 6);
  assert.match(JSON.stringify(jobDescription), /copy-ready|copy and adapt/i);
  assert.match(JSON.stringify(jobDescription), /success metrics|definition of done/i);
  assert.match(JSON.stringify(jobDescription), /decision boundaries/i);
  assert.ok(jobDescription.internalLinks.some((link) => link.href === "/tools/virtual-assistant-job-description-generator"));
  assert.ok(jobDescription.internalLinks.some((link) => link.href === "/hire"));

  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const comparison = posts.find((item) => item.slug === "virtual-assistant-agency-vs-freelancer");
  assert.ok(comparison);
  assert.equal(comparison.updatedAt, "2026-09-23");
  assert.ok(comparison.description.length >= 150 && comparison.description.length <= 160);
  assert.match(JSON.stringify(comparison), /total operating cost/i);
  assert.match(JSON.stringify(comparison), /management burden/i);
  assert.match(JSON.stringify(comparison), /replacement|continuity/i);
  assert.ok(comparison.internalLinks.some((link) => link.href === "/managed-vs-direct-hire"));
});
