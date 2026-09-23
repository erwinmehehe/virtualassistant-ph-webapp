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

test("hourly-rate guide exposes first-party data and useful monthly examples", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "average-hourly-rate-virtual-assistants-philippines");
  assert.ok(post);
  const body = JSON.stringify(post);
  assert.match(body, /137 Filipino Virtual Assistant profiles/);
  assert.match(body, /93 profiles reporting/);
  assert.match(body, /median preferred rate is \$5 per hour/);
  assert.match(body, /average is \$6\.61/);
  assert.match(body, /current profile form requires new candidates to enter at least \$6 per hour/);
  assert.match(body, /about \$1,039 per month/);
  assert.ok(post.sections.some((section) => section.table?.headers?.includes("20 hrs/week")));
  assert.equal(post.updatedAt, "2026-09-23");
});

test("salary guide separates salary from contractor and agency pricing", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "virtual-assistant-salary-philippines");
  assert.ok(post);
  const body = JSON.stringify(post);
  assert.match(body, /employee salary/);
  assert.match(body, /independent contractor/);
  assert.match(body, /agency or managed service/i);
  assert.match(body, /not employee salary records/i);
  assert.match(body, /\$1,039 per month/);
  assert.ok(post.internalLinks.some((link) => link.href === "/research/virtual-assistant-rates-philippines-2026"));
  assert.ok(post.internalLinks.some((link) => link.href === "/blog/how-to-pay-a-filipino-virtual-assistant-directly"));
});

test("SSS PhilHealth and Pag-IBIG guide uses official program sources", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va");
  assert.ok(post);
  const urls = (post.sources || []).map((item) => item.href);
  assert.ok(urls.some((href) => href.startsWith("https://www.sss.gov.ph/")));
  assert.ok(urls.some((href) => href.startsWith("https://www.philhealth.gov.ph/")));
  assert.ok(urls.some((href) => href.startsWith("https://www.pagibigfund.gov.ph/")));
  assert.doesNotMatch(JSON.stringify(post.sources), /privacy\.gov\.ph/);
  const body = JSON.stringify(post);
  assert.match(body, /Self-Earning Individual/);
  assert.match(body, /Pag-IBIG Fund Circular No\. 274/);
  assert.match(body, /contract label/i);
  assert.match(body, /cross-border|overseas client/i);
  assert.equal(post.updatedAt, "2026-09-23");
});

test("near-page-one archive guides now include decision modules and current review date", () => {
  const posts = parseArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const checks = new Map([
    ["get-paid-virtual-assistant-philippines", "Choose the payment setup by what reaches your Philippine account"],
    ["general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines", "When one role should become two roles"],
    ["hourly-rates-for-filipino-virtual-project-manager", "Use broader VA rate data as context, not a project-manager benchmark"],
    ["how-to-pay-a-filipino-virtual-assistant-directly", "Direct-payment checklist for the client"]
  ]);
  for (const [slug, marker] of checks) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.equal(post.updatedDate, "September 23, 2026");
    assert.match(post.html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const comparison = posts.find((item) => item.slug.startsWith("general-virtual-assistant-vs-executive"));
  assert.match(comparison.html, /\/blog\/virtual-assistant-team/);
  const direct = posts.find((item) => item.slug === "how-to-pay-a-filipino-virtual-assistant-directly");
  assert.match(direct.html, /do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va/);
});

test("new demand guides reinforce GSC-proven canonical owners", () => {
  const links = source("src/lib/seo-priority-links.ts");
  assert.match(links, /"part-time-virtual-assistant-jobs-philippines": \[SALARY_GUIDE, RATE_GUIDE, GET_PAID_GUIDE\]/);
  assert.match(links, /"virtual-assistant-side-hustle-philippines": \[GET_PAID_GUIDE, SALARY_GUIDE, RATE_GUIDE\]/);
  assert.match(links, /"virtual-assistant-team": \[GENERAL_VS_EXECUTIVE, PRICING_HUB, HIRE_HUB\]/);
  assert.match(links, /"virtual-assistant-tasks": \[RATE_GUIDE, SERVICES_HUB, HIRE_HUB\]/);

  const plan = JSON.parse(source("data/seo-ranking-push-2026-09-22.json"));
  assert.equal(plan.newUrlPolicy.action, "defer-unverified-gaps");
});
