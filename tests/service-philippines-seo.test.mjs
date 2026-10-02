import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function parseServiceArray(source) {
  const marker = "export const SERVICE_PAGES: ServiceSeoPage[] = ";
  const startAt = source.indexOf(marker);
  assert.ok(startAt >= 0, "service array marker missing");
  const start = source.indexOf("[", startAt + marker.length);
  const end = source.indexOf("];", start);
  return JSON.parse(source.slice(start, end + 1));
}

test("all service SEO owners use Philippines-focused primary keywords and pure titles", async () => {
  const source = await readFile("src/lib/service-pages.ts", "utf8");
  const services = parseServiceArray(source);

  assert.equal(services.length, 86);

  for (const page of services) {
    assert.match(page.primaryKeyword, /philippines$/i, `${page.slug} primary keyword must end in Philippines`);
    assert.match(page.metaTitle, /Philippines$/, `${page.slug} title must end in Philippines`);
    assert.equal(page.metaTitle.includes("|"), false, `${page.slug} title must not use a brand or descriptor suffix`);
    assert.ok(page.metaTitle.length <= 60, `${page.slug} title is too long`);
    assert.match(page.metaDescription, /Philippines/i, `${page.slug} meta description must mention Philippines`);
    assert.ok(page.metaDescription.length >= 90 && page.metaDescription.length <= 160, `${page.slug} meta description must stay 90-160 characters`);
  }
});

test("service pages use the pure SEO title as the visible H1", async () => {
  const route = await readFile("src/app/service/[slug]/page.tsx", "utf8");

  assert.match(route, /titleLead=\{serviceMetaTitle\(s\)\}/);
  assert.match(route, /titleAccent=""/);
  assert.doesNotMatch(route, /titleTail="in the Philippines"/);
});

test("relevant service tools link to software-specific Philippines pages", async () => {
  const services = await readFile("src/lib/service-pages.ts", "utf8");
  const route = await readFile("src/app/service/[slug]/page.tsx", "utf8");
  const software = await readFile("src/lib/software-pages.ts", "utf8");

  for (const tool of ["Ebix WinBEAT", "INSIGHT", "Lumary", "Splose"]) {
    assert.match(services, new RegExp(tool.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }

  for (const slug of ["winbeat", "insight", "lumary", "splose"]) {
    assert.match(software, new RegExp(`slug: "${slug}"`));
  }

  assert.match(route, /softwarePagesForTools\(s\.tools\)/);
  assert.match(route, /href=\{\`\/software\/\$\{software\.slug\}\`\}/);
  assert.match(route, /Software hiring guides/);
});
