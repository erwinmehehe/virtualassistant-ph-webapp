#!/usr/bin/env node
/**
 * Production auth challenge health: read-only aggregate DB query + one
 * deduplicated GitHub issue. No customer data, token, IP, or secret appears
 * in the issue body or the GitHub Actions log.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const AUTH_HEALTH_ISSUE_TITLE = "Authentication security-check failures need attention";
export const AUTH_HEALTH_ISSUE_MARKER = "<!-- vaph-auth-challenge-health -->";
const QUERY = [
  "select json_build_object(",
  " 'total', count(*)::int,",
  " 'infrastructure', count(*) filter (where metadata->>'reason' in",
  "   ('incomplete_configuration', 'siteverify_http_failure', 'siteverify_request_failed',",
  "    'action_mismatch', 'hostname_mismatch'))::int,",
  " 'rejected', count(*) filter (where metadata->>'reason' = 'siteverify_rejected')::int,",
  " 'missing', count(*) filter (where metadata->>'reason' = 'missing_or_malformed_token')::int",
  ")",
  "from public.analytics_events",
  "where event_name = 'auth_security_check_failed'",
  "and created_at >= now() - interval '15 minutes';",
].join("\n");

function count(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function evaluateAuthChallengeHealth(counters) {
  if (!counters || typeof counters !== "object") {
    return { healthy: false, reason: "monitor_unavailable", counts: null };
  }
  const counts = {
    total: count(counters.total),
    infrastructure: count(counters.infrastructure),
    rejected: count(counters.rejected),
    missing: count(counters.missing),
  };
  // Missing/invalid tokens may be bot traffic; provider/hostname outages are
  // much more urgent and use a lower threshold.
  let reason = "within_threshold";
  if (counts.infrastructure >= 3) reason = "infrastructure_threshold";
  else if (counts.rejected >= 15) reason = "rejected_token_threshold";
  else if (counts.missing >= 30) reason = "missing_token_threshold";
  return { healthy: reason === "within_threshold", reason, counts };
}

function readCounts() {
  const raw = process.env.SUPABASE_DB_URL || "";
  if (!raw) throw new Error("Production read-only monitoring connection missing.");
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname || !url.username || !url.password || !url.pathname.slice(1)) {
    throw new Error("Malformed monitoring database URL.");
  }
  const isTest = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!isTest && !url.hostname.endsWith(".supabase.com") && !url.hostname.endsWith(".supabase.co")) {
    throw new Error("Refusing to query an unapproved database host.");
  }
  const env = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGSSLMODE: url.searchParams.get("sslmode") || (isTest ? "disable" : "require"),
    PGCONNECT_TIMEOUT: "10",
    PGOPTIONS: "-c default_transaction_read_only=on -c statement_timeout=10000",
  };
  const output = execFileSync(
    "psql", ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", QUERY],
    { env, encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  return JSON.parse(output);
}

function bodyFor(health) {
  return [
    AUTH_HEALTH_ISSUE_MARKER,
    "## VAPH authentication security-check monitoring",
    "",
    "**Status:** " + (health.healthy ? "Within threshold" : "Operator action required"),
    "",
    "**Signal:** " + health.reason.replace(/_/g, " "),
    "",
    "Window: rolling 15 minutes (aggregate counts only).",
    "",
    health.counts
      ? "Failures — infrastructure: " + health.counts.infrastructure +
        "; provider rejections: " + health.counts.rejected +
        "; missing or malformed tokens: " + health.counts.missing + "."
      : "Monitoring could not safely retrieve aggregate counts. Check the scheduled workflow's connection and query.",
    "",
    "Investigate Vercel logs for redacted [turnstile] reason codes and compare",
    "the intended hostnames and Siteverify action with Cloudflare Turnstile Analytics.",
    "Keep Cloudflare server verification enabled and avoid account mutations.",
    "",
    "Runbook: https://github.com/erwinmehehe/virtualassistant-ph-webapp/blob/main/docs/AUTH_RELIABILITY_GATE.md",
    "",
    "_Automatically maintained by the auth health monitor. No learner details are included._",
  ].join("\n");
}

async function reconcileIssue(health) {
  const token = process.env.GITHUB_TOKEN || "";
  const repo = process.env.GITHUB_REPOSITORY || "";
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("Auth monitor requires a GitHub Actions token and repository.");
  }
  async function api(path, options = {}) {
    const res = await fetch("https://api.github.com" + path, {
      ...options,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error("GitHub auth monitor returned HTTP " + res.status);
    return res.json();
  }

  const query = "repo:" + repo + " is:issue in:title \"" + AUTH_HEALTH_ISSUE_TITLE + "\"";
  const found = await api("/search/issues?q=" + encodeURIComponent(query) + "&per_page=40");
  const matches = (found.items || []).filter(issue =>
    issue.title === AUTH_HEALTH_ISSUE_TITLE &&
    !issue.pull_request &&
    String(issue.body || "").includes(AUTH_HEALTH_ISSUE_MARKER),
  );
  const existing = matches.find(issue => issue.state === "open") || matches[0] || null;
  if (health.healthy) {
    if (existing?.state === "open") {
      await api("/repos/" + repo + "/issues/" + existing.number, {
        method: "PATCH",
        body: JSON.stringify({ state: "closed", state_reason: "completed", body: bodyFor(health) }),
      });
    }
    console.log("Auth security-check aggregates are below alert thresholds.");
    return;
  }
  const body = bodyFor(health);
  if (existing) {
    await api("/repos/" + repo + "/issues/" + existing.number, {
      method: "PATCH", body: JSON.stringify({ state: "open", body }),
    });
  } else {
    await api("/repos/" + repo + "/issues", {
      method: "POST", body: JSON.stringify({ title: AUTH_HEALTH_ISSUE_TITLE, body }),
    });
  }
  console.log("Auth security-check incident issue opened or updated.");
}

export async function runAuthHealthMonitor() {
  let health;
  try {
    health = evaluateAuthChallengeHealth(readCounts());
  } catch {
    health = evaluateAuthChallengeHealth(null);
  }
  await reconcileIssue(health);
  if (health.reason === "monitor_unavailable") {
    throw new Error("Auth security-check monitor could not read aggregate failure counts.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAuthHealthMonitor().catch((error) => {
    console.error(error instanceof Error ? error.message : "Auth monitor failed.");
    process.exitCode = 1;
  });
}
