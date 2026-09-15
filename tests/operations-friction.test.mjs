import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const clientNotifications = read("src/app/workspace/client/notifications/page.tsx");
const vaNotifications = read("src/app/workspace/va/notifications/page.tsx");
const notificationOpen = read("src/app/actions/notification-open.ts");
const today = read("src/app/workspace/recruiter/today/page.tsx");
const stalled = read("src/app/workspace/recruiter/stalled/page.tsx");
const exactActionsMigration = read("supabase/migrations/20260915090000_recruiter_today_exact_actions.sql");
const clientShortlist = read("src/app/actions/client-shortlist.ts");
const clientInterviews = read("src/app/workspace/client/interviews/page.tsx");
const maintenance = read("src/app/api/cron/maintenance/route.ts");
const interviewReminderMigration = read("supabase/migrations/20260915042944_candidate_interview_reminders.sql");
const clientSuccess = read("src/app/workspace/client-success/page.tsx");
const recruiterPlacements = read("src/app/workspace/recruiter/placements/page.tsx");

test("client and VA notification cards open their linked action and mark it read", () => {
  for (const source of [clientNotifications, vaNotifications]) {
    assert.match(source, /openWorkspaceNotificationAction/);
    assert.match(source, /Click to act/);
    assert.match(source, /Act now/);
  }
  assert.match(notificationOpen, /\.eq\("user_id", user\.id\)/);
  assert.match(notificationOpen, /update\(\{ read_at: new Date\(\)\.toISOString\(\) \}\)/);
  assert.match(notificationOpen, /redirect\(safeHref\)/);
});

test("My Day routes to exact control centers and can send shortlist follow-up inline", () => {
  assert.match(today, /exactActionHref/);
  assert.match(today, /roles\/\$\{item\.id\}/);
  assert.match(today, /placement_checkin/);
  assert.match(today, /placement_handoff/);
  assert.match(today, /candidates\/\$\{item\.id\}/);
  assert.match(today, /q=\$\{encodeURIComponent\(email\)\}/);
  assert.match(today, /sendClientShortlistFollowupAction/);
  assert.match(today, /Send client follow-up/);
});

test("My Day does not duplicate the 5-day client overdue stage", () => {
  assert.match(exactActionsMigration, /q\.action_type='client_shortlist_waiting' and q\.age_hours>=120/);
  assert.match(today, /meta\.subject_type==="job"/);
  assert.match(today, /meta\.subject_type==="va"/);
});

test("post-hire work has one shared Client Success workspace", () => {
  assert.match(clientSuccess,/Client Success Today/);
  assert.match(recruiterPlacements,/redirect\("\/workspace\/client-success"\)/);
});

test("stalled work uses canonical shortlist interview and offer state", () => {
  assert.match(stalled, /candidate_interviews/);
  assert.match(stalled, /placement_offers/);
  assert.match(stalled, /job_shortlist_candidates/);
  assert.doesNotMatch(stalled, /from\("applications"\)/);
  assert.match(stalled, /\.eq\("recruiter_id",user\.id\)/);
  assert.match(stalled, /Interview feedback overdue/);
  assert.match(stalled, /Waiting for VA acceptance/);
});

test("curated interview requests stay in the canonical interview workflow", () => {
  assert.match(clientShortlist, /from\("candidate_interviews"\)/);
  assert.match(clientShortlist, /shortlist_candidate_id: shortlist\.id/);
  assert.match(clientShortlist, /href: "\/workspace\/va\/interviews"/);
  assert.match(clientShortlist, /redirect\("\/workspace\/client\/interviews\?requested=1"\)/);
  assert.doesNotMatch(clientShortlist, /from\("job_invites"\)/);
  assert.doesNotMatch(clientShortlist, /Open your applications workspace for the next step/);
  assert.match(clientInterviews, /Interview requested\. Choose a time below to schedule it/);
});

test("managed interview and offer reminders stay on canonical workspaces", () => {
  assert.match(maintenance, /from\("candidate_interviews"\)/);
  assert.match(maintenance, /from\("placement_offers"\)/);
  assert.match(maintenance, /schedule_interview_\$\{interview\.id\}/);
  assert.match(maintenance, /href: "\/workspace\/client\/interviews"/);
  assert.match(maintenance, /href: "\/workspace\/va\/offers"/);
  assert.match(maintenance, /href: "\/workspace\/client\/offers"/);
  assert.match(maintenance, /managedByCanonicalFlow/);
});

test("candidate interview reminders are hourly, deduped, and use interview workspaces", () => {
  assert.match(interviewReminderMigration, /reminder_24h_sent_at is null/);
  assert.match(interviewReminderMigration, /reminder_1h_sent_at is null/);
  assert.match(interviewReminderMigration, /candidate-interview-reminders-hourly/);
  assert.match(interviewReminderMigration, /'\/workspace\/client\/interviews'/);
  assert.match(interviewReminderMigration, /'\/workspace\/va\/interviews'/);
});
