import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public content families use visible answer-first summaries", () => {
  const paths = [
    "src/components/blog-article.tsx",
    "src/components/archive-article.tsx",
    "src/app/blog/page.tsx",
    "src/app/services/page.tsx",
    "src/app/service/[slug]/page.tsx",
    "src/app/industries/page.tsx",
    "src/app/industries/[slug]/page.tsx",
    "src/app/training/page.tsx",
    "src/app/jobs/page.tsx",
    "src/app/jobs/[id]/page.tsx",
  ];
  for (const path of paths) {
    assert.match(source(path), /<AnswerFirst\b/, `${path} needs a visible quick answer`);
  }
  const component = source("src/components/answer-first.tsx");
  assert.match(component, /<h2 id=/);
  assert.match(component, /<p>\{answer\}<\/p>/);
  assert.match(source("src/app/layout.tsx"), /answer-first\.css/);
});

test("blog summary and heading overrides remain available to editors", () => {
  assert.match(source("src/lib/blog-types.ts"), /quickAnswerQuestion\?: string/);
  assert.match(source("src/lib/blog-types.ts"), /questionHeading\?: string/);
  const article = source("src/components/blog-article.tsx");
  assert.match(article, /post\.quickAnswer\?\.trim\(\)/);
  assert.match(article, /editorialQuickAnswer\(post\.description, post\.keyTakeaways\)/);
  assert.match(article, /editorialQuestionHeading\(section\.heading, section\.questionHeading\)/);
  assert.match(article, /idFor\(section\.heading\)/); // stable canonical section anchors
});

test("training schemas never reveal unpublished courses or private lesson content", () => {
  const page = source("src/app/training/page.tsx");
  assert.match(page, /publishedCourses = courses\.filter\(\(course\) => course\.status === "published"\)/);
  assert.match(page, /itemListElement: publishedCourses\.map/);
  assert.match(page, /"@type": "Course"/);
  assert.match(page, /id=\{`course-\$\{course\.slug\}`\}/);
  assert.doesNotMatch(page, /training_lessons|training_practical_responses|certificate_token/);
});

test("published job details retain verified job schema and render the same visible FAQs", () => {
  const page = source("src/app/jobs/[id]/page.tsx");
  assert.match(page, /"@type": "JobPosting"/);
  assert.match(page, /validThrough: job\.expires_at/);
  assert.match(page, /applicantLocationRequirements/);
  assert.match(page, /faqSchema\(pageUrl, jobFaqs\)/);
  assert.match(page, /jobFaqs\.map\(\(faq\) =>/);
  assert.match(page, /getPublishedJob\(id\)/);
  assert.match(source("src/app/jobs/page.tsx"), /"@type": "CollectionPage"/);
});

test("AboutPage anchors the real founder to the canonical organization", () => {
  const page = source("src/app/about/page.tsx");
  assert.match(page, /"@type": "AboutPage"/);
  assert.match(page, /"@type": "Person"/);
  assert.match(page, /"Erwin Valles"/);
  assert.match(page, /organizationId\(base\)/);
  assert.match(page, /id="founder"/);
});
