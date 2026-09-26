import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseServices() {
  const text = source("src/lib/service-pages.ts");
  const marker = "export const SERVICE_PAGES: ServiceSeoPage[] = ";
  const markerIndex = text.indexOf(marker);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.indexOf("];", start);
  return JSON.parse(text.slice(start, end + 1));
}

function objectForSlug(text, slug) {
  const needle = `slug: "${slug}"`;
  const slugIndex = text.indexOf(needle);
  assert.ok(slugIndex >= 0, `missing object for ${slug}`);
  let start = slugIndex;
  while (start >= 0 && text[start] !== "{") start -= 1;
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  assert.fail(`missing object end for ${slug}`);
}

function arrayField(objectText, field) {
  const match = objectText.match(new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

const serviceGaps = [
  ["accounts-payable", "accounts payable virtual assistant"],
  ["accounts-receivable", "accounts receivable virtual assistant"],
  ["customer-success", "customer success virtual assistant"],
  ["meta-ads", "facebook ads virtual assistant"],
  ["marketing-automation", "marketing automation virtual assistant"],
];

const softwareGaps = [
  ["zapier", "zapier virtual assistant"],
  ["make", "make.com virtual assistant"],
  ["squarespace", "squarespace virtual assistant"],
];

test("global commercial service gaps have distinct short-slug canonical owners", () => {
  const services = parseServices();
  const serviceSlugs = new Set(services.map((page) => page.slug));
  const keywords = new Map(services.map((page) => [page.primaryKeyword.toLowerCase(), page.slug]));

  for (const [slug, keyword] of serviceGaps) {
    const page = services.find((item) => item.slug === slug);
    assert.ok(page, `missing service ${slug}`);
    assert.equal(page.market, "global");
    assert.equal(page.primaryKeyword, keyword);
    assert.equal(keywords.get(keyword), slug);
    assert.doesNotMatch(page.slug, /virtual-assistant/);
    assert.doesNotMatch(page.metaTitle, /Philippines/i);
    assert.doesNotMatch(page.metaDescription, /Philippines/i);
    assert.ok(page.metaTitle.length <= 60, `${slug}: title too long`);
    assert.ok(page.metaDescription.length >= 140 && page.metaDescription.length <= 160, `${slug}: description length ${page.metaDescription.length}`);
    for (const related of page.relatedSlugs) assert.ok(serviceSlugs.has(related), `${slug} links to missing service ${related}`);
  }
});

test("existing service owners link into the new commercial canonicals", () => {
  const services = parseServices();
  const bySlug = new Map(services.map((page) => [page.slug, page]));
  const expected = [
    ["bookkeeping", "accounts-payable"],
    ["bookkeeping", "accounts-receivable"],
    ["customer-service", "customer-success"],
    ["social-media", "meta-ads"],
    ["google-ads-virtual-assistant", "meta-ads"],
    ["technical-virtual-assistant", "marketing-automation"],
    ["crm", "marketing-automation"],
  ];
  for (const [owner, target] of expected) {
    assert.ok(bySlug.get(owner)?.relatedSlugs.includes(target), `${owner} must link to ${target}`);
  }
});

test("global service template does not force Philippines-only positioning", () => {
  const route = source("src/app/service/[slug]/page.tsx");
  assert.match(route, /const isGlobal = s\.market === "global"/);
  assert.match(route, /isGlobal \? `Hire \$\{article\} \$\{s\.name\}`/);
  assert.match(route, /isGlobal \? undefined : "in the Philippines"/);
  assert.match(route, /isGlobal \? `Philippines-based \$\{roleName\(s\.name\)\} talent`/);
});

test("Zapier, Make and Squarespace have distinct global software pages", () => {
  const software = source("src/lib/software-pages.ts");
  const services = parseServices();
  const serviceSlugs = new Set(services.map((page) => page.slug));
  const industryText = source("src/lib/industries.ts");
  const industrySlugs = new Set([...industryText.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]));

  for (const [slug, keyword] of softwareGaps) {
    const objectText = objectForSlug(software, slug);
    assert.doesNotMatch(slug, /virtual-assistant/);
    assert.match(objectText, new RegExp(`primaryKeyword:\\s*"${keyword.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, "\\\\$&")}"`));
    const title = objectText.match(/metaTitle:\s*"([^"]+)"/)?.[1] || "";
    const description = objectText.match(/metaDescription:\s*"([^"]+)"/)?.[1] || "";
    assert.ok(title.length >= 45 && title.length <= 60, `${slug}: title length ${title.length}`);
    assert.ok(description.length >= 140 && description.length <= 160, `${slug}: description length ${description.length}`);
    assert.doesNotMatch(title, /Philippines/i);
    assert.doesNotMatch(description, /Philippines/i);
    for (const related of arrayField(objectText, "relatedServiceSlugs")) assert.ok(serviceSlugs.has(related), `${slug} links to missing service ${related}`);
    for (const related of arrayField(objectText, "relatedIndustrySlugs")) assert.ok(industrySlugs.has(related), `${slug} links to missing industry ${related}`);
  }
});
