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


test("Recruiter Today promotes human shortlist conversion into the command center", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /getRecruiterRolesSummary/);
  assert.match(page, /shortlistConversionRoles/);
  const { focusRoleAction } = await import("../src/lib/recruiter-today-focus.ts");
  const example = {
    id: "role-1", title: "VA", company_name: "Acme", status: "published",
    hiring_stage: "internal_review", created_at: "2026-10-01T00:00:00Z",
    proposed_count: 2, blocked_proposed_count: 1, client_ready_proposed_count: 1,
    released_count: 0, unanswered_released_count: 0,
    active_interview_count: 0, interview_overdue: false,
    active_offer_count: 0, offer_overdue: false, placement_created: false,
    client_id: "client-1", commercial_status: "accepted",
    candidate_access_status: "paid",
  };
  assert.equal(focusRoleAction(example).label, "Check candidate readiness");
  assert.equal(focusRoleAction({ ...example, blocked_proposed_count: 0, client_ready_proposed_count: 2 }).label, "Send candidates to client");
  assert.match(page, /Shortlists to move/);
  assert.match(page, /not automatic match suggestions/);
});
