import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("zero-completion VA reminders return the user to quick setup",async()=>{
  const email=await read("src/lib/email.ts");
  const start=email.indexOf("export async function sendProfileCompletionReminderEmail");
  const end=email.indexOf("export async function sendDiscoveryBookingEmail",start);
  const reminder=email.slice(start,end);
  assert.ok(start >= 0 && end > start);
  assert.match(reminder,/const profileUrl = args\.score === 0[\s\S]*\/workspace\/va\/onboarding[\s\S]*:\s*`\$\{args\.appUrl\}\/workspace\/va\/profile`/);
  assert.match(reminder,/ctaHref: profileUrl/);
  assert.match(reminder,/Complete my quick setup/);
});

test("maintenance does not send profile completion reminder emails",async()=>{
  const cron=await read("src/app/api/cron/maintenance/route.ts");
  assert.doesNotMatch(cron,/sendProfileCompletionReminderEmail/);
  assert.doesNotMatch(cron,/runProfileNudges/);
});
