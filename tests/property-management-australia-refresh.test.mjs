import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924000500_refresh_property_management_australia.sql";

test("property management refresh uses jurisdiction-first tenancy administration", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Identify the property jurisdiction/i);
  assert.match(sql, /jurisdiction before applying any notice, entry, rent, bond, or tenancy workflow/i);
  assert.match(sql, /Do not copy notice periods or forms between jurisdictions/i);
  assert.match(sql, /NSW/);
  assert.match(sql, /VIC/);
  assert.match(sql, /QLD/);
});

test("rental application workflow protects privacy and anti-discrimination boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /data-minimisation/i);
  assert.match(sql, /major rental-application platform collected excessive personal information/i);
  assert.match(sql, /Do not reject, downgrade, steer, or discourage an applicant/i);
  assert.match(sql, /young children/i);
  assert.match(sql, /social-media information/i);
  assert.match(sql, /unredacted bank transaction history/i);
});

test("rent administration separates ledger evidence from legal enforcement", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Check recent receipts, reversals, allocation errors, credits/i);
  assert.match(sql, /A ledger is evidence, not legal authority/);
  assert.match(sql, /payment plans, waivers, tribunal matters/i);
  assert.match(sql, /rent increases/i);
  assert.match(sql, /formal termination/i);
});

test("maintenance lesson triages serious risk without technical diagnosis", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /immediate safety or serious property risk must not sit in a normal inbox/i);
  assert.match(sql, /Triage is not diagnosis/);
  assert.match(sql, /water entering through a ceiling near a light fitting/i);
  assert.match(sql, /preferred contractor rules/i);
  assert.match(sql, /strata\/body-corporate responsibility/i);
});

test("inspection workflow requires purpose notice proof and local entry rules", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /exact reason for entry/i);
  assert.match(sql, /notice form, minimum notice, permitted time, frequency limit/i);
  assert.match(sql, /preserve proof of service/i);
  assert.match(sql, /A calendar event is not permission to enter/);
  assert.match(sql, /property is in Queensland/i);
});

test("renewal vacate and bond workflow separates evidence from entitlement", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /condition reports, photos, invoices, maintenance records/i);
  assert.match(sql, /separates proposed deductions from authorised outcomes/i);
  assert.match(sql, /Evidence first, entitlement second/);
  assert.match(sql, /unmatched receipt/i);
  assert.match(sql, /Do not decide notice validity or bond entitlement/i);
});

test("final property simulation uses current practical assessment quality system", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Mixed-jurisdiction property queue/);
  assert.match(sql, /Jurisdiction-first workflow accuracy/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /jsonb/);
  assert.match(sql, /resource_pack/);
  assert.match(sql, /rubric/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("property course stays editorial-only and published", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("property training remains private and inside the Australia training path", async () => {
  const learner = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");

  assert.match(learner, /property-management-administration-australia/);
  assert.doesNotMatch(publicTraining, /\/training\/courses\/property-management-administration-australia/);
});
