import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA acceptance starts durable client confirmation and client confirmation creates handoff work", async () => {
  const [actions, trigger, helper] = await Promise.all([
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/lib/trigger-automation.ts"),
    read("src/lib/post-hire-automation.ts"),
  ]);

  assert.match(actions, /queueOfferClientConfirmationAutomation\(offerId, now\)/);
  assert.match(actions, /data: workroomId, error: hireError/);
  assert.match(actions, /ensurePlacementHandoffAction/);
  assert.match(actions, /queuePlacementHandoffAutomation\(room\.id, room\.created_at\)/);
  assert.match(actions, /resolveOfferClientConfirmationArtifacts/);
  assert.match(trigger, /vaph-offer-client-confirmation/);
  assert.match(trigger, /vaph-placement-handoff/);
  assert.match(helper, /Client confirmation ·/);
  assert.match(helper, /Placement handoff ·/);
});

test("offer confirmation uses 4h and 24h checkpoints without auto-emailing the client", async () => {
  const [taskSource, route, helper] = await Promise.all([
    read("automations/trigger/src/offer-client-confirmation.ts"),
    read("src/app/api/internal/automation/post-hire/route.ts"),
    read("src/lib/post-hire-automation.ts"),
  ]);

  assert.match(taskSource, /4 \* 60 \* 60_000/);
  assert.match(taskSource, /wait\.for\(\{ hours: 20 \}\)/);
  assert.match(taskSource, /"4h"/);
  assert.match(taskSource, /"24h"/);
  assert.match(route, /stale_acceptance/);
  assert.match(route, /pending_client/);
  assert.doesNotMatch(route, /sendTransactionalEventEmail/);
  assert.doesNotMatch(helper, /sendTransactionalEventEmail/);
});

test("formal handoff stays recruiter-owned until completion and then queues Client Success readiness", async () => {
  const [actions, handoffTask, readinessTask] = await Promise.all([
    read("src/app/actions/agency-operations-v2.ts"),
    read("automations/trigger/src/placement-handoff.ts"),
    read("automations/trigger/src/placement-readiness.ts"),
  ]);

  assert.match(actions, /ensurePlacementHandoffAction/);
  assert.match(actions, /resolvePlacementHandoffTask/);
  assert.match(actions, /queuePlacementReadinessAutomation\(workroomId, now, room\.start_date\)/);
  assert.match(actions, /completeAgencyChecklistByTitle\(admin, workroomId, "Assign Client Success owner", user\.id\)/);
  assert.match(handoffTask, /24 \* 60 \* 60_000/);
  assert.match(readinessTask, /48 \* 60 \* 60_000/);
  assert.match(readinessTask, /24 \* 60 \* 60_000/);
  assert.match(readinessTask, /wait\.until/);
});

test("post-handoff readiness is assigned to Client Success and preserves participant ownership", async () => {
  const helper = await read("src/lib/post-hire-automation.ts");

  assert.match(helper, /activeClientSuccessOwner/);
  assert.match(helper, /client_success_owner_id/);
  assert.match(helper, /Launch readiness ·/);
  assert.match(helper, /owner_role === "client"/);
  assert.match(helper, /owner_role === "va"/);
  assert.match(helper, /owner_role === "agency"/);
  assert.match(helper, /without taking ownership away from the client or VA/);
});

test("client and VA checklist changes recompute placement readiness and clear completed automation work", async () => {
  const [owned, legacy, agency] = await Promise.all([
    read("src/app/actions/workroom-checklist.ts"),
    read("src/app/actions/workroom.ts"),
    read("src/app/actions/agency-operations-v2.ts"),
  ]);

  assert.match(owned, /recompute_placement_readiness/);
  assert.match(owned, /resolvePlacementReadinessIfReady/);
  assert.match(legacy, /recompute_placement_readiness/);
  assert.match(legacy, /resolvePlacementReadinessIfReady/);
  assert.match(agency, /recompute_placement_readiness/);
  assert.match(agency, /resolvePlacementReadinessIfReady/);
});

test("post-hire callback is secret-protected and ignores stale events", async () => {
  const route = await read(
    "src/app/api/internal/automation/post-hire/route.ts",
  );

  assert.match(route, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(route, /timingSafeSecretMatches/);
  assert.match(route, /stale_acceptance/);
  assert.match(route, /stale_workroom/);
  assert.match(route, /stale_handoff/);
  assert.match(route, /handoff_complete/);
  assert.match(route, /placement_ready/);
  assert.match(route, /readiness_not_applicable/);
});

test("post-hire recruiter tasks use the allowed job subject type", async () => {
  const helper = await read("src/lib/post-hire-automation.ts");

  assert.match(helper, /subject_type: "job"/);
  assert.match(helper, /subject_id: args\.jobId/);
  assert.doesNotMatch(helper, /subject_type: "offer"/);
  assert.doesNotMatch(helper, /subject_type: "workroom"/);
});

test("legacy client-confirmation reminder remains fallback-only until durable automations are active", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");

  assert.match(maintenance, /const durableHiringAutomation = triggerAutomationsActive\(\)/);
  assert.match(
    maintenance,
    /!durableHiringAutomation && offer\.status === "pending_client"/,
  );
});

test("all post-hire queues share the explicit Trigger activation gate", async () => {
  const trigger = await read("src/lib/trigger-automation.ts");

  assert.match(trigger, /TRIGGER_AUTOMATIONS_ACTIVE === "1"/);
  assert.match(trigger, /vaph-offer-client-confirmation/);
  assert.match(trigger, /vaph-placement-handoff/);
  assert.match(trigger, /vaph-placement-readiness/);
  assert.match(trigger, /offer-client-confirmation-\$\{offerId\}/);
  assert.match(trigger, /placement-handoff-\$\{workroomId\}/);
  assert.match(trigger, /placement-readiness-\$\{workroomId\}/);
});
