import { pathToFileURL } from "node:url";

export const BACKUP_ISSUE_TITLE = "Production database backup needs attention";
export const BACKUP_ISSUE_MARKER = "<!-- vaph-backup-health-monitor -->";

export function evaluateBackupHealth(runs, nowMs = Date.now()) {
  const completed = (Array.isArray(runs) ? runs : [])
    .filter((run) => run && run.status === "completed")
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  const latest = completed[0] || null;
  if (!latest) return { healthy: false, reason: "No completed production backup run was found.", run: null };
  if (latest.conclusion !== "success") {
    return { healthy: false, reason: "The latest production backup did not finish successfully.", run: latest };
  }
  const timestamp = Date.parse(latest.updated_at || latest.created_at || "");
  if (!Number.isFinite(timestamp) || timestamp > nowMs + 600_000 || nowMs - timestamp > 36 * 60 * 60 * 1000) {
    return { healthy: false, reason: "The most recent successful production backup is older than 36 hours.", run: latest };
  }
  return { healthy: true, reason: "An encrypted backup and isolated restore completed within 36 hours.", run: latest };
}

function trustedRunUrl(run) {
  const value = String(run?.html_url || "");
  return /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/actions\/runs\/\d+$/.test(value)
    ? value : null;
}

function issueBody(health) {
  const link = trustedRunUrl(health.run);
  return [
    BACKUP_ISSUE_MARKER,
    "## Production recovery readiness",
    "",
    "**Status:** " + (health.healthy ? "Verified" : "Needs operator action"),
    "",
    health.reason,
    "",
    link ? "Latest completed backup run: " + link : "No verified backup run is available.",
    "",
    "A successful run must dump, encrypt, verify, restore to an isolated database, and upload the encrypted artifact.",
    "",
    "Configure these repository Actions secrets (never post their values in GitHub issues or source files):",
    "- SUPABASE_DB_URL: production backup connection string using session-mode connection.",
    "- BACKUP_ENCRYPTION_PASSPHRASE: random 32+ character passphrase with a separate recovery copy.",
    "",
    "Manually run the Encrypted production database backup workflow after configuring the secrets and verify both restore testing and artifact upload.",
    "",
    "Runbook: https://github.com/erwinmehehe/virtualassistant-ph-webapp/blob/main/docs/PRODUCTION_DATABASE_BACKUP.md",
    "",
    "**Disaster recovery is not verified until a real dump and isolated restore pass.**",
    "",
    "_Maintained automatically using workflow metadata; secret values are not read._",
  ].join("\n");
}

async function runMonitor() {
  const token = process.env.GITHUB_TOKEN || "";
  const repository = process.env.GITHUB_REPOSITORY || "";
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error("Backup monitor requires GitHub Actions token and repository.");
  }

  async function api(path, options = {}) {
    const response = await fetch("https://api.github.com" + path, {
      ...options,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("GitHub backup monitor request failed with HTTP " + response.status);
    return response.json();
  }

  const runsResponse = await api("/repos/" + repository + "/actions/workflows/database-backup.yml/runs?per_page=20");
  const health = evaluateBackupHealth(runsResponse.workflow_runs || []);
  const query = 'repo:' + repository + ' is:issue in:title "' + BACKUP_ISSUE_TITLE + '"';
  const search = await api("/search/issues?q=" + encodeURIComponent(query) + "&per_page=30");
  const candidates = (search.items || []).filter((item) => item.title === BACKUP_ISSUE_TITLE && !item.pull_request);
  const existing = candidates.find((issue) => issue.state === "open") || candidates[0] || null;
  const body = issueBody(health);

  if (health.healthy) {
    if (existing?.state === "open") {
      await api("/repos/" + repository + "/issues/" + existing.number, {
        method: "PATCH",
        body: JSON.stringify({ body, state: "closed", state_reason: "completed" }),
      });
    }
    console.log("Backup health verified: encrypted dump and isolated restore succeeded recently.");
    return;
  }

  if (existing) {
    await api("/repos/" + repository + "/issues/" + existing.number, {
      method: "PATCH", body: JSON.stringify({ body, state: "open" }),
    });
  } else {
    await api("/repos/" + repository + "/issues", {
      method: "POST", body: JSON.stringify({ title: BACKUP_ISSUE_TITLE, body }),
    });
  }
  console.log("Backup recovery is not verified; issue opened or updated.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMonitor().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
