import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("lead scoring is admin configurable with safe defaults",async()=>{
  const [scoring,settings,action,migration]=await Promise.all([
    read("src/lib/lead-scoring.ts"),
    read("src/app/workspace/admin/settings/page.tsx"),
    read("src/app/actions/settings.ts"),
    read("supabase/migrations/20261004081700_configurable_lead_scoring.sql"),
  ]);
  assert.match(scoring,/DEFAULT_LEAD_SCORING_RULES/);
  assert.match(scoring,/normalizeLeadScoringRules/);
  assert.match(scoring,/hotThreshold/);
  assert.match(scoring,/warmThreshold/);
  assert.match(settings,/Lead scoring/);
  assert.match(settings,/updateLeadScoringSettingsAction/);
  assert.match(action,/lead_scoring_rules: rules/);
  assert.match(migration,/lead_scoring_rules jsonb not null/);
  assert.match(migration,/jsonb_typeof\(lead_scoring_rules\) = 'object'/);
});

test("recruiter CRM uses one configured score for list and board prioritization",async()=>{
  const crm=await read("src/app/workspace/recruiter/crm/page.tsx");
  assert.match(crm,/select\("lead_scoring_rules"\)/);
  assert.match(crm,/normalizeLeadScoringRules\(settingsData\?\.lead_scoring_rules\)/);
  assert.match(crm,/scoreByLeadId/);
  assert.match(crm,/leadTemperatureLabel\(scored.temperature\)/);
  assert.match(crm,/scored.score/);
  assert.match(crm,/scoreDiff/);
});
