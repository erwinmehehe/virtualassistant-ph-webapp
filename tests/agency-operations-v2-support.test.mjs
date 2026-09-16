import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const migration=read("supabase/migrations/20260915173200_placement_support_and_work_readiness.sql");
const supportActions=read("src/app/actions/placement-support.ts");
const readinessActions=read("src/app/actions/work-readiness.ts");
const clientSupport=read("src/app/workspace/client/support/page.tsx");
const vaSupport=read("src/app/workspace/va/support/page.tsx");
const csSupport=read("src/app/workspace/client-success/support/page.tsx");
const vaReadiness=read("src/app/workspace/va/work-readiness/page.tsx");
const vaProfile=read("src/app/workspace/va/profile/page.tsx");
const recruiterReadiness=read("src/app/workspace/recruiter/work-readiness/page.tsx");
const clientTeam=read("src/app/workspace/client/team/page.tsx");
const nav=read("src/components/app-nav-links.tsx");

test("placement support is first-class and server-authorized",()=>{
  assert.match(migration,/create table if not exists public\.placement_support_requests/);
  for(const type of ["leave","sick","emergency","late","schedule_change","concern","replacement"]) assert.match(migration,new RegExp(`'${type}'`));
  assert.match(migration,/enable row level security/);
  assert.match(migration,/revoke all on table public\.placement_support_requests from public, anon, authenticated/);
  assert.match(supportActions,/requireAnyRole\(\["client", "va"\]\)/);
  assert.match(supportActions,/room\.client_id !== user\.id/);
  assert.match(supportActions,/room\.va_id !== user\.id/);
  assert.match(supportActions,/requireAnyRole\(\["recruiter", "admin"\]\)/);
  assert.match(supportActions,/client_success_owner_id !== user\.id/);
});

test("attendance and support signals feed deterministic placement health",()=>{
  assert.match(migration,/health_attendance_weight/);
  assert.match(migration,/health_support_weight/);
  assert.match(migration,/v_attendance_score/);
  assert.match(migration,/v_support_score/);
  assert.match(migration,/placement_support_health_sync/);
  assert.doesNotMatch(migration,/openai|llm|gpt/i);
});

test("client VA and Client Success surfaces complete the support loop",()=>{
  assert.match(clientSupport,/Placement support/);
  assert.match(clientSupport,/replacement/);
  assert.match(vaSupport,/Schedule & support/);
  assert.match(vaSupport,/emergency/);
  assert.match(vaSupport,/late/);
  assert.match(csSupport,/Support queue/);
  assert.match(csSupport,/resolvePlacementSupportRequestAction/);
  assert.match(supportActions,/workspace\/client-success\/support\?request=/);
  assert.ok(!nav.includes('["Support", "/workspace/client/support"'));
  assert.ok(!nav.includes('["Schedule & support", "/workspace/va/support"'));
  assert.ok(!nav.includes('["Support queue", "/workspace/client-success/support"'));
});

test("work readiness is private VA evidence with recruiter verification",()=>{
  assert.match(migration,/work_setup_submitted_at/);
  assert.match(migration,/work_setup_verified_by/);
  assert.match(readinessActions,/saveVaWorkSetupAction/);
  assert.match(readinessActions,/verifyVaWorkSetupAction/);
  assert.match(readinessActions,/work_setup_verified_at: null/);
  assert.match(vaReadiness,/redirect\("\/workspace\/va\/profile#work-readiness"\)/);
  assert.match(vaProfile,/Work readiness/);
  assert.match(vaProfile,/Save work setup/);
  assert.match(vaProfile,/These setup details stay private with the recruiting team/);
  assert.match(recruiterReadiness,/Verification queue/);
  assert.match(recruiterReadiness,/Verify work setup/);
  assert.match(clientTeam,/Work setup verified/);
  assert.doesNotMatch(clientTeam,/primary_internet|backup_internet|work_setup_computer/);
  assert.doesNotMatch(nav,/\["Work readiness", "\/workspace\/va\/work-readiness"/);
  assert.doesNotMatch(nav,/\["Work readiness", "\/workspace\/recruiter\/work-readiness"/);
});
