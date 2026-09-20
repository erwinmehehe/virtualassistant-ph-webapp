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
const forbiddenLegacyClaims = [
  /20% to 50% markup/i,
  /massive 50% markup/i,
  /minimum of 25 Mbps/i,
  /USD is the industry standard/i,
  /solely responsible for handling their own Bureau of Internal Revenue/i,
  /every Virtual Assistant/i
];

for (const post of archive) {
  if (post.updatedDate !== "September 20, 2026") failures.push(`${post.slug}: missing current substantive update date`);
  if (!["client", "candidate"].includes(post.audience)) failures.push(`${post.slug}: audience must be client or candidate`);
  if (!Array.isArray(post.fieldNotes) || post.fieldNotes.length < 3) failures.push(`${post.slug}: needs at least three current field notes`);

  const plain = (post.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plain ? plain.split(/\s+/).length : 0;
  if (wordCount < 550) failures.push(`${post.slug}: retained guide is too thin after rewrite (${wordCount} words)`);
  if ((post.html.match(/<h2>/g) || []).length < 4) failures.push(`${post.slug}: needs a useful editorial section structure`);
  if (!/href="\//.test(post.html)) failures.push(`${post.slug}: needs at least one canonical internal link`);

  for (const pattern of forbiddenLegacyClaims) {
    if (pattern.test(plain)) failures.push(`${post.slug}: legacy unsupported claim survived: ${pattern}`);
  }
}
for (const slug of activeSlugs) {
  const decision = decisions.get(slug);
  if (!decision) failures.push(`${slug}: active archive post has no editorial decision`);
  if (decision && (decision.action === "merge" || decision.action === "redirect")) {
    failures.push(`${slug}: ${decision.action} decision must not remain in ARCHIVE_POSTS`);
  }
  if (decision && decision.status !== "completed") {
    failures.push(`${slug}: retained editorial decision is not marked completed`);
  }
  if (decision && decision.completedAt !== "2026-09-20") {
    failures.push(`${slug}: retained editorial completion date is missing or stale`);
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
  upgradedRetainedPosts: archive.filter((post) => post.updatedDate === "September 20, 2026").length,
  failures: failures.length
}, null, 2));

if (failures.length) {
  console.error("\nFailures:\n" + failures.join("\n"));
  process.exit(1);
}
