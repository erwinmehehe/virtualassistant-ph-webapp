import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("previously public closed or expired jobs permanently redirect to the live marketplace", async () => {
  const detail = await readFile("src/app/jobs/[id]/page.tsx", "utf8");

  assert.match(detail, /createAdminClient/);
  assert.match(detail, /published_at/);
  assert.match(detail, /data\.status === "closed" \|\| expired/);
  assert.match(detail, /permanentRedirect\("\/jobs\?closed=1"\)/);
});

test("private never-published job URLs remain inaccessible", async () => {
  const detail = await readFile("src/app/jobs/[id]/page.tsx", "utf8");

  assert.match(detail, /if \(!data\?\.published_at\) return false/);
  assert.match(detail, /notFound\(\)/);
});

test("jobs marketplace explains why a retired listing redirected", async () => {
  const jobs = await readFile("src/app/jobs/page.tsx", "utf8");

  assert.match(jobs, /params\.closed === "1"/);
  assert.match(jobs, /That role has closed\./);
  assert.match(jobs, /current recruiter-reviewed Virtual Assistant opportunities/);
});
