import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("production browser smoke checks conversion routes without submitting customer data", async()=>{
  const script=await read("scripts/production-browser-smoke.mjs");
  assert.match(script,/https:\/\/virtualassistant\.com\.ph/);
  assert.match(script,/\/hire/);
  assert.match(script,/\/book-client-call/);
  assert.match(script,/\/contact/);
  assert.match(script,/\/proposal\/not-found/);
  assert.match(script,/booking-time-grid/);
  assert.match(script,/horizontalOverflow/);
  assert.match(script,/pageerror/);
  assert.doesNotMatch(script,/\.click\(\)/);
  assert.doesNotMatch(script,/\.fill\(/);
  assert.doesNotMatch(script,/\.press\(/);
});

test("scheduled browser smoke runs every six hours and retains screenshots",async()=>{
  const workflow=await read(".github/workflows/production-browser-smoke.yml");
  assert.match(workflow,/cron: "23 \*\/6 \* \* \*"/);
  assert.match(workflow,/npx playwright install --with-deps chromium/);
  assert.match(workflow,/npm run smoke:production/);
  assert.match(workflow,/retention-days: 14/);
});
