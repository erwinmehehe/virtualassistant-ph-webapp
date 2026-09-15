import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const migration=read("supabase/migrations/20260915173000_agency_operations_v2.sql");
const normalizer=read("supabase/migrations/20260915173100_normalize_sales_terms_stage.sql");
const actions=read("src/app/actions/agency-operations-v2.ts");
const roles=read("src/app/workspace/recruiter/roles/page.tsx");
const roleDetail=read("src/app/workspace/recruiter/roles/[id]/page.tsx");
const placements=read("src/app/workspace/recruiter/placements/page.tsx");
const placementDetail=read("src/app/workspace/recruiter/placements/[id]/page.tsx");
const nav=read("src/components/app-nav-links.tsx");
const today=read("src/app/workspace/recruiter/today/page.tsx");
const leadCrm=read("src/lib/lead-crm.ts");

test("agency lifecycle separates Sales Hiring and Placement state",()=>{
  assert.match(leadCrm,/terms_sent/);
  assert.match(migration,/hiring_stage text not null default 'intake'/);
  assert.match(migration,/client_success_owner_id uuid references public\.profiles/);
  assert.match(migration,/placement_stage text not null default 'onboarding'/);
  assert.match(migration,/create table if not exists public\.placement_checkins/);
  for(const checkpoint of ["day3","day7","day14","day30"]) assert.match(migration,new RegExp(`'${checkpoint}'`));
  assert.match(normalizer,/new\.crm_stage='shortlist_sent'/);
  assert.match(normalizer,/new\.crm_stage:='terms_sent'/);
});

test("placement health uses actionable states instead of fake numeric scoring",()=>{
  for(const state of ["healthy","watch","at_risk","recovery","replacement","ended"]) assert.match(migration,new RegExp(`'${state}'`));
  assert.doesNotMatch(migration,/health_score|placement_health_score/);
  assert.doesNotMatch(placementDetail,/\/100|92\/100|Health \d+/);
  assert.match(placementDetail,/Healthy/);
  assert.match(placementDetail,/At Risk/);
  assert.match(placementDetail,/Recovery/);
});

test("Client Success ownership and recruiter handoff are explicit",()=>{
  assert.match(actions,/assignClientSuccessOwnerAction/);
  assert.match(actions,/completeRecruiterHandoffAction/);
  assert.match(actions,/client_success_owner_id/);
  assert.match(actions,/handoff_completed_at/);
  assert.match(placementDetail,/Recruiter → Client Success handoff/);
  assert.match(placementDetail,/Client Success owner/);
  assert.match(migration,/Complete recruiter to Client Success handoff/);
});

test("placement readiness has client VA and agency ownership",()=>{
  assert.match(migration,/\['client'::text,'va'::text,'agency'::text\]/);
  assert.match(migration,/placement_ready_at/);
  assert.match(migration,/recompute_placement_readiness/);
  assert.match(placementDetail,/>Client</);
  assert.match(placementDetail,/>VA</);
  assert.match(placementDetail,/>Agency</);
  assert.match(actions,/toggleAgencyChecklistAction/);
});

test("Role and Placement control centers replace more disconnected recruiter pages",()=>{
  assert.match(roles,/Role Control Center|control center/);
  assert.match(roleDetail,/Role Control Center/);
  assert.match(placements,/Client Success/);
  assert.match(placementDetail,/Placement Control Center/);
  assert.match(nav,/\["Roles", "\/workspace\/recruiter\/roles"/);
  assert.match(nav,/\["Placements", "\/workspace\/recruiter\/placements"/);
});

test("My Day carries Client Success exceptions when the same operator owns them",()=>{
  assert.match(migration,/placement_checkin/);
  assert.match(migration,/placement_risk/);
  assert.match(migration,/placement_handoff/);
  assert.match(today,/Complete check-in/);
  assert.match(today,/Open placement/);
  assert.match(today,/Complete handoff/);
});

test("check-ins turn serious concerns into operational risk",()=>{
  assert.match(actions,/signals\.includes\("red"\)/);
  assert.match(actions,/nextStage = "at_risk"/);
  assert.match(actions,/signals\.includes\("yellow"\)/);
  assert.match(actions,/nextStage = "watch"/);
  assert.match(actions,/room\.placement_ready_at/);
  assert.match(actions,/nextStage = "healthy"/);
});
