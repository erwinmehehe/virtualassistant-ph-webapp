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

  assert.equal(rows.length, 41);

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
  for (const slug of ["winbeat", "insight", "lumary", "splose"]) {
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
