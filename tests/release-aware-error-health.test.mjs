import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("client error telemetry records deployment identity and a stable fallback fingerprint", async () => {
  const route = await readFile("src/app/api/errors/route.ts", "utf8");
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /error_name: errorName/);
  assert.match(route, /client_stack: clientStack/);
  assert.match(route, /release_sha: process\.env\.VERCEL_GIT_COMMIT_SHA/);
  assert.match(route, /deployment_environment:/);
  assert.match(route, /deployment_host:/);
});

test("client error boundaries send useful debugging context", async () => {
  const rootBoundary = await readFile("src/app/error.tsx", "utf8");
  const workspaceBoundary = await readFile("src/components/workspace-error.tsx", "utf8");

  for (const source of [rootBoundary, workspaceBoundary]) {
    assert.match(source, /name:\s*error\.name/);
    assert.match(source, /stack:\s*error\.stack/);
    assert.match(source, /path:\s*window\.location\.pathname/);
  }
});

test("proposal not-found page gives clients a recoverable path", async () => {
  const page = await readFile("src/app/proposal/not-found.tsx", "utf8");
  assert.match(page, /Proposal unavailable/);
  assert.match(page, /return to the email from your recruiter/i);
  assert.match(page, /Contact the recruiting team/);
});

test("admin health blocks on current-release errors but not historical backlog", async () => {
  const page = await readFile("src/app/workspace/admin/health/page.tsx", "utf8");
  assert.match(page, /currentReleaseSha = runtime\.deployment\.commitSha/);
  assert.match(page, /metadata\?\.release_sha/);
  assert.match(page, /Current release app errors/);
  assert.match(page, /Historical unresolved app errors/);
  assert.match(page, /currentReleaseErrors === 0/);
});
