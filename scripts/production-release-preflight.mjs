#!/usr/bin/env node
/**
 * Read-only production release audit. It never merges, deploys, or reads secret
 * values. Passing machine checks still requires a separate operator approval.
 */
import { readFile, writeFile } from "node:fs/promises";

const REQUIRED_WORKFLOWS = ["CI", "CodeQL security scan", "Browser and database contracts"];
const BACKUP_STEPS = [
  ["Secrets", /require backup secrets/i],
  ["Encrypted dump", /create encrypted production dump/i],
  ["Archive verification", /verify encrypted archive/i],
  ["Isolated restore", /restore.test encrypted archive/i],
  ["Off-provider artifact", /upload encrypted off.provider artifact/i],
];
const TURNSTILE_KEYS = ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"];
const asArray = value => Array.isArray(value) ? value : [];
const dateMs = value => Number.isFinite(Date.parse(value || "")) ? Date.parse(value) : 0;
const newest = rows => [...asArray(rows)].sort((a,b) =>
  dateMs(b.created_at || b.run_started_at) - dateMs(a.created_at || a.run_started_at))[0] || null;
const productionScope = row => asArray(Array.isArray(row.target) ? row.target : [row.target]).includes("production");

export function evaluateRelease(snapshot, options = {}) {
  const now = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const maxBackupHours = options.maxBackupHours ?? 48;
  const pr = snapshot.pr || {};
  const sha = pr.head?.sha || "";
  const checks = [];
  function record(name, pass, detail) {
    checks.push({name, status: pass ? "pass" : "block", detail});
  }

  record("Reviewed PR state", pr.state === "open" && pr.draft === false,
    pr.draft ? "Draft PR: release prohibited" : (pr.state === "open" ? "Open for review" : "PR not open"));
  record("Exact PR commit", /^[a-f0-9]{40}$/i.test(sha),
    /^[a-f0-9]{40}$/i.test(sha) ? "SHA " + sha.slice(0,12) : "Missing valid SHA");

  for (const name of REQUIRED_WORKFLOWS) {
    const run = newest(asArray(snapshot.commitRuns).filter(r => r.name === name && r.head_sha === sha));
    const pass = run?.status === "completed" && run.conclusion === "success";
    record("Workflow: " + name, pass,
      !run ? "No run for exact PR head" : "Run " + run.id + " " + run.status + "/" + (run.conclusion || "pending"));
  }

  // Latest failed/cancelled run blocks even if an older backup succeeded.
  const backup = newest(snapshot.backupRuns);
  const backupOk = backup?.status === "completed" && backup.conclusion === "success";
  const ageHours = backup ? (now - dateMs(backup.created_at || backup.run_started_at))/3600000 : Infinity;
  const fresh = Number.isFinite(ageHours) && ageHours >= 0 && ageHours <= maxBackupHours;
  const correctBranch = Boolean(backup && backup.head_branch === snapshot.defaultBranch);
  record("Fresh production backup on default branch", backupOk && fresh && correctBranch,
    backup ? "Run " + backup.id + " " + backup.status + "/" + (backup.conclusion || "pending") +
      "; fresh=" + fresh + "; default branch=" + correctBranch : "No backup runs found");

  const steps = asArray(snapshot.backupJobs).flatMap(job => asArray(job.steps));
  for (const [name, pattern] of BACKUP_STEPS) {
    const step = steps.find(s => pattern.test(String(s.name || "")));
    record("Backup: " + name, backupOk && step?.status === "completed" && step.conclusion === "success",
      step ? step.status + "/" + (step.conclusion || "pending") : "Step missing (skipped is not a pass)");
  }

  const artifact = asArray(snapshot.backupArtifacts).find(x =>
    !x.expired && x.size_in_bytes > 0 && /backup|encrypted|database|postgres/i.test(x.name || ""));
  record("Retained encrypted backup artifact", backupOk && Boolean(artifact),
    artifact ? "Artifact " + artifact.id + ", " + artifact.size_in_bytes + " bytes" : "No retained backup archive");

  for (const key of TURNSTILE_KEYS) {
    const found = asArray(snapshot.vercelEnvs).some(x => x.key === key && productionScope(x));
    record("Production env: " + key, found,
      found ? "Present (value not read or validated)" : "Missing or production scope unknown");
  }

  const blockedCount = checks.filter(c => c.status === "block").length;
  return {
    decision: blockedCount ? "BLOCKED" : "OPERATOR_REVIEW_REQUIRED",
    readyForProduction: false,
    checkedAt: new Date(now).toISOString(),
    repo: options.repo || null,
    prNumber: options.prNumber || null,
    prHead: /^[a-f0-9]{40}$/i.test(sha) ? sha : null,
    blockedCount,
    checks,
    manualReleaseRequirements: [
      "Restore an encrypted database backup in an independently controlled environment",
      "Verify actual Turnstile tokens, hostnames, and server rejection of missing or invalid tokens",
      "Verify production payment callbacks and Google Calendar/Meet delivery using consenting test accounts",
      "Obtain human change approval and record rollback deployment and commit",
    ],
  };
}

