import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared contextual OG metadata uses exact titles for image alt text", async () => {
  const source = await read("src/lib/og.ts");
  assert.match(source, /images:\s*\[/);
  assert.match(source, /alt: input\.title/);
  assert.match(source, /title: input\.title/);
  assert.match(source, /card: "summary_large_image"/);
  assert.ok(source.includes('return `${siteOrigin()}/api/og?${params.toString()}`;'));
});

test("dynamic OG renderer is contextual, 1200x630, and font-safe", async () => {
  const source = await read("src/app/api/og/route.tsx");
  assert.match(source, /new ImageResponse/);
  assert.match(source, /width: 1200, height: 630/);
  assert.match(source, /VIRTUAL ASSISTANT GUIDE/);
  assert.match(source, /INDUSTRY VA GUIDE/);
  assert.match(source, /SOFTWARE VA GUIDE/);
  assert.match(source, /HIRE A VIRTUAL ASSISTANT/);
  assert.match(source, /VA PRICING/);
  assert.doesNotMatch(source, /[✓↗●◆]/);
  assert.match(source, /function fontSafeText/);
  assert.match(source, /normalize\("NFKD"\)/);
  assert.match(source, /replace\(\/\[\^\\x20-\\x7E\]\//);
  assert.match(source, /fontSafeText\(url\.searchParams\.get\(key\) \|\| fallback, max\)/);
  assert.match(source, /map\(\(point\) => fontSafeText\(point, 54\)\)/);
});

test("industry and blog families use contextual OG metadata", async () => {
  const paths = [
    "src/app/industries/page.tsx",
    "src/app/industries/[slug]/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/blog/topic/[slug]/page.tsx",
    "src/app/authors/[slug]/page.tsx",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /socialMetadata\(/, path);
  }

  const industry = await read("src/app/industries/[slug]/page.tsx");
  assert.match(industry, /category: "industry"/);
  assert.match(industry, /points: industry\.workflows\.slice\(0, 4\)/);

  const blog = await read("src/app/blog/[slug]/page.tsx");
  assert.match(blog, /category: "blog"/);
  assert.match(blog, /type: "article"/);
  assert.match(blog, /author: post\.author/);
});

test("major conversion and trust pages no longer rely on root OG fallback", async () => {
  const paths = [
    "src/app/hire/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/find-talent/page.tsx",
    "src/app/about/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/how-vetting-works/page.tsx",
    "src/app/for-virtual-assistants/page.tsx",
    "src/app/jobs/page.tsx",
    "src/app/jobs/[id]/page.tsx",
    "src/app/managed-vs-direct-hire/page.tsx",
    "src/app/book-client-call/page.tsx",
    "src/app/faq/page.tsx",
    "src/app/editorial-policy/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/terms/page.tsx",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /socialMetadata\(/, path);
  }
});

test("resource, software and tool families use contextual OG metadata", async () => {
  const paths = [
    "src/app/resources/page.tsx",
    "src/app/resources/[slug]/page.tsx",
    "src/app/software/page.tsx",
    "src/app/software/[slug]/page.tsx",
    "src/app/tools/page.tsx",
    "src/app/tools/virtual-assistant-cost-calculator/page.tsx",
    "src/app/tools/virtual-assistant-hourly-to-monthly-calculator/page.tsx",
    "src/app/tools/virtual-assistant-job-description-generator/page.tsx",
    "src/app/tools/what-type-of-va-do-i-need/page.tsx",
    "src/app/research/virtual-assistant-rates-philippines-2026/page.tsx",
    "src/components/seo-authority-page.tsx",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /socialMetadata\(/, path);
  }
});

test("existing polished homepage, services and training OGs stay intact", async () => {
  const [home, services, service, training] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/services/page.tsx"),
    read("src/app/service/[slug]/page.tsx"),
    read("src/app/training/page.tsx"),
  ]);
  assert.match(home, /\/opengraph-image/);
  assert.match(services, /socialMetadata\(/);
  assert.match(service, /socialMetadata\(/);
  assert.match(service, /serviceOgCategory\(/);
  assert.match(training, /\/training\/opengraph-image/);
});
