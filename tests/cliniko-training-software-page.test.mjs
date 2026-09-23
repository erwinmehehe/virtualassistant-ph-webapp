import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const softwarePath = "src/lib/software-pages.ts";
const migrationPath = "supabase/migrations/20260923225000_refresh_cliniko_training.sql";

test("Cliniko has one dedicated software hiring page", async () => {
  const software = await readFile(softwarePath, "utf8");

  assert.equal((software.match(/slug: "cliniko-virtual-assistant"/g) || []).length, 1);
  assert.match(software, /primaryKeyword: "cliniko virtual assistant"/);
  assert.match(software, /metaTitle: "Hire Cliniko Virtual Assistant Philippines"/);
  assert.match(software, /directoryCategory: "Dental & Healthcare"/);
  assert.match(software, /allied-health-referral-billing/);
  assert.match(software, /medical-virtual-assistant/);
  assert.match(software, /phone-receptionist/);
});

test("Cliniko software page targets non-clinical front-desk workflows", async () => {
  const software = await readFile(softwarePath, "utf8");

  for (const phrase of [
    "appointment scheduling",
    "patient record administration",
    "appointment reminders",
    "secure patient form administration",
    "invoice administration",
    "payment recording",
    "recall and missed-appointment administration",
  ]) {
    assert.match(software, new RegExp(phrase, "i"));
  }

  assert.match(software, /Scheduler may be enough for booking-only support/i);
  assert.match(software, /Do not give a Virtual Assistant treatment-note or clinical access simply for convenience/i);
  assert.match(software, /clinical decisions/i);
});

test("Cliniko software page inherits static route, sitemap, canonical, and FAQ schema", async () => {
  const route = await readFile("src/app/software/[slug]/page.tsx", "utf8");
  const sitemap = await readFile("src/app/sitemap.ts", "utf8");

  assert.match(route, /generateStaticParams/);
  assert.match(route, /softwarePages\.map/);
  assert.match(route, /canonicalPath\(\`\/software\/\$\{page\.slug\}\`\)/);
  assert.match(route, /FAQPage/);
  assert.match(route, /BreadcrumbList/);
  assert.match(sitemap, /softwarePages\.map/);
});

test("Cliniko training uses least-privilege security roles", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const role of ["Scheduler", "Receptionist", "Power receptionist", "Practitioner", "Bookkeeper", "Administrator"]) {
    assert.match(sql, new RegExp(role));
  }
  assert.match(sql, /minimum role/i);
  assert.match(sql, /treatment notes/i);
  assert.match(sql, /Clinical records stay clinical/);
});

test("Cliniko training covers current reminders, secure forms, and booking handoff", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /secure patient forms/i);
  assert.match(sql, /appointment confirmations and reminders/i);
  assert.match(sql, /practitioner booking notifications/i);
  assert.match(sql, /Forms are not a diagnosis queue/);
  assert.match(sql, /clinical interpretation belongs with the practitioner/i);
});

test("Cliniko payment training covers current online payment workflow and boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Stripe/);
  assert.match(sql, /deposits or full payment during online booking/i);
  assert.match(sql, /email, SMS, or QR code/i);
  assert.match(sql, /refund/i);
  assert.match(sql, /write off/i);
  assert.match(sql, /Payment tools do not create commercial authority/);
});

test("Cliniko final simulation remains practical with the 80 percent gate", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /minimum-necessary user permissions/i);
  assert.match(sql, /secure patient-form workflow/i);
  assert.match(sql, /deposits or online payment requests/i);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
  assert.match(sql, /and status = 'published'/);
});
