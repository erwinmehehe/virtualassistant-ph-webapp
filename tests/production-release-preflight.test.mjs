import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateRelease } from "../scripts/production-release-preflight.mjs";

const run = promisify(execFile);
const NOW = Date.parse("2026-10-09T04:15:00Z");
const SHA = "b591fde496603900a2249e73cdbfa29c9f05e7cf";
const date = hours => new Date(NOW - hours * 3600000).toISOString();
function fixture() {
  return {
    pr: {state:"open", draft:false, head:{sha:SHA}},
    defaultBranch:"main",
    commitRuns:["CI","CodeQL security scan","Browser and database contracts"].map((name,i) =>
      ({name,id:i+10,head_sha:SHA,status:"completed",conclusion:"success",created_at:date(1)})),
    backupRuns:[{id:50,status:"completed",conclusion:"success",created_at:date(6),head_branch:"main"}],
    backupJobs:[{steps:[
      "Require backup secrets","Create encrypted production dump","Verify encrypted archive",
      "Restore-test encrypted archive","Upload encrypted off-provider artifact",
    ].map(name => ({name,status:"completed",conclusion:"success"}))}],
    backupArtifacts:[{id:80,name:"encrypted-production-database-backup",size_in_bytes:10000,expired:false}],
    vercelEnvs:[
      {key:"NEXT_PUBLIC_TURNSTILE_SITE_KEY",target:["production"]},
      {key:"TURNSTILE_SECRET_KEY",target:["production"]},
    ],
  };
}
const evaluate = data => evaluateRelease(data,{nowMs:NOW,repo:"erwinmehehe/virtualassistant-ph-webapp",prNumber:867});
const blocked = (result,name) => result.checks.some(x => x.status==="block" && x.name.includes(name));

test("even all green machine checks cannot approve production without a human",() => {
  const r=evaluate(fixture());
  assert.equal(r.blockedCount,0);
  assert.equal(r.decision,"OPERATOR_REVIEW_REQUIRED");
  assert.equal(r.readyForProduction,false);
  assert.ok(r.manualReleaseRequirements.length >= 4);
});
test("draft pull requests block release",() => {
  const s=fixture();s.pr.draft=true;
  assert.equal(evaluate(s).decision,"BLOCKED");
});
test("closed PR blocks release",() => {
  const s=fixture();s.pr.state="closed";
  assert.ok(blocked(evaluate(s),"Reviewed PR state"));
});
test("only successful checks on exact PR head count",() => {
  const s=fixture();s.commitRuns[0].head_sha="0".repeat(40);
  assert.ok(blocked(evaluate(s),"Workflow: CI"));
});
test("newer failed check supersedes earlier success on same SHA",() => {
  const s=fixture();s.commitRuns.push({name:"CI",id:30,head_sha:SHA,status:"completed",conclusion:"failure",created_at:date(0.25)});
  assert.ok(blocked(evaluate(s),"Workflow: CI"));
});
test("latest backup missing blocks release",() => {
  const s=fixture();s.backupRuns=[];
  assert.ok(blocked(evaluate(s),"Fresh production backup"));
});
test("backup must be recent",() => {
  const s=fixture();s.backupRuns[0].created_at=date(60);
  assert.ok(blocked(evaluate(s),"Fresh production backup"));
});
test("newer failed backup supersedes old successful backup",() => {
  const s=fixture();s.backupRuns.push({id:51,status:"completed",conclusion:"failure",created_at:date(1),head_branch:"main"});
  assert.ok(blocked(evaluate(s),"Fresh production backup"));
});
test("backup must originate on default branch",() => {
  const s=fixture();s.backupRuns[0].head_branch="feature";
  assert.ok(blocked(evaluate(s),"Fresh production backup"));
});
test("skipped isolated restore is an explicit blocker",() => {
  const s=fixture();s.backupJobs[0].steps[3].conclusion="skipped";
  assert.ok(blocked(evaluate(s),"Backup: Isolated restore"));
});
test("expired or zero-byte backup artifact blocks release",() => {
  const s=fixture();s.backupArtifacts[0].expired=true;
  assert.ok(blocked(evaluate(s),"Retained encrypted backup artifact"));
});
test("Turnstile env variables require production scope",() => {
  const s=fixture();s.vercelEnvs[0].target=["preview"];
  assert.ok(blocked(evaluate(s),"NEXT_PUBLIC_TURNSTILE_SITE_KEY"));
});
test("missing Vercel metadata always blocks release",() => {
  const s=fixture();s.vercelEnvs=[];
  assert.ok(blocked(evaluate(s),"TURNSTILE_SECRET_KEY"));
});
test("audit never emits environment variable values",() => {
  const s=fixture();s.vercelEnvs[0].value="sentinel-private-value";
  assert.doesNotMatch(JSON.stringify(evaluate(s)),/sentinel-private-value/);
});
test("missing read-only tokens fail closed and preserve a JSON report",async () => {
  const dir=await mkdtemp(join(tmpdir(),"release-gate-"));
  const output=join(dir,"result.json");
  try {
    await assert.rejects(run("node",[new URL("../scripts/production-release-preflight.mjs",import.meta.url).pathname,
      "--output",output],{env:{...process.env,GITHUB_TOKEN:"",GH_TOKEN:"",VERCEL_TOKEN:""}}));
    const data=JSON.parse(await readFile(output,"utf8"));
    assert.equal(data.decision,"BLOCKED");
    assert.equal(data.readyForProduction,false);
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
});
test("workflow has no deployment or command injection through dispatch inputs",async () => {
  const source=await readFile(new URL("../.github/workflows/production-release-preflight.yml",import.meta.url),"utf8");
  assert.ok(source.includes("PREFLIGHT_PR_NUMBER: "+"${{ inputs.pr_number }}"));
  assert.ok(source.includes('--pr "$PREFLIGHT_PR_NUMBER"'));
  assert.ok(source.includes("exit 1"));
  assert.doesNotMatch(source,/VERCEL_TOKEN|pull_request_target/);
  assert.match(source,/permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(source,/vercel deploy|vercel --prod|gh pr merge|git push|supabase db push/i);
});
