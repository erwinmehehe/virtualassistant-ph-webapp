import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function prunePolicy() {
  const policy = await read("src/lib/seo-prune.ts");
  const redirects = JSON.parse(policy.match(/SEO_PRUNE_REDIRECTS: Record<string, string> = (\{[\s\S]*?\});/)?.[1] ?? "null");
  const noindex = JSON.parse(policy.match(/new Set<string>\((\[[\s\S]*?\])\)/)?.[1] ?? "null");
  return { redirects, noindex, policy };
}

test("CSV pruning maps 77 redirects and 27 unique software noindex routes", async () => {
  const { redirects, noindex } = await prunePolicy();
  assert.equal(Object.keys(redirects).length, 77);
  assert.equal(noindex.length, 27);
  assert.equal(new Set(noindex).size, 27);
  assert.equal(Object.keys(redirects).filter((path) => redirects[path] === path).length, 0);

  const serviceData = await read("src/lib/service-pages.ts");
  const serviceSlugs = new Set([...serviceData.matchAll(/"slug": "([^"]+)"/g)].map((match) => match[1]));
  const softwareData = await read("src/lib/software-pages.ts");
  const softwareSlugs = new Set([...softwareData.matchAll(/^\s*slug: "([^"]+)"/gm)].map((match) => match[1]));
  for (const slug of noindex) {
    assert.ok(softwareSlugs.has(slug), `noindex software ${slug} must exist`);
    assert.equal(redirects[`/software/${slug}`], undefined, `noindex and redirect must not overlap: ${slug}`);
  }

  const costServices = new Set();
  for (const [source, destination] of Object.entries(redirects)) {
    assert.ok(source.startsWith("/") && destination.startsWith("/"));
    assert.ok(!redirects[destination], `new redirect must not point to another new redirect: ${source}`);
    if (destination.startsWith("/service/")) {
      const slug = destination.slice("/service/".length);
      assert.ok(serviceSlugs.has(slug), `missing target service page: ${slug}`);
      if (source.endsWith("-cost-philippines")) costServices.add(slug);
    }
  }
  assert.equal(costServices.size, 40);
});

test("Next redirects dedupe legacy routes and repoint chains in one hop", async () => {
  const config = await read("next.config.ts");
  assert.match(config, /Object\.entries\(SEO_PRUNE_REDIRECTS\)\.flatMap/);
  assert.match(config, /source: source \+ "\/"/);
  assert.match(config, /existing\.source === rule\.source/);
  assert.match(config, /resolvePrunedSeoHref\(rule\.destination\)/);
});

test("noindex software retains accessible pages but is removed from sitemap", async () => {
  const route = await read("src/app/software/[slug]/page.tsx");
  const sitemap = await read("src/app/sitemap.ts");
  assert.match(route, /SEO_PRUNE_NOINDEX_SOFTWARE_SLUGS\.has\(page\.slug\)/);
  assert.match(route, /robots: \{ index: false, follow: true/);
  assert.match(sitemap, /SEO_PRUNE_NOINDEX_SOFTWARE_SLUGS\.has\(page\.slug\)/);
  assert.match(sitemap, /isPrunedRedirectSource\(blogHref\(post\)\)/);
  assert.match(sitemap, /isPrunedRedirectSource\(`\/resources\/\$\{page\.slug\}`\)/);
  assert.match(sitemap, /isPrunedRedirectSource\(`\/software\/\$\{page\.slug\}`\)/);
});

test("retired guides are omitted from hub listings and their links are repointed", async () => {
  const blog = await read("src/lib/blog.ts");
  const resources = await read("src/lib/seo-resource-pages.ts");
  const priority = await read("src/lib/seo-priority-links.ts");
  const softwareHub = await read("src/app/software/page.tsx");
  assert.match(blog, /BLOG_POSTS\.splice\(index, 1\)/);
  assert.match(blog, /href: resolvePrunedSeoHref\(link\.href\)/);
  assert.match(resources, /\.filter\(\(page\) => !isPrunedRedirectSource/);
  assert.match(resources, /href: resolvePrunedSeoHref\(link\.href\)/);
  assert.match(priority, /activePriorityLinks/);
  assert.match(softwareHub, /directorySoftwarePages/);
});

test("service pages receiving cost redirects add grounded budget guidance", async () => {
  const route = await read("src/app/service/[slug]/page.tsx");
  assert.match(route, /SEO_PRUNE_COST_SERVICE_SLUGS\.has\(s\.slug\)/);
  assert.match(route, /id="philippines-va-cost"/);
  assert.match(route, /s\.costFactors\.slice\(0, 3\)/);
  assert.match(route, /candidate preferences, not a confirmed price/);
  assert.match(route, /href="\/average-hourly-rate-virtual-assistants-philippines"/);
});

test("QuickBooks blog references bypass the retired software URL", async () => {
  const article = await read("src/components/blog-article.tsx");
  const guides = await read("src/lib/blog-keyword-support-guides.ts");
  assert.ok(article.includes('href={resolvePrunedSeoHref(`/software/${software.slug}`)}'));
  assert.ok(guides.includes('"href": "/service/quickbooks-virtual-assistant"'));
  assert.ok(!guides.includes('"href": "/software/quickbooks"'));
});
