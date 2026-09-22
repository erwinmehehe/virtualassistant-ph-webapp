import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("recruiter Today leads with one next action and four workstreams",async()=>{
  const [page,css]=await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css")
  ]);

  assert.match(page,/id="recruiter-next-action"/);
  assert.match(page,/const workstreams = \[/);
  for(const label of ["Sales","Talent","Clients","Hiring"]){
    assert.ok(page.includes(`label:"${label}"`),`missing ${label} workstream`);
  }
  assert.doesNotMatch(page,/Action lanes/);
  assert.ok(page.indexOf('id="recruiter-next-action"') < page.indexOf('id="workstreams"'));
  assert.match(css,/\.workstreamGrid\s*\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/@media \(max-width: 520px\)[\s\S]*\.workstreamGrid\s*\{[\s\S]*grid-template-columns:1fr/);
});

test("owner dashboard puts exceptions before the business pipeline",async()=>{
  const [page,css]=await Promise.all([
    read("src/app/workspace/admin/today/page.tsx"),
    read("src/app/workspace/admin/today/today.module.css")
  ]);

  assert.match(page,/const ownerSnapshot=\[/);
  for(const label of ["Owner exceptions","New hiring leads","Active placements","Overdue collections"]){
    assert.ok(page.includes(`label:"${label}"`),`missing ${label} owner summary`);
  }
  assert.ok(page.indexOf('id="owner-actions"') < page.indexOf('aria-label="Agency operating pipeline"'));
  assert.doesNotMatch(page,/Revenue & hiring pulse/);
  assert.doesNotMatch(page,/Client & money pulse/);
  assert.match(page,/title="Watchlist"/);
  assert.match(page,/styles\.pipelineQuiet/);
  assert.match(css,/\.snapshotGrid\s*\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/@media \(max-width: 560px\)[\s\S]*\.snapshotGrid\s*\{[\s\S]*grid-template-columns:1fr/);
});

test("client and VA dashboards keep their lean summary paths",async()=>{
  const [client,va]=await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/va/page.tsx")
  ]);

  assert.match(client,/getClientDashboardSummary\(userId\)/);
  assert.match(va,/getVaDashboardSummary\(userId\)/);
  assert.match(client,/getClientDashboardSummary\(userId\)/);
  assert.match(va,/getVaDashboardSummary\(userId\)/);
  assert.match(client,/DashHeader kicker="Managed VA hiring"/);
  assert.match(va,/DashHeader kicker="Vetted VA workspace"/);
  assert.match(client,/Current action/);
  assert.match(va,/Next best action/);
});
