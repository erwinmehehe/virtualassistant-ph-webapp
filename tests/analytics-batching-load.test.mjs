import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("related navigation analytics use one request while preserving separate event records", async () => {
  const client = await read("src/components/analytics.tsx");

  assert.match(client, /function sendMany\(events: AnalyticsEvent\[\]\)/);
  assert.match(client, /const payload = JSON\.stringify\(entries\.length === 1 \? entries\[0\] : entries\)/);
  assert.match(client, /const events: AnalyticsEvent\[\] = \[\{ event: "page_view" \}\]/);
  assert.match(client, /if \(pathname === "\/pricing"\) events\.push\(\{ event: "pricing_view" \}\)/);
  assert.match(client, /if \(pathname === "\/hire"\) events\.push\(\{ event: "hire_page_view" \}\)/);
  assert.match(client, /if \(pathname\.startsWith\("\/va\/"\)\) events\.push\(\{ event: "candidate_view" \}\)/);
  assert.match(client, /sendMany\(events\)/);
  assert.doesNotMatch(client, /send\("page_view"\)/);
  assert.match(client, /if \(!tracked\.length\) return/);
  assert.match(client, /getBrowserSessionId\(\)/);
  assert.match(client, /crypto\?\.randomUUID/);
  assert.match(client, /navigator\.sendBeacon/);
});

test("analytics API bounds every batch, retains legacy single event and fails closed", async () => {
  const route = await read("src/app/api/analytics/route.ts");

  assert.match(route, /const candidates = Array\.isArray\(body\) \? body : \[body\]/);
  assert.match(route, /candidates\.length > 4/);
  assert.match(route, /schema\.safeParse\(candidate\)/);
  assert.match(route, /!allowedEvent\(parsed\.data\.event\)/);
  assert.match(route, /const sessionIds = new Set\(events\.map\(\(event\) => event\.session_id \?\? ""\)\)/);
  assert.match(route, /sessionIds\.size !== 1/);
  assert.equal((route.match(/enforceActionRateLimit\("public_analytics:ip"/g) || []).length, 1);
  assert.equal((route.match(/enforceActionRateLimit\("public_analytics:session"/g) || []).length, 1);
  assert.match(route, /if \(sessionId\)/);
  assert.match(route, /BOT_USER_AGENT\.test\(userAgent\)/);
  assert.match(route, /hasSupabaseSession/);
  assert.match(route, /if \(!hasSupabaseSession\) return null/);
  assert.match(route, /const withIds = payloads\.filter/);
  assert.match(route, /const withoutIds = payloads\.filter/);
  assert.match(route, /\.upsert\(withIds, \{ onConflict: "event_id", ignoreDuplicates: true \}\)/);
  assert.match(route, /\.insert\(withoutIds\)/);
  assert.match(route, /dropped: "storage_unavailable"/);
});
