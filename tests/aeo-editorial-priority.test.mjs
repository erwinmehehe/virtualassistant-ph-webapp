import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function blogRecords(path) {
  const raw = source(path);
  const start = raw.indexOf("= [");
  const end = raw.lastIndexOf("];");
  assert.ok(start >= 0 && end > start, `expected an editorial array in ${path}`);
  // These editorial data modules are intentionally plain JSON-shaped arrays.
  return JSON.parse(raw.slice(start + 2, end + 1));
}

const priorityGuides = [
  ["src/lib/blog-hiring-guides.ts", "virtual-assistant-onboarding-checklist", "mailbox"],
  ["src/lib/blog-hiring-guides.ts", "how-many-hours-hire-virtual-assistant", "time audit"],
  ["src/lib/blog-opportunity-posts.ts", "virtual-assistant-interview-questions", "evidence notes"],
  ["src/lib/blog-demand-guides.ts", "part-time-virtual-assistant-jobs-philippines", "availability"],
  ["src/lib/blog-demand-guides.ts", "virtual-assistant-niches", "comparison table"],
  ["src/lib/blog-demand-guides.ts", "virtual-assistant-tasks", "testable lane"],
  ["src/lib/blog-candidate-profile-guides.ts", "how-to-create-the-best-va-profile", "five real jobs"],
  ["src/lib/blog-candidate-profile-guides.ts", "virtual-assistant-introduction-video", "microphone"],
  ["src/lib/blog-candidate-profile-guides.ts", "virtual-assistant-proposal-sample", "two most concrete"],
  ["src/lib/blog-job-search-guides.ts", "free-virtual-assistant-job-websites-philippines", "tracking sheet"],
  ["src/lib/blog-keyword-support-guides.ts", "virtual-assistant-email-management-tasks-sops", "exception list"],
  ["src/lib/blog-keyword-support-guides.ts", "digital-marketing-virtual-assistant-tasks", "Search Console"]
];

test("priority blog guides have reviewed, visible answer-first copy and natural section questions", () => {
  const cache = new Map();
  for (const [path, slug, example] of priorityGuides) {
    if (!cache.has(path)) cache.set(path, blogRecords(path));
    const post = cache.get(path).find((p) => p.slug === slug);
    assert.ok(post, `missing priority guide: ${slug}`);
    assert.match(post.quickAnswerQuestion || "", /\\?$/u, `missing editor-reviewed answer question: ${slug}`);
    assert.ok(post.quickAnswer && post.quickAnswer !== post.description, `missing authored answer: ${slug}`);
    const words = post.quickAnswer.trim().split(/\\s+/u).length;
    assert.ok(words >= 35 && words <= 85, `answer for ${slug} should be complete, concise copy; got ${words} words`);
    assert.ok(post.sections.length >= 6, `guide lacks depth: ${slug}`);
    for (const section of post.sections) {
      assert.match(section.questionHeading || "", /\\?$/u, `review section heading on ${slug}: ${section.heading}`);
    }
    const sectionCopy = post.sections.flatMap((s) => [...(s.paragraphs || []), ...(s.bullets || [])]).join(" ");
    assert.ok(sectionCopy.toLowerCase().includes(example.toLowerCase()), `missing practical editorial example in ${slug}`);
    assert.ok(post.faqs.length >= 5, `missing visible FAQ depth: ${slug}`);
    assert.equal(new Set(post.faqs.map((faq) => faq.question.trim().toLowerCase())).size, post.faqs.length, `repeated FAQ: ${slug}`);
    assert.ok(post.internalLinks.length >= 3, `missing related page connections: ${slug}`);
    assert.ok(post.metaTitle.length >= 45 && post.metaTitle.length <= 65, `check metadata title: ${slug}`);
    assert.ok(post.description.length >= 130 && post.description.length <= 165, `check meta description: ${slug}`);
  }
});

test("editorial edits leave canonical blog slugs unique and keep existing section anchors", () => {
  const paths = [...new Set(priorityGuides.map(([path]) => path))];
  const all = paths.flatMap((path) => blogRecords(path));
  const slugs = all.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const template = source("src/components/blog-article.tsx");
  assert.match(template, /idFor\\(section\\.heading\\)/u);
  assert.match(template, /editorialQuestionHeading\\(section\\.heading, section\\.questionHeading\\)/u);
  assert.match(template, /post\\.quickAnswer\\?\\.trim\\(\\)/u);
});
