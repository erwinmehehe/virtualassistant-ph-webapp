import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter CRM exposes a dedicated timezone confirmation queue", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(page, /import \{ isValidTimeZone \} from "@\/lib\/timezone"/);
  assert.match(page, /\["timezone", "Timezone"\]/);
  assert.match(page, /view === "timezone"/);
  assert.match(page, /!isValidTimeZone\(lead\.timezone\)/);
  assert.match(page, /timezoneNeedsConfirmation/);
  assert.match(page, /Review timezones/);
  assert.match(page, /Timezone needed/);
  assert.match(css, /\.timezoneBanner/);
  assert.match(css, /\.timezoneWarning/);
});

test("Recruiter Today elevates invalid active client timezones as a next action", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /activeLeadTimeZones/);
  assert.match(page, /!\["won", "lost"\]\.includes\(stage\)/);
  assert.match(page, /!isValidTimeZone\(lead\.timezone\)/);
  assert.match(page, /title:"Confirm client timezones"/);
  assert.match(page, /href:"\/workspace\/recruiter\/crm\?view=timezone"/);
});

test("public discovery booking rejects non-IANA timezone strings", async () => {
  const action = await read("src/app/actions/leads.ts");
  const start = action.indexOf("const discoveryBookingSchema");
  const end = action.indexOf("export async function submitDiscoveryBookingAction", start);
  const block = action.slice(start, end);

  assert.match(block, /timezone: z\.string\(\)\.trim\(\)\.min\(2\)\.max\(100\)\.refine/);
  assert.match(block, /isValidTimeZone\(value\)/);
  assert.match(block, /We could not confirm your timezone/);
});

test("database migration clears placeholder timezones and rejects future invalid client-hiring zones", async () => {
  const migration = await read("supabase/migrations/20261001192000_enforce_client_lead_timezone.sql");

  assert.match(migration, /to confirm on discovery call/);
  assert.match(migration, /create or replace function private\.validate_client_hiring_timezone/);
  assert.match(migration, /pg_catalog\.pg_timezone_names/);
  assert.match(migration, /client_hiring timezone must be a valid IANA timezone/);
  assert.match(migration, /before insert or update of timezone, lead_type/);
  assert.match(migration, /revoke execute on function private\.validate_client_hiring_timezone\(\) from public, anon, authenticated/);
});
