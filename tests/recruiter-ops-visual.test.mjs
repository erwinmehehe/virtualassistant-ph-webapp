import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("authenticated visual QA covers recruiter Roles, Work Readiness, and Agency Funnel",async()=>{
  const visual=await read("scripts/authenticated-dashboard-visual.mjs");
  for(const fragment of [
    'name: "roles", path: "/workspace/recruiter/roles?view=intervention&sort=urgent", heading: "Roles"',
    'name: "work-readiness", path: "/workspace/recruiter/work-readiness", heading: "Work readiness"',
    'name: "funnel", path: "/workspace/recruiter/funnel", heading: "Sales funnel"',
    '.recruiter-readiness-summary > a.is-ready',
    '.agency-funnel-flow',
  ]){
    assert.ok(visual.includes(fragment),`missing recruiter visual coverage: ${fragment}`);
  }
  assert.match(visual,/width: 390, height: 844/);
  assert.match(visual,/width: 768, height: 1024/);
  assert.match(visual,/width: 1440, height: 1000/);
  assert.match(visual,/document\.documentElement\.scrollWidth > document\.documentElement\.clientWidth/);
  assert.match(visual,/mobile first action starts below the first viewport/);
});
