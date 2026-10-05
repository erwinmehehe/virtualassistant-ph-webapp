import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production SEO audit covers every important public content family", async () => {
  const audit = await read("scripts/audit-seo-production.mjs");

  for (const prefix of ["/service/", "/resources/", "/software/", "/blog/", "/research/", "/industries/", "/jobs/"]) {
    assert.match(audit, new RegExp(prefix.replaceAll("/", "\\/")));
  }

  for (const path of [
    "/jobs",
    "/post-a-job",
    "/training",
    "/for-virtual-assistants",
    "/blog/how-to-create-the-best-va-profile",
    "/blog/virtual-assistant-introduction-video",
    "/blog/virtual-assistant-proposal-sample",
  ]) {
    assert.match(audit, new RegExp(path.replaceAll("/", "\\/")));
  }

  assert.match(audit, /missing og:title/);
  assert.match(audit, /missing og:description/);
  assert.match(audit, /missing og:image/);
  assert.match(audit, /missing twitter:card/);
  assert.match(audit, /blog article missing Article schema/);
  assert.match(audit, /job detail missing JobPosting schema/);
  assert.match(audit, /private routes found in sitemap/);
  assert.match(audit, /query or fragment URLs found in sitemap/);
  assert.match(audit, /robots\.txt does not reference the canonical sitemap/);
  assert.match(audit, /llms\.txt exposes a private route/);
});

test("llms.txt surfaces the candidate application journey without private routes", async () => {
  const llms = await read("src/app/llms.txt/route.ts");

  for (const slug of [
    "how-to-create-the-best-va-profile",
    "virtual-assistant-resume-sample",
    "virtual-assistant-portfolio-examples",
    "virtual-assistant-introduction-video",
    "virtual-assistant-proposal-sample",
    "how-to-apply-as-a-virtual-assistant",
  ]) {
    assert.match(llms, new RegExp(slug));
  }

  assert.match(llms, /## Candidate Application Guides/);
  assert.match(llms, /BLOG_POSTS/);
  assert.match(llms, /blogHref/);
  assert.doesNotMatch(llms, /workspace\/recruiter|workspace\/client|workspace\/va/);
});


test("public templates keep visible FAQs but never emit FAQPage structured data", async () => {
  const publicTemplates = [
    "src/app/page.tsx",
    "src/app/[legacy]/page.tsx",
    "src/app/service/[slug]/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/resources/[slug]/page.tsx",
    "src/app/software/[slug]/page.tsx",
    "src/app/industries/[slug]/page.tsx",
    "src/app/jobs/page.tsx",
    "src/app/training/page.tsx",
  ];

  for (const path of publicTemplates) {
    const page = await read(path);
    assert.doesNotMatch(page, /FAQPage/, `${path} must not emit FAQPage schema`);
  }
});
