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
    read("supabase/migrations/20260929171000_role_scoped_client_candidate_views.sql"),
  ]);

  for (const label of [
    "Last login",
    "Last VA viewed",
    "VAs viewed",
    "Shortlist opened",
    "Last shortlist activity",
    "Decision received",
    "Last email reply",
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
    read("supabase/migrations/20260929171000_role_scoped_client_candidate_views.sql"),
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
  assert.match(pipeline, /Reply in chat/);
  assert.match(pipeline, /unread client message/);
  assert.match(pipeline, /client_more_options_requested/);
  assert.match(pipeline, /need_more_options/);
  assert.match(pipeline, /Build more options/);
  assert.match(pipeline, /unreadChat > 0 \|\| activity\?\.latest_decision === "need_more_options"/);

  assert.match(migration, /auth\.users/);
  assert.match(migration, /candidate_viewed/);
  assert.match(migration, /metadata ->> 'job_id'/);
  assert.match(migration, /count\(distinct nullif\(a\.metadata ->> 'va_id', ''\)\)/);
  assert.match(migration, /client_shortlist_viewed/);
  assert.match(migration, /client_shortlist_message/);
  assert.match(migration, /job_shortlist_candidates/);
  assert.match(migration, /client_recruiter_messages/);
  assert.match(migration, /m\.read_at is null/);
  assert.match(migration, /grant execute on function public\.recruiter_client_activity_snapshot\(uuid\[\]\) to service_role/);

  assert.match(css, /\.clientSignals/);
  assert.match(css, /\.signalUnread/);
});


test("recruiter CRM can bulk assign follow-up ownership without duplicating search", async () => {
  const [pipeline, action, selection, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/actions/crm.ts"),
    read("src/components/recruiter-crm-selection-control.tsx"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.equal((pipeline.match(/name="q"/g) || []).length, 1);
  assert.match(pipeline, /RecruiterCrmSelectionControl/);
  assert.match(pipeline, /name="bulk_owner_id"/);
  assert.match(pipeline, /name="bulk_follow_up_at"/);
  assert.match(pipeline, /name="lead_id"/);
  assert.match(pipeline, /<b>Reply<\/b>/);
  assert.match(pipeline, /shortlist_opened_at/);
  assert.match(pipeline, /last_shortlist_activity_at/);

  assert.match(selection, /Select all visible/);
  assert.match(selection, /Clear selection/);

  assert.match(action, /bulkUpdateCrmLeadsAction/);
  assert.match(action, /lead_bulk_followup_updated/);
  assert.match(action, /\.eq\("lead_type", "client_hiring"\)/);
  assert.match(action, /CRM_BULK_LEAD_LIMIT = 200/);
  assert.match(action, /Follow-up dates can only be set on active clients/);
  assert.match(action, /\["won", "lost"\]/);

  assert.match(css, /\.bulkBar/);
  assert.match(css, /\.nextStepLink/);
  assert.match(css, /\.rowCheckbox/);
});
