import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("client shortlist is evidence-first with clear interview, shortlist, and pass actions", async () => {
  const [page, card] = await Promise.all([
    read("src/app/workspace/client/candidates/page.tsx"),
    read("src/components/client-shortlist-candidate-card.tsx"),
  ]);

  assert.match(page, /Why this VA matches|whyMatches/);
  assert.match(page, /label="Request interview"/);
  assert.match(page, /label="Keep shortlisted"/);
  assert.match(page, /Confirm pass/);
  assert.match(card, /View full profile/);
  assert.match(card, /Why this VA matches/);
  assert.match(page, /recordProductEvent\("shortlist_viewed"/);
});

test("every released shortlist candidate can open the client review route even without an application", async () => {
  const page = await read("src/app/workspace/client/candidates/[id]/page.tsx");

  assert.match(page, /from\("job_shortlist_candidates"\)/);
  assert.match(page, /from\("applications"\)/);
  assert.match(page, /eq\("shortlist_status","released"\)/);
  assert.match(page, /shortlist_candidate_id:shortlist\.id/);
  assert.match(page, /Request interview/);
  assert.match(page, /Keep shortlisted/);
  assert.match(page, /clientShortlistDecisionAction/);
});

test("requesting an interview creates the interview workflow and alerts the recruiter and VA", async () => {
  const action = await read("src/app/actions/client-shortlist.ts");

  assert.match(action, /decision === "interview"/);
  assert.match(action, /from\("candidate_interviews"\)\.insert/);
  assert.match(action, /status: "requested"/);
  assert.match(action, /Interview requested for/);
  assert.match(action, /Client requested an interview/);
  assert.match(action, /recordProductEvent\("interview_requested"/);
});

test("Recruiter Today exposes 24, 48, and 72 hour shortlist decision SLA signals", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /clientWait24/);
  assert.match(page, /clientWait48/);
  assert.match(page, /clientWait72/);
  assert.match(page, /24h\+/);
  assert.match(page, /48h\+/);
  assert.match(page, /72h\+/);
  assert.match(page, /client shortlist decision/);
  assert.match(page, /Send client follow-up|Follow up/);
});

test("conversion analytics cover shortlist view through hire", async () => {
  const [shortlistPage, shortlistAction, operations] = await Promise.all([
    read("src/app/workspace/client/candidates/page.tsx"),
    read("src/app/actions/client-shortlist.ts"),
    read("src/app/actions/recruiter-operations-system.ts"),
  ]);

  assert.match(shortlistPage, /recordProductEvent\("shortlist_viewed"/);
  assert.match(shortlistAction, /recordProductEvent\("interview_requested"/);
  assert.match(operations, /recordProductEvent\("interview_completed"/);
  assert.match(operations, /recordProductEvent\("placement_offer_created"/);
  assert.match(operations, /recordProductEvent\("hire_confirmed"/);
});
