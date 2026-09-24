import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const path = "supabase/migrations/20260924113000_deepen_support_seo_training.sql";

test("deep pass covers all Customer Support and SEO lessons", async () => {
  const sql = await readFile(path, "utf8");
  const slugs = [
    "customer-support-channels-roles-and-outcomes",
    "tone-empathy-accuracy-and-ownership",
    "ticket-triage-priority-and-routing",
    "notes-tags-statuses-and-handoffs",
    "using-a-knowledge-base-without-copy-paste-support",
    "troubleshooting-boundaries-and-escalation",
    "refunds-credits-cancellations-and-policy-boundaries",
    "complaints-angry-customers-and-de-escalation",
    "sla-response-time-resolution-and-backlog",
    "quality-assurance-and-support-coaching-notes",
    "crm-and-cross-team-handoffs",
    "composite-customer-support-simulation",
    "search-intent-crawling-indexing-and-rankings",
    "keywords-topics-entities-and-cannibalization",
    "keyword-research-and-opportunity-prioritization",
    "serp-analysis-and-competitor-gap-research",
    "titles-meta-descriptions-headings-and-search-intent",
    "content-briefs-coverage-and-helpful-depth",
    "internal-linking-and-anchor-text",
    "canonicals-indexability-redirects-and-sitemap-basics",
    "google-search-console-and-performance-analysis",
    "seo-qa-reporting-and-change-validation",
    "responsible-ai-for-seo-work",
    "composite-seo-va-work-simulation",
  ];
  assert.equal(slugs.length, 24);
  for (const slug of slugs) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing lesson deep pass: " + slug);
  }
});

test("Customer Support uses distinct operational artifacts", async () => {
  const sql = await readFile(path, "utf8");
  for (const artifact of [
    "Omnichannel case consolidation record",
    "Customer response and commitment log",
    "Support queue triage board",
    "Internal note and cross-team handoff",
    "Knowledge-base source decision",
    "Support troubleshooting and escalation log",
    "Refund / cancellation exception request",
    "Complaint and de-escalation record",
    "Support backlog recovery board",
    "Support QA scorecard and coaching note",
    "CRM cross-team handoff",
    "Support shift control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing support artifact: " + artifact);
  }
});

test("SEO uses distinct evidence-based artifacts", async () => {
  const sql = await readFile(path, "utf8");
  for (const artifact of [
    "Search visibility diagnostic",
    "Keyword intent and cannibalization map",
    "Keyword opportunity matrix",
    "SERP and competitor gap brief",
    "On-page metadata specification",
    "SEO content brief",
    "Internal linking QA matrix",
    "Technical indexability and redirect issue log",
    "Search Console performance analysis",
    "SEO change validation log",
    "AI-assisted SEO verification log",
    "SEO workstream control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing SEO artifact: " + artifact);
  }
});

test("support capstone includes policy, queue, backlog, QA, and SLA evidence", async () => {
  const sql = await readFile(path, "utf8");
  for (const phrase of [
    "Northstar live support queue",
    "Northstar support policy excerpts",
    "Order and account evidence",
    "Known-issue backlog snapshot",
    "Knowledge base and macro conflict",
    "Completed case for QA review",
    "Support SLA and ownership rules",
    "Queue triage and SLA judgment",
  ]) {
    assert.ok(sql.includes(phrase), "Missing support capstone evidence: " + phrase);
  }
});

test("SEO capstone includes keyword, GSC, crawl, page, internal-link, SERP, and QA evidence", async () => {
  const sql = await readFile(path, "utf8");
  for (const phrase of [
    "AU keyword export",
    "Search Console 28-day comparison",
    "Crawler and indexability extract",
    "BrightPath page evidence",
    "Internal link opportunity file",
    "SERP notes: small business bookkeeping services",
    "SEO implementation QA claims",
    "SEO evidence discipline",
  ]) {
    assert.ok(sql.includes(phrase), "Missing SEO capstone evidence: " + phrase);
  }
});

test("migration preserves learner progress and updates lessons in place", async () => {
  const sql = await readFile(path, "utf8");
  assert.match(sql, /jsonb_array_elements\(l\.content\)/);
  assert.match(sql, /content_version=l\.content_version\+1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  assert.doesNotMatch(sql, /insert into public\.training_courses/i);
});
