import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [join(repoRoot, "src"), join(repoRoot, "scripts")];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test("app and operational scripts cannot bypass the shared tracked Resend sender", async () => {
  const offenders = [];
  const files = (await Promise.all(roots.map(walk))).flat();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (/from\s+["']resend["']|new\s+Resend\s*\(|\.emails\.send\s*\(/.test(source)) {
      const rel = relative(repoRoot, file).replaceAll("\\", "/");
      if (rel !== "src/lib/email.ts") offenders.push(rel);
    }
  }

  assert.deepEqual(offenders, [], `Only src/lib/email.ts may call Resend directly. Found: ${offenders.join(", ")}`);
});
