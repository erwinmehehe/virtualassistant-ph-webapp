import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter Today keeps role follow-through visible without duplicating Talent", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.doesNotMatch(page, /Talent operations/);
  assert.match(page, /Follow-through/);
  assert.match(page, /daily_actions/);
  assert.match(page, /client_shortlist_waiting/);
  assert.match(page, /client_response_overdue/);
  assert.match(page, /stale_roles_count/);
  assert.match(page, /stale_roles_preview/);
});

test("Recruiter Today keeps client waits out of the generic work queue once promoted", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /FOLLOW_THROUGH_KINDS/);
  assert.match(page, /!FOLLOW_THROUGH_KINDS\.has\(String\(item\.kind\)\)/);
  assert.match(page, /sendClientShortlistFollowupAction/);
});

test("Recruiter Today stays mobile-friendly after removing the duplicate talent panel", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css"),
  ]);

  assert.doesNotMatch(page, /priorityStrip|Talent operations/);
  assert.doesNotMatch(css, /\.operationsGrid|\.signalRow|\.compactPeople/);
  assert.match(css, /@media \(max-width: 640px\)/);
});
