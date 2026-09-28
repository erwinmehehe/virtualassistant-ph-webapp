import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Recruiter My Day exposes one action-first operating queue",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/recruiter-next-action/);
  assert.match(page,/Needs action/);
  assert.doesNotMatch(page,/Talent operations/);
  assert.match(page,/Discovery no-shows/);
  assert.match(page,/Follow-through/);
  assert.match(page,/no_show_preview/);
  assert.match(page,/stale_roles_preview/);
  assert.doesNotMatch(page,/Four places to look|priorityStrip/);
});

test("Recruiter My Day uses the compact summary RPC instead of repeated dashboard queries",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/recruiter_today_summary/);
  assert.doesNotMatch(page,/admin\.from\("recruiter_va_directory"\)/);
  assert.doesNotMatch(page,/\.limit\(100\)/);
});

test("Owner Today reads like a business pipeline with direct queues",async()=>{
  const page=await read("src/app/workspace/admin/today/page.tsx");
  assert.match(page,/Lead → revenue → retention/);
  assert.match(page,/New leads/);
  assert.match(page,/Calls today/);
  assert.match(page,/Proposals/);
  assert.match(page,/Open roles/);
  assert.match(page,/Shortlists/);
  assert.match(page,/Placements/);
  assert.match(page,/Collections/);
  assert.match(page,/Retention risks/);
  assert.match(page,/Use this as a scan, not a second task list/);
  assert.match(page,/What needs you now/);
  assert.match(page,/summary\.open_roles/);
});

test("Today dashboards retain action-first mobile responsive styles",async()=>{
  const [recruiterCss,ownerCss]=await Promise.all([
    read("src/app/workspace/recruiter/today/today.module.css"),
    read("src/app/workspace/admin/today/today.module.css")
  ]);
  assert.doesNotMatch(recruiterCss,/workstreamGrid|priorityStrip/);
  assert.match(recruiterCss,/nextAction/);
  assert.doesNotMatch(recruiterCss,/operationsGrid/);
  assert.match(ownerCss,/snapshotGrid/);
  assert.match(ownerCss,/pipelineGrid/);
  assert.match(ownerCss,/@media \(max-width: 760px\)/);
  assert.match(ownerCss,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
