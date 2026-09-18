import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("admin system setup reports Google Calendar readiness", async () => {
  const [status,page,check] = await Promise.all([
    read("src/lib/env-status.ts"),
    read("src/app/workspace/admin/system/page.tsx"),
    read("scripts/check-runtime-config.mjs"),
  ]);

  for (const name of [
    "GOOGLE_CALENDAR_CLIENT_ID",
    "GOOGLE_CALENDAR_CLIENT_SECRET",
    "GOOGLE_CALENDAR_REFRESH_TOKEN",
  ]) {
    assert.match(status, new RegExp(name));
    assert.match(check, new RegExp(name));
  }

  assert.match(status, /googleCalendar:/);
  assert.match(page, /Google Calendar \+ Meet/);
  assert.match(page, /status\.googleCalendar\.configured/);
  assert.match(page, /automatic Google Calendar booking/i);
});
