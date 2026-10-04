import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const UK_SOFTWARE = [
  "reapit",
  "alto",
  "goodlord",
  "fixflo",
  "payprop",
  "mortgage-brain",
  "twenty7tec",
  "acre",
  "sage",
  "freeagent",
  "brightpay",
  "dext",
];

const UK_SERVICES = [
  "lettings-administration-virtual-assistant",
  "sales-progression-virtual-assistant",
  "tenancy-administration-virtual-assistant",
  "mortgage-case-management-virtual-assistant",
  "protection-administration-virtual-assistant",
  "vat-bookkeeping-virtual-assistant",
  "rti-payroll-administration-virtual-assistant",
  "domiciliary-care-administration-virtual-assistant",
  "insurance-broker-administration-virtual-assistant",
  "recruitment-compliance-administration-virtual-assistant",
];

test("UK software expansion adds 12 non-country URL targets using en-GB", async () => {
  const source = await readFile("src/lib/software-pages.ts", "utf8");
  for (const slug of UK_SOFTWARE) {
    assert.match(source, new RegExp(`slug: "${slug}"[\\s\\S]{0,100}locale: "en-GB"`));
  }
  assert.doesNotMatch(source, /slug: "uk-/);
  assert.doesNotMatch(source, /slug: "[^"]*-uk"/);
});

test("UK service expansion adds 10 intent-separated targets using en-GB", async () => {
  const source = await readFile("src/lib/service-pages.ts", "utf8");
  for (const slug of UK_SERVICES) {
    assert.match(source, new RegExp(`"slug": "${slug}"[\\s\\S]{0,100}"locale": "en-GB"`));
  }
  assert.doesNotMatch(source, /"slug": "uk-/);
  assert.doesNotMatch(source, /"slug": "[^"]*-uk"/);
});

test("UK pages keep Philippines commercial targeting without UK title stuffing", async () => {
  const [software, services] = await Promise.all([
    readFile("src/lib/software-pages.ts", "utf8"),
    readFile("src/lib/service-pages.ts", "utf8"),
  ]);

  for (const slug of [...UK_SOFTWARE, ...UK_SERVICES]) {
    const source = UK_SOFTWARE.includes(slug) ? software : services;
    const start = source.indexOf(`slug: "${slug}"`) >= 0
      ? source.indexOf(`slug: "${slug}"`)
      : source.indexOf(`"slug": "${slug}"`);
    assert.ok(start >= 0, `Missing ${slug}`);
    const block = source.slice(start, start + 4500);
    const title = block.match(/metaTitle["']?\s*:\s*"([^"]+)"/)?.[1];
    const keyword = block.match(/primaryKeyword["']?\s*:\s*"([^"]+)"/)?.[1];
    assert.ok(title?.includes("Philippines"), `Title should retain Philippines targeting for ${slug}`);
    assert.ok(!/\bUK\b|United Kingdom/i.test(title || ""), `Title should not be country-stuffed for ${slug}`);
    assert.ok(keyword?.includes("philippines"), `Primary keyword should retain Philippines targeting for ${slug}`);
  }
});

test("content localization and schema support en-GB", async () => {
  const [language, servicePage, softwarePage] = await Promise.all([
    readFile("src/lib/content-language.ts", "utf8"),
    readFile("src/app/service/[slug]/page.tsx", "utf8"),
    readFile("src/app/software/[slug]/page.tsx", "utf8"),
  ]);

  assert.match(language, /"en-AU" \| "en-GB"/);
  assert.match(language, /locale !== "en-AU" && locale !== "en-GB"/);
  assert.match(servicePage, /page\.locale === "en-GB" \? "en_GB"/);
  assert.match(softwarePage, /page\.locale === "en-GB" \? "en_GB"/);
  assert.match(servicePage, /"United Kingdom"/);
  assert.match(softwarePage, /"United Kingdom"/);
});

test("service and software datasets have unique slugs after UK expansion", async () => {
  const [software, services] = await Promise.all([
    readFile("src/lib/software-pages.ts", "utf8"),
    readFile("src/lib/service-pages.ts", "utf8"),
  ]);

  const softwareSlugs = [...software.matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
  const serviceSlugs = [...services.matchAll(/["']slug["']\s*:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.equal(new Set(softwareSlugs).size, softwareSlugs.length);
  assert.equal(new Set(serviceSlugs).size, serviceSlugs.length);
  assert.equal(softwareSlugs.length, 59);
  assert.equal(serviceSlugs.length, 96);
});
