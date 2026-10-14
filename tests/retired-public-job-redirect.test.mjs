import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("closed or expired public job URLs return 404 for clean deindexing", async () => {
  const detail = await readFile("src/app/jobs/[id]/page.tsx", "utf8");

  assert.doesNotMatch(detail, /createAdminClient/);
  assert.doesNotMatch(detail, /permanentRedirect\("\/jobs\?closed=1"\)/);
  assert.match(detail, /if \(!job\) notFound\(\)/);
});

test("private never-published job URLs remain inaccessible", async () => {
  const detail = await readFile("src/app/jobs/[id]/page.tsx", "utf8");

  assert.match(detail, /if \(!job\) notFound\(\)/);
  assert.match(detail, /robots: \{ index: false, follow: false \}/);
});

test("jobs marketplace can still explain a retired listing when linked with the closed flag", async () => {
  const jobs = await readFile("src/app/jobs/page.tsx", "utf8");

  assert.match(jobs, /params\.closed === "1"/);
  assert.match(jobs, /That role has closed\./);
  assert.match(jobs, /current recruiter-reviewed Virtual Assistant opportunities/);
});
