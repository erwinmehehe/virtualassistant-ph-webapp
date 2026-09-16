import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page=readFileSync("src/app/workspace/client-success/page.tsx","utf8");
const migration=readFileSync("supabase/migrations/20260916033305_client_success_queue_performance.sql","utf8");

test("Client Success loads its operational queue through one scoped RPC",()=>{
  assert.match(page,/\.rpc\("client_success_today_queue"/);
  assert.match(page,/p_actor_id:user\.id/);
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
