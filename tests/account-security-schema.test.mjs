import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security migration stores private events and exposes only own sessions", async () => {
  const sql = await read("supabase/migrations/20260921_account_security_events_and_session_controls.sql");

  assert.match(sql, /create table if not exists public\.account_security_events/i);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /(?:select\s+)?auth\.uid\(\)\)? = user_id/i);

  assert.match(sql, /create or replace function public\.list_own_auth_sessions\(\)/i);
  assert.match(sql, /from auth\.sessions/i);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i);

  assert.match(sql, /create or replace function public\.revoke_own_auth_session\(target_session_id uuid\)/i);
  assert.match(sql, /id = target_session_id/i);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /auth\.jwt\(\)->>'session_id'/i);
  assert.match(sql, /set search_path = ''/i);
  assert.doesNotMatch(sql, /lookup_auth_user_id_by_email/i);
});

test("session RPC does not accept a browser-supplied user id", async () => {
  const sql = await read("supabase/migrations/20260921_account_security_events_and_session_controls.sql");
  assert.doesNotMatch(sql, /list_own_auth_sessions\s*\(\s*user_id/i);
  assert.doesNotMatch(sql, /revoke_own_auth_session\s*\([^)]*user_id/i);
});
