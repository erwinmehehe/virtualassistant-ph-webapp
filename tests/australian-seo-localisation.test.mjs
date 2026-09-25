import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseJsonArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path} marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.indexOf("];", start);
  assert.ok(start >= 0 && end > start, `${path} array must remain parseable`);
  return JSON.parse(text.slice(start, end + 1));
}

function objectForSlug(text, slug) {
  const needles = [`"slug": "${slug}"`, `slug: "${slug}"`];
  let slugIndex = -1;
  for (const needle of needles) {
    slugIndex = text.indexOf(needle);
    if (slugIndex >= 0) break;
  }
  assert.ok(slugIndex >= 0, `missing object for ${slug}`);

  let start = slugIndex;
  while (start >= 0 && text[start] !== "{") start -= 1;
  assert.ok(start >= 0, `missing object start for ${slug}`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  assert.fail(`missing object end for ${slug}`);
}

function arrayField(objectText, field) {
  const match = objectText.match(new RegExp(`${field}:?\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

const existingAuServices = [
  "construction-estimating-virtual-assistant",
  "month-end-production-virtual-assistant",
  "ndis-billing-virtual-assistant",
  "mortgage-loan-processing-virtual-assistant",
  "smsf-production-virtual-assistant",
  "strata-management-virtual-assistant",
  "property-management-maintenance-virtual-assistant",
  "allied-health-referral-billing-virtual-assistant",
  "trades-service-administration-virtual-assistant",
  "bim-revit-production-virtual-assistant",
  "recruitment-candidate-sourcing-virtual-assistant",
  "insurance-broker-renewal-virtual-assistant"
];

const newAuServices = [
  "conveyancing-virtual-assistant",
  "buyers-agent-virtual-assistant",
  "financial-planning-virtual-assistant",
  "ndis-rostering-virtual-assistant",
  "aged-care-virtual-assistant",
  "trust-accounting-virtual-assistant",
  "medical-receptionist-virtual-assistant"
];

const existingAuIndustries = [
  "construction-estimating-tender-desk",
  "accounting-firms-month-end",
  "ndis-providers",
  "mortgage-broker-loan-processing",
  "smsf-production",
  "strata-management-administration",
  "property-management-maintenance-coordination",
  "allied-health-referral-billing",
  "trades-service-administration",
  "bim-revit-production",
  "recruitment-candidate-sourcing",
  "insurance-broker-renewal-desk"
];

const newAuIndustries = [
  "conveyancing-firms",
  "buyers-agents",
  "financial-planning-firms",
  "aged-care-providers"
];

const existingAuSoftware = [
  "applyonline-virtual-assistant",
  "salestrekker-virtual-assistant",
  "brokerengine-virtual-assistant",
  "propertyme-virtual-assistant",
  "console-cloud-virtual-assistant",
  "servicem8-virtual-assistant",
  "simpro-virtual-assistant",
  "aroflo-virtual-assistant",
  "tradify-virtual-assistant",
  "cliniko-virtual-assistant",
  "halaxy-virtual-assistant",
  "power-diary-virtual-assistant",
  "jobadder-virtual-assistant",
  "bullhorn-virtual-assistant",
  "vincere-virtual-assistant",
  "stratamax-virtual-assistant",
  "strata-master-virtual-assistant",
  "bgl-simple-fund-360-virtual-assistant",
  "class-super-virtual-assistant",
  "revit-virtual-assistant",
  "xero-virtual-assistant"
];

const newAuSoftware = [
  "shiftcare-virtual-assistant",
  "best-practice-premier-virtual-assistant",
  "xplan-virtual-assistant",
  "pexa-virtual-assistant",
  "leap-virtual-assistant",
  "vaultre-virtual-assistant",
  "agentbox-virtual-assistant",
  "property-tree-virtual-assistant",
  "ailo-virtual-assistant",
  "myob-virtual-assistant"
];

const forbiddenAmericanSpellings = /\b(organization|organizations|organize|organized|organizing|prioritize|prioritized|prioritization|specialize|specialized|specialization|authorized|authorization|optimize|optimized|optimization|analyze|analyzed|behavior|labor|fulfillment|enrollment|canceled)\b/i;

test("all Australian-target service, industry and software records are explicitly en-AU", () => {
  const services = source("src/lib/service-pages.ts");
  const industries = source("src/lib/industries.ts");
  const software = source("src/lib/software-pages.ts");

  for (const slug of [...existingAuServices, ...newAuServices]) {
    assert.match(objectForSlug(services, slug), /"locale": "en-AU"/, `${slug} must stay en-AU`);
  }
  for (const slug of [...existingAuIndustries, ...newAuIndustries]) {
    assert.match(objectForSlug(industries, slug), /"locale": "en-AU"/, `${slug} must stay en-AU`);
  }
  for (const slug of [...existingAuSoftware, ...newAuSoftware]) {
    assert.match(objectForSlug(software, slug), /locale: "en-AU"/, `${slug} must stay en-AU`);
  }
});

test("Australian-target records do not regress to common US spellings", () => {
  const files = [
    ["src/lib/service-pages.ts", [...existingAuServices, ...newAuServices]],
    ["src/lib/industries.ts", [...existingAuIndustries, ...newAuIndustries]],
    ["src/lib/software-pages.ts", [...existingAuSoftware, ...newAuSoftware]]
  ];

  for (const [path, slugs] of files) {
    const text = source(path);
    for (const slug of slugs) {
      const objectText = objectForSlug(text, slug);
      assert.doesNotMatch(objectText, forbiddenAmericanSpellings, `${slug} contains US English in ${path}`);
    }
  }
});

test("new Australian gap pages have distinct canonical owners and valid internal links", () => {
  const services = parseJsonArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const industries = parseJsonArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
  const software = source("src/lib/software-pages.ts");
  const serviceSlugs = new Set(services.map((page) => page.slug));
  const industrySlugs = new Set(industries.map((page) => page.slug));
  const softwareSlugs = [...software.matchAll(/\bslug:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.equal(new Set(serviceSlugs).size, services.length, "service slugs must stay unique");
  assert.equal(new Set(industrySlugs).size, industries.length, "industry slugs must stay unique");
  assert.equal(new Set(softwareSlugs).size, softwareSlugs.length, "software slugs must stay unique");

  for (const slug of newAuServices) {
    const page = services.find((item) => item.slug === slug);
    assert.ok(page, `missing AU service ${slug}`);
    assert.equal(page.locale, "en-AU");
    assert.ok(page.metaTitle.length <= 60, `${slug} title is too long`);
    assert.ok(page.metaDescription.length >= 120 && page.metaDescription.length <= 160, `${slug} description should be 120-160 chars`);
    for (const related of page.relatedSlugs) assert.ok(serviceSlugs.has(related), `${slug} links to missing service ${related}`);
  }

  for (const slug of newAuIndustries) {
    const page = industries.find((item) => item.slug === slug);
    assert.ok(page, `missing AU industry ${slug}`);
    assert.equal(page.locale, "en-AU");
    assert.ok(page.metaTitle.length <= 60, `${slug} title is too long`);
    assert.ok(page.metaDescription.length >= 120 && page.metaDescription.length <= 160, `${slug} description should be 120-160 chars`);
    for (const related of page.serviceSlugs) assert.ok(serviceSlugs.has(related), `${slug} links to missing service ${related}`);
  }

  for (const slug of newAuSoftware) {
    const objectText = objectForSlug(software, slug);
    const title = objectText.match(/metaTitle:\s*"([^"]+)"/)?.[1] || "";
    const description = objectText.match(/metaDescription:\s*"([^"]+)"/)?.[1] || "";
    assert.ok(title.length > 0 && title.length <= 60, `${slug} title is missing or too long`);
    assert.ok(description.length >= 120 && description.length <= 160, `${slug} description should be 120-160 chars`);
    for (const related of arrayField(objectText, "relatedServiceSlugs")) assert.ok(serviceSlugs.has(related), `${slug} links to missing service ${related}`);
    for (const related of arrayField(objectText, "relatedIndustrySlugs")) assert.ok(industrySlugs.has(related), `${slug} links to missing industry ${related}`);
  }
});

test("Australian SEO templates render AU English and Australian market metadata", () => {
  const language = source("src/lib/content-language.ts");
  const serviceRoute = source("src/app/service/[slug]/page.tsx");
  const industryRoute = source("src/app/industries/[slug]/page.tsx");
  const softwareRoute = source("src/app/software/[slug]/page.tsx");

  assert.match(language, /export function localizeEnglish/);
  assert.match(language, /"organisations"/);
  assert.match(language, /"prioritise"/);
  assert.match(language, /"authorised"/);

  assert.match(serviceRoute, /locale: page\.locale === "en-AU" \? "en_AU" : undefined/);
  assert.match(serviceRoute, /areaServed: isAu \? "Australia" : "Worldwide"/);
  assert.match(serviceRoute, /titleTail=\{isAu \? "for Australian businesses" : "in the Philippines"\}/);

  assert.match(industryRoute, /locale: industry\.locale === "en-AU" \? "en_AU" : undefined/);
  assert.match(industryRoute, /areaServed: isAu \? "Australia" : "Worldwide"/);
  assert.match(industryRoute, /localizeContent\(industryFirst30Days\(page\), page\.locale\)/);

  assert.match(softwareRoute, /locale: page\.locale === "en-AU" \? "en_AU" : undefined/);
  assert.match(softwareRoute, /areaServed: isAu \? "Australia" : "Worldwide"/);
  assert.match(softwareRoute, /localizeContent\(softwareLongFormCopy\(page\), page\.locale\)/);
});
