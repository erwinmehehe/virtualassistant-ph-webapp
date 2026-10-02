import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shortlist release queues a durable client-review clock", async () => {
  const [matching, claims, trigger] = await Promise.all([
    read("src/app/actions/matching.ts"),
    read("src/lib/lead-claims.ts"),
    read("src/lib/trigger-automation.ts"),
  ]);

  assert.match(matching, /queueShortlistReviewAutomation\(jobId, now\)/);
  assert.match(claims, /queueShortlistReviewAutomation\(jobId, releasedAt\)/);
  assert.match(trigger, /vaph-shortlist-review/);
  assert.match(
    trigger,
    /shortlist-review-\$\{jobId\}-\$\{releaseKey\}/,
  );
});

test("client interview request queues scheduling automation and decision changes clean stale work", async () => {
  const actions = await read("src/app/actions/client-shortlist.ts");

  assert.match(actions, /queueInterviewSchedulingAutomation/);
  assert.match(actions, /select\("id,created_at"\)\.single\(\)/);
  assert.match(
    actions,
    /queueInterviewSchedulingAutomation\(interviewId, interviewRequestedAt\)/,
  );
  assert.match(actions, /resolveInterviewSchedulingIfClear/);
  assert.match(actions, /resolveShortlistReviewIfComplete/);
});

test("scheduled interviews queue post-interview feedback checks and cancellations clean them", async () => {
  const actions = await read(
    "src/app/actions/recruiter-operations-system.ts",
  );

  assert.match(actions, /queueInterviewFeedbackAutomation/);
  assert.match(
    actions,
    /queueInterviewFeedbackAutomation\([\s\S]*interviewId[\s\S]*scheduledAt\.toISOString\(\)[\s\S]*duration/,
  );
  assert.match(actions, /resolveInterviewSchedulingIfClear/);
  assert.match(actions, /resolveInterviewFeedbackIfClear/);
});

test("client Proceed creates offer-prep work and sending the offer clears it", async () => {
  const [actions, helper] = await Promise.all([
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/lib/hiring-pipeline-automation.ts"),
  ]);

  assert.match(actions, /decision === "proceed"/);
  assert.match(actions, /ensureOfferPrepAction/);
  assert.match(actions, /resolveOfferPrepIfNoProceed/);
  assert.match(actions, /resolveOfferPrepTask\(admin, jobId\)/);
  assert.match(helper, /Prepare placement offer ·/);
  assert.match(helper, /placement_offers/);
});

test("durable hiring callback rejects stale release, request, and schedule runs", async () => {
  const route = await read(
    "src/app/api/internal/automation/hiring-pipeline/route.ts",
  );

  assert.match(route, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(route, /timingSafeSecretMatches/);
  assert.match(route, /stale_release/);
  assert.match(route, /stale_request/);
  assert.match(route, /stale_schedule/);
  assert.match(route, /shortlist_reviewed/);
  assert.match(route, /feedback_recorded/);
});

test("shortlist, scheduling, and feedback clocks use the intended escalation windows", async () => {
  const [shortlist, scheduling, feedback] = await Promise.all([
    read("automations/trigger/src/shortlist-review.ts"),
    read("automations/trigger/src/interview-scheduling.ts"),
    read("automations/trigger/src/interview-feedback.ts"),
  ]);

  assert.match(shortlist, /24 \* 60 \* 60_000/);
  assert.match(shortlist, /wait\.for\(\{ hours: 24 \}\)/);
  assert.match(scheduling, /4 \* 60 \* 60_000/);
  assert.match(scheduling, /wait\.for\(\{ hours: 20 \}\)/);
  assert.match(feedback, /2 \* 60 \* 60_000/);
  assert.match(feedback, /wait\.for\(\{ hours: 22 \}\)/);
});

test("new recruiter tasks use only allowed job subjects and proposal closing uses lead", async () => {
  const [hiring, proposal] = await Promise.all([
    read("src/lib/hiring-pipeline-automation.ts"),
    read("src/lib/proposal-closing-automation.ts"),
  ]);

  assert.match(hiring, /subject_type: "job"/);
  assert.doesNotMatch(hiring, /subject_type: "interview"/);
  assert.match(proposal, /subject_type: "lead"/);
  assert.doesNotMatch(proposal, /subject_type: "proposal"/);
});

test("legacy shortlist and interview cron reminders remain fallback-only until Trigger activation", async () => {
  const [maintenance, trigger] = await Promise.all([
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/lib/trigger-automation.ts"),
  ]);

  assert.match(maintenance, /triggerAutomationsActive/);
  assert.match(maintenance, /if \(!durableHiringAutomation\)/);
  assert.match(trigger, /TRIGGER_AUTOMATIONS_ACTIVE === "1"/);
});

test("hiring pipeline automation does not automatically email clients", async () => {
  const [route, helper] = await Promise.all([
    read("src/app/api/internal/automation/hiring-pipeline/route.ts"),
    read("src/lib/hiring-pipeline-automation.ts"),
  ]);

  assert.doesNotMatch(route, /sendTransactionalEventEmail/);
  assert.doesNotMatch(helper, /sendTransactionalEventEmail/);
  assert.match(helper, /How did the interview go/);
});
