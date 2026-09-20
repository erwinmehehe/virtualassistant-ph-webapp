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

const authoritySlugs = [
  "bookkeeping-cost-philippines",
  "how-to-hire-a-bookkeeping",
  "executive-virtual-assistant-cost-philippines",
  "how-to-hire-a-executive-virtual-assistant",
  "medical-virtual-assistant-cost-philippines",
  "how-to-hire-a-medical-virtual-assistant",
  "best-tools-for-medical-virtual-assistant",
  "real-estate-tasks",
  "how-to-hire-a-real-estate",
  "ecommerce-interview-questions",
  "amazon-virtual-assistant-tasks",
  "how-to-hire-a-amazon-virtual-assistant",
  "lead-generation-cost-philippines",
  "how-to-hire-a-lead-generation",
  "customer-service-cost-philippines",
  "how-to-hire-a-customer-service",
  "legal-virtual-assistant-cost-philippines",
  "how-to-hire-a-legal-virtual-assistant",
  "how-much-virtual-assistant-philippines",
  "hire-virtual-assistant-philippines"
];

test("20 authority posts contain explicit recruiter field notes", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  assert.equal(authoritySlugs.length, 20);
  for (const slug of authoritySlugs) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: missing`);
    assert.equal(post.updatedAt, "2026-09-20", `${slug}: needs current substantive update date`);
    assert.ok((post.fieldNotes || []).length >= 3, `${slug}: needs at least three recruiter field notes`);
    const notes = (post.fieldNotes || []).join(" ");
    assert.match(notes, /screen|candidate|shortlist|interview|hire|recruit/i, `${slug}: notes need hiring evidence`);
    assert.doesNotMatch(notes, /game.?changer|delve|unlock the potential|seamless solution/i);
  }
});

test("blog articles render dated first-party marketplace evidence and recruiter notes", () => {
  const article = source("src/components/blog-article.tsx");
  const evidence = source("src/lib/editorial-evidence.ts");
  assert.match(article, /marketplaceEvidenceForPost/);
  assert.match(article, /Recruiter field notes/);
  assert.match(article, /Marketplace snapshot/);
  assert.match(article, /post\.fieldNotes\?\.length \? marketplaceEvidenceForPost/);
  assert.match(evidence, /asOf: "2026-09-20"/);
  assert.match(evidence, /approvedBenchProfiles: 101/);
  assert.match(evidence, /shortlistRows: 444/);
  assert.match(evidence, /shortlistJobs: 58/);
  assert.match(evidence, /medianYearsExperience: 3/);
  assert.match(evidence, /experienceSample: 85/);
  assert.match(evidence, /medianWeeklyHours: 40/);
  assert.match(evidence, /weeklyHoursSample: 83/);
  assert.match(evidence, /medianOverlapHours: 4/);
  assert.match(evidence, /overlapSample: 67/);
  assert.match(evidence, /candidateSkills:/);
  assert.match(evidence, /"Customer Support": 20/);
  assert.match(evidence, /"Calendar Management": 17/);
  assert.match(evidence, /"Data Entry": 17/);
  assert.match(evidence, /No structured candidate rejection-reason records are currently available/);
  assert.match(evidence, /self-reported|optional fields|not a market-wide survey/i);
});

test("role blogs expose relevant industry guides from the service-industry map", () => {
  const article = source("src/components/blog-article.tsx");
  assert.match(article, /INDUSTRIES/);
  assert.match(article, /Relevant industry guides/);
  assert.match(article, /industry\.serviceSlugs\.includes\(post\.serviceSlug/);
});

test("archive keeps distinct intent and consolidates broad duplicates", () => {
  const archive = parseArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");
  const slugs = new Set(archive.map((item) => item.slug));
  const retained = [
    "become-virtual-assistant-no-experience",
    "ecommerce-va-vs-in-house-assistant",
    "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
    "get-paid-virtual-assistant-philippines",
    "hourly-rates-for-filipino-virtual-project-manager",
    "how-a-filipino-va-can-manage-your-ai-workflow",
    "how-to-become-bookkeeping-virtual-assistant",
    "how-to-pay-a-filipino-virtual-assistant-directly",
    "how-to-securely-share-passwords-and-credit-cards-with-an-overseas-va-2",
  ];
  const removed = [
    "can-a-filipino-va-be-hipaa-compliant-security-checklist",
    "filipino-virtual-assistant-the-complete-hiring-guide",
    "filipino-vs-indian-virtual-assistant",
    "hire-healthcare-virtual-assistant-philippines",
    "hiring-real-estate-virtual-assistant-philippines",
    "how-much-to-pay-a-filipino-virtual-assistant-2026-guide",
    "how-to-find-virtual-assistant-philippines",
    "how-to-hire-a-virtual-assistant-philippines",
    "how-to-hire-ecommerce-virtual-assistant",
    "how-to-pay-a-virtual-assistant-in-the-philippines-in-depth-2026-guide",
    "medical-virtual-assistant-philippines-guide",
    "rate-project-manager-virtual-assistant",
    "seo-virtual-assistant-philippines-guide",
    "virtual-assistant-hourly-rate-philippines",
    "virtual-assistant-outsourcing-guide",
    "virtual-assistant-services-philippines-guide",
    "ai-augmented-vas-why-you-should-pay-for-output-not-hours",
    "virtual-assistant-agency-philippines-guide"
  ];
  assert.equal(archive.length, 9);
  for (const slug of retained) assert.ok(slugs.has(slug), `${slug}: distinct archive article should stay`);
  for (const slug of removed) assert.equal(slugs.has(slug), false, `${slug}: overlapping archive article should be consolidated`);
});

test("content clusters do not contain duplicate role plus editorial-family pages", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const family = (post) => {
    const slug = post.slug;
    if (/cost|hourly-rate/.test(slug)) return "cost";
    if (/interview/.test(slug)) return "interview";
    if (/tasks/.test(slug)) return "tasks";
    if (/how-to-hire|hire-.*virtual-assistant/.test(slug)) return "hiring";
    if (/job-description/.test(slug)) return "job-description";
    if (/how-to-train/.test(slug)) return "training";
    if (/best-tools/.test(slug)) return "tools";
    if (/what-does|what-is-a-virtual/.test(slug)) return "role-definition";
    return null;
  };
  const seen = new Map();
  for (const post of posts) {
    if (!post.serviceSlug) continue;
    const editorialFamily = family(post);
    if (!editorialFamily) continue;
    const key = `${post.serviceSlug}:${editorialFamily}`;
    assert.equal(seen.has(key), false, `${key}: duplicate pages ${seen.get(key)} and ${post.slug}`);
    seen.set(key, post.slug);
  }
});
