import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("new hiring leads queue the durable SLA workflow without making lead capture depend on it", async () => {
  const [leads, helper] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/trigger-automation.ts"),
  ]);

  assert.match(leads, /queueLeadSlaAutomation/);
  assert.equal((leads.match(/await queueLeadSlaAutomation\(lead\.id\)/g) || []).length, 3);
  assert.match(helper, /api\.trigger\.dev\/api\/v1\/tasks/);
  assert.match(helper, /vaph-lead-sla/);
  assert.match(helper, /idempotencyKey: `lead-sla-\$\{leadId\}`/);
  assert.match(helper, /reason: "not_active"/);
  assert.match(helper, /AbortSignal\.timeout\(2500\)/);
});

test("lead SLA callback is secret-protected, idempotent, and checks real recruiter contact", async () => {
  const route = await read("src/app/api/internal/automation/lead-sla/route.ts");

  assert.match(route, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(route, /timingSafeSecretMatches/);
  assert.match(route, /first_contact_at/);
  assert.match(route, /discovery_scheduled_at/);
  assert.match(route, /Lead SLA · recruiter contact overdue/);
  assert.match(route, /lead_sla_escalated_30m/);
  assert.match(route, /lead_sla_escalated_2h/);
  assert.match(route, /existingTask/);
  assert.match(route, /\.eq\("status", "todo"\)/);
});

test("Trigger.dev workflow uses durable waits and calls back into VAPH instead of holding database credentials", async () => {
  const [taskSource, config, pkg] = await Promise.all([
    read("automations/trigger/src/lead-sla.ts"),
    read("automations/trigger/trigger.config.ts"),
    read("automations/trigger/package.json"),
  ]);

  assert.match(taskSource, /wait\.for\(\{ seconds: 30 \* 60 \}\)/);
  assert.match(taskSource, /wait\.for\(\{ seconds: 90 \* 60 \}\)/);
  assert.match(taskSource, /\/api\/internal\/automation\/lead-sla/);
  assert.match(taskSource, /AUTOMATION_CALLBACK_SECRET/);
  assert.doesNotMatch(taskSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(config, /runtime: "node-22"/);
  assert.match(pkg, /"@trigger\.dev\/sdk": "4\.6\.4"/);
});
