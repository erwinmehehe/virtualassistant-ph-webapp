import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page=readFileSync("src/app/workspace/client-success/page.tsx","utf8");
const support=readFileSync("src/app/workspace/client-success/support/page.tsx","utf8");
const retention=readFileSync("src/app/workspace/client-success/retention/page.tsx","utf8");
const detail=readFileSync("src/app/workspace/client-success/[id]/page.tsx","utf8");
const helpers=readFileSync("src/lib/client-success-dashboard.ts","utf8");
const loading=readFileSync("src/app/workspace/client-success/loading.tsx","utf8");
const migration=readFileSync("supabase/migrations/20260916033305_client_success_queue_performance.sql","utf8");
const fastMigration=readFileSync("supabase/migrations/20260922153324_client_success_dashboard_fast_paths.sql","utf8");

test("Client Success loads its operational queue through one scoped RPC",()=>{
  assert.match(page,/\.rpc\("client_success_today_queue"/);
  assert.match(page,/p_actor_id:userId/);
  assert.doesNotMatch(page,/\.from\("workrooms"\)/);
  assert.doesNotMatch(page,/\.from\("jobs"\)/);
  assert.doesNotMatch(page,/\.from\("profiles"\)/);
  assert.doesNotMatch(page,/\.from\("placement_checkins"\)/);
  assert.doesNotMatch(page,/roomCheckins|jobMap|profileMap/);
});

test("Client Success queue visibility and priority are resolved in Postgres",()=>{
  assert.match(migration,/create or replace function public\.client_success_today_queue/);
  assert.match(migration,/p\.role::text in \('admin', 'recruiter'\)/);
  assert.match(migration,/w\.client_success_owner_id = p_actor_id/);
  assert.match(migration,/j\.recruiter_id = p_actor_id/);
  assert.match(migration,/priority_rank/);
  assert.match(migration,/left join lateral/);
  assert.match(migration,/status = 'todo'/);
});

test("Client Success performance indexes and RPC permissions stay narrow",()=>{
  assert.match(migration,/workrooms_active_owner_created_idx/);
  assert.match(migration,/placement_checkins_todo_workroom_due_idx/);
  assert.match(migration,/security invoker/);
  assert.match(migration,/revoke all on function public\.client_success_today_queue\(uuid, integer, integer\) from anon/);
  assert.match(migration,/revoke all on function public\.client_success_today_queue\(uuid, integer, integer\) from authenticated/);
  assert.match(migration,/grant execute on function public\.client_success_today_queue\(uuid, integer, integer\) to service_role/);
});

test("Client Success keeps link prefetch disabled",()=>{
  assert.match(page,/Link prefetch=\{false\}/);
});


test("Client Success secondary screens use one scoped summary RPC instead of query fan-out",()=>{
  assert.match(support,/getClientSuccessSupportSummary\(userId\)/);
  assert.match(retention,/getClientSuccessRetentionSummary\(userId\)/);
  assert.match(detail,/getClientSuccessPlacementDetail\(userId,id\)/);
  for(const source of [support,retention,detail]){
    assert.match(source,/requireAnyRoleFast/);
    assert.doesNotMatch(source,/requireAnyRole\(/);
    assert.doesNotMatch(source,/createAdminClient/);
    assert.doesNotMatch(source,/\.from\("/);
  }
  assert.match(helpers,/rpc\("client_success_support_summary"/);
  assert.match(helpers,/rpc\("client_success_retention_summary"/);
  assert.match(helpers,/rpc\("client_success_placement_detail"/);
  assert.match(helpers,/withServerTiming\("client-success\.support_summary"/);
  assert.match(helpers,/withServerTiming\("client-success\.retention_summary"/);
  assert.match(helpers,/withServerTiming\("client-success\.placement_detail"/);
});

test("Client Success fast-path RPCs enforce actor-scoped service-only access",()=>{
  for(const fn of [
    "client_success_support_summary",
    "client_success_retention_summary",
    "client_success_placement_detail",
  ]){
    assert.match(fastMigration,new RegExp(`create or replace function public\\.${fn}`));
  }
  assert.match(fastMigration,/security invoker/g);
  assert.match(fastMigration,/p\.account_status = 'active'/);
  assert.match(fastMigration,/p\.role::text in \('admin','recruiter'\)/);
  assert.match(fastMigration,/w\.client_success_owner_id = p_actor_id/);
  assert.match(fastMigration,/j\.recruiter_id = p_actor_id/);
  assert.match(fastMigration,/revoke all on function public\.client_success_support_summary\(uuid, integer\) from authenticated/);
  assert.match(fastMigration,/revoke all on function public\.client_success_retention_summary\(uuid, integer, integer\) from authenticated/);
  assert.match(fastMigration,/revoke all on function public\.client_success_placement_detail\(uuid, uuid\) from authenticated/);
  assert.match(fastMigration,/grant execute on function public\.client_success_placement_detail\(uuid, uuid\) to service_role/);
});

test("Client Success shows a consistent route loading state",()=>{
  assert.match(loading,/WorkspaceSkeleton/);
  assert.match(loading,/cards=\{4\}/);
});
