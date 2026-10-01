import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiters have an obvious Discovery destination and direct workspace links", async () => {
  const [nav, hub, today, crm, workspace] = await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/discovery/page.tsx"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
  ]);

  assert.match(nav, /\["Discovery", "\/workspace\/recruiter\/discovery", CalendarDays\]/);
  assert.match(hub, /requireRoleFast\("recruiter"\)/);
  assert.match(hub, /Discovery calls/);
  assert.match(hub, /Upcoming/);
  assert.match(hub, /Needs action/);
  assert.match(hub, /Completed/);
  assert.match(hub, /Open Discovery Workspace/);

  assert.match(today, /\/workspace\/recruiter\/crm\/\$\{item\.id\}\/discovery/);
  assert.match(today, /Open Discovery Workspace/);
  assert.match(crm, /href="\/workspace\/recruiter\/discovery"/);
  assert.match(crm, /Open discovery/);

  assert.match(workspace, /requireAnyRoleFast\(\["recruiter", "admin"\]\)/);
  assert.doesNotMatch(workspace, /Qualified · Open matching/);
  assert.match(workspace, /Generate recommendation/);
  assert.match(workspace, /send the proposal before matching/);
});

test("manual discovery scheduling uses the client's timezone and never assumes Manila", async () => {
  const [crm, action, workspace, today, timezone, migration] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/lib/timezone.ts"),
    read("supabase/migrations/20260930192000_recruiter_today_discovery_timezone.sql"),
  ]);

  assert.match(crm, /name="discovery_timezone"/);
  assert.match(crm, /client local time/);
  assert.match(crm, /Confirm the client's timezone before scheduling/);
  assert.doesNotMatch(crm, /Date & time[\s\S]{0,120}\(Manila\)/);

  assert.match(action, /zonedDateTimeToUtc/);
  assert.match(action, /discovery_timezone/);
  assert.match(action, /Confirm the client's timezone before scheduling/);
  assert.doesNotMatch(action, /\$\{raw\}:00\+08:00/);

  assert.doesNotMatch(workspace, /Asia\/Manila/);
  assert.match(workspace, /Client timezone not confirmed/);
  assert.match(today, /discoveryTime/);
  assert.match(today, /client timezone not confirmed/);
  assert.match(migration, /l\.timezone/);

  assert.match(timezone, /isValidTimeZone/);
  assert.match(timezone, /zonedDateTimeToUtc/);
  assert.match(timezone, /timeZoneName: "longOffset"/);
});
