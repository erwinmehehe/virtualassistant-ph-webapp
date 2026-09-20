import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("admin email health exposes volume failures and suppressions", async () => {
  const p = await readFile(new URL("../src/app/workspace/admin/email-health/page.tsx", import.meta.url), "utf8");
  assert.match(p, /Email health/);
  assert.match(p, /outbound_email_events/);
  assert.match(p, /email_suppressions/);
  assert.match(p, /Quota errors/);
  assert.match(p, /Email volume by automation/);
  assert.match(p, /Recent delivery problems/);
});

test("admin email health is reachable from workspace navigation", async () => {
  const nav = await readFile(new URL("../src/components/app-nav-links.tsx", import.meta.url), "utf8");
  assert.match(nav, /\["Email Health", "\/workspace\/admin\/email-health", Activity\]/);
});
