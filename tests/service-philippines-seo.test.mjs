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

  assert.equal(services.length, 97);

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


test("service pages emit a connected transactional Service entity graph", async () => {
  const route = await readFile("src/app/service/[slug]/page.tsx", "utf8");

  assert.match(route, /"@graph"/);
  assert.match(route, /"@type": "WebPage"/);
  assert.match(route, /"@type": "Service"/);
  assert.match(route, /serviceType: `\$\{s\.name\} Services`/);
  assert.match(route, /const orgId = organizationId\(base\)/);
  assert.match(route, /const siteId = websiteId\(base\)/);
  assert.match(route, /isPartOf: \{ "@id": siteId \}/);
  assert.match(route, /about: \{ "@id": serviceId \}/);
  assert.match(route, /mainEntity: \{ "@id": serviceId \}/);
  assert.match(route, /mainEntityOfPage: \{ "@id": webpageId \}/);
  assert.match(route, /provider: \{ "@id": orgId \}/);
  assert.match(route, /publisher: \{ "@id": orgId \}/);
  assert.match(route, /areaServed,/);
  assert.match(route, /"@type": "Country"/);
  assert.match(route, /\["US", "AU", "CA", "GB", "NZ"\]/);
  assert.match(route, /"@type": "OfferCatalog"/);
  assert.match(route, /"@id": `\$\{serviceId\}-offers`/);
  assert.match(route, /itemListElement: serviceCapabilities/);
  assert.match(route, /"@type": "Offer"/);
  assert.match(route, /name: toTitle\(task\)/);
  assert.match(route, /"@type": "BreadcrumbList"/);
});

test("healthcare virtual assistant has a distinct, linked, non-clinical service page", async () => {
  const servicesSource = await readFile("src/lib/service-pages.ts", "utf8");
  const industriesSource = await readFile("src/lib/industries.ts", "utf8");
  const route = await readFile("src/app/service/[slug]/page.tsx", "utf8");
  const services = parseServiceArray(servicesSource);
  const healthcare = services.find((page) => page.slug === "healthcare-virtual-assistant");
  const medical = services.find((page) => page.slug === "medical-virtual-assistant");

  assert.ok(healthcare, "new healthcare service is missing");
  assert.equal(healthcare.metaTitle, "Healthcare Virtual Assistant Philippines");
  assert.equal(healthcare.primaryKeyword, "healthcare virtual assistant philippines");
  assert.equal(healthcare.group, "Healthcare");
  assert.equal(healthcare.directoryCategory, "Dental & Healthcare");
  assert.notEqual(healthcare.focus, medical.focus, "healthcare and medical service intent should remain distinct");
  assert.ok(healthcare.tasks.some((task) => task.includes("care-team handoffs")));
  assert.ok(healthcare.relatedSlugs.includes("medical-virtual-assistant"));
  assert.ok(medical.relatedSlugs.includes("healthcare-virtual-assistant"));
  assert.match(industriesSource, /"slug": "healthcare-dental"[\s\S]*?"healthcare-virtual-assistant"/);
  assert.match(industriesSource, /"slug": "medical-practices"[\s\S]*?"healthcare-virtual-assistant"/);
  assert.match(route, /s.slug === "healthcare-virtual-assistant"/);
  assert.match(route, /Only if the healthcare organization permits it under applicable privacy laws/);
  assert.match(route, /Diagnosis, treatment advice, clinical triage/);
});
