import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("workspace loads shared mobile-first dashboard rules after existing safeguards", async()=>{
  const [layout,styles]=await Promise.all([
    read("src/app/workspace/layout.tsx"),
    read("src/app/workspace/dashboard-mobile-first.css")
  ]);

  assert.match(layout,/import "\.\/workspace-layout-fixes\.css";\s*import "\.\/dashboard-mobile-first\.css";/);
  assert.match(styles,/--dash-touch:\s*44px/);
  assert.match(styles,/font-size:\s*16px/);
  assert.match(styles,/safe-area-inset-bottom/);
  assert.match(styles,/\.dashboard-shell \.dash-stats,[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles,/@media \(min-width: 681px\)/);
  assert.match(styles,/@media \(max-width: 420px\)/);
  assert.match(styles,/\.dashboard-shell \.table-wrap,[\s\S]*overflow-x:\s*auto/);
});

test("primary role dashboards share the responsive dash-page foundation", async()=>{
  const paths=[
    "src/app/workspace/recruiter/today/page.tsx",
    "src/app/workspace/client/page.tsx",
    "src/app/workspace/va/page.tsx",
    "src/app/workspace/admin/today/page.tsx",
    "src/app/workspace/client-success/page.tsx"
  ];
  const pages=await Promise.all(paths.map(read));
  for(const page of pages) assert.match(page,/className="dash-page/);
});

test("Client Success uses the shared mobile-first dashboard system without inline layout styles", async()=>{
  const [page,layout]=await Promise.all([
    read("src/app/workspace/client-success/page.tsx"),
    read("src/app/workspace/client-success/layout.tsx")
  ]);

  assert.match(page,/className="dash-page role-overview client-success-overview"/);
  assert.match(page,/StatCard/);
  assert.match(page,/cs-placement-row/);
  assert.doesNotMatch(page,/style=\{\{/);
  assert.match(layout,/className="client-success-tabs"/);
});
