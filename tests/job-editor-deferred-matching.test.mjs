import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20261027120411_defer_job_matching_from_client_save.sql";

test("editing job matching criteria queues refresh instead of executing a full synchronous match", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const start = sql.indexOf("create or replace function public.trigger_refresh_job_matches()");
  const end = sql.indexOf("-- The existing update trigger", start);
  const triggerBody = sql.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(triggerBody, /private\.job_match_refresh_queue/);
  assert.match(triggerBody, /on conflict \(job_id\) do update/);
  assert.match(triggerBody, /clock_timestamp\(\)/);
  assert.doesNotMatch(triggerBody, /refresh_all_match_suggestions|refresh_match_suggestions_for_va/);
  assert.match(sql, /after insert or update of categories,/);
  assert.match(sql, /references public\.jobs\(id\) on delete cascade/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on private\.job_match_refresh_queue from public, anon, authenticated/);
});

test("only the server-side service role may acknowledge completed matching runs", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const maintenance = await readFile("src/app/api/cron/maintenance/route.ts", "utf8");
  assert.match(sql, /current_setting\('request\.jwt\.claims', true\)/);
  assert.match(sql, /is distinct from 'service_role'/);
  assert.match(sql, /requested_at <= p_completed_through/);
  assert.match(sql, /revoke all on function public\.acknowledge_job_match_refresh_queue\(timestamptz\)/);
  assert.match(sql, /grant execute on function public\.acknowledge_job_match_refresh_queue\(timestamptz\)/);
  assert.match(maintenance, /const matchingStartedAt = new Date\(\)\.toISOString\(\)/);
  assert.match(maintenance, /"acknowledge_job_match_refresh_queue"/);
  assert.match(maintenance, /p_completed_through: matchingStartedAt/);
  const errorGuardAt = maintenance.indexOf("if (failed) {");
  const acknowledgeAt = maintenance.indexOf('"acknowledge_job_match_refresh_queue"');
  assert.ok(errorGuardAt > 0 && acknowledgeAt > errorGuardAt);
});

test("client job edit reports temporary database errors rather than returning a false 404", async () => {
  const page = await readFile("src/app/workspace/client/jobs/[id]/edit/page.tsx", "utf8");
  const boundary = await readFile("src/app/workspace/client/jobs/[id]/edit/error.tsx", "utf8");
  assert.match(page, /\.eq\("client_id",user\.id\)\.maybeSingle\(\)/);
  assert.match(page, /if\(jobError\)/);
  assert.ok(page.indexOf("if(jobError)") < page.indexOf("if(!j)notFound()"));
  assert.match(boundary, /Try again/);
  assert.match(boundary, /Return to your jobs/);
});
