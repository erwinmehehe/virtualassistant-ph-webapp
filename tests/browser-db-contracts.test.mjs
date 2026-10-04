import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("browser/database contract lane is isolated from production",async()=>{
  const [workflow,bootstrap,seed,sql]=await Promise.all([
    read(".github/workflows/browser-db-contracts.yml"),
    read("scripts/bootstrap-e2e-local-supabase.sh"),
    read("scripts/seed-e2e-users.mjs"),
    read("scripts/verify-e2e-db-contracts.sql"),
  ]);

  assert.match(workflow,/SUPABASE_CLI_VERSION: "2\.113\.0"/);
  assert.match(workflow,/127\.0\.0\.1:3000/);
  assert.match(bootstrap,/supabase_cli db start/);
  assert.match(bootstrap,/supabase\/schema\.sql/);
  assert.match(bootstrap,/db push --local --include-all/);
  assert.match(bootstrap,/supabase_cli start/);
  assert.doesNotMatch(workflow,/ywkgcyilxhezrfxuwius/);
  assert.doesNotMatch(workflow,/SUPABASE_ACCESS_TOKEN|secrets\\.SUPABASE_DB_URL|secrets\\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(seed,/@gmail\.com|virtualassistant\.com\.ph/i);
  assert.match(sql,/has_table_privilege\('anon'/);
  assert.match(sql,/has_function_privilege\('authenticated'/);
  assert.match(sql,/security_invoker=true/);
  assert.match(sql,/security_barrier=true/);
});

test("Playwright covers public routes and all three workspace roles",async()=>{
  const [config,publicSpec,authSpec]=await Promise.all([
    read("playwright.config.ts"),
    read("e2e/public-critical-paths.spec.ts"),
    read("e2e/auth-workspace.spec.ts"),
  ]);

  assert.match(config,/Desktop Chrome/);
  assert.match(publicSpec,/\/hire/);
  assert.match(publicSpec,/\/book-client-call/);
  assert.match(publicSpec,/\/proposal\/not-found/);
  assert.match(publicSpec,/workspace\/recruiter\/today/);
  assert.match(authSpec,/recruiter\.e2e@example\.test/);
  assert.match(authSpec,/client\.e2e@example\.test/);
  assert.match(authSpec,/va\.e2e@example\.test/);
  assert.match(authSpec,/workspace\/client\/company/);
  assert.match(authSpec,/workspace\/va\/profile/);
});
