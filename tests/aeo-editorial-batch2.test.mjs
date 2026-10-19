import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  "src/lib/blog-demand-guides.ts": {
    "virtual-assistant-non-phone-tasks": "supplier records",
    "virtual-assistant-team": "weekly grid",
    "virtual-assistant-side-hustle-philippines": "tuesday and thursday",
  },
  "src/lib/blog-opportunity-posts.ts": {
    "virtual-assistant-jobs-for-students-philippines": "source url",
    "virtual-assistant-tools": "approved communication",
  },
  "src/lib/blog-keyword-support-guides.ts": {
    "gohighlevel-virtual-assistant-tasks": "20 contact records",
    "hubspot-virtual-assistant-tasks": "data dictionary",
    "quickbooks-virtual-assistant-tasks": "reconciliation-support packet",
    "canva-virtual-assistant-tasks": "safe margins",
    "real-estate-virtual-assistant-crm-listing-workflow": "property identifier",
    "data-entry-virtual-assistant-tasks": "source-reference column",
    "bookkeeping-virtual-assistant-month-end-workflow": "document type",
  },
};

function records(path) {
  const raw = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const first = raw.indexOf("= [");
  const last = raw.lastIndexOf("];");
  assert.ok(first >= 0 && last > first, "missing data array: " + path);
  return JSON.parse(raw.slice(first + 2, last + 1));
}

test("second editorial batch has authored answers, practical steps, natural H2 questions and visible FAQs", () => {
  let updated = 0;
  for (const [path, expected] of Object.entries(files)) {
    const posts = records(path);
    for (const [slug, example] of Object.entries(expected)) {
      const post = posts.find((entry) => entry.slug === slug);
      assert.ok(post, "missing article: " + slug);
      assert.match(post.quickAnswerQuestion || "", /\?$/u, "unreviewed lead question: " + slug);
      assert.ok(post.quickAnswer && post.quickAnswer !== post.description, "missing authored answer: " + slug);
      const count = post.quickAnswer.trim().split(/\s+/u).length;
      assert.ok(count >= 35 && count <= 85, "lead answer length: " + slug + ": " + count);
      assert.ok(post.sections.length >= 7, "missing section depth: " + slug);
      for (const section of post.sections) {
        assert.match(section.questionHeading || "", /\?$/u, "unreviewed heading: " + slug + "/" + section.heading);
        assert.ok(section.heading.length > 5, "preserve original anchor heading: " + slug);
      }
      const copy = post.sections.flatMap((section) => [
        ...(section.paragraphs || []), ...(section.bullets || [])
      ]).join(" ").toLowerCase();
      assert.ok(copy.includes(example), "missing reviewed practical example: " + slug);
      assert.ok(post.faqs.length >= 5, "missing visible FAQ: " + slug);
      assert.equal(new Set(post.faqs.map((faq) => faq.question.toLowerCase().trim())).size, post.faqs.length,
        "duplicate FAQ: " + slug);
      assert.ok(post.internalLinks.length >= 4, "missing contextual internal links: " + slug);
      assert.equal(new Set(post.internalLinks.map((link) => link.href)).size, post.internalLinks.length,
        "duplicate internal link: " + slug);
      assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 65, "check meta title: " + slug);
      assert.ok(post.description.length >= 130 && post.description.length <= 165, "check meta description: " + slug);
      assert.ok(post.publishedAt && post.updatedAt, "publication fields were lost: " + slug);
      updated++;
    }
  }
  assert.equal(updated, 12);
});

test("batch two retains unique slugs and the semantic answer-first template", () => {
  const paths = Object.keys(files);
  const posts = paths.flatMap(records);
  assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length);
  const article = readFileSync(new URL("../src/components/blog-article.tsx", import.meta.url), "utf8");
  assert.match(article, /post\.quickAnswer\?\.trim\(\)/u);
  assert.match(article, /editorialQuestionHeading\(section\.heading, section\.questionHeading\)/u);
  assert.match(article, /idFor\(section\.heading\)/u);
});
