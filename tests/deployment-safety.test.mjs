import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("Vercel only auto-deploys main from Git",async()=>{
  const config=JSON.parse(await read("vercel.json"));
  assert.equal(config.git?.deploymentEnabled?.main,true);
  assert.equal(config.git?.deploymentEnabled?.["*"],false);
});

test("optional CLI production deploy cannot report success without credentials",async()=>{
  const workflow=await read(".github/workflows/vercel-production.yml");
  assert.doesNotMatch(workflow,/workflow_run:/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/VERCEL_TOKEN is not configured/);
  assert.match(workflow,/exit 1/);
});
