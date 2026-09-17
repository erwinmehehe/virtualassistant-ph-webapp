import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public hiring forms save drafts and keep the homepage request lightweight", async () => {
  const [shared, hire, home, migration] = await Promise.all([
    read("src/components/hiring-brief-form.tsx"), read("src/app/hire/page.tsx"), read("src/app/page.tsx"),
    read("supabase/migrations/20260913100907_website_conversion_features.sql")
  ]);
  assert.match(shared, /FormDraftPersistence/);
  assert.match(hire, /<HiringBriefForm/);
  assert.match(home, /<HiringBriefForm variant="general"/);
  assert.doesNotMatch(shared, /name="attachment"/);
  assert.doesNotMatch(shared, /Job description or SOP/i);
  assert.match(shared, /name="name" required/);
  assert.match(shared, /name="email" type="email" required/);
  assert.doesNotMatch(shared, /name="phone" type="tel" required/);
  assert.match(migration, /lead-attachments/);
  assert.match(migration, /public = false/);
});

test("role finder passes qualification answers into the hiring form", async () => {
  const [tools, hire] = await Promise.all([read("src/components/va-tools.tsx"), read("src/app/hire/page.tsx")]);
  for (const key of ["category", "hours", "budget", "start_time"]) assert.match(tools, new RegExp(key));
  assert.match(hire, /params\.hours/);
  assert.match(hire, /params\.budget/);
  assert.match(hire, /params\.start_time/);
});

test("email delivery webhook verifies signatures before updating status", async () => {
  const [route, migration] = await Promise.all([read("src/app/api/webhooks/resend/route.ts"), read("supabase/migrations/20260913100907_website_conversion_features.sql")]);
  assert.match(route, /new Webhook\(secret\)\.verify/);
  assert.match(route, /RESEND_WEBHOOK_SECRET/);
  for (const status of ["delivered", "bounced", "complained", "suppressed"]) assert.match(migration, new RegExp(status));
});

test("legacy operational styles are split from the global foundation", async () => {
  const [layout, globals, operations] = await Promise.all([read("src/app/layout.tsx"), read("src/app/globals.css"), read("src/app/operations.css")]);
  assert.match(layout, /operations\.css/);
  assert.ok(globals.length < 200000, `globals.css remains too large: ${globals.length}`);
  assert.match(operations, /Classes that were referenced in markup but never defined/);
});
