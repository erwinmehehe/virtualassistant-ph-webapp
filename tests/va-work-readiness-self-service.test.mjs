import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("VA profile links directly to the work-from-home setup editor", async () => {
  const profile = await source("src/app/workspace/va/profile/page.tsx");
  const nav = await source("src/components/app-nav-links.tsx");
  assert.match(profile, /href="\/workspace\/va\/work-readiness"/);
  assert.match(profile, /Edit work-from-home setup/);
  assert.match(nav, /\["Work Readiness", "\/workspace\/va\/work-readiness"/);
});

test("work readiness reads existing details before showing an editable form", async () => {
  const page = await source("src/app/workspace/va/work-readiness/page.tsx");
  assert.match(page, /profileError \|\| !va/);
  assert.match(page, /Reload work setup/);
  assert.match(page, /Back to my profile/);
  assert.match(page, /action=\{saveVaWorkSetupAction\}/);
});

test("work readiness saves only the authenticated VA and confirms a row was written", async () => {
  const action = await source("src/app/actions/work-readiness.ts");
  assert.match(action, /requireRoleFast\("va"\)/);
  assert.match(action, /\.eq\("user_id", userId\)\.select\("user_id"\)\.maybeSingle\(\)/);
  assert.match(action, /if \(!updatedProfile\) throw new Error/);
  assert.match(action, /work_setup_verified_at: null/);
  assert.match(action, /redirect\("\/workspace\/va\/work-readiness\?saved=1"\)/);
});
