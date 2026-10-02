import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production hiring runtime QA remains rollback-only and covers acceptance invariants", async () => {
  const sql = await readFile("scripts/agency-production-runtime-qa.sql", "utf8");

  assert.match(sql, /^begin;/mi);
  assert.match(sql, /rollback;/i);
  assert.match(sql, /accept_lead_proposal_atomic/);
  assert.match(sql, /crm_stage = 'won'/);
  assert.match(sql, /status = 'published'::public\.job_status/);
  assert.match(sql, /hiring_stage in \('ready_to_recruit', 'sourcing'\)/);
  assert.match(sql, /commercial_status = 'accepted'/);
  assert.match(sql, /access_status = 'comped'/);
  assert.match(sql, /proposal_accepted/);
  assert.match(sql, /event_name = 'lead_won'/);
  assert.match(sql, /already_accepted/);
  assert.match(sql, /'cleanup', 'rollback'/);

  assert.doesNotMatch(sql, /commit;/i);
  assert.doesNotMatch(sql, /delete from auth\./i);
  assert.doesNotMatch(sql, /update auth\./i);
});

test("release readiness records live runtime evidence without overstating remaining gates", async () => {
  const readiness = await readFile("AGENCY_RELEASE_READINESS.md", "utf8");

  assert.match(readiness, /2026-10-03 production hiring-loop verification/);
  assert.match(readiness, /3 client-hiring leads/);
  assert.match(readiness, /3 recent booked calls/);
  assert.match(readiness, /discovery-reminder-sweep/);
  assert.match(readiness, /client_identity_invalid/);
  assert.match(readiness, /proposal_expired/);
  assert.match(readiness, /10 stale check-in notifications/);
  assert.match(readiness, /still record runtime new\/existing-client Auth invite\/magic-link/);
  assert.match(readiness, /still record both service models/);
  assert.match(readiness, /still record Auth and email failure behavior/);
  assert.match(readiness, /Go\/no-go: HOLD/);
});
