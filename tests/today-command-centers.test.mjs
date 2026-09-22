import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Recruiter My Day exposes the full operating queue",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/Four places to look/);
  assert.match(page,/recruiter-next-action/);
  assert.match(page,/Approval-ready/);
  assert.match(page,/Approval cleanup/);
  assert.match(page,/Work setup ready/);
  assert.match(page,/0% profiles/);
  assert.match(page,/No-show email/);
  assert.match(page,/Waiting to rebook/);
  assert.match(page,/Need candidates/);
  assert.match(page,/Chase overdue client decisions/);
  assert.match(page,/Interview action/);
  assert.match(page,/Offers waiting/);
  assert.match(page,/Need replacements/);
  assert.match(page,/Stale roles/);
  assert.match(page,/no_show_needs_email/);
  assert.match(page,/role_no_candidates/);
  assert.match(page,/replacement_needed/);
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
  assert.match(recruiterCss,/workstreamGrid/);
  assert.match(recruiterCss,/nextAction/);
  assert.match(recruiterCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(ownerCss,/snapshotGrid/);
  assert.match(ownerCss,/pipelineGrid/);
  assert.match(ownerCss,/@media \(max-width: 760px\)/);
  assert.match(ownerCss,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
