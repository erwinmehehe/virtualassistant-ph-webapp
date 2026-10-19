import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const corpus = readFileSync(new URL("../src/lib/blog-content.ts", import.meta.url), "utf8");
const first = corpus.indexOf("= [");
const last = corpus.lastIndexOf("];");
assert.ok(first >= 0 && last > first, "the existing editorial corpus must remain parseable");
const posts = JSON.parse(corpus.slice(first + 2, last + 1));

function headingFingerprint(post) {
  let hash = 0;
  for (const char of post.sections.map((section) => section.heading).join(" || ")) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return hash >>> 0;
}

// Original heading signatures and truthful publication dates are captured
// before Batch 3. This prevents an editorial display question from changing
// a canonical section anchor or artificially refreshing article dates.
const reviewed = {
  "hire-virtual-assistant-philippines": {
    hash: 1470389889, published: "2026-02-21", updated: "2026-09-20",
    paragraphs: ["executive-support brief", "first-month review"],
    faq: "Can I assess a VA without sharing real customer or company data?",
    link: "/blog/virtual-assistant-onboarding-checklist"
  },
  "average-hourly-rate-virtual-assistants-philippines": {
    hash: 3404434271, published: "2026-03-01", updated: "2026-09-23",
    paragraphs: ["historical snapshot", "transparent planning sheet"],
    faq: "Does a preferred profile rate guarantee that an assistant will accept an offer?",
    link: "/blog/how-many-hours-hire-virtual-assistant"
  },
  "onlinejobs-ph-vs-virtual-assistant-agency": {
    hash: 3662480778, published: "2026-08-09", updated: "2026-08-09",
    paragraphs: ["responsibility matrix", "misses a customer-support shift"],
    faq: "Should I compare current OnlineJobs.ph terms with the agency agreement?",
    link: "/blog/virtual-assistant-interview-questions"
  },
  "customer-service-tasks": {
    hash: 1040425132, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["four-column triage sheet", "refund policy card"],
    faq: "What should a support VA do when a customer requests an out-of-policy refund?",
    link: "/blog/virtual-assistant-email-management-tasks-sops"
  },
  "customer-service-interview-questions": {
    hash: 375987375, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["fictional case", "client shift date"],
    faq: "How can employers compare support writing samples fairly?",
    link: "/blog/virtual-assistant-interview-questions"
  },
  "executive-virtual-assistant-tasks": {
    hash: 3502151335, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["three-tier calendar rule", "leadership meeting"],
    faq: "How much calendar authority should an executive VA receive at first?",
    link: "/blog/virtual-assistant-onboarding-checklist"
  },
  "ecommerce-tasks": {
    hash: 3071130012, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["daily store checklist", "decision table"],
    faq: "Should one ecommerce VA be responsible for every sales channel?",
    link: "/blog/virtual-assistant-team"
  },
  "amazon-virtual-assistant-tasks": {
    hash: 1094334933, published: "2026-08-09", updated: "2026-09-20",
    paragraphs: ["order-exception review", "catalog-update checklist"],
    faq: "Should an Amazon VA submit account-health appeals independently?",
    link: "/blog/virtual-assistant-tools"
  },
  "shopify-virtual-assistant-tasks": {
    hash: 3389649243, published: "2026-08-09", updated: "2026-08-09",
    paragraphs: ["workflow cards", "product-upload brief"],
    faq: "Can a Shopify VA install apps or change payment settings without approval?",
    link: "/blog/virtual-assistant-tools"
  },
  "seo-interview-questions": {
    hash: 463877738, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["fictional Search Console", "example prioritization"],
    faq: "Should an SEO VA candidate promise higher rankings or traffic?",
    link: "/blog/digital-marketing-virtual-assistant-tasks"
  },
  "bookkeeping-tasks": {
    hash: 3208301929, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["weekly close-prep queue", "bank-statement mismatch"],
    faq: "Can a bookkeeping VA approve journal entries or tax filings?",
    link: "/blog/bookkeeping-virtual-assistant-month-end-workflow"
  },
  "medical-virtual-assistant-tasks": {
    hash: 805737826, published: "2026-08-09", updated: "2026-09-19",
    paragraphs: ["patient-reminder workflow", "referral-status handoff"],
    faq: "Can a medical VA advise a patient who describes urgent symptoms?",
    link: "/blog/medical-virtual-assistant-admin-workflow"
  }
};

