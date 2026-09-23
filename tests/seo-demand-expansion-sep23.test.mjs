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

const demandPosts = () => parseArray("src/lib/blog-demand-guides.ts", "export const BLOG_DEMAND_GUIDES: BlogPost[] = ");
const services = () => parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
const industries = () => parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");

test("September 23 demand expansion owns six distinct blog intents", () => {
  const posts = demandPosts();
  const expected = [
    "part-time-virtual-assistant-jobs-philippines",
    "virtual-assistant-niches",
    "virtual-assistant-non-phone-tasks",
    "virtual-assistant-tasks",
    "virtual-assistant-team",
    "virtual-assistant-side-hustle-philippines"
  ];
  assert.deepEqual(posts.map((post) => post.slug), expected);

  const topicHubs = {
    philippines: "/blog/topic/philippines",
    hiring: "/blog/topic/hiring",
    managing: "/blog/topic/managing"
  };

  for (const post of posts) {
    assert.ok(post.metaTitle.length >= 40 && post.metaTitle.length <= 60, `${post.slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 140 && post.description.length <= 160, `${post.slug}: meta description length ${post.description.length}`);
    assert.ok(post.sections.length >= 6, `${post.slug}: needs at least six useful sections`);
    assert.ok(post.faqs.length >= 4, `${post.slug}: needs at least four FAQs`);
    assert.ok(post.internalLinks.length >= 5, `${post.slug}: needs at least five internal links`);
    assert.ok(post.internalLinks.some((link) => link.href === topicHubs[post.topic]), `${post.slug}: missing topic hub`);
    assert.equal(post.publishedAt, "2026-09-23");
    assert.equal(post.updatedAt, "2026-09-23");
  }

  assert.equal(new Set(posts.map((post) => post.metaTitle)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.description)).size, posts.length);
});

test("candidate guides keep jobs, niches and side-hustle intent separate", () => {
  const posts = demandPosts();
  const bySlug = new Map(posts.map((post) => [post.slug, post]));

  assert.match(JSON.stringify(bySlug.get("part-time-virtual-assistant-jobs-philippines")), /schedule|application|job|scam/i);
  assert.match(JSON.stringify(bySlug.get("virtual-assistant-niches")), /speciali[sz]ation|workflow|industry|software/i);
  assert.match(JSON.stringify(bySlug.get("virtual-assistant-side-hustle-philippines")), /capacity|client|outside work|side hustle/i);

  for (const slug of [
    "part-time-virtual-assistant-jobs-philippines",
    "virtual-assistant-niches",
    "virtual-assistant-side-hustle-philippines"
  ]) {
    const post = bySlug.get(slug);
    assert.equal(post.topic, "philippines");
    assert.ok((post.sources || []).length >= 2, `${slug}: needs authoritative sources`);
    assert.ok(post.reviewNote, `${slug}: needs editorial scope note`);
  }
});

test("task cluster separates broad delegation, non-phone work and team design", () => {
  const posts = demandPosts();
  const bySlug = new Map(posts.map((post) => [post.slug, post]));

  assert.equal(bySlug.get("virtual-assistant-tasks").intent, "informational");
  assert.equal(bySlug.get("virtual-assistant-non-phone-tasks").intent, "informational");
  assert.equal(bySlug.get("virtual-assistant-team").intent, "comparison");

  assert.match(JSON.stringify(bySlug.get("virtual-assistant-tasks")), /50\+|administrative|customer service|marketing|finance|ecommerce/i);
  assert.match(JSON.stringify(bySlug.get("virtual-assistant-non-phone-tasks")), /asynchronous|no customer calls|written/i);
  assert.match(JSON.stringify(bySlug.get("virtual-assistant-team")), /capacity|coverage|specialist|handoff/i);
});

test("Technical Virtual Assistant is a separate service from IT support", () => {
  const pages = services();
  const technical = pages.find((page) => page.slug === "technical-virtual-assistant");
  const it = pages.find((page) => page.slug === "it-virtual-assistant");

  assert.ok(technical);
  assert.ok(it);
  assert.equal(technical.primaryKeyword, "technical virtual assistant");
  assert.match(JSON.stringify(technical), /Zapier|Make|automation|integration|CRM/i);
  assert.match(JSON.stringify(it), /helpdesk|ticket|account|device|IT/i);
  assert.notEqual(technical.focus, it.focus);
  assert.ok(technical.relatedSlugs.includes("it-virtual-assistant"));
});

test("cleaning and trucking industries map to existing service canonicals", () => {
  const pages = industries();
  const cleaning = pages.find((page) => page.slug === "cleaning-businesses");
  const trucking = pages.find((page) => page.slug === "trucking-companies");

  assert.ok(cleaning);
  assert.ok(trucking);
  assert.equal(cleaning.clusterSlug, "home-local-services");
  assert.ok(cleaning.serviceSlugs.includes("appointment-setter-virtual-assistant"));
  assert.ok(cleaning.serviceSlugs.includes("customer-service"));
  assert.ok(trucking.serviceSlugs.includes("logistics-virtual-assistant"));
  assert.ok(trucking.serviceSlugs.includes("bookkeeping"));

  for (const page of [cleaning, trucking]) {
    assert.ok(page.metaTitle.length >= 40 && page.metaTitle.length <= 60);
    assert.ok(page.metaDescription.length >= 145 && page.metaDescription.length <= 160);
    assert.ok(page.workflows.length >= 8);
    assert.ok(page.tools.length >= 5);
    assert.ok(page.hiringNotes.length >= 3);
  }

  const seo = source("src/lib/industry-seo-content.ts");
  assert.match(seo, /"cleaning-businesses": \{/);
  assert.match(seo, /"trucking-companies": \{/);
  assert.match(seo, /Enquiry response time/);
  assert.match(seo, /Missing POD or BOL backlog/);
});

test("all demand guides are wired into the unified blog and audit scripts", () => {
  const blog = source("src/lib/blog.ts");
  const quality = source("scripts/check-blog-quality.mjs");
  const clusters = source("scripts/check-content-clusters.mjs");
  const overlap = source("scripts/audit-content-intent-overlap.mjs");

  assert.match(blog, /BLOG_DEMAND_GUIDES/);
  for (const audit of [quality, clusters, overlap]) {
    assert.match(audit, /blog-demand-guides\.ts/);
    assert.match(audit, /BLOG_DEMAND_GUIDES/);
  }
});
