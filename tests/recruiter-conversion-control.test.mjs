import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("conversion control queue catches discovery and proposal handoff gaps",async()=>{
  const [migration,today]=await Promise.all([
    read("supabase/migrations/20261001033500_recruiter_conversion_control.sql"),
    read("src/app/workspace/recruiter/today/page.tsx"),
  ]);

  assert.match(migration,/'proposal_missing'::text/);
  assert.match(migration,/'proposal_draft'::text/);
  assert.match(migration,/discovery_scheduled_at>=now\(\)-interval '7 days'/);
  assert.match(migration,/Discovery outcome overdue/);
  assert.match(migration,/Qualified discovery has no proposal/);
  assert.match(migration,/Proposal draft not sent/);
  assert.doesNotMatch(migration,/\/workspace\/recruiter\/leads/);
  assert.match(migration,/\/workspace\/recruiter\/crm\//);
  assert.match(migration,/set search_path='pg_catalog','public'/);
  assert.match(migration,/revoke execute on function public\.recruiter_today_queue\(uuid,integer\) from public,anon,authenticated/);
  assert.match(migration,/grant execute on function public\.recruiter_today_queue\(uuid,integer\) to service_role/);

  assert.match(today,/CONVERSION_QUEUE_KINDS/);
  assert.match(today,/Resolve overdue discovery outcomes/);
  assert.match(today,/Prepare qualified proposals/);
  assert.match(today,/Send proposal drafts/);
});

test("qualified discovery cannot bypass client proposal approval",async()=>{
  const [workspace,page,recruiter]=await Promise.all([
    read("src/app/actions/discovery-workspace.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(workspace,/const NEXT_STEPS = new Set\(\["save", "proposal", "follow_up", "nurture"\]\)/);
  assert.doesNotMatch(workspace,/intent === "qualified"/);
  assert.match(workspace,/proposal\?generated=1/);
  assert.doesNotMatch(page,/Qualified · Open matching/);
  assert.match(page,/Generate recommendation/);
  assert.match(recruiter,/stage === "qualified" && profile\.role === "recruiter"/);
  assert.match(recruiter,/\/workspace\/recruiter\/crm\/\$\{leadId\}\/discovery\?discovery_completed=1/);
});
