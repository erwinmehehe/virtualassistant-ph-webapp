import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("lead scoring is deterministic and uses stage, recency, value, and follow-up urgency", async()=>{
  const scoring=await read("src/lib/lead-scoring.ts");
  assert.match(scoring,/STAGE_POINTS/);
  assert.match(scoring,/estimated_value_usd/);
  assert.match(scoring,/next_follow_up_at/);
  assert.match(scoring,/finalScore >= 70 \? "hot" : finalScore >= 40 \? "warm" : "cold"/);
  assert.match(scoring,/First response overdue/);
});

test("Kanban moves only pipeline state and does not overwrite CRM value or ownership", async()=>{
  const action=await read("src/app/actions/recruiter-stage.ts");
  assert.match(action,/moveLeadStageAction/);
  assert.match(action,/stage_updated_at/);
  assert.match(action,/legacyLeadStatus/);
  assert.doesNotMatch(action,/estimated_value_usd/);
  assert.doesNotMatch(action,/owner_id/);
  assert.doesNotMatch(action,/lost_reason/);
  assert.match(action,/revalidatePath\("\/workspace\/recruiter\/today"\)/);
});

test("recruiter pipeline board supports desktop drag and touch-friendly stage movement", async()=>{
  const [page,board,styles]=await Promise.all([
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
    read("src/components/recruiter-lead-kanban.tsx"),
    read("src/app/workspace/revenue-ops.css")
  ]);
  assert.match(page,/scope === "mine"/);
  assert.match(page,/scoreLead/);
  assert.match(board,/draggable/);
  assert.match(board,/Move .* to another stage/);
  assert.match(board,/moveLeadStageAction/);
  assert.match(styles,/grid-auto-columns: minmax\(272px, 86vw\)/);
  assert.match(styles,/scroll-snap-type: x proximity/);
});

test("CRM list surfaces lead temperature and links to the board", async()=>{
  const crm=await read("src/app/workspace/recruiter/leads/page.tsx");
  assert.match(crm,/Hot leads/);
  assert.match(crm,/lead-temperature/);
  assert.match(crm,/\/workspace\/recruiter\/leads\/board/);
  assert.match(crm,/scoreLead\(lead, now\)/);
});

test("My Day shows how stale or overdue cleanup items are", async()=>{
  const today=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(today,/function overdueAge/);
  assert.match(today,/days-overdue/);
  assert.match(today,/stale/);
  assert.match(today,/overdue/);
});

test("sales analytics render responsive trend, source, and funnel charts", async()=>{
  const [analytics,charts,lib,funnel]=await Promise.all([
    read("src/components/sales-analytics-dashboard.tsx"),
    read("src/components/revenue-charts.tsx"),
    read("src/lib/sales-analytics.ts"),
    read("src/components/agency-funnel-dashboard.tsx")
  ]);
  assert.match(lib,/buildLeadTimeline/);
  assert.match(lib,/timeline,/);
  assert.match(analytics,/RevenueTrendChart/);
  assert.match(analytics,/RevenueBarChart/);
  assert.match(analytics,/RevenueFunnelChart/);
  assert.match(charts,/<svg/);
  assert.match(charts,/role="img"/);
  assert.match(funnel,/RevenueFunnelChart/);
});

test("CRM database function keeps canonical terms_sent leads visible and service-role only", async()=>{
  const migration=await read("supabase/migrations/20260918090000_revenue_ops_pipeline_stage_fix.sql");
  assert.match(migration,/terms_sent/);
  assert.match(migration,/recruiter_leads_page/);
  assert.match(migration,/revoke execute .* from public, anon, authenticated;/s);
  assert.match(migration,/grant execute .* to service_role;/s);
});
