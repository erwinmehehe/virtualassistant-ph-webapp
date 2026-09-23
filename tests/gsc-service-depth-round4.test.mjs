import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path}: marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

const TARGETS = [
  "fulfilment",
  "dental-virtual-assistant",
  "project-coordination",
  "operations",
  "hvac-virtual-assistant",
  "transcription",
  "travel-lifestyle",
  "content-writing"
];

test("GSC service round keeps the existing canonical metadata owners", () => {
  const pages = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const expectedTitles = new Map([
    ["fulfilment", "Order & Fulfilment Virtual Assistant Philippines"],
    ["dental-virtual-assistant", "Dental Virtual Assistant Philippines"],
    ["project-coordination", "Project Management Virtual Assistant Philippines"],
    ["operations", "Operations Virtual Assistant Philippines"],
    ["hvac-virtual-assistant", "HVAC Virtual Assistant Philippines"],
    ["transcription", "Transcription Virtual Assistant Philippines"],
    ["travel-lifestyle", "Travel & Lifestyle Virtual Assistant Philippines"],
    ["content-writing", "Content Writing Virtual Assistant Philippines"]
  ]);

  for (const slug of TARGETS) {
    const page = pages.find((item) => item.slug === slug);
    assert.ok(page, `${slug}: service page missing`);
    assert.equal(page.metaTitle, expectedTitles.get(slug));
    assert.ok(page.metaDescription.length >= 140 && page.metaDescription.length <= 160, `${slug}: meta description length ${page.metaDescription.length}`);
  }
});

test("GSC service targets receive role-specific scope modules", () => {
  const page = source("src/app/service/[slug]/page.tsx");
  assert.match(page, /const PRIORITY_SERVICE_MODULES/);
  assert.match(page, /priorityServiceModule\(s\.slug\)/);
  assert.match(page, /id="role-scope"/);
  assert.match(page, /The VA can own/);
  assert.match(page, /Keep with the client/);
  assert.match(page, /Proof to ask for/);

  for (const slug of TARGETS) {
    const key = slug === "fulfilment" || slug === "operations" || slug === "transcription"
      ? new RegExp(`\\b${slug}: \\{`)
      : new RegExp(`"${slug}": \\{`);
    assert.match(page, key, `${slug}: priority module missing`);
  }

  for (const marker of [
    "failed fulfilment",
    "clearly non-clinical",
    "Separate coordination ownership from project authority",
    "recurring operating layer",
    "service board",
    "Quality is more than typing speed",
    "one auditable itinerary",
    "research discipline and editorial judgment"
  ]) assert.ok(page.includes(marker), `role-specific copy missing: ${marker}`);
});

test("priority service pages get multiple contextual authority links", () => {
  const links = source("src/lib/seo-priority-links.ts");
  const expected = new Map([
    ["fulfilment", ["ECOMMERCE_TASKS", "RATE_GUIDE", "PRICING_HUB"]],
    ["dental-virtual-assistant", ["DENTAL_INTERVIEW", "DENTAL_COST", "RATE_GUIDE", "HIRE_HUB"]],
    ["project-coordination", ["PROJECT_MANAGER_RATES", "RATE_GUIDE", "PRICING_HUB", "HIRE_HUB"]],
    ["operations", ["PROJECT_MANAGER_RATES", "RATE_GUIDE", "PRICING_HUB", "HIRE_HUB"]],
    ["hvac-virtual-assistant", ["HVAC_HIRING", "HVAC_COST", "RATE_GUIDE", "HIRE_HUB"]],
    ["transcription", ["RATE_GUIDE", "PRICING_HUB", "HIRE_HUB"]],
    ["travel-lifestyle", ["RATE_GUIDE", "PRICING_HUB", "HIRE_HUB"]],
    ["content-writing", ["CONTENT_MARKETING_GUIDE", "RATE_GUIDE", "PRICING_HUB", "HIRE_HUB"]]
  ]);

  for (const [slug, symbols] of expected) {
    const row = `"${slug}": [${symbols.join(", ")}]`;
    assert.ok(links.includes(row), `${slug}: authority link set is incomplete`);
  }
});

test("round four still follows the existing-canonical-first GSC release rule", () => {
  const plan = source("SEO_GSC_TOP20_2026-09-21.md");
  assert.match(plan, /Do not create a new URL just because a query has impressions/);
  const route = source("src/app/service/[slug]/page.tsx");
  const staticParams = route.match(/export function generateStaticParams\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(staticParams, /SERVICE_PAGES\.map/);
  assert.doesNotMatch(staticParams, /PRIORITY_SERVICE_MODULES/);
});
