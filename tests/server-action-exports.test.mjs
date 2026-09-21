import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

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

test('"use server" modules only expose async runtime functions', async () => {
  const offenders = [];
  for (const file of await walk(root)) {
    const source = await readFile(file, "utf8");
    const trimmed = source.trimStart();
    if (!trimmed.startsWith('"use server"') && !trimmed.startsWith("'use server'")) continue;

    const invalidNamed = [...source.matchAll(/^\s*export\s+(const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)/gm)]
      .map((match) => `${match[1]} ${match[2]}`);
    const invalidDefault = /^\s*export\s+default\s+(?!async\s+function)/m.test(source);

    if (invalidNamed.length || invalidDefault) {
      offenders.push({
        file: relative(root, file).replaceAll("\\", "/"),
        exports: [...invalidNamed, ...(invalidDefault ? ["default non-async value"] : [])]
      });
    }
  }

  assert.deepEqual(offenders, [], `Invalid Server Action runtime exports: ${JSON.stringify(offenders)}`);
});
