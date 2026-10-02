import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client-facing shortlists reject sub-60 percent matches", async () => {
  const matching = await read("src/app/actions/matching.ts");
  assert.match(matching, /\["invite", "release"\]\.includes\(mode\)/);
  assert.match(matching, /Number\(row\.match_score \|\| 0\) < 60/);
  assert.match(matching, /Client-facing shortlists require 60%\+ matches/);
});

test("client shortlist invite records its delivery timestamp for follow-up timing", async () => {
  const matching = await read("src/app/actions/matching.ts");
  assert.match(matching, /action: "client_review_invited"/);
  assert.match(matching, /invite_sent_at: now/);
});

test("maintenance sends one account-claim follow-up after 24 hours", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance, /async function runClientClaimFollowups/);
  assert.match(maintenance, /24 \* 60 \* 60 \* 1000/);
  assert.match(maintenance, /client_review_invite_followup_sent/);
  assert.match(maintenance, /client_shortlist_claim_followup/);
  assert.match(maintenance, /client-shortlist-claim-followup-/);
  assert.match(maintenance, /job\.client_id/);
  assert.match(maintenance, /lead\.client_id/);
  assert.match(maintenance, /client shortlist claim follow-up/);
  assert.match(maintenance, /clientClaimFollowups: clientClaimFollowupResult/);
});
