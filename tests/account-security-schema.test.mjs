import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security migration stores private events and keeps session RPCs server-only", async () => {
  const sql = await read("supabase/migrations/20260921_account_security_events_and_session_controls.sql");

  assert.match(sql, /create table if not exists public\.account_security_events/i);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /(?:select\s+)?auth\.uid\(\)\)? = user_id/i);

  assert.match(sql, /create or replace function public\.list_auth_sessions_for_user\(target_user_id uuid\)/i);
  assert.match(sql, /from auth\.sessions/i);
  assert.match(sql, /s\.user_id = target_user_id/i);
  assert.match(sql, /grant execute on function public\.list_auth_sessions_for_user\(uuid\) to service_role/i);
  assert.match(sql, /revoke all on function public\.list_auth_sessions_for_user\(uuid\) from public, anon, authenticated/i);

  assert.match(sql, /create or replace function public\.revoke_auth_session_for_user/i);
  assert.match(sql, /target_user_id uuid/i);
  assert.match(sql, /target_session_id uuid/i);
  assert.match(sql, /current_session_id uuid/i);
  assert.match(sql, /target_session_id = current_session_id/i);
  assert.match(sql, /user_id = target_user_id/i);
  assert.match(sql, /grant execute on function public\.revoke_auth_session_for_user\(uuid, uuid, uuid\) to service_role/i);

  assert.match(sql, /set search_path = ''/i);
  assert.doesNotMatch(sql, /grant execute[\s\S]*to authenticated/i);
});

test("production hardening migration removes the old signed-in callable RPCs", async () => {
  const sql = await read("supabase/migrations/20260921175000_harden_account_session_rpcs.sql");
  assert.match(sql, /drop function if exists public\.list_own_auth_sessions\(\)/i);
  assert.match(sql, /drop function if exists public\.revoke_own_auth_session\(uuid\)/i);
  assert.match(sql, /grant execute on function public\.list_auth_sessions_for_user\(uuid\) to service_role/i);
  assert.match(sql, /grant execute on function public\.revoke_auth_session_for_user\(uuid, uuid, uuid\) to service_role/i);
});
