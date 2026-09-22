import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("public job surfaces exclude moderated roles",()=>{
  const listing=read("src/app/jobs/page.tsx");
  const detail=read("src/app/jobs/[id]/page.tsx");
  assert.match(listing,/\.eq\("status", "published"\)[\s\S]{0,120}\.eq\("moderation_status", "clear"\)/);
  assert.match(detail,/\.eq\("status", "published"\)\.eq\("moderation_status", "clear"\)/);
});

test("authenticated visual QA mutates only the exact protected smoke role",()=>{
  const script=read("scripts/authenticated-dashboard-visual.mjs");
  assert.match(script,/const smokeJobId = String\(process\.env\.SMOKE_JOB_ID/);
  assert.match(script,/\[SMOKE QA\] Admin Support/);
  assert.match(script,/SMOKE_JOB_ID does not point to the protected smoke QA role/);
  assert.match(script,/Send 3 to client/);
  assert.match(script,/Move Smoke VA Three up/);
  assert.match(script,/Request interview/);
  assert.match(script,/Client shortlist order did not match recruiter order/);
  assert.doesNotMatch(script,/workspace\/recruiter\/matching\/\$\{/);
});

test("GitHub workflows use OIDC and do not depend on stored smoke credentials",()=>{
  const visual=read(".github/workflows/dashboard-visual.yml");
  const production=read(".github/workflows/authenticated-production-smoke.yml");
  for(const workflow of [visual,production]){
    assert.match(workflow,/id-token: write/);
    assert.match(workflow,/bootstrap-github-smoke\.mjs/);
    assert.doesNotMatch(workflow,/secrets\.SMOKE_/);
    assert.doesNotMatch(workflow,/vars\.SMOKE_JOB_ID/);
    assert.doesNotMatch(workflow,/SUPABASE_SERVICE_ROLE_KEY/);
  }
  assert.match(production,/SMOKE_BASE_URL: https:\/\/virtualassistant\.com\.ph/);
  assert.match(visual,/SMOKE_BASE_URL: https:\/\/virtualassistant\.com\.ph/);
  assert.match(visual,/VISUAL_BASE_URL: https:\/\/virtualassistant\.com\.ph/);
  assert.match(visual,/Wait for this main commit to reach production/);
  assert.doesNotMatch(visual,/SMOKE_BASE_URL: \$\{\{ steps\.production\.outputs\.url \}\}/);
  assert.doesNotMatch(production,/inputs\.base_url/);
});

test("smoke bootstrap route is restricted to this repo, main, and the two approved workflows",()=>{
  const route=read("src/app/api/internal/github-smoke-auth/route.ts");
  assert.match(route,/virtualassistant-smoke/);
  assert.match(route,/erwinmehehe\/virtualassistant-ph-webapp/);
  assert.match(route,/refs\/heads\/main/);
  assert.match(route,/dashboard-visual\.yml/);
  assert.match(route,/authenticated-production-smoke\.yml/);
  assert.match(route,/verifyGithubOidc/);
  assert.match(route,/moderation_status: "blocked"/);
  assert.match(route,/directory_visible: false/);
  assert.match(route,/type: "magiclink"/);
  assert.doesNotMatch(route,/password:/);
});

test("smoke sign-in accepts current publishable keys without treating them as bearer JWTs",()=>{
  for(const path of ["scripts/authenticated-dashboard-visual.mjs","scripts/authenticated-production-smoke.mjs"]){
    const script=read(path);
    assert.match(script,/anonKey\.startsWith\("eyJ"\)/);
  }
});
