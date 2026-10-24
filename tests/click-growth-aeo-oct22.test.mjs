import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function parseLiteralArray(path, marker) {
  const text = source(path);
  const i = text.indexOf(marker);
  assert.ok(i >= 0, marker + " missing");
  const start = text.indexOf("[", i + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

test("October click-growth cover guide includes useful copy-ready samples", () => {
  const text = source("src/lib/seo-resource-pages.ts");
  const start = text.indexOf('slug: "virtual-assistant-cover-letter"');
  const end = text.indexOf('slug: "best-laptop-for-virtual-assistant"', start);
  const block = text.slice(start, end);
  assert.ok(start >= 0 && end > start);
  for (const phrase of [
    "Virtual Assistant Cover Letter Samples (2026) | PH Guide",
    "cover letter sample for beginners",
    "cover letter sample for experienced",
    "Copy-and-fill Virtual Assistant cover letter template",
    "Customize the sample before sending",
    "Do not invent client names"
  ]) assert.ok(block.includes(phrase), "Missing " + phrase);
  assert.match(source("src/lib/editorial-seo-guides.ts"), /What should a Virtual Assistant cover letter include/);
});

test("laptop CTR improvement does not remove existing comparison research", () => {
  const text = source("src/lib/seo-resource-pages.ts");
  const start = text.indexOf('slug: "best-laptop-for-virtual-assistant"');
  const end = text.indexOf('slug: "freelance-platforms-for-virtual-assistants"', start);
  const block = text.slice(start, end);
  for (const phrase of ["8 GB vs 16 GB", "Windows vs Mac", "Laptop requirements by Virtual Assistant niche", "Current laptop families worth comparing"]) {
    assert.ok(block.includes(phrase), "Lost laptop research " + phrase);
  }
  assert.ok(block.includes("Best Laptop for Virtual Assistant Work (2026): PH Guide"));
});

test("payment guide has evidence-linked named methods and valid metadata", () => {
  const posts = parseLiteralArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const post = posts.find((item) => item.slug === "get-paid-virtual-assistant-philippines");
  assert.ok(post);
  assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 60);
  assert.ok(post.metaDescription.length >= 140 && post.metaDescription.length <= 160);
  for (const phrase of ["Wise", "Payoneer", "PayPal", "Bank-to-bank transfer", "https://wise.com", "https://www.payoneer.com", "USD 500"]) {
    assert.ok(post.html.includes(phrase), "Missing payment guidance " + phrase);
  }
});

test("commercial service updates keep metadata within SERP length budget", () => {
  const pages = parseLiteralArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  for (const slug of ["it-virtual-assistant", "operations", "dental-virtual-assistant"]) {
    const p = pages.find((page) => page.slug === slug);
    assert.ok(p, slug + " missing");
    assert.ok(p.metaTitle.length >= 30 && p.metaTitle.length <= 60, slug + " title length");
    assert.match(p.metaTitle, /Philippines$/, slug + " title must preserve its canonical phrase");
    assert.equal(p.metaTitle.includes("|"), false, slug + " title must remain pure");
    assert.ok(p.metaDescription.length >= 140 && p.metaDescription.length <= 160, slug + " description length");
    assert.ok(p.outcomes.length >= 3);
    assert.match(p.intro, /Virtual Assistant in the Philippines/i);
  }
});

test("salary and hourly-rate quick answers disclose sample limits", () => {
  const text = source("src/lib/blog.ts");
  assert.match(text, /CLICK_GROWTH_POST_OVERRIDES/);
  assert.match(text, /virtual-assistant-salary-philippines/);
  assert.match(text, /average-hourly-rate-virtual-assistants-philippines/);
  assert.match(text, /not accepted pay or employee salary records/);
  assert.match(text, /not verified payroll data/);
});

test("payment revisions preserve the original query owner and editorial audit date", () => {
  const posts = parseLiteralArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const paid = posts.find((post) => post.slug === "get-paid-virtual-assistant-philippines");
  assert.ok(paid);
  assert.equal(paid.metaTitle, "How to Get Paid as a Virtual Assistant in the Philippines");
  assert.equal(paid.updatedDate, "October 24, 2026");
  const decisions = JSON.parse(source("data/archive-editorial-decisions.json"));
  assert.equal(decisions.items.find((item) => item.slug === paid.slug).completedAt, "2026-10-24");
  assert.match(source("src/lib/blog.ts"), /BLOG_POSTS.push\(\.\.\.BLOG_AEO_GUIDES\)/);
});
