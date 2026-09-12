import { execFileSync } from "node:child_process";

const branch = String(process.env.VERCEL_GIT_COMMIT_REF || "");
const pullRequestId = String(process.env.VERCEL_GIT_PULL_REQUEST_ID || "");
const currentSha = String(process.env.VERCEL_GIT_COMMIT_SHA || "HEAD");
const previousSha = String(process.env.VERCEL_GIT_PREVIOUS_SHA || "");

if (branch === "main") process.exit(1);

// Branch pushes that are not attached to a pull request do not need a preview.
if (!pullRequestId) process.exit(0);

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
if (!files.length) process.exit(1);

const documentationOnly = files.every((file) =>
  file.endsWith(".md") ||
  file.startsWith("docs/") ||
  file.startsWith(".github/ISSUE_TEMPLATE/")
);

process.exit(documentationOnly ? 0 : 1);

