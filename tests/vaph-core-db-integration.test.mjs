import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (p) => readFile(new URL("../" + p, import.meta.url), "utf8");

test("core integration combines consented publication and multi-role hiring tests", async () => {
  const workflow = await read(".github/workflows/vaph-core-db-isolated-qa.yml");
  for (const target of [
    "lead-job-auto-publication.spec.ts",
    "agency-proposal-to-recruiting.spec.ts",
    "agency-shortlist-to-placement.spec.ts",
    "admin-training-completion-health.spec.ts",
    "training-account-activation.spec.ts",
  ]) assert.ok(workflow.includes(target), "Missing focused E2E: " + target);
  assert.match(workflow, /Remote Supabase prohibited in E2E/);
  assert.match(workflow, /Remote Next.js prohibited in E2E/);
  assert.match(workflow, /--workers=1/);
  assert.match(workflow, /stop --no-backup/);
  assert.doesNotMatch(workflow, /VERCEL_TOKEN|AI_GATEWAY_API_KEY|SUPABASE_DB_URL/);
});

test("merging #867 fixtures preserves local-only seeds and client onboarding", async () => {
  const seed = await read("scripts/seed-e2e-users.mjs");
  assert.match(seed, /E2E seed requires a loopback-only Supabase URL/);
  assert.match(seed, /seeded:local-hiring-proposals:6/);
  assert.match(seed, /training_probe/);
  assert.match(seed, /onboarding_completed_at: new Date\(\)\.toISOString\(\)/);
});

test("the feature integration has no schema changes or remote auth bypass", async () => {
  const guide = await read("docs/VAPH_CORE_DB_INTEGRATION_QA_20261015.md");
  assert.match(guide, /no schema migration differences/i);
  assert.match(guide, /Do not merge this integration PR/);
});
