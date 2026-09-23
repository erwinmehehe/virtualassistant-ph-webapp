import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("Vercel only auto-deploys main from Git",async()=>{
  const config=JSON.parse(await read("vercel.json"));
  assert.equal(config.git?.deploymentEnabled?.main,true);
  assert.equal(config.git?.deploymentEnabled?.["**"],false);
});

test("production deploy relies on the Git integration instead of a long-lived Vercel token workflow",async()=>{
  await assert.rejects(
    read(".github/workflows/vercel-production.yml"),
    (error)=>error?.code === "ENOENT"
  );
});
