import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path) => fs.readFileSync(path, "utf8");

test("every industry uses an explicit reviewed talent mapping", () => {
  const industries = source("src/lib/industries.ts");
  const mappings = source("src/lib/industry-talent-mappings.ts");
  const page = source("src/app/industries/[slug]/page.tsx");

  const slugs = [...industries.matchAll(/"slug": "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(slugs.length, 39);

  for (const slug of slugs) {
    assert.match(mappings, new RegExp(`"${slug}": \\{[\\s\\S]*?category: "[^"]+",[\\s\\S]*?query: "[^"]+"`), `${slug} needs an explicit category and query`);
  }

  assert.match(page, /industryTalentFilters\(page\.slug\)/);
  assert.match(page, /talentParams\.set\("category", talentFilters\.category\)/);
  assert.match(page, /talentParams\.set\("q", talentFilters\.query\)/);
  assert.doesNotMatch(page, /services\[0\]\?\.directoryCategory/);
});

test("specialist industries do not inherit broad or unrelated talent filters", () => {
  const mappings = source("src/lib/industry-talent-mappings.ts");

  assert.match(mappings, /"bim-revit-production": \{ category: "Administrative Support", query: "BIM Revit" \}/);
  assert.match(mappings, /"allied-health-referral-billing": \{ category: "Dental & Healthcare", query: "allied health" \}/);
  assert.match(mappings, /"mortgage-broker-loan-processing": \{ category: "Real Estate", query: "mortgage loan processing" \}/);
  assert.match(mappings, /"recruitment-candidate-sourcing": \{ category: "Lead Generation & Sales", query: "recruitment sourcing" \}/);
});
