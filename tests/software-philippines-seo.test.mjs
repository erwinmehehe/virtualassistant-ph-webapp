import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const softwarePath = "src/lib/software-pages.ts";
const routePath = "src/app/software/[slug]/page.tsx";

test("software SEO uses clean slugs and Philippines keyword targeting", async () => {
  const source = await readFile(softwarePath, "utf8");
  const rows = [...source.matchAll(/slug:\s*"([^"]+)"[\s\S]*?software:\s*"([^"]+)"[\s\S]*?primaryKeyword:\s*"([^"]+)"[\s\S]*?metaTitle:\s*"([^"]+)"[\s\S]*?metaDescription:\s*(?:\n\s*)?"([^"]+)"/g)]
    .map((match) => ({
      slug: match[1],
      software: match[2],
      keyword: match[3],
      title: match[4],
      description: match[5],
    }));

  assert.equal(rows.length, 47);

  for (const row of rows) {
    assert.equal(row.slug.includes("virtual-assistant"), false, `${row.slug} should use a clean software-only URL`);
    assert.equal(row.title, `${row.software} Virtual Assistant Philippines`);
    assert.equal(row.keyword, row.title.toLowerCase());
    assert.match(row.description, /Philippines/i);
    assert.ok(row.description.length <= 160, `${row.software} meta description is too long`);
  }
});

test("software pages place Philippines in title, H1, supporting headings and copy", async () => {
  const route = await readFile(routePath, "utf8");

  assert.match(route, /softwareSeoTitle\(page\)/);
  assert.match(route, /softwareSeoDescription\(page\)/);
  assert.match(route, /softwareSeoH1\(page\)/);
  assert.match(route, /Philippines-based \{page\.software\} Virtual Assistant/);
  assert.match(route, /virtual assistant in the Philippines should actually own/);
  assert.match(route, /Philippines-based \{page\.software\} Virtual Assistant\.<\/h2>/);
  assert.match(route, /Virtual Assistant in the Philippines\?<\/h2>/);
  assert.match(route, /Virtual Assistant Philippines questions/);
});

test("priority Australian software pages are present with clean canonicals", async () => {
  const source = await readFile(softwarePath, "utf8");
  for (const slug of ["winbeat", "insight", "lumary", "splose", "buildxact", "employment-hero", "nookal", "buildertrend", "procore", "groundplan"]) {
    assert.match(source, new RegExp(`slug: "${slug}"`));
  }
  assert.match(source, /softwarePagesForTools/);
  assert.match(source, /aliases\?: string\[\]/);
});

test("legacy software URLs permanently redirect to clean slugs", async () => {
  const config = await readFile("next.config.ts", "utf8");

  assert.match(config, /SOFTWARE_SLUG_REDIRECTS/);
  assert.match(config, /\/software\/\$\{slug\}-virtual-assistant/);
  assert.match(config, /destination: `\/software\/\$\{slug\}`/);
  assert.match(config, /permanent: true/);
});


test("software redirect registry covers every canonical software slug", async () => {
  const software = await readFile(softwarePath, "utf8");
  const config = await readFile("next.config.ts", "utf8");
  const slugs = [...software.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((match) => match[1]);
  const redirectMatch = config.match(/const SOFTWARE_SLUG_REDIRECTS = \[([^\]]+)\] as const;/);
  assert.ok(redirectMatch, "software legacy redirect registry is missing");
  const redirects = [...redirectMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(redirects, slugs, "legacy software redirects must stay in lockstep with canonical software pages");
});

test("software pages remain discoverable from the hub, sitemap, static params, and canonical metadata", async () => {
  const hub = await readFile("src/app/software/page.tsx", "utf8");
  const route = await readFile(routePath, "utf8");
  const sitemap = await readFile("src/app/sitemap.ts", "utf8");

  assert.match(hub, /softwarePages\.map|pages\.map/);
  assert.match(hub, /href=\{\`\/software\/\$\{page\.slug\}\`\}/);
  assert.match(route, /generateStaticParams\(\)/);
  assert.match(route, /softwarePages\.map\(\(page\) => \(\{ slug: page\.slug \}\)\)/);
  assert.match(route, /canonicalPath\(\`\/software\/\$\{page\.slug\}\`\)/);
  assert.match(sitemap, /softwarePages\.map\(\(page\) => \(\{/);
  assert.match(sitemap, /url: \`\$\{base\}\/software\/\$\{page\.slug\}\`/);
});


test("new AU software pages have contextual inbound service links", async () => {
  const services = await readFile("src/lib/service-pages.ts", "utf8");

  function block(slug) {
    const start = services.indexOf(`"slug": "${slug}"`);
    assert.ok(start >= 0, `missing service ${slug}`);
    const next = services.indexOf("\n  {", start + 10);
    return services.slice(start, next > 0 ? next : services.length);
  }

  const expectations = [
    ["construction-estimating-virtual-assistant", ["Buildxact", "Groundplan"]],
    ["construction-virtual-assistant", ["Buildertrend", "Procore"]],
    ["allied-health-referral-billing-virtual-assistant", ["Nookal"]],
    ["recruitment-hr", ["Employment Hero"]],
  ];

  for (const [slug, tools] of expectations) {
    const content = block(slug);
    for (const tool of tools) assert.ok(content.includes(`"${tool}"`), `${slug} must link the ${tool} software guide`);
  }
});
