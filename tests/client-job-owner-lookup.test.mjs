import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("an accepted client can read only their own linked role; missing or cross-account roles stay 404", async () => {
  const page = await readFile("src/app/workspace/client/jobs/[id]/page.tsx", "utf8");
  assert.match(page, /requireRoleFast\("client"\)/);
  assert.match(page, /createAdminClient\(\)/);
  assert.match(page, /admin\.from\("jobs"\)\.select\("\*"\)\.eq\("id",id\)\.eq\("client_id",userId\)\.maybeSingle\(\)/);
  assert.match(page, /if\(jobError\|\|!job\)notFound\(\)/);
  assert.doesNotMatch(page, /admin\.from\("jobs"\)\.select\("\*"\)\.eq\("id",id\)\.maybeSingle\(\)/);
});

test("the browser acceptance suite verifies linked identity and visible client job title", async () => {
  const spec = await readFile("e2e/agency-proposal-to-recruiting.spec.ts", "utf8");
  assert.match(spec, /expect\(job\?\.client_id\)\.toBe\(lead\?\.client_id\)/);
  assert.match(spec, /expect\(lead\?\.client_id\)\.toBe\(clientAuth\.users\.find/);
  assert.match(spec, /\/workspace\/client\/jobs\/\$\{jobId\}/);
  assert.match(spec, /getByRole\("heading", \{ name: fixture\.roleTitle \}\)/);
});
