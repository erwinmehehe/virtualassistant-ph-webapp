import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

test("dynamic OG endpoint is branded, contextual, and 1200x630", async () => {
  const source = await read("src/app/api/og/route.tsx");
  assert.match(source, /new ImageResponse/);
  assert.match(source, /width: 1200, height: 630/);
  assert.match(source, /VirtualAssistant/);
  assert.match(source, /#4F46E5/);
  assert.match(source, /ADMIN & EXECUTIVE SUPPORT/);
  assert.match(source, /MARKETING & SEO SUPPORT/);
  assert.match(source, /BOOKKEEPING & FINANCE SUPPORT/);
  assert.match(source, /TECHNICAL & IT SUPPORT/);
  assert.match(source, /VIRTUAL ASSISTANT GUIDE/);
  assert.match(source, /url\.searchParams\.get\("title"\)/);
  assert.match(source, /url\.searchParams\.get\("description"\)/);
  assert.match(source, /url\.searchParams\.get\("category"\)/);
});

test("social metadata sends exact title to og:title and og:image:alt", async () => {
  const source = await read("src/lib/og.ts");
  assert.match(source, /title: input\.title/);
  assert.match(source, /description: input\.description/);
  assert.match(source, /alt: input\.title/);
  assert.match(source, /params\.set\("title", clean\(input\.title/);
  assert.match(source, /params\.set\("description", clean\(input\.description/);
  assert.match(source, /siteOrigin\(\)\/api\/og\?\$\{params\.toString\(\)\}/);
  assert.doesNotMatch(source, /canonicalUrl\(\`\/api\/og\?/);
});

test("service and blog metadata use page-specific dynamic OG context", async () => {
  const [service, blog] = await Promise.all([
    read("src/app/service/[slug]/page.tsx"),
    read("src/app/blog/[slug]/page.tsx"),
  ]);

  assert.match(service, /serviceOgCategory\(page\.group\)/);
  assert.match(service, /points: localizedPage\.tasks\.slice\(0, 4\)/);
  assert.match(blog, /title: post\.metaTitle/);
  assert.match(blog, /author: post\.author/);
  assert.match(blog, /points: post\.faqs\.slice\(0, 4\)/);
});

test("all public pages with explicit metadata opt into dynamic social metadata", async () => {
  const appDir = new URL("../src/app/", import.meta.url);
  const files = (await walk(appDir.pathname))
    .filter((path) => /\/page\.(tsx|ts|jsx|js)$/.test(path));

  const failures = [];
  for (const absolute of files) {
    const path = relative(new URL("../", import.meta.url).pathname, absolute).replaceAll("\\", "/");
    if (
      path.includes("/workspace/") ||
      path.includes("/auth/") ||
      path.includes("/proposal/") ||
      path.includes("/training/review/") ||
      path.includes("/training/certificates/")
    ) continue;

    const source = await readFile(absolute, "utf8");
    if (!/export (?:async function generateMetadata|const metadata)/.test(source)) continue;
    if (/robots:\s*\{\s*index:\s*false/.test(source) && !/socialMetadata\(/.test(source)) continue;
    if (/permanentRedirect\(|redirect\(/.test(source) && !/socialMetadata\(/.test(source)) continue;

    const usesDynamicOg =
      /socialMetadata\(/.test(source) ||
      /authorityMetadata\(/.test(source);

    if (!usesDynamicOg) failures.push(path);
  }

  assert.deepEqual(failures, [], `Public metadata pages missing dynamic OG: ${failures.join(", ")}`);
});

test("legacy file-based OG routes are removed so they cannot override metadata URLs", async () => {
  const legacy = [
    "src/app/opengraph-image.tsx",
    "src/app/twitter-image.tsx",
    "src/app/training/opengraph-image.tsx",
  ];

  for (const path of legacy) {
    await assert.rejects(access(new URL(`../${path}`, import.meta.url)));
  }
});

test("major public metadata families use the shared dynamic OG helper", async () => {
  const paths = [
    "src/app/page.tsx",
    "src/app/services/page.tsx",
    "src/app/training/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/blog/topic/[slug]/page.tsx",
    "src/app/resources/[slug]/page.tsx",
    "src/app/industries/[slug]/page.tsx",
    "src/app/software/[slug]/page.tsx",
    "src/components/seo-authority-page.tsx",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /socialMetadata\(/, path);
  }
});
