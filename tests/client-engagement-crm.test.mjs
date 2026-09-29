import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("reviewed shortlist questions route into the role-scoped recruiter chat", async () => {
  const page = await read("src/app/workspace/client/candidates/page.tsx");

  assert.match(page, /Message recruiter about this role/);
  assert.match(page, /\/workspace\/client\/messages\?job=/);
  assert.doesNotMatch(page, /clientShortlistMessageAction/);
  assert.doesNotMatch(page, /Send to recruiter/);
});

test("recruiter CRM shows role-scoped client engagement signals", async () => {
  const [record, panel, tracker, analyticsApi, migration] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/components/client-engagement-panel.tsx"),
    read("src/components/client-candidate-view-tracker.tsx"),
    read("src/app/api/analytics/route.ts"),
    read("supabase/migrations/20260929195800_client_contact_snapshot.sql"),
  ]);

  for (const label of [
    "Last login",
    "Last VA viewed",
    "VAs viewed",
    "Shortlist opened",
    "Last shortlist activity",
    "Decision received",
    "Last email / chat reply",
  ]) {
    assert.match(panel, new RegExp(label));
  }

  assert.match(record, /recruiter_client_activity_snapshot/);
  assert.match(record, /ClientEngagementPanel/);
  assert.match(tracker, /event: "candidate_viewed"/);
  assert.match(tracker, /job_id: jobId/);
  assert.match(tracker, /va_id: vaId/);
  assert.match(tracker, /surface: "client_hiring_room"/);
  assert.match(analyticsApi, /"candidate_viewed"/);
  assert.match(migration, /count\(distinct nullif\(a\.metadata ->> 'va_id', ''\)\)/);
  assert.match(migration, /a\.metadata ->> 'job_id' = l\.job_id::text/);
  assert.match(migration, /a\.metadata ->> 'surface' = 'client_hiring_room'/);
  assert.match(panel, /distinct candidates actually viewed in this role's Hiring Room/);
});

test("recruiter can explicitly log inbound email replies", async () => {
  const record = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(record, /Log client interaction or email reply/);
  assert.match(record, /<option value="email">Email reply<\/option>/);
});


test("recruiter pipeline surfaces client activity and unread work without opening each record", async () => {
  const [pipeline, migration, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("supabase/migrations/20260929195800_client_contact_snapshot.sql"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(pipeline, /recruiter_client_activity_snapshot/);
  assert.match(pipeline, /Client activity/);
  assert.match(pipeline, /Login/);
  assert.match(pipeline, /VA views/);
  assert.doesNotMatch(pipeline, /VA views\*/);
  assert.doesNotMatch(pipeline, /Account-wide candidate viewing activity/);
  assert.match(pipeline, /Shortlist/);
  assert.match(pipeline, /Decision/);
  assert.match(pipeline, /Follow up/);
  assert.match(pipeline, /unread client message/);
  assert.match(pipeline, /client_more_options_requested/);
  assert.match(pipeline, /need_more_options/);
  assert.match(pipeline, /Review decision/);
  assert.match(pipeline, /unreadChat > 0 \|\| activity\?\.latest_decision === "need_more_options"/);

  assert.match(migration, /auth\.users/);
  assert.match(migration, /candidate_viewed/);
  assert.match(migration, /metadata ->> 'job_id'/);
  assert.match(migration, /count\(distinct nullif\(a\.metadata ->> 'va_id', ''\)\)/);
  assert.match(migration, /client_shortlist_viewed/);
  assert.match(migration, /client_shortlist_message/);
  assert.match(migration, /job_shortlist_candidates/);
  assert.match(migration, /client_recruiter_messages/);
  assert.match(migration, /last_client_chat_at/);
  assert.match(migration, /last_client_contact_at/);
  assert.match(migration, /m\.read_at is null/);
  assert.match(migration, /grant execute on function public\.recruiter_client_activity_snapshot\(uuid\[\]\) to service_role/);

  assert.match(css, /\.clientSignals/);
  assert.match(css, /\.signalUnread/);
});


test("recruiter CRM gives one explicit operational next action", async () => {
  const [record, panel, pipeline] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/components/client-engagement-panel.tsx"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
  ]);

  for (const label of ["Follow up", "Review decision", "Schedule interview", "Close role"]) {
    assert.match(record, new RegExp(label));
    assert.match(pipeline, new RegExp(label));
  }
  assert.match(panel, /Recruiter next action/);
  assert.match(panel, /nextAction\.label/);
  assert.match(panel, /lastClientContact/);
});
