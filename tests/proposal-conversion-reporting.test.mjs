import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("agency funnel reports proposal conversion and timing from actual proposal events",async()=>{
  const [migration,loader,dashboard]=await Promise.all([
    read("supabase/migrations/20260930213000_proposal_conversion_reporting.sql"),
    read("src/lib/agency-funnel-metrics.ts"),
    read("src/components/agency-funnel-dashboard.tsx"),
  ]);

  for(const field of [
    "proposal_sent",
    "proposal_accepted",
    "median_hours_to_view",
    "median_hours_to_decision",
    "changes_requested",
    "accepted",
    "declined",
  ]) assert.match(migration,new RegExp(field));

  assert.match(migration,/lp\.sent_at is not null/);
  assert.match(migration,/percentile_cont\(0\.5\)/);
  assert.match(loader,/proposal_sent:number/);
  assert.match(loader,/proposal_accepted:number/);
  assert.match(loader,/median_hours_to_view:number/);
  assert.match(loader,/median_hours_to_decision:number/);

  assert.match(dashboard,/label:"Proposal sent"/);
  assert.match(dashboard,/label:"Proposal accepted"/);
  assert.match(dashboard,/Proposal conversion/);
  assert.match(dashboard,/View rate/);
  assert.match(dashboard,/Response rate/);
  assert.match(dashboard,/Acceptance rate/);
  assert.match(dashboard,/Time to view/);
  assert.match(dashboard,/Time to decision/);
  assert.match(dashboard,/Actual proposal events only/);
});

test("Recruiter Today surfaces only proposal states that need human action",async()=>{
  const [migration,page]=await Promise.all([
    read("supabase/migrations/20260930213000_proposal_conversion_reporting.sql"),
    read("src/app/workspace/recruiter/today/page.tsx"),
  ]);

  assert.match(migration,/status='changes_requested'/);
  assert.match(migration,/viewed_at<=now\(\)-interval '24 hours'/);
  assert.match(migration,/sent_at<=now\(\)-interval '48 hours'/);
  assert.match(migration,/expires_at is null or expires_at>now\(\)/);
  assert.match(migration,/row_number\(\) over\(partition by lp\.lead_id/);

  assert.match(page,/summary\.proposal_actions/);
  assert.match(page,/Move open proposals/);
  assert.match(page,/Changes requested:/);
  assert.match(page,/Viewed proposal needs follow-up:/);
  assert.match(page,/Proposal not opened:/);
  assert.match(page,/Open proposal/);
  assert.match(page,/proposalChangesRequested/);
  assert.match(page,/proposalViewedWaiting/);
  assert.match(page,/proposalUnopened/);
});

test("proposal reporting keeps both dashboard RPCs service-role only",async()=>{
  const migration=await read("supabase/migrations/20260930213000_proposal_conversion_reporting.sql");
  assert.match(migration,/revoke all on function public\.agency_funnel_metrics\(integer,uuid\) from public/);
  assert.match(migration,/revoke all on function public\.agency_funnel_metrics\(integer,uuid\) from authenticated/);
  assert.match(migration,/grant execute on function public\.agency_funnel_metrics\(integer,uuid\) to service_role/);
  assert.match(migration,/revoke execute on function public\.recruiter_today_summary\(uuid\) from public, anon, authenticated/);
  assert.match(migration,/grant execute on function public\.recruiter_today_summary\(uuid\) to service_role/);
});

test("proposal action queue stays inside the existing Recruiter Today summary RPC",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/recruiter_today_summary/);
  assert.doesNotMatch(page,/from\("lead_proposals"\)/);
  assert.doesNotMatch(page,/rpc\("proposal_/);
});
