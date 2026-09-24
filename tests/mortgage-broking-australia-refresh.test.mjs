import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924001500_refresh_mortgage_broking_australia.sql";

test("mortgage course distinguishes admin from regulated credit conduct", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /A VA job title does not by itself make regulated conduct unregulated/i);
  assert.match(sql, /authorised broker/i);
  assert.match(sql, /Do not independently suggest a lender or product/i);
  assert.match(sql, /job title is not the boundary/i);
});

test("intake workflow applies current privacy and data-minimisation principles", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /OAIC's May 2026 APP 3 guidance/i);
  assert.match(sql, /data minimisation/i);
  assert.match(sql, /collect only personal information reasonably necessary/i);
  assert.match(sql, /personal device or personal cloud drive/i);
});

test("fact find preserves source data instead of improving serviceability", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /reasonable inquiries into the consumer's requirements and objectives/i);
  assert.match(sql, /reasonable steps to verify the financial situation/i);
  assert.match(sql, /preliminary assessment/i);
  assert.match(sql, /Data entry is not a serviceability edit/i);
  assert.match(sql, /Do not reduce expenses, omit liabilities/i);
});

test("lender research stays factual and dated without recommendation", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /best interests/i);
  assert.match(sql, /checked date/i);
  assert.match(sql, /Facts can be compared; recommendations belong to the broker/i);
  assert.match(sql, /Do not rank options as best/i);
});

test("application packaging tracks ASIC disclosure workflow evidence", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /credit guide, quote, proposal document, and written preliminary assessment/i);
  assert.match(sql, /track required brokerage disclosures/i);
  assert.match(sql, /Packaging is not permission to change the story/i);
  assert.match(sql, /latest payslip is missing/i);
});

test("conditional approval and settlement statuses are not overstated", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Conditional approval is not the same as unconditional approval or settlement/i);
  assert.match(sql, /Conditional is conditional/i);
  assert.match(sql, /Record successful settlement only when the authoritative confirmation arrives/i);
  assert.match(sql, /Settlement admin does not reopen the recommendation/i);
});

test("final assessment is evidence-based and broker-boundary aware", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Client file checklist/);
  assert.match(sql, /Lender research extract/);
  assert.match(sql, /Application and conditions register/);
  assert.match(sql, /Mortgage administration authority matrix/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("mortgage course uses normal editorial release and stays published", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("mortgage training remains private inside authenticated training", async () => {
  const specializations = await readFile("src/lib/training-specializations.ts", "utf8");
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");

  assert.match(specializations, /mortgage-broking-administration-australia/);
  assert.doesNotMatch(publicTraining, /\/training\/courses\/mortgage-broking-administration-australia/);
});
