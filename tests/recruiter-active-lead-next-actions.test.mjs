import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter Today gets one sales action per owned active lead from the summary RPC", async () => {
  const migration = await read("supabase/migrations/20261001195500_recruiter_active_lead_actions.sql");

  assert.match(migration, /active_lead_action_rows as materialized/);
  assert.match(migration, /coalesce\(l\.crm_stage,'new'\) not in \('won','lost'\)/);
  assert.match(migration, /\(l\.owner_id=p_user_id or l\.owner_id is null\)/);
  assert.match(migration, /left join lateral/);
  assert.match(migration, /then 'first_contact'/);
  assert.match(migration, /then 'record_discovery_outcome'/);
  assert.match(migration, /then 'revise_proposal'/);
  assert.match(migration, /then 'follow_up_proposal'/);
  assert.match(migration, /then 'reengage_nurture'/);
  assert.match(migration, /then 'prepare_discovery'/);
  assert.match(migration, /then 'prepare_proposal'/);
  assert.match(migration, /then 'wait_follow_up'/);
  assert.match(migration, /'active_lead_actions', ala\.rows/);
  assert.match(migration, /cross join active_lead_actions ala/);
});

test("Recruiter Today renders a dedicated client next-action list without another lead query", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css"),
  ]);

  assert.match(page, /summary\.active_lead_actions/);
  assert.match(page, /id="client-next-actions"/);
  assert.match(page, />Client next actions</);
  assert.match(page, /One concrete sales step per active client assigned to you/);
  assert.match(page, /clientLeadActionLabel/);
  assert.match(page, /clientLeadActionDetail/);
  assert.match(page, /clientLeadActionHref/);
  assert.match(page, /Timezone needed/);
  assert.doesNotMatch(page, /from\("lead_intake"\)/);
  assert.match(css, /\.clientActionList/);
  assert.match(css, /\.clientActionRow/);
  assert.match(css, /\.clientActionUrgent/);
  assert.match(css, /@media \(max-width: 700px\)/);
});

test("first contact and due client work can become the Recruiter Today primary action", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  const replies = page.indexOf('title:"Reply to clients"');
  const firstContact = page.indexOf('title:"Contact new client leads"');
  const dueClients = page.indexOf('title:"Move due client leads"');
  const timezone = page.indexOf('title:"Confirm client timezones"');

  assert.ok(replies >= 0);
  assert.ok(firstContact > replies);
  assert.ok(dueClients > firstContact);
  assert.ok(timezone > dueClients);
  assert.match(page, /firstContactActions/);
  assert.match(page, /dueClientActions/);
});
