import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const clientNotifications = read("src/app/workspace/client/notifications/page.tsx");
const vaNotifications = read("src/app/workspace/va/notifications/page.tsx");
const notificationOpen = read("src/app/actions/notification-open.ts");
const today = read("src/app/workspace/recruiter/today/page.tsx");
const migration = read("supabase/migrations/20260915090000_recruiter_today_exact_actions.sql");

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

test("My Day routes to exact records and can send shortlist follow-up inline", () => {
  assert.match(today, /exactActionHref/);
  assert.match(today, /matching\/\$\{item\.id\}/);
  assert.match(today, /candidates\/\$\{item\.id\}/);
  assert.match(today, /q=\$\{encodeURIComponent\(email\)\}/);
  assert.match(today, /sendClientShortlistFollowupAction/);
  assert.match(today, /Send client follow-up/);
});

test("My Day does not duplicate the 5-day client overdue stage", () => {
  assert.match(migration, /q\.action_type='client_shortlist_waiting' and q\.age_hours>=120/);
  assert.match(migration, /when q\.subject_type='job' then '\/workspace\/recruiter\/matching\/'\|\|q\.subject_id/);
  assert.match(migration, /when q\.subject_type='va' then '\/workspace\/recruiter\/candidates\/'\|\|q\.subject_id/);
});