test("Batch 3 contains twelve distinct, specifically authored answer-first guides", () => {
  assert.equal(Object.keys(reviewed).length, 12);
  assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length, "duplicate canonical slug");
  for (const [slug, spec] of Object.entries(reviewed)) {
    const post = posts.find((entry) => entry.slug === slug);
    assert.ok(post, "missing article: " + slug);
    assert.match(post.quickAnswerQuestion || "", /\?$/u, "missing natural answer-first question: " + slug);
    assert.ok(post.quickAnswer && post.quickAnswer !== post.description, "missing authored answer: " + slug);
    const words = post.quickAnswer.trim().split(/\s+/u).length;
    assert.ok(words >= 45 && words <= 85, "complete concise answer required: " + slug + ": " + words);
    assert.ok(post.sections.length >= 8, "guide depth lost: " + slug);
    const displayQuestions = post.sections.map((section) => section.questionHeading);
    assert.ok(displayQuestions.every((q) => typeof q === "string" && /\?$/u.test(q)),
      "all section questions must be reviewed: " + slug);
    assert.equal(new Set(displayQuestions).size, displayQuestions.length, "repeated display questions: " + slug);
    assert.equal(headingFingerprint(post), spec.hash, "original section anchor text changed: " + slug);
    assert.equal(post.publishedAt, spec.published, "original publication date changed: " + slug);
    assert.equal(post.updatedAt, spec.updated, "unapproved date freshness claim: " + slug);
    if (slug === "average-hourly-rate-virtual-assistants-philippines") {
      assert.equal(post.legacyPath, "/average-hourly-rate-virtual-assistants-philippines/",
        "first-party rate guide root canonical must stay intact");
    } else {
      assert.equal(post.legacyPath, undefined, "unintended legacy route on " + slug);
    }
    assert.ok(post.author && post.title && post.excerpt, "article attribution missing: " + slug);
    assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 65, "meta title length: " + slug);
    assert.ok(post.description.length >= 130 && post.description.length <= 165, "meta description length: " + slug);
    const text = post.sections.flatMap((section) => [...(section.paragraphs || []), ...(section.bullets || [])]).join(" ").toLowerCase();
    for (const excerpt of spec.paragraphs) {
      assert.ok(text.includes(excerpt.toLowerCase()), "missing practical example on " + slug + ": " + excerpt);
    }
    assert.equal(post.faqs.length, 7, "should add exactly one substantive visible FAQ: " + slug);
    assert.ok(post.faqs.some((faq) => faq.question === spec.faq), "specific FAQ missing: " + slug);
    assert.equal(new Set(post.faqs.map((faq) => faq.question.trim().toLowerCase())).size,
      post.faqs.length, "duplicate FAQ: " + slug);
    assert.ok(post.internalLinks.some((link) => link.href === spec.link), "relevant link missing: " + slug);
    assert.equal(new Set(post.internalLinks.map((link) => link.href)).size,
      post.internalLinks.length, "duplicate internal destination: " + slug);
  }
});

test("regulated or numerical copy preserves its evidence and approval boundaries", () => {
  const bySlug = (slug) => posts.find((post) => post.slug === slug);
  const rates = bySlug("average-hourly-rate-virtual-assistants-philippines").quickAnswer;
  assert.match(rates, /September 22, 2026/);
  assert.match(rates, /93 rate-reporting assistants/);
  assert.match(rates, /not an independent wage survey/);
  const seo = bySlug("seo-interview-questions").quickAnswer;
  assert.match(seo, /rather than promises of rankings/);
  const medical = bySlug("medical-virtual-assistant-tasks").quickAnswer;
  assert.match(medical, /licensed staff/);
  assert.match(medical, /role-based access/);
  const bookkeeping = bySlug("bookkeeping-tasks").quickAnswer;
  assert.match(bookkeeping, /qualified reviewer/);
  assert.match(bookkeeping, /tax positions/);
  const hiring = bySlug("hire-virtual-assistant-philippines").quickAnswer;
  assert.match(hiring, /limited account access/);
});

test("visible Quick Answers, FAQs, and immutable section anchors remain wired into the article template", () => {
  const template = readFileSync(new URL("../src/components/blog-article.tsx", import.meta.url), "utf8");
  assert.match(template, /post\.quickAnswer\?\.trim\(\)/u);
  assert.match(template, /editorialQuestionHeading\(section\.heading, section\.questionHeading\)/u);
  assert.match(template, /idFor\(section\.heading\)/u);
  const faq = readFileSync(new URL("../src/app/blog/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(faq, /faqSchema\(/u);
});
