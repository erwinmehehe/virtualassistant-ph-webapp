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

test("keyword-support corpus owns eighteen informational or comparison intents", () => {
  const items = posts();
  assert.deepEqual(items.map((post) => post.slug), [
    "technical-virtual-assistant-vs-it-virtual-assistant",
    "virtual-assistant-email-management-tasks-sops",
    "gohighlevel-virtual-assistant-tasks",
    "hubspot-virtual-assistant-tasks",
    "salesforce-virtual-assistant-tasks",
    "what-does-a-logistics-virtual-assistant-do",
    "klaviyo-virtual-assistant-tasks",
    "xero-virtual-assistant-tasks",
    "quickbooks-virtual-assistant-tasks",
    "canva-virtual-assistant-tasks",
    "creative-virtual-assistant-vs-graphic-designer",
    "event-planning-virtual-assistant-tasks",
    "real-estate-virtual-assistant-crm-listing-workflow",
    "amazon-virtual-assistant-seller-operations-workflow",
    "data-entry-virtual-assistant-tasks",
    "medical-virtual-assistant-admin-workflow",
    "digital-marketing-virtual-assistant-tasks",
    "bookkeeping-virtual-assistant-month-end-workflow"
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
    ["what-does-a-logistics-virtual-assistant-do", "logistics-virtual-assistant"],
    ["creative-virtual-assistant-vs-graphic-designer", "creative-virtual-assistant"],
    ["event-planning-virtual-assistant-tasks", "event-planning-virtual-assistant"],
    ["real-estate-virtual-assistant-crm-listing-workflow", "real-estate"],
    ["amazon-virtual-assistant-seller-operations-workflow", "amazon-virtual-assistant"],
    ["data-entry-virtual-assistant-tasks", "research-data"],
    ["medical-virtual-assistant-admin-workflow", "medical-virtual-assistant"],
    ["digital-marketing-virtual-assistant-tasks", "digital-marketing-virtual-assistant"],
    ["bookkeeping-virtual-assistant-month-end-workflow", "bookkeeping"]
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
    ["salesforce-virtual-assistant-tasks", "salesforce-virtual-assistant"],
    ["klaviyo-virtual-assistant-tasks", "klaviyo-virtual-assistant"],
    ["xero-virtual-assistant-tasks", "xero-virtual-assistant"],
    ["quickbooks-virtual-assistant-tasks", "quickbooks-virtual-assistant"],
    ["canva-virtual-assistant-tasks", "canva-virtual-assistant"]
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
    "salesforce-virtual-assistant-tasks",
    "klaviyo-virtual-assistant-tasks",
    "xero-virtual-assistant-tasks",
    "quickbooks-virtual-assistant-tasks",
    "canva-virtual-assistant-tasks"
  ]) {
    const post = items.find((item) => item.slug === slug);
    assert.match(post.slug, /-tasks$/);
    assert.equal(post.intent, "informational");
    assert.doesNotMatch(post.metaTitle.toLowerCase(), /\bhire\b/);
    assert.doesNotMatch(post.title.toLowerCase(), /^hire\b/);
  }
});


test("round two service guides answer adjacent intent without replacing money pages", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));

  const creative = bySlug.get("creative-virtual-assistant-vs-graphic-designer");
  assert.equal(creative.intent, "comparison");
  assert.ok(creative.internalLinks.some((link) => link.href === "/service/creative-virtual-assistant"));
  assert.ok(creative.internalLinks.some((link) => link.href === "/service/graphic-design"));
  assert.ok(creative.internalLinks.some((link) => link.href === "/software/canva-virtual-assistant"));
  assert.match(JSON.stringify(creative), /creative ownership|original visual|template/i);

  const events = bySlug.get("event-planning-virtual-assistant-tasks");
  assert.equal(events.intent, "informational");
  assert.ok(events.internalLinks.some((link) => link.href === "/service/event-planning-virtual-assistant"));
  assert.ok(events.internalLinks.some((link) => link.href === "/service/project-coordination"));
  assert.ok(events.internalLinks.some((link) => link.href === "/service/calendar"));
  assert.match(JSON.stringify(events), /run sheet|vendor|registration|dependency/i);
});

test("round two finance-software guides keep accounting judgment with accountable owners", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));
  for (const slug of ["xero-virtual-assistant-tasks", "quickbooks-virtual-assistant-tasks"]) {
    const post = bySlug.get(slug);
    const body = JSON.stringify(post);
    assert.match(body, /accounting|bookkeeping/i);
    assert.match(body, /tax|final accounting|qualified|finance professional/i);
    assert.match(body, /payment authority|bank/i);
    assert.match(body, /exception|escalat/i);
  }
});


test("round three service-support guides preserve role boundaries and adjacent intent", () => {
  const bySlug = new Map(posts().map((post) => [post.slug, post]));

  const realEstate = bySlug.get("real-estate-virtual-assistant-crm-listing-workflow");
  assert.ok(realEstate.internalLinks.some((link) => link.href === "/service/real-estate"));
  assert.ok(realEstate.internalLinks.some((link) => link.href === "/industries/real-estate-agents"));
  assert.match(JSON.stringify(realEstate), /licensed|negotiat|contract/i);

  const amazon = bySlug.get("amazon-virtual-assistant-seller-operations-workflow");
  assert.ok(amazon.internalLinks.some((link) => link.href === "/service/amazon-virtual-assistant"));
  assert.match(JSON.stringify(amazon), /account-risk|compliance|inventory|listing/i);

  const dataEntry = bySlug.get("data-entry-virtual-assistant-tasks");
  assert.equal(dataEntry.topic, "managing");
  assert.match(JSON.stringify(dataEntry), /source of truth|exception queue|quality assurance/i);

  const digital = bySlug.get("digital-marketing-virtual-assistant-tasks");
  assert.ok(digital.internalLinks.some((link) => link.href === "/service/digital-marketing-virtual-assistant"));
  assert.match(JSON.stringify(digital), /strategy|approval|budget|reporting/i);
});

test("medical admin workflow remains administrative and non-clinical", () => {
  const post = posts().find((item) => item.slug === "medical-virtual-assistant-admin-workflow");
  const body = JSON.stringify(post);
  assert.match(body, /non-clinical/i);
  assert.match(body, /does not diagnose|do not interpret|without giving clinical advice/i);
  assert.match(body, /privacy/i);
  assert.ok(post.internalLinks.some((link) => link.href === "/service/medical-virtual-assistant"));
  assert.ok(post.internalLinks.some((link) => link.href === "/resources/virtual-assistant-job-description"));
});

test("bookkeeping month-end workflow links the service owner to Xero and QuickBooks support content", () => {
  const post = posts().find((item) => item.slug === "bookkeeping-virtual-assistant-month-end-workflow");
  const hrefs = post.internalLinks.map((link) => link.href);
  assert.ok(hrefs.includes("/service/bookkeeping"));
  assert.ok(hrefs.includes("/blog/xero-virtual-assistant-tasks"));
  assert.ok(hrefs.includes("/blog/quickbooks-virtual-assistant-tasks"));
  assert.match(JSON.stringify(post), /tax decisions|payment authority|accounting treatment/i);
});
