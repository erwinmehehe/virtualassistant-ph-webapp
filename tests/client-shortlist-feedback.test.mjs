import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const actions = fs.readFileSync("src/app/actions/client-shortlist.ts", "utf8");
const matching = fs.readFileSync("src/components/staff-job-matching.tsx", "utf8");
const matchingTable = fs.readFileSync("src/components/matching-candidate-table.tsx", "utf8");
const clientCandidates = fs.readFileSync("src/app/workspace/client/candidates/page.tsx", "utf8");
const clientCandidateCard = fs.readFileSync("src/components/client-shortlist-candidate-card.tsx", "utf8");
const recruiterQueue = fs.readFileSync("src/app/workspace/recruiter/client-review/page.tsx", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260915005739_client_shortlist_feedback_and_availability.sql", "utf8");

test("client shortlist feedback is authorized and keeps release state separate from client decisions", () => {
  assert.match(actions, /requireRole\("client"\)/);
  assert.match(actions, /candidateAccessUnlocked/);
  assert.match(actions, /shortlist_status", "released"/);
  assert.match(actions, /client_decision/);
  assert.match(migration, /client_decision in \('interested','interview','pass'\)/);
});

test("recruiters can attach client-facing recommendations and matcher uses current VA profile availability", () => {
  assert.match(matchingTable, /Why this VA is a strong fit for this client/);
  assert.match(matchingTable, /From the VA&apos;s current profile/);
  assert.doesNotMatch(matchingTable, />Ask VA</);
  assert.doesNotMatch(matchingTable, />Mark confirmed</);
  assert.doesNotMatch(matchingTable, /Needs confirmation/);
  assert.match(matchingTable, /current profile/);
  assert.match(matching, /otherClientReviews/);
  assert.match(matching, /potentialCommittedHours/);
});

test("client shortlist records viewed state and offers interested interview and pass decisions", () => {
  assert.match(clientCandidates, /client_shortlist_viewed/);
  assert.match(clientCandidates, />Interested</);
  assert.match(clientCandidates, />Request interview</);
  assert.match(clientCandidates, />Confirm pass</);
  assert.match(clientCandidateCard, /Why we recommend this VA/);
  assert.match(clientCandidates, /ClientShortlistCandidateCard/);
});

test("recruiter client-review queue exposes follow-up and replacement states", () => {
  assert.match(recruiterQueue, /Waiting for client/);
  assert.match(recruiterQueue, /Send follow-up/);
  assert.match(recruiterQueue, /Needs replacement matches/);
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
});
