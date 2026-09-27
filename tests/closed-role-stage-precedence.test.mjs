import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = "supabase/migrations/20260927142000_closed_role_stage_precedence.sql";

test("closed roles outrank historical client-review records in stage sync", async () => {
  const sql = await readFile(path, "utf8");

  const filled = sql.indexOf("v_stage := 'filled'");
  const closed = sql.indexOf("v_stage := 'closed'");
  const offer = sql.indexOf("v_stage := 'offer'");
  const clientReview = sql.indexOf("v_stage := 'client_review'");

  assert.ok(filled >= 0);
  assert.ok(closed > filled);
  assert.ok(offer > closed);
  assert.ok(clientReview > closed);
  assert.match(sql, /elsif v_status = 'closed' then\s+v_stage := 'closed'/);
});

test("draft roles remain intake even when a client is already linked", async () => {
  const sql = await readFile(path, "utf8");

  const draft = sql.indexOf("elsif v_status = 'draft' then");
  const clientReady = sql.indexOf("elsif v_status = 'pending' and v_client is not null then");

  assert.ok(draft >= 0);
  assert.ok(clientReady > draft);
  assert.match(sql, /elsif v_status = 'draft' then\s+v_stage := 'intake'/);
  assert.match(sql, /elsif v_status = 'pending' and v_client is not null then\s+v_stage := 'ready_to_recruit'/);
});

test("stage precedence migration normalizes existing roles", async () => {
  const sql = await readFile(path, "utf8");
  assert.match(sql, /for r in select id from public\.jobs/);
  assert.match(sql, /perform public\.sync_job_hiring_stage\(r\.id\)/);
});
