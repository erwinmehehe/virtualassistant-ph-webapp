import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client Hiring Room uses the consolidated summary fast path", async () => {
  const [page, helper] = await Promise.all([
    read("src/app/workspace/client/candidates/page.tsx"),
    read("src/lib/client-hiring-room.ts"),
  ]);

  assert.match(page, /getClientHiringRoomSummary\(userId, query\.role \|\| null\)/);
  assert.match(page, /recordClientShortlistView\(userId, selectedJob\.id, selectedReleased\.length\)/);
  assert.match(page, /trainingCredentialsByUser\(summary\.credentials \|\| \[\]\)/);

  assert.doesNotMatch(page, /createClient/);
  assert.doesNotMatch(page, /createAdminClient/);
  assert.doesNotMatch(page, /\.from\(/);
  assert.doesNotMatch(page, /getTrainingCredentialsForUsers/);

  assert.match(helper, /admin\.rpc\("client_hiring_room_summary"/);
  assert.match(helper, /withServerTiming\("client\.hiring_room_summary"/);
  assert.match(helper, /admin\.rpc\("record_client_shortlist_view"/);
});

test("Hiring Room summary keeps candidate identity behind published role and paid or comped access", async () => {
  const sql = await read("supabase/migrations/20260924162500_client_hiring_room_summary.sql");

  assert.match(sql, /from jobs\s+where client_id=p_client_id/);
  assert.match(sql, /where j\.status='published'/);
  assert.match(sql, /a\.access_status in \('paid','comped'\)/);
  assert.match(sql, /join visible_candidates v on v\.va_id=p\.id/);
  assert.match(sql, /join visible_candidates c on c\.va_id=v\.user_id/);
  assert.match(sql, /where tc\.revoked_at is null/);

  assert.match(sql, /revoke execute on function public\.client_hiring_room_summary\(uuid,uuid\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.client_hiring_room_summary\(uuid,uuid\) to service_role/);
});

test("shortlist view logging is ownership checked and rate limited in one database call", async () => {
  const sql = await read("supabase/migrations/20260924162500_client_hiring_room_summary.sql");

  assert.match(sql, /client_id=p_client_id/);
  assert.match(sql, /status='published'/);
  assert.match(sql, /created_at>=now\(\)-interval '6 hours'/);
  assert.match(sql, /action='client_shortlist_viewed'/);
  assert.match(sql, /jsonb_build_object\('released_count',p_released_count\)/);
  assert.match(sql, /revoke execute on function public\.record_client_shortlist_view\(uuid,uuid,integer\) from public, anon, authenticated/);
});

test("client shortlist decisions disable while saving", async () => {
  const page = await read("src/app/workspace/client/candidates/page.tsx");

  assert.match(page, /PendingSubmitButton[\s\S]*label="Interested"[\s\S]*pendingLabel="Saving…"/);
  assert.match(page, /PendingSubmitButton[\s\S]*label="Request interview"[\s\S]*pendingLabel="Saving…"/);
  assert.match(page, /PendingSubmitButton className="btn btn-sm" label="Place on hold" pendingLabel="Saving…"/);
  assert.match(page, /PendingSubmitButton className="btn btn-sm" label="Confirm pass" pendingLabel="Saving…"/);
});
