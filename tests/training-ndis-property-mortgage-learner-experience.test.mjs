import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("NDIS overview foregrounds evidence, claims, incidents, and provider handoff", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-ndis-course/);
  assert.match(page, /An NDIS administration control pack/);
  assert.match(page, /Authority \+ registration evidence map/);
  assert.match(page, /Roster \+ claim exception queues/);
  assert.match(page, /Complaint \+ incident escalation log/);
  assert.match(page, /Provider admin control board/);
});

test("Property Management overview foregrounds jurisdiction-first controls", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-property-management-course/);
  assert.match(page, /A jurisdiction-first property-management control pack/);
  assert.match(page, /Jurisdiction \+ authority matrix/);
  assert.match(page, /Application \+ rent evidence queues/);
  assert.match(page, /Maintenance \+ access control board/);
  assert.match(page, /Renewal \+ vacate \+ bond handoff/);
});

test("Mortgage Broking overview foregrounds evidence-first administration", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-mortgage-broking-course/);
  assert.match(page, /A mortgage-administration evidence pack/);
  assert.match(page, /Authority \+ secure intake controls/);
  assert.match(page, /Fact-find \+ lender research evidence/);
  assert.match(page, /Application \+ conditions tracker/);
  assert.match(page, /Settlement \+ CRM handoff/);
});

test("all three courses use the shared practical-work lesson treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-ndis-player/);
  assert.match(page, /training-work-player training-property-management-player/);
  assert.match(page, /training-work-player training-mortgage-broking-player/);
  assert.match(page, /NDIS admin artifact included/);
  assert.match(page, /Property admin artifact included/);
  assert.match(page, /Mortgage admin artifact included/);

  assert.match(css, /Australia regulated-admin palettes/);
  assert.match(css, /\.training-ndis-course,[\s\S]*\.training-ndis-player/);
  assert.match(css, /\.training-property-management-course,[\s\S]*\.training-property-management-player/);
  assert.match(css, /\.training-mortgage-broking-course,[\s\S]*\.training-mortgage-broking-player/);
});

test("learner artifact badges are backed by first-class exercises templates and checklists", async () => {
  const sql = await read("supabase/migrations/20260924171500_deepen_ndis_property_mortgage_practical_training.sql");

  assert.match(sql, /ndis-administration-fundamentals/);
  assert.match(sql, /property-management-administration-australia/);
  assert.match(sql, /mortgage-broking-administration-australia/);
  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
});

test("critical regulated-decision boundaries remain explicit", async () => {
  const sql = await read("supabase/migrations/20260924171500_deepen_ndis_property_mortgage_practical_training.sql");

  assert.match(sql, /submitted is not approved/i);
  assert.match(sql, /do not make the claim fit/i);
  assert.match(sql, /administrative completeness is not tenant selection/i);
  assert.match(sql, /a calendar event is not permission to enter/i);
  assert.match(sql, /data entry is not a serviceability edit/i);
  assert.match(sql, /recommendations belong to the broker/i);
  assert.match(sql, /conditional is conditional/i);
});

test("all three finals remain connected practical work simulations", async () => {
  const sql = await read("supabase/migrations/20260924171500_deepen_ndis_property_mortgage_practical_training.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(sql, /Evergreen Supports NDIS Administration Final Work Simulation/);
  assert.match(sql, /Harbourview Property Management Australia Final Work Simulation/);
  assert.match(sql, /Southern Cross Mortgage Administration Final Work Simulation/);
  assert.ok((sql.match(/"hard_fail":true/g) || []).length >= 3);
  assert.match(page, /Practical work simulation/);
});
