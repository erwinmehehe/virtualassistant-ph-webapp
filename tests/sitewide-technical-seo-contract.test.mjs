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


test("FAQ structured data only mirrors publicly visible Q&As", async () => {
  const helper = await read("src/lib/faq-schema.ts");
  assert.match(helper, /"@type": "FAQPage"/);
  assert.match(helper, /question: string; answer: string/);
  assert.match(helper, /acceptedAnswer/);

  const withVisibleFaqs = [
    ["src/app/blog/[slug]/page.tsx", /faqSchema\(url, post\.faqs\)/],
    ["src/app/service/[slug]/page.tsx", /faqSchema\(pageUrl, faqs\.map/],
    ["src/app/industries/[slug]/page.tsx", /faqSchema\(pageUrl, faqs\.map/],
    ["src/app/training/page.tsx", /faqSchema\(trainingUrl, FAQS\.map/],
    ["src/app/jobs/page.tsx", /faqSchema\(canonicalUrl\("\/jobs"\), jobFaqs\.map/],
    ["src/app/jobs/[id]/page.tsx", /faqSchema\(pageUrl, jobFaqs\)/],
  ];
  for (const [path, pattern] of withVisibleFaqs) {
    assert.match(await read(path), pattern, `${path}: FAQs must be generated from visible content`);
  }

  // Do not add an empty or invented FAQ just to check a schema box.
  for (const path of ["src/app/about/page.tsx", "src/app/resources/[slug]/page.tsx", "src/app/software/[slug]/page.tsx"]) {
    assert.doesNotMatch(await read(path), /faqSchema\(|"@type": "FAQPage"/);
  }
});

test("public schema templates converge on the canonical VAPH website and organization IDs", async () => {
  const organization = await read("src/lib/organization.ts");
  assert.match(organization, /export function websiteId\(base: string\)/);
  assert.match(organization, /#website/);
  assert.match(organization, /#organization/);

  const templates = [
    "src/app/page.tsx",
    "src/app/service/[slug]/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/resources/[slug]/page.tsx",
    "src/app/jobs/[id]/page.tsx",
    "src/app/software/[slug]/page.tsx",
    "src/app/industries/[slug]/page.tsx",
  ];

  for (const path of templates) {
    const page = await read(path);
    assert.match(page, /organizationId\(base\)/, `${path} must reference the canonical organization ID`);
    assert.match(page, /websiteId\(base\)/, `${path} must reference the canonical website ID`);
    assert.match(page, /"@type": "WebPage"/, `${path} must expose a WebPage node`);
    assert.match(page, /isPartOf: \{ "@id": siteId \}/, `${path} WebPage must connect to #website`);
  }
});

test("content and commerce entities point back to their canonical WebPage nodes", async () => {
  const expectations = [
    ["src/app/service/[slug]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
    ["src/app/blog/[slug]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
    ["src/app/resources/[slug]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
    ["src/app/jobs/[id]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
    ["src/app/software/[slug]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
    ["src/app/industries/[slug]/page.tsx", /mainEntityOfPage: \{ "@id": webpageId \}/],
  ];

  for (const [path, pattern] of expectations) {
    assert.match(await read(path), pattern, `${path} entity must point to its canonical WebPage`);
  }
});
