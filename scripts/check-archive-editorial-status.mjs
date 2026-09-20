import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function parseArchive() {
  const text = source("src/lib/archive-posts.ts");
  const marker = "export const ARCHIVE_POSTS: ArchivePost[] = ";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error("archive marker missing");
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

const audit = JSON.parse(source("data/archive-editorial-decisions.json"));
const archive = parseArchive();
const nextConfig = source("next.config.ts");
const allowed = new Set(["keep", "improve", "merge", "redirect", "reposition"]);
const failures = [];

const decisions = new Map();
for (const item of audit.items || []) {
  if (!item.slug || !allowed.has(item.action)) {
    failures.push(`invalid audit item: ${JSON.stringify(item)}`);
    continue;
  }
  if (decisions.has(item.slug)) failures.push(`duplicate decision for ${item.slug}`);
  decisions.set(item.slug, item);

  const shouldBeGone = item.action === "merge" || item.action === "redirect";
  if (shouldBeGone) {
    if (!item.target || !item.target.startsWith("/")) failures.push(`${item.slug}: ${item.action} requires a site-relative target`);
    const sourcePath = `/blog/${item.slug}`;
    if (!nextConfig.includes(`source: "${sourcePath}"`) || !nextConfig.includes(`source: "${sourcePath}/"`)) {
      failures.push(`${item.slug}: missing permanent redirect entries`);
    }
    if (item.target && !nextConfig.includes(`destination: "${item.target}"`)) {
      failures.push(`${item.slug}: redirect target ${item.target} missing from next.config.ts`);
    }
  }
}

const activeSlugs = new Set(archive.map((post) => post.slug));
for (const slug of activeSlugs) {
  const decision = decisions.get(slug);
  if (!decision) failures.push(`${slug}: active archive post has no editorial decision`);
  if (decision && (decision.action === "merge" || decision.action === "redirect")) {
    failures.push(`${slug}: ${decision.action} decision must not remain in ARCHIVE_POSTS`);
  }
}
for (const [slug, decision] of decisions) {
  if (!["merge", "redirect"].includes(decision.action) && !activeSlugs.has(slug)) {
    failures.push(`${slug}: ${decision.action} decision is missing from ARCHIVE_POSTS`);
  }
}

const expectedDecisionCount = audit.remainingAtStartOfPass;
if (decisions.size !== expectedDecisionCount) {
  failures.push(`expected ${expectedDecisionCount} audited posts, found ${decisions.size}`);
}

console.log(JSON.stringify({
  auditedPosts: decisions.size,
  activeArchivePosts: activeSlugs.size,
  consolidatedThisPass: [...decisions.values()].filter((item) => ["merge", "redirect"].includes(item.action)).length,
  failures: failures.length
}, null, 2));

if (failures.length) {
  console.error("\nFailures:\n" + failures.join("\n"));
  process.exit(1);
}
