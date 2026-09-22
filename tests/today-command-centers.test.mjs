import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Recruiter My Day exposes the full operating queue",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/Action lanes/);
  assert.match(page,/Approval-ready/);
  assert.match(page,/Approval cleanup/);
  assert.match(page,/Work setup ready/);
  assert.match(page,/0% profiles/);
  assert.match(page,/No-show email/);
  assert.match(page,/Waiting to rebook/);
  assert.match(page,/Roles need candidates/);
  assert.match(page,/Client response overdue/);
  assert.match(page,/Interview action/);
  assert.match(page,/Offers waiting/);
  assert.match(page,/Need replacements/);
  assert.match(page,/Stale roles/);
  assert.match(page,/discovery_no_show_rebook/);
  assert.match(page,/role_without_shortlist/);
  assert.match(page,/all_candidates_passed/);
});

test("Recruiter My Day approval counts are null-stage safe",async()=>{
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/stage\.is\.null,and\(stage\.neq\.approved,stage\.neq\.bench,stage\.neq\.rejected\)/);
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
  assert.match(page,/Every number opens the operating queue behind it/);
  assert.match(page,/openRoleCount/);
});

test("Today dashboards retain action-first mobile responsive styles",async()=>{
  const [recruiterCss,ownerCss]=await Promise.all([
    read("src/app/workspace/recruiter/today/today.module.css"),
    read("src/app/workspace/admin/today/today.module.css")
  ]);
  assert.match(recruiterCss,/actionLaneGrid/);
  assert.match(recruiterCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(ownerCss,/pipelineGrid/);
  assert.match(ownerCss,/@media \(max-width: 760px\)/);
  assert.match(ownerCss,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
