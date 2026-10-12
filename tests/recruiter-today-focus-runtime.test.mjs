import assert from "node:assert/strict";
import test from "node:test";
import { focusRoleAction, focusStage, recruiterTodayFocus } from "../src/lib/recruiter-today-focus.ts";

function role(id, changes = {}) {
  return {
    id, title: `Role ${id}`, company_name: "Acme Studio",
    status: "published", hiring_stage: "intake", created_at: "2026-10-01T00:00:00Z",
    proposed_count: 0, blocked_proposed_count: 0, client_ready_proposed_count: 0,
    released_count: 0, unanswered_released_count: 0,
    active_interview_count: 0, interview_overdue: false,
    active_offer_count: 0, offer_overdue: false, placement_created: false,
    client_id: "client-1", commercial_status: "accepted",
    candidate_access_status: "paid",
    ...changes,
  };
}

const noSignals = {
  clientReplies: 0, firstContacts: 0, interviewsRequested: 0,
  clientDecisionsWaiting: 0, approvalReady: 0,
};

test("four stage totals classify every job only once, excluding closed jobs", () => {
  const input = [
    role("new"), role("match", { hiring_stage: "sourcing", proposed_count: 2 }),
    role("client", { hiring_stage: "client_review", released_count: 2 }),
    role("interview", { hiring_stage: "interviewing", active_interview_count: 1 }),
    role("filled", { hiring_stage: "filled", placement_created: true }),
    role("closed", { hiring_stage: "closed" }), role("match", { hiring_stage: "sourcing", proposed_count: 2 }),
  ];
  const focus = recruiterTodayFocus(input, noSignals);
  assert.deepEqual(focus.stages, { new: 1, matching: 1, client: 1, interview: 2 });
  assert.equal(focus.needsToday.length, 4);
  assert.equal(new Set(focus.needsToday.map((item) => item.id)).size, focus.needsToday.length);
  assert.equal(focusStage(input[3]), "interview");
});

test("priority order puts overdue interviews ahead of waiting clients and new matching work", () => {
  const focus = recruiterTodayFocus([
    role("matching", { hiring_stage: "sourcing" }),
    role("waiting", { released_count: 1, unanswered_released_count: 1 }),
    role("interview", { active_interview_count: 1, interview_overdue: true }),
  ], noSignals);
  assert.deepEqual(focus.needsToday.map((item) => item.id), ["interview", "waiting", "matching"]);
  assert.equal(focusRoleAction(role("waiting", { released_count: 1, unanswered_released_count: 1 })).label, "Follow up with client");
  assert.equal(focus.needsToday[0].href, "/workspace/recruiter/roles/interview#interviews");
});

test("handoff or commercial approvals are never silently treated as satisfied", () => {
  const blocked = role("block", {
    hiring_stage: "internal_review",
    proposed_count: 3, client_ready_proposed_count: 3,
    commercial_status: null, candidate_access_status: "locked",
  });
  assert.equal(focusRoleAction(blocked).label, "Finish setup before sending");
  assert.equal(focusRoleAction({ ...blocked, commercial_status: "accepted", candidate_access_status: "paid" }).label, "Send candidates to client");
  assert.equal(focusRoleAction({ ...blocked, blocked_proposed_count: 1 }).label, "Check candidate readiness");
});

test("one next action is selected from five plain-language groups with a safe empty state", () => {
  const response = recruiterTodayFocus([], { ...noSignals, clientReplies: 2, firstContacts: 1, interviewsRequested: 5 });
  assert.equal(response.next.title, "Reply to clients");
  assert.equal(response.next.count, 3);
  const interviewing = recruiterTodayFocus([], { ...noSignals, interviewsRequested: 1 });
  assert.equal(interviewing.next.title, "Schedule or review interviews");
  const caughtUp = recruiterTodayFocus([role("filled", { hiring_stage: "filled", placement_created: true })], noSignals);
  assert.equal(caughtUp.next.count, 0);
  assert.equal(caughtUp.next.title, "You're caught up");
});
