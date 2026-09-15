import { execFileSync } from "node:child_process";

const branch = String(process.env.VERCEL_GIT_COMMIT_REF || "");
const pullRequestId = String(process.env.VERCEL_GIT_PULL_REQUEST_ID || "");
const currentSha = String(process.env.VERCEL_GIT_COMMIT_SHA || "HEAD");
const previousSha = String(process.env.VERCEL_GIT_PREVIOUS_SHA || "");

// Never suppress production. This keeps main deploys safe even if an older
// Vercel project-level Ignored Build Step still points at this script.
if (branch === "main") process.exit(1);

function changedFiles() {
  const ranges = [
    previousSha ? `${previousSha}...${currentSha}` : null,
    "HEAD^...HEAD"
  ].filter(Boolean);

  for (const range of ranges) {
    try {
      return execFileSync("git", ["diff", "--name-only", range], { encoding: "utf8" })
        .split("\n")
        .map((file) => file.trim())
        .filter(Boolean);
    } catch {}
  }

  return [];
}

const files = changedFiles();

// If Git history is unavailable or the diff cannot be resolved, build rather
// than risk skipping a runtime change.
if (!files.length) process.exit(1);

const nonRuntimeOnly = files.every((file) =>
  file.endsWith(".md") ||
  file.startsWith("docs/") ||
  file.startsWith("tests/") ||
  file.startsWith(".github/")
);

// Branch pushes that are not attached to a pull request do not need a preview.
if (!pullRequestId) process.exit(0);

// PRs receive previews for runtime changes while non-runtime-only changes are skipped.
process.exit(nonRuntimeOnly ? 0 : 1);
