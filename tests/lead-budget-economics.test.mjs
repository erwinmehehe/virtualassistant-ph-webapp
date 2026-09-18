import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("lead economics derives monthly client budget from hourly budget and expected hours", async()=>{
  const economics=await read("src/lib/lead-economics.ts");
  assert.match(economics,/WEEKS_PER_MONTH = 4\.33/);
  assert.match(economics,/estimateHoursPerWeek/);
  assert.match(economics,/hourly\.midpoint \* hoursPerWeek \* WEEKS_PER_MONTH/);
  assert.match(economics,/Virtual Assistant budget\|Hourly VA budget/);
});

test("lead scoring prioritizes budget and hours before manual agency value", async()=>{
  const scoring=await read("src/lib/lead-scoring.ts");
  assert.match(scoring,/estimateLeadBudget/);
  assert.match(scoring,/Strong budget \+ hours/);
  assert.match(scoring,/Healthy budget \+ hours/);
  assert.match(scoring,/estimatedMonthlyBudget/);
  assert.match(scoring,/estimated_value_usd/);
});

test("all public hiring flows persist structured budget and carry it into job drafts", async()=>{
  const leads=await read("src/app/actions/leads.ts");
  assert.match(leads,/service: service\.name,[\s\S]*budget: parsed\.data\.budget \|\| null/);
  assert.match(leads,/title: service\.name,[\s\S]*budget: parsed\.data\.budget/);
  assert.match(leads,/service: serviceLabel,[\s\S]*budget: parsed\.data\.budget \|\| null/);
  assert.match(leads,/title: primaryService\?\.name \|\|[\s\S]*budget: parsed\.data\.budget/);
  assert.match(leads,/company: parsed\.data\.company\?\.trim\(\) \|\| null,[\s\S]*budget: parsed\.data\.budget/);
  assert.match(leads,/source_page: "client_discovery_booking"[\s\S]*budget: parsed\.data\.budget|budget: parsed\.data\.budget,[\s\S]*source_page: "client_discovery_booking"/);
});

test("lead API and migration support structured budget with historical backfill", async()=>{
  const [api,migration]=await Promise.all([
    read("src/app/api/leads/route.ts"),
    read("supabase/migrations/20260918102000_lead_budget_hours_scoring.sql")
  ]);
  assert.match(api,/budget: z\.string\(\)\.optional\(\)\.nullable\(\)/);
  assert.match(migration,/add column if not exists budget text/);
  assert.match(migration,/Virtual Assistant budget/);
  assert.match(migration,/Hourly VA budget/);
});

test("recruiter CRM and Kanban label client budget separately from agency value", async()=>{
  const [crm,boardPage,board]=await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
    read("src/components/recruiter-lead-kanban.tsx")
  ]);
  assert.match(crm,/\/mo client budget/);
  assert.match(crm,/agency est\./);
  assert.match(boardPage,/estimatedMonthlyBudget/);
  assert.match(board,/\/mo client budget/);
  assert.match(board,/agency est\./);
});
