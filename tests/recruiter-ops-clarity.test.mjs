import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("recruiter work readiness is a filtered verification queue",async()=>{
  const page=await read("src/app/workspace/recruiter/work-readiness/page.tsx");
  assert.match(page,/Needs action/);
  assert.match(page,/Ready to verify/);
  assert.match(page,/Incomplete/);
  assert.match(page,/Verified/);
  assert.match(page,/missingEvidence/);
  assert.match(page,/recruiter-readiness-evidence/);
  assert.match(page,/Verify work setup/);
});

test("categories are consolidated into Roles talent coverage",async()=>{
  const [roles,categories,nav,action]=await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/app/workspace/recruiter/categories/page.tsx"),
    read("src/components/app-nav-links.tsx"),
    read("src/app/actions/va-categories.ts")
  ]);
  assert.match(roles,/Talent coverage/);
  assert.match(roles,/demandCounts/);
  assert.match(roles,/supplyCounts/);
  assert.match(roles,/Auto-categorize/);
  assert.match(categories,/redirect\("\/workspace\/recruiter\/roles#talent-coverage"\)/);
  assert.doesNotMatch(nav,/\["Categories", "\/workspace\/recruiter\/categories"/);
  assert.match(action,/workspace\/recruiter\/roles\?categorized=/);
});

test("agency funnel explains stage-to-stage conversion",async()=>{
  const component=await read("src/components/agency-funnel-dashboard.tsx");
  assert.match(component,/Each percentage compares one stage with the stage immediately before it/);
  assert.match(component,/moved forward/);
  assert.match(component,/Lead → active role/);
  assert.match(component,/Role → placement/);
  assert.match(component,/Needs attention/);
});

test("recruiter analytics prioritizes operating health before diagnostics",async()=>{
  const [page,sales]=await Promise.all([
    read("src/app/workspace/recruiter/analytics/page.tsx"),
    read("src/components/sales-analytics-dashboard.tsx")
  ]);
  assert.match(page,/Analytics answers “how well are we operating\?”/);
  assert.match(page,/Hiring conversion/);
  assert.match(page,/Current workload/);
  assert.match(page,/Why clients pass/);
  assert.match(page,/Website & sales analytics/);
  assert.match(sales,/Hiring enquiries/);
  assert.match(sales,/Website → client funnel/);
  assert.match(sales,/from previous step/);
});
