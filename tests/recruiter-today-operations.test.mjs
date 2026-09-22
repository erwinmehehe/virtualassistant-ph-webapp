import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter My Day surfaces the daily talent and role operations queues", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /Talent operations/);
  assert.match(page, /Role follow-through/);
  assert.match(page, /readiness=approval_ready/);
  assert.match(page, /missing_photo_count/);
  assert.match(page, /daily_actions/);
  assert.match(page, /client_shortlist_waiting/);
  assert.match(page, /client_response_overdue/);
  assert.match(page, /stale_roles_count/);
  assert.match(page, /stale_roles_preview/);
});

test("Recruiter My Day keeps client waits out of the generic work queue once promoted", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /FOLLOW_THROUGH_KINDS/);
  assert.match(page, /!FOLLOW_THROUGH_KINDS\.has\(String\(item\.kind\)\)/);
  assert.match(page, /sendClientShortlistFollowupAction/);
});

test("Recruiter My Day daily operations layout collapses cleanly on smaller screens", async () => {
  const css = await read("src/app/workspace/recruiter/today/today.module.css");

  assert.match(css, /\.priorityStrip/);
  assert.match(css, /\.operationsGrid/);
  assert.match(css, /@media \(max-width: 1080px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
});
