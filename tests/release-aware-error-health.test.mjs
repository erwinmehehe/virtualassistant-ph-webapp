import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("client error telemetry records deployment identity", async () => {
  const route = await readFile("src/app/api/errors/route.ts", "utf8");
  assert.match(route, /release_sha: process\.env\.VERCEL_GIT_COMMIT_SHA/);
  assert.match(route, /deployment_environment:/);
  assert.match(route, /deployment_host:/);
});

test("admin health blocks on current-release errors but not historical backlog", async () => {
  const page = await readFile("src/app/workspace/admin/health/page.tsx", "utf8");
  assert.match(page, /currentReleaseSha = runtime\.deployment\.commitSha/);
  assert.match(page, /metadata\?\.release_sha/);
  assert.match(page, /Current release app errors/);
  assert.match(page, /Historical unresolved app errors/);
  assert.match(page, /currentReleaseErrors === 0/);
});
