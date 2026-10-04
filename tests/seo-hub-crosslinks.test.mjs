import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function parseServicePages(source) {
  const marker = "export const SERVICE_PAGES: ServiceSeoPage[] = ";
  const markerIndex = source.indexOf(marker);
  assert.ok(markerIndex >= 0, "service registry marker missing");
  const start = source.indexOf("[", markerIndex + marker.length);
  const end = source.indexOf("];", start);
  return JSON.parse(source.slice(start, end + 1));
}

test("services hub covers every service group, including UK expansion groups", async () => {
  const [hub, registry] = await Promise.all([
    readFile("src/app/services/page.tsx", "utf8"),
    readFile("src/lib/service-pages.ts", "utf8"),
  ]);
  const pages = parseServicePages(registry);
  const groups = [...new Set(pages.map((page) => page.group))];
  const mappedGroups = [...hub.matchAll(/groups:\s*\[([^\]]+)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]));

  for (const group of groups) {
    assert.ok(mappedGroups.includes(group), `Services hub is missing group: ${group}`);
  }

  assert.match(hub, /Recruitment & HR/);
  assert.match(hub, /Finance & Lending/);
  assert.match(hub, /Insurance & Finance/);
  assert.match(hub, /Architecture & Engineering/);
  assert.match(hub, /Browse services by workflow/);
});

test("software hub exposes workflow category overview and every registry category", async () => {
  const [hub, registry] = await Promise.all([
    readFile("src/app/software/page.tsx", "utf8"),
    readFile("src/lib/software-pages.ts", "utf8"),
  ]);

  assert.match(hub, /Browse software by workflow/);
  assert.match(hub, /\[\.\.\.groups\.entries\(\)\]/);
  for (const category of ["Lettings & Property", "Mortgage & Finance", "Accounting & Payroll"]) {
    assert.ok(registry.includes(`category: "${category}"`), `Missing UK software category: ${category}`);
  }
});

test("service pages connect commercial intent to software, industries, training, and jobs", async () => {
  const page = await readFile("src/app/service/[slug]/page.tsx", "utf8");

  assert.match(page, /softwarePagesForTools\(s\.tools\)/);
  assert.match(page, /\/industries\/\$\{industry\.slug\}/);
  assert.match(page, /const trainingHref = "\/training#course-library"/);
  assert.match(page, /const jobsHref = `\/jobs\?category=/);
  assert.match(page, /kicker="Training & jobs"/);
  assert.match(page, /Free training related to/);
});

test("software pages connect commercial intent to services, industries, training, and jobs", async () => {
  const page = await readFile("src/app/software/[slug]/page.tsx", "utf8");

  assert.match(page, /page\.relatedServiceSlugs\.map\(servicePageBySlug\)/);
  assert.match(page, /page\.relatedIndustrySlugs\.map\(industryBySlug\)/);
  assert.match(page, /const trainingHref = "\/training#course-library"/);
  assert.match(page, /const jobsHref = `\/jobs\?q=/);
  assert.match(page, /Learn the workflow or find roles using/);
  assert.match(page, /Virtual Assistant jobs/);
});

test("training catalogue now describes both AU and UK software coverage", async () => {
  const catalogue = await readFile("src/lib/training-catalogue.ts", "utf8");
  assert.match(catalogue, /Australian and UK businesses actually run on/);
});