function getArg(args, flag, fallback) {
  const i = args.indexOf(flag);
  return i < 0 ? fallback : (args[i + 1] || fallback);
}
async function getJson(url, token, host) {
  if (!token) throw new Error("Missing read-only API credentials for " + host);
  if (new URL(url).hostname !== host) throw new Error("Unexpected API hostname");
  const headers = {Accept: "application/json", Authorization: "Bearer " + token};
  if (host === "api.github.com") headers["X-GitHub-Api-Version"] = "2026-03-10";
  let response;
  try {
    response = await fetch(url, {headers, redirect:"error",signal:AbortSignal.timeout(20000)});
  } catch {
    throw new Error("API not reachable: " + host);
  }
  if (!response.ok) throw new Error("Read-only API " + host + " returned HTTP " + response.status);
  return response.json();
}
async function gatherLive({repo, prNumber, projectId, teamId, workflow}) {
  const gh = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const vt = process.env.VERCEL_TOKEN || "";
  const api = path => getJson("https://api.github.com/repos/" + repo + path, gh, "api.github.com");
  const [repository, pr] = await Promise.all([api(""), api("/pulls/" + prNumber)]);
  if (!pr.head?.sha) throw new Error("PR head unavailable");
  const [runs, backups] = await Promise.all([
    api("/actions/runs?head_sha=" + encodeURIComponent(pr.head.sha) + "&per_page=100"),
    api("/actions/workflows/" + encodeURIComponent(workflow) + "/runs?branch=" +
        encodeURIComponent(repository.default_branch) + "&per_page=20"),
  ]);
  const backup = newest(backups.workflow_runs);
  const [jobs, artifacts] = backup ? await Promise.all([
    api("/actions/runs/" + backup.id + "/jobs?per_page=100"),
    api("/actions/runs/" + backup.id + "/artifacts?per_page=100"),
  ]) : [{jobs:[]},{artifacts:[]}];
  // Vercel values are NEVER decrypted, retrieved, emitted, or stored.
  const vercel = vt ? await getJson(
    "https://api.vercel.com/v9/projects/" + projectId + "/env?decrypt=false" +
      (teamId ? "&teamId=" + encodeURIComponent(teamId) : ""), vt, "api.vercel.com"
  ) : {envs:[]};
  return {
    pr, defaultBranch:repository.default_branch,
    commitRuns:runs.workflow_runs || [], backupRuns:backups.workflow_runs || [],
    backupJobs:jobs.jobs || [], backupArtifacts:artifacts.artifacts || [],
    vercelEnvs:vercel.envs || [],
  };
}
export async function main(args = process.argv.slice(2)) {
  const repo = getArg(args, "--repo", process.env.GITHUB_REPOSITORY || "erwinmehehe/virtualassistant-ph-webapp");
  const prNumber = getArg(args, "--pr", "867");
  const projectId = getArg(args, "--vercel-project", "prj_eUS8RTfbvCxDGsjhi4qLSVgAffOO");
  const teamId = getArg(args, "--vercel-team-id", process.env.VERCEL_TEAM_ID || "");
  const workflow = getArg(args, "--backup-workflow", "database-backup.yml");
  const output = getArg(args, "--output", "");
  const fixture = getArg(args, "--fixture", "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(prNumber) ||
      !/^prj_[a-zA-Z0-9]+$/.test(projectId) ||
      (teamId && !/^team_[a-zA-Z0-9]+$/.test(teamId)) ||
      !/^[\w.-]+\.ya?ml$/.test(workflow)) {
    throw new Error("Invalid release target");
  }
  let report;
  try {
    const snapshot = fixture ? JSON.parse(await readFile(fixture,"utf8"))
      : await gatherLive({repo,prNumber,projectId,teamId,workflow});
    report = evaluateRelease(snapshot,{repo,prNumber:Number(prNumber)});
  } catch (error) {
    report = {decision:"BLOCKED",readyForProduction:false,repo,prNumber:Number(prNumber),blockedCount:1,
      checks:[{name:"Read-only release metadata",status:"block",
        detail:error instanceof Error ? error.message : "Metadata unavailable"}],
      manualReleaseRequirements:["Supply read-only credentials and retry; do not deploy"]};
  }
  if (output) await writeFile(output, JSON.stringify(report,null,2) + "\n",{mode:0o600});
  for (const check of report.checks) console.log(check.status.toUpperCase() + " " + check.name + ": " + check.detail);
  console.log("Release decision: " + report.decision + "; production approval not issued");
  // Exit code 2 denotes successful machine evaluation but unmet human approval.
  return report.decision === "BLOCKED" ? 1 : 2;
}
if (process.argv[1]?.endsWith("/production-release-preflight.mjs")) {
  main().then(code => {process.exitCode=code;}).catch(() => {
    console.error("Release metadata audit error: BLOCKED");
    process.exitCode=1;
  });
}
