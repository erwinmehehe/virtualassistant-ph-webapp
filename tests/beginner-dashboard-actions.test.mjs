import assert from "node:assert/strict";
import test from "node:test";
import { resolveClientHomeAction, resolveVaHomeAction } from "../src/lib/beginner-dashboard-actions.ts";
import { candidateAccessLabel, candidateAccessUnlocked } from "../src/lib/candidate-access.ts";
import { normalizeTimeZone, safeTimeZone } from "../src/lib/timezones.ts";

const role = (id="r1", overrides={}) => ({
  id, title: "Customer Support VA", status: "published",
  moderation_status: "clear", ...overrides,
});
const client = (overrides={}) => ({
  roles: [role()], offers: [], interviews: [], shortlists: [], terms: [],
  access: [], timeToReview: [], tasksToReview: [],
  activePlacements: 0, now: Date.parse("2026-10-12T10:00:00Z"),
  ...overrides,
});
const offer = (status="pending_client", id="r1") => ({ id: "offer-1", job_id: id, status });
const interview = (status="requested", id="r1") => ({
  id: "interview-1", job_id: id, status, client_decision: null,
});
const va = (overrides={}) => ({
  offers: [], interviews: [], pendingInvites: 0, workroomCount: 0,
  recruiterRequests: [], completionScore: 40,
  completionNext: { label: "Work experience", href: "/workspace/va/profile" },
  minimumProfileScore: 80, vetted: false,
  unreadMessages: 0, now: Date.parse("2026-10-12T10:00:00Z"),
  ...overrides,
});

test("client action follows the owner of an offer, not just the offered stage", () => {
  assert.equal(resolveClientHomeAction(client({ offers: [offer("pending_client")] })).label, "Review final offer");
  const waiting = resolveClientHomeAction(client({ offers: [offer("pending_va")] }));
  assert.equal(waiting.tone, "waiting");
  assert.match(waiting.title, /Waiting for the VA/);
  assert.equal(resolveClientHomeAction(client({ offers: [offer("pending_client","another-job")] })).tone, "waiting");
});

test("client is prompted for scheduling only when requested, and feedback after the interview", () => {
  assert.equal(resolveClientHomeAction(client({ interviews: [interview()] })).label, "Choose an interview time");
  const future = { ...interview("scheduled"), scheduled_at: "2026-10-13T10:00:00Z" };
  assert.equal(resolveClientHomeAction(client({ interviews: [future] })).tone, "waiting");
  const done = { ...future, scheduled_at: "2026-10-11T10:00:00Z", duration_minutes: 30 };
  assert.equal(resolveClientHomeAction(client({ interviews: [done] })).label, "Record your decision");
  assert.equal(resolveClientHomeAction(client({ interviews: [{ ...done, client_decision: "proceed" }] })).tone, "waiting");
});

test("fee waiver and paid entitlements are both unlocked, without unlocking a locked job", () => {
  for (const status of ["paid", "comped"]) assert.equal(candidateAccessUnlocked(status), true);
  for (const status of [undefined, null, "locked", "quoted", "invoiced", "requested"]) assert.equal(candidateAccessUnlocked(status), false);
  assert.match(candidateAccessLabel("comped"), /fee waived/i);
  const shortlist = [{ job_id: "r1", client_decision: null }];
  assert.equal(resolveClientHomeAction(client({ shortlists: shortlist, access: [{ job_id:"r1", access_status:"paid" }] })).tone, "decision");
  assert.equal(resolveClientHomeAction(client({ shortlists: shortlist, access: [{ job_id:"r1", access_status:"comped" }] })).label, "Review candidates");
  assert.equal(resolveClientHomeAction(client({ shortlists: shortlist, access: [{ job_id:"r1", access_status:"locked" }] })).tone, "waiting");
});

test("client work review and terms outrank routine hiring updates; setup never resets an active placement", () => {
  assert.equal(resolveClientHomeAction(client({ timeToReview: [{ workroom_id: "w1" }] })).label, "Review submitted work");
  assert.equal(resolveClientHomeAction(client({ terms: [{ job_id: "r1", commercial_status: "quoted" }] })).label, "Review service terms");
  assert.equal(resolveClientHomeAction(client({ roles: [], activePlacements: 1 })).href, "/workspace/client/workroom");
  assert.equal(resolveClientHomeAction(client({ roles: [], activePlacements: 0 })).label, "Post your first job");
  const held = resolveClientHomeAction(client({ roles: [role("r1",{moderation_status:"review"})] }));
  assert.equal(held.label, "View review status");
});

test("VA urgent offers, interviews, invitations and ongoing work outrank routine setup", () => {
  assert.equal(resolveVaHomeAction(va({ offers: [offer("pending_va")] })).label, "Review offer");
  assert.equal(resolveVaHomeAction(va({ interviews: [{...interview("scheduled"), scheduled_at: "2026-10-13T10:00:00Z"}] })).label, "See interview details");
  assert.equal(resolveVaHomeAction(va({ pendingInvites: 1 })).label, "Review opportunities");
  assert.equal(resolveVaHomeAction(va({ workroomCount: 1 })).label, "Open My Work");
  assert.equal(resolveVaHomeAction(va({ recruiterRequests: [{body:"Please update your hours"}] })).label, "Review request");
  assert.equal(resolveVaHomeAction(va({ offers: [offer("pending_client")], vetted: true, completionScore: 100 })).tone, "waiting");
});

test("VA setup stages are only used when there is no more urgent real action", () => {
  assert.equal(resolveVaHomeAction(va()).label, "Continue profile");
  assert.equal(resolveVaHomeAction(va({ completionScore: 90 })).label, "Continue screening");
  assert.equal(resolveVaHomeAction(va({ completionScore: 100, vetted: true })).label, "Find jobs");
});

test("timezone suggestions normalize legacy labels and reject invalid values", () => {
  assert.equal(normalizeTimeZone("Asia/Manila"), "Asia/Manila");
  assert.equal(normalizeTimeZone("US Eastern"), "America/New_York");
  assert.equal(normalizeTimeZone("GMT+8"), "Asia/Manila");
  assert.equal(normalizeTimeZone("not-a-real-zone"), null);
  assert.equal(safeTimeZone("not-a-real-zone"), "Asia/Manila");
});
