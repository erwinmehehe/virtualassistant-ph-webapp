import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const core=read("supabase/migrations/20260915173000_agency_operations_v2.sql");
const lifecycle=read("supabase/migrations/20260915173010_agency_operations_v2_lifecycle.sql");
const automation=read("supabase/migrations/20260915173020_placement_health_privacy_and_automation.sql");
const guardrails=read("supabase/migrations/20260915173025_availability_and_rate_guardrails.sql");
const actions=read("src/app/actions/agency-operations-v2.ts");
const csToday=read("src/app/workspace/client-success/page.tsx");
const placement=read("src/app/workspace/client-success/[id]/page.tsx");
const clientTeam=read("src/app/workspace/client/team/page.tsx");
const vaWorkroom=read("src/app/workspace/va/workroom/page.tsx");
const vaProfile=read("src/app/workspace/va/profile/page.tsx");
const company=read("src/app/workspace/client/company/page.tsx");
const companyVisibility=read("src/app/actions/company-visibility.ts");
const jobs=read("src/app/jobs/page.tsx");
const jobCard=read("src/components/job-card.tsx");
const pricing=read("src/app/pricing/page.tsx");
const settings=read("src/app/workspace/admin/settings/page.tsx");
const businessSettings=read("src/lib/business-settings.ts");
const nav=read("src/components/app-nav-links.tsx");
const oldPlacements=read("src/app/workspace/recruiter/placements/page.tsx");

test("sales hiring and placement are separate lifecycles",()=>{
  assert.match(core,/hiring_stage text not null default 'intake'/);
  for(const stage of ["pre_start","launch","active","recovery","replacement","ended"]) assert.match(core,new RegExp(`'${stage}'`));
  assert.match(core,/client_success_owner_id uuid references public\.profiles/);
  assert.match(lifecycle,/client_success_owner_id into v_owner from admin_settings/);
  assert.doesNotMatch(lifecycle,/coalesce\(j\.recruiter_id/);
});

test("placement health is numeric deterministic and separate from lifecycle",()=>{
  assert.match(core,/health_score integer/);
  assert.match(core,/health_status text not null default 'building'/);
  assert.match(automation,/create or replace function public\.recompute_placement_health/);
  assert.match(automation,/health_client_sentiment_weight/);
  assert.match(automation,/health_va_sentiment_weight/);
  assert.match(automation,/health_task_completion_weight/);
  assert.match(automation,/health_timesheet_weight/);
  assert.match(automation,/health_performance_weight/);
  assert.match(automation,/v_score:=null/);
  assert.match(placement,/health_score!=null/);
  assert.match(placement,/Waiting for enough real signals/);
  assert.doesNotMatch(automation,/openai|llm|gpt/i);
});

test("milestone pulses are automated and only concerns escalate",()=>{
  for(const checkpoint of ["day1","day3","day7","day14","day30","day60","day90"]) assert.match(lifecycle,new RegExp(`'${checkpoint}'`));
  assert.match(automation,/placement-client-success-hourly/);
  assert.match(automation,/month'\|\|v_month/);
  assert.match(automation,/client_signal in \('yellow','red'\)/);
  assert.match(automation,/va_signal in \('yellow','red'\)/);
  assert.match(actions,/submitPlacementPulseAction/);
  assert.match(clientTeam,/Great/);
  assert.match(clientTeam,/Some concerns/);
  assert.match(clientTeam,/Need help/);
  assert.match(vaWorkroom,/Need support/);
  assert.match(vaWorkroom,/Serious concern/);
});

test("Client Success is a shared post-hire workspace instead of a duplicate recruiter system",()=>{
  assert.match(csToday,/Client Success Today/);
  assert.match(csToday,/Who needs attention today/);
  assert.match(placement,/Recruiter → Client Success handoff/);
  assert.match(placement,/Placement readiness/);
  assert.match(oldPlacements,/redirect\("\/workspace\/client-success"\)/);
  assert.match(nav,/\["Client Success", "\/workspace\/client-success"/);
  assert.match(nav,/\["My Team", "\/workspace\/client\/team"/);
});

test("client My Team centers the managed placement relationship",()=>{
  assert.match(clientTeam,/<h1>My Team<\/h1>/);
  assert.match(clientTeam,/Placement Ready|Setup in progress/);
  assert.match(clientTeam,/Client Success/);
  assert.match(clientTeam,/health_score/);
  assert.match(clientTeam,/submitPlacementPulseAction/);
  assert.match(clientTeam,/Health is still building/);
});

test("availability freshness is VA self-service and blocks stale client presentation",()=>{
  assert.match(automation,/va-availability-freshness-daily/);
  assert.match(automation,/availability_confirmed_at<now\(\)-interval '14 days'/);
  assert.match(automation,/guard_released_candidate_availability/);
  assert.match(automation,/new\.shortlist_status='released'/);
  assert.match(actions,/confirmVaAvailabilityAction/);
  assert.match(actions,/availability_self_confirmed/);
  assert.match(vaProfile,/Confirm availability/);
  assert.match(vaProfile,/Availability confirmed/);
  assert.match(guardrails,/invalidate_va_availability_confirmation/);
});

test("public client identity is private unless the client opts in",()=>{
  assert.match(core,/public_company_visible boolean not null default false/);
  assert.match(automation,/where c\.public_company_visible=true/);
  assert.match(company,/Public company identity/);
  assert.match(companyVisibility,/public_company_visible:visible/);
  assert.match(jobCard,/company\?\.company_name\|\|"Confidential Client"/);
  assert.doesNotMatch(jobCard,/job\.company_name/);
  assert.doesNotMatch(jobs,/company_name\.ilike/);
});

test("commercial defaults have one server source of truth",()=>{
  assert.match(businessSettings,/admin_settings/);
  assert.match(businessSettings,/min_hourly_rate/);
  assert.match(pricing,/getBusinessSettings/);
  assert.match(settings,/Minimum managed placement hourly rate/);
  assert.match(guardrails,/guard_configured_minimum_rate/);
});

test("placement automation reads as managed service rather than an AI product",()=>{
  for(const source of [clientTeam,vaWorkroom,csToday,placement]) assert.doesNotMatch(source,/AI assistant|AI-powered|copilot|chatbot/i);
  assert.match(placement,/Client Success/);
  assert.match(clientTeam,/Client Success/);
});
