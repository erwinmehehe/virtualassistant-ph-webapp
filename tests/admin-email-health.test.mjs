import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("admin email health exposes volume failures and suppressions", async () => {
  const p = await readFile(new URL("../src/app/workspace/admin/email-health/page.tsx", import.meta.url), "utf8");
  assert.match(p, /Email health/);
  assert.match(p, /outbound_email_events/);
  assert.match(p, /email_suppressions/);
  assert.match(p, /Recipient deliveries today/);
  assert.match(p, /Remaining daily allowance/);
  assert.match(p, /Sends by automation/);
  assert.match(p, /Recent delivery problems/);
});

test("admin email health reports query failures instead of healthy empty states", async () => {
  const p = await readFile(new URL("../src/app/workspace/admin/email-health/page.tsx", import.meta.url), "utf8");
  assert.match(p, /eventsError/);
  assert.match(p, /suppressionsError/);
  assert.match(p, /Email health data unavailable/);
  assert.match(p, /Email health data unavailable/);
  assert.match(p, /suppression data/);
});

test("admin email health is an admin-only workspace destination", async () => {
  const nav = await readFile(new URL("../src/components/app-nav-links.tsx", import.meta.url), "utf8");
  const adminLayout = await readFile(new URL("../src/app/workspace/admin/layout.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/workspace/admin/email-health/page.tsx", import.meta.url), "utf8");
  const emailHealth = '["Email Health", "/workspace/admin/email-health", Activity]';
  const adminStart = nav.indexOf("admin: [");
  const linkIndex = nav.indexOf(emailHealth);

  assert.ok(adminStart >= 0, "admin navigation group must exist");
  assert.ok(linkIndex > adminStart, "Email Health must be placed in the admin navigation group");
  assert.equal(nav.slice(0, adminStart).includes(emailHealth), false, "Email Health must not appear in non-admin navigation");
  assert.match(adminLayout, /requireRoleFast\("admin"\)/);
  assert.match(page, /requireRoleFast\("admin"\)/);
});
