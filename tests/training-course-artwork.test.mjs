import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedArtworkKeys = [
  "virtual-assistant-foundations",
  "real-estate-virtual-assistant",
  "medical-healthcare-virtual-assistant",
  "executive-virtual-assistant",
  "marketing-virtual-assistant",
  "bookkeeping-administration-for-virtual-assistants",
  "sales-lead-generation-virtual-assistant",
  "e-commerce-virtual-assistant",
  "social-media-virtual-assistant",
  "customer-support-virtual-assistant",
  "seo-virtual-assistant",
  "operations-virtual-assistant",
  "project-management-for-virtual-assistants",
  "payroll-administration-for-virtual-assistants",
  "airbnb-short-term-rental-virtual-assistant",
  "australian-va-fundamentals",
  "australian-trades-administration",
  "servicem8-for-virtual-assistants",
  "australian-allied-health-administration",
  "cliniko-for-virtual-assistants",
  "australian-bookkeeping-administration",
  "xero-workflows-for-virtual-assistants",
  "myob-workflows-for-virtual-assistants",
  "ndis-administration-fundamentals",
  "property-management-administration-australia",
  "mortgage-broking-administration-australia",
];

test("all 26 public course titles have unique illustrated covers", async () => {
  const source = await readFile("src/components/training-course-artwork.tsx", "utf8");
  const keys = [...source.matchAll(/\bkey: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(keys, expectedArtworkKeys);
  assert.equal(new Set(keys).size, 26);
  assert.match(source, /normalizeCourseKey\(title\)/);
  assert.match(source, /normalizeCourseKey\(slug\)/);
});

test("training art is decorative and does not hardcode learning facts", async () => {
  const source = await readFile("src/components/training-course-artwork.tsx", "utf8");
  const page = await readFile("src/app/training/page.tsx", "utf8");
  assert.match(source, /aria-hidden="true"/);
  assert.doesNotMatch(source, /hours|lessons|certificate included|beginner/i);
  assert.match(page, /course\.lesson_count/);
  assert.match(page, /course\.estimated_minutes/);
  assert.match(page, /course\.summary/);
  assert.match(page, /course\.title/);
  assert.match(page, /courseHref = signedIn \? trainingCourseDestination/);
});

test("every approved mockup cover exists as a small, valid WebP header asset", async () => {
  const source = await readFile("src/components/training-course-artwork.tsx", "utf8");
  assert.match(source, /from "next\/image"/);
  assert.match(source, /\/training\/approved-covers\/\$\{art.key\}\.webp/);
  assert.match(source, /className="tr-course-art-approved-image"/);
  assert.match(source, /unoptimized/);
  assert.match(source, /alt=""/);

  for (const slug of expectedArtworkKeys) {
    const file = await readFile("public/training/approved-covers/" + slug + ".webp");
    assert.equal(file.subarray(0, 4).toString("ascii"), "RIFF", slug + ": must be WebP RIFF");
    assert.equal(file.subarray(8, 12).toString("ascii"), "WEBP", slug + ": missing WebP signature");
    assert.ok(file.length > 4_000 && file.length < 35_000,
      slug + ": approved hero image must be valid and optimized");
  }
});
